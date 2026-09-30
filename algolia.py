import os
import argparse
import logging
import re
import json
import unicodedata
import yaml
from algoliasearch.search.client import SearchClientSync

def load_dotenv(path='.env'):
    """Carga KEY=VALUE de un .env local sin pisar variables ya definidas (en CI no hay .env)."""
    if not os.path.exists(path):
        return
    with open(path, encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            key, value = line.split('=', 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"\''))


# --- Configuración del Logging ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def clean_markdown(text):
    """
    Limpia el texto de la sintaxis común de Markdown para indexar contenido puro.
    """
    text = re.sub(r'```.*?```', '', text, flags=re.DOTALL)
    text = re.sub(r'<!--.*?-->', '', text, flags=re.DOTALL)
    text = re.sub(r'<[^>]+>', ' ', text)                              # HTML en línea (figure, div, img…)
    text = re.sub(r'^\s*(?:!!!|\?\?\?\+?)\s+\w+(?:\s+"([^"]*)")?\s*$', r'\1', text, flags=re.MULTILINE)  # admonitions
    text = re.sub(r'\{:?[^}\n]*\}', '', text)                        # attr_list: { .class }, {: #id }
    text = re.sub(r'^\s*=== "([^"]*)"\s*$', r'\1', text, flags=re.MULTILINE)  # pestañas
    text = re.sub(r'!\[[^\]]*\]\([^\)]+\)', '', text)            # imágenes antes que enlaces
    text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)
    text = re.sub(r':[a-z0-9]+(?:-[a-z0-9]+)+:', '', text)              # iconos :material-…: / :octicons-…:
    text = re.sub(r'(\*\*|__|\*|_|~~|`)(.*?)\1', r'\2', text)
    text = re.sub(r'^\s*#+\s+', '', text, flags=re.MULTILINE)
    text = re.sub(r'^\s*[-*_]{3,}\s*$', '', text, flags=re.MULTILINE)
    return ' '.join(text.split())

def parse_markdown_file(file_path):
    """
    Parsea un archivo Markdown, separando el frontmatter YAML del contenido.
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        match = re.match(r'---\s*\n(.*?)---\s*\n', content, re.DOTALL)
        if match:
            frontmatter = yaml.safe_load(match.group(1)) or {}
            markdown_content = content[match.end():]
            return frontmatter, markdown_content
        return {}, content
    except Exception as e:
        logging.error(f"Error al leer el archivo {file_path}: {e}")
        return {}, None

def parse_nav_section(nav_data, docs_dir):
    """
    Recorre la sección 'nav' para mapear rutas de archivo a su jerarquía de títulos.
    """
    nav_map = {}
    def get_title_from_md(file_path):
        try:
            frontmatter, _ = parse_markdown_file(file_path)
            return frontmatter.get('title')
        except Exception: return None
    def recurse_nav(items, prefix):
        for item in items:
            if isinstance(item, str):
                title = get_title_from_md(os.path.join(docs_dir, item)) or \
                        os.path.splitext(os.path.basename(item))[0].capitalize()
                nav_map[item] = prefix + [title]
            elif isinstance(item, dict):
                for title, value in item.items():
                    if isinstance(value, str): nav_map[value] = prefix + [title]
                    elif isinstance(value, list): recurse_nav(value, prefix + [title])
    recurse_nav(nav_data, [])
    return nav_map

def create_records(markdown_content, hierarchy_titles, page_url, tags):
    """
    Segmenta el contenido, añadiendo un group_id para la deduplicación.
    """
    ALGOLIA_RECORD_LIMIT = 9500  # Algolia limit is 10KB; reserve 500B margin

    records = []
    base_hierarchy = {f'lvl{i}': title for i, title in enumerate(hierarchy_titles)}
    max_lvl = len(base_hierarchy) - 1
    page_title = hierarchy_titles[-1] if hierarchy_titles else ''

    _strip_anchor = lambda h: re.sub(r'\s*\{[^}]*\}\s*$', '', h).strip()
    h2s = [_strip_anchor(h) for h in re.findall(r'^##\s+(.*)', markdown_content, re.MULTILINE)]
    h3s = [_strip_anchor(h) for h in re.findall(r'^###\s+(.*)', markdown_content, re.MULTILINE)]
    h4s = [_strip_anchor(h) for h in re.findall(r'^####\s+(.*)', markdown_content, re.MULTILINE)]

    def add_records_from_content(content_chunk, base_url, hierarchy):
        title_parts = [hierarchy.get(f'lvl{i}') for i in range(7)]
        if max_lvl + 1 < len(title_parts) and title_parts[max_lvl] and title_parts[max_lvl + 1]:
            nav_title = title_parts[max_lvl].lower()
            h1_title = title_parts[max_lvl + 1].lower()
            if h1_title.startswith(nav_title):
                title_parts[max_lvl] = None

        final_parts = [part for part in title_parts if part]
        record_title = final_parts[-1] if final_parts else ''

        # group id is base_url without fragment
        group_id = base_url.split('#')[0]
        base_record = {
            'title': record_title,
            'page_title': page_title,
            'tags': tags,
            'h2': h2s,
            'h3': h3s,
            'h4': h4s,
            'group_id': group_id
        }

        # Calculate how much space is left for content after metadata fields
        base_size = len(json.dumps(base_record, ensure_ascii=False).encode('utf-8'))
        # Account for objectID, url, content field names and JSON overhead (~100B)
        RECORD_SIZE_LIMIT = ALGOLIA_RECORD_LIMIT - base_size - 100

        # Guard: if bulky h2/h3/h4 metadata leaves no room, drop those lists and retry
        if RECORD_SIZE_LIMIT <= 0:
            base_record = {k: v for k, v in base_record.items() if k not in ('h2', 'h3', 'h4')}
            slim_size = len(json.dumps(base_record, ensure_ascii=False).encode('utf-8'))
            RECORD_SIZE_LIMIT = ALGOLIA_RECORD_LIMIT - slim_size - 100
            if RECORD_SIZE_LIMIT <= 0:
                logging.warning(f"Skipping record for {base_url}: metadata alone exceeds size limit.")
                return

        if len(content_chunk.encode('utf-8')) <= RECORD_SIZE_LIMIT:
            if content_chunk:
                record = base_record.copy()
                record.update({'objectID': base_url, 'url': base_url, 'content': content_chunk})
                records.append(record)
            return

        words = content_chunk.split()
        current_chunk_words = []
        sub_chunk_index = 0
        
        for word in words:
            current_chunk_words.append(word)
            current_chunk_str = ' '.join(current_chunk_words)
            if len(current_chunk_str.encode('utf-8')) > RECORD_SIZE_LIMIT:
                valid_chunk_words = current_chunk_words[:-1]
                if valid_chunk_words:
                    valid_chunk_str = ' '.join(valid_chunk_words)
                    object_id = f"{base_url}_{sub_chunk_index}"
                    record = base_record.copy()
                    record.update({'objectID': object_id, 'url': base_url, 'content': valid_chunk_str})
                    records.append(record)
                    sub_chunk_index += 1
                current_chunk_words = [word]

        if current_chunk_words:
            last_chunk_str = ' '.join(current_chunk_words)
            object_id = f"{base_url}_{sub_chunk_index}"
            record = base_record.copy()
            record.update({'objectID': object_id, 'url': base_url, 'content': last_chunk_str})
            records.append(record)

    # El resto de la función (el cuerpo principal) no necesita cambios...
    chunks = re.split(r'\n(#+)\s+', markdown_content)
    intro_content = clean_markdown(chunks[0])
    if intro_content:
        hierarchy = base_hierarchy.copy()
        for i in range(max_lvl + 1, 6): hierarchy[f'lvl{i}'] = None
        add_records_from_content(intro_content, page_url, hierarchy)

    current_headings, i = {}, 1
    while i < len(chunks):
        level = len(chunks[i])
        parts = chunks[i+1].split('\n', 1)
        header_text = parts[0].strip()
        content = clean_markdown(parts[1]) if len(parts) > 1 else ""
        
        current_headings[level] = header_text
        for l in range(level + 1, 7): current_headings.pop(l, None)
        if content:
            hierarchy = base_hierarchy.copy()
            for l in range(1, 7): hierarchy[f'lvl{max_lvl + l}'] = current_headings.get(l)
            
            # Mismo slug que el plugin toc de MkDocs: sin acentos
            ascii_header = unicodedata.normalize('NFKD', header_text).encode('ascii', 'ignore').decode('ascii')
            anchor = re.sub(r'[^\w\s-]', '', ascii_header).strip().lower()
            anchor = re.sub(r'[-\s]+', '-', anchor)
            record_url = f"{page_url}#{anchor}"
            add_records_from_content(content, record_url, hierarchy)
        i += 2
        
    return records

def get_locale_nav(config, locale):
    """
    Extrae el nav para un locale específico desde la configuración del plugin i18n.
    Retorna None si no se encuentra, para que el caller use el nav global como fallback.
    """
    for plugin in config.get('plugins', []):
        if not isinstance(plugin, dict) or 'i18n' not in plugin:
            continue
        for lang in plugin['i18n'].get('languages', []):
            if lang.get('locale') == locale and 'nav' in lang:
                return lang['nav']
    return None


INDEX_SETTINGS = {
    'searchableAttributes': ['unordered(title)', 'unordered(page_title)', 'unordered(h2)', 'unordered(h3)', 'unordered(h4)', 'unordered(content)'],
    'attributesForFaceting': ['filterOnly(tags)'],
    'attributeForDistinct': 'group_id',
    'distinct': True,
    'attributesToSnippet': ['content:30'],
    'highlightPreTag': '<mark>',
    'highlightPostTag': '</mark>',
}


def index_docs(app_id, api_key, index_name, docs_dir, site_url, config_file, locale=None, dry_run=False):
    """
    Función principal que usa el cliente SÍNCRONO para indexar los documentos.
    Si se pasa un locale (ej: 'es'), usa el nav definido en el plugin i18n para ese
    locale en lugar del nav global, para que las jerarquías queden en el idioma correcto.
    """
    client = None if dry_run else SearchClientSync(app_id, api_key)

    try:
        with open(config_file, 'r', encoding='utf-8') as f:
            config_content = f.read()
        cleaned_content = re.sub(r'!!python/name:.*', '', config_content)
        config = yaml.load(cleaned_content, Loader=yaml.FullLoader)

        if locale:
            nav_data = get_locale_nav(config, locale)
            if nav_data is None:
                logging.warning(f"No se encontró nav para el locale '{locale}' en el plugin i18n. Usando nav global.")
                nav_data = config.get('nav', [])
            else:
                logging.info(f"Usando nav del locale '{locale}' desde el plugin i18n.")
        else:
            nav_data = config.get('nav', [])

        nav_map = parse_nav_section(nav_data, docs_dir) if nav_data else {}
    except FileNotFoundError:
        logging.error(f"Archivo de configuración no encontrado: {config_file}")
        return

    all_records = []
    if not site_url.endswith('/'): site_url += '/'

    for relative_path, hierarchy_titles in nav_map.items():
        file_path = os.path.join(docs_dir, relative_path)
        if not os.path.exists(file_path): continue

        frontmatter, markdown_content = parse_markdown_file(file_path)

        if frontmatter.get('title'): hierarchy_titles[-1] = frontmatter.get('title')

        page_slug = os.path.splitext(relative_path)[0]
        if os.path.basename(page_slug) == 'index':
            page_slug = os.path.dirname(page_slug)
        page_url = f"{site_url}{page_slug}"
        if not page_url.endswith('/'): page_url += '/'

        if markdown_content:
            tags = frontmatter.get('tags', [])
            records = create_records(markdown_content, hierarchy_titles, page_url, tags)
            all_records.extend(records)
            logging.info(f"Procesado: {relative_path} -> {len(all_records)} registros totales.")

    if not all_records:
        logging.info("No se encontraron registros para indexar.")
        return
    if dry_run:
        logging.info(f"[dry-run] {len(all_records)} registros generados; no se envía nada a Algolia.")
        return all_records
    try:
        # Reemplazo atómico: el índice nunca queda vacío si falla a mitad de camino
        logging.info(f"Enviando {len(all_records)} registros a Algolia ({index_name})...")
        client.set_settings(index_name=index_name, index_settings=INDEX_SETTINGS)
        client.replace_all_objects(index_name=index_name, objects=all_records)
        logging.info("¡Proceso de indexación completado exitosamente!")
    except Exception as e:
        logging.error(f"Error al enviar registros a Algolia: {e}")
        raise SystemExit(1)   # que el job de deploy falle de forma visible

def main():
    parser = argparse.ArgumentParser(description="Indexa archivos Markdown de MkDocs en Algolia (versión síncrona).")
    parser.add_argument("api_key", nargs="?", default="", help="Clave de escritura de Algolia. Si se omite, se lee ALGOLIA_WRITE_INDEX_KEY del entorno o de .env. No hace falta con --dry-run.")
    parser.add_argument("--app-id", required=True, help="El ID de la aplicación de Algolia.")
    parser.add_argument("--index-name", required=True, help="El nombre del índice en Algolia.")
    parser.add_argument("--config-file", default="mkdocs.yml", help="Ruta a mkdocs.yml.")
    parser.add_argument("--docs-dir", default="docs", help="Directorio de los archivos Markdown.")
    parser.add_argument("--site-url", required=True, help="La URL base del sitio.")
    parser.add_argument("--locale", default=None, help="Locale del sitio (ej: 'es'). Usa el nav del plugin i18n para ese locale.")
    parser.add_argument("--dry-run", action="store_true", help="Genera los registros sin enviarlos a Algolia.")
    parser.add_argument("--dump", default=None, help="Con --dry-run: ruta donde guardar los registros en JSON.")
    args = parser.parse_args()
    load_dotenv()
    args.api_key = args.api_key or os.environ.get('ALGOLIA_WRITE_INDEX_KEY', '')
    if not args.dry_run and not args.api_key:
        parser.error("falta la clave: pásala como argumento o define ALGOLIA_WRITE_INDEX_KEY en .env")
    records = index_docs(args.app_id, args.api_key, args.index_name, args.docs_dir, args.site_url, args.config_file, args.locale, args.dry_run)
    if args.dry_run and args.dump and records is not None:
        with open(args.dump, 'w', encoding='utf-8') as f:
            json.dump(records, f, ensure_ascii=False, indent=1)

if __name__ == "__main__":
    main()
