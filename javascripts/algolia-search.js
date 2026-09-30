/* Buscador de Etendo Academy con Algolia.
   Se engancha a la caja de búsqueda de Material y sustituye sus resultados (lunr)
   por los del índice de Algolia. La search-only key es pública por diseño. */
(function () {
  var APP_ID = 'XMLZ1ZZEY7';
  var SEARCH_KEY = 'de992ae25d65509474690fe8761e2a21';
  var INDEX_NAME = 'etendo_go_docs_index_es';
  var SUGGEST_INDEX = 'etendo_go_docs_index_es_prompt_suggestions';   // generado por el agente de sugerencias
  var TOP_SUGGESTIONS = 5;
  var ICON_SPARKLES = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" /><path d="M20 2v4" /><path d="M22 4h-4" /><circle cx="4" cy="20" r="2" /></svg>';
  var MAX_HITS = 8;
  var DEBOUNCE_MS = 150;

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // Escapa todo el HTML salvo las marcas <mark> que añade Algolia al resaltar
  function safeHighlight(value) {
    return escapeHtml(value).replace(/&lt;(\/?)mark&gt;/g, '<$1mark>');
  }

  function highlighted(hit, attribute) {
    var res = hit._highlightResult && hit._highlightResult[attribute];
    return res && res.value ? safeHighlight(res.value) : escapeHtml(hit[attribute] || '');
  }

  function snippet(hit) {
    var res = hit._snippetResult && hit._snippetResult.content;
    return res && res.value ? safeHighlight(res.value) : '';
  }

  function initSearch() {
    var input = document.querySelector('input.md-search__input');
    var scrollwrap = document.querySelector('.md-search__scrollwrap');
    if (!input || !scrollwrap || input.dataset.algoliaBound) return;
    if (typeof algoliasearch === 'undefined') return;
    input.dataset.algoliaBound = '1';

    var client = algoliasearch(APP_ID, SEARCH_KEY);
    var index = client.initIndex(INDEX_NAME);
    var suggestionsPromise = null;   // se cargan una sola vez

    function chatAvailable() {
      return window.etendoChat && typeof window.etendoChat.ask === 'function';
    }

    // Cierra el buscador y abre el asistente con la pregunta
    function askAssistant(text) {
      var toggle = document.getElementById('__search');
      if (toggle) { toggle.checked = false; toggle.dispatchEvent(new Event('change')); }
      input.value = '';
      input.blur();
      window.etendoChat.ask(text);
    }

    function askItem(text, label) {
      var li = document.createElement('li');
      li.className = 'md-search-result__item etendo-ask__item';
      li.innerHTML =
        '<a class="md-search-result__link" href="#" tabindex="-1">' +
          '<span class="etendo-ask__icon">' + ICON_SPARKLES + '</span>' +
          '<span class="etendo-ask__text">' + (label || escapeHtml(text)) + '</span>' +
        '</a>';
      li.querySelector('a').addEventListener('click', function (e) { e.preventDefault(); askAssistant(text); });
      return li;
    }

    function topSuggestions() {
      if (!suggestionsPromise) {
        suggestionsPromise = client.initIndex(SUGGEST_INDEX).search('', {
          hitsPerPage: 50,
          attributesToRetrieve: ['prompt', 'rank']
        }).then(function (res) {
          return res.hits
            .sort(function (a, b) { return (a.rank || 99) - (b.rank || 99); })
            .slice(0, TOP_SUGGESTIONS)
            .map(function (h) { return h.prompt; });
        }).catch(function () { suggestionsPromise = null; return []; });
      }
      return suggestionsPromise;
    }

    // Con el buscador vacío: sugerencias para empezar una conversación con el asistente
    function showTopSuggestions() {
      if (!chatAvailable()) return;
      var current = ++requestId;
      topSuggestions().then(function (prompts) {
        if (current !== requestId || input.value.trim() || !prompts.length) return;
        var meta = document.createElement('div');
        meta.className = 'md-search-result__meta';
        meta.textContent = 'Pregunta al asistente';
        var list = document.createElement('ol');
        list.className = 'md-search-result__list';
        prompts.forEach(function (prompt) { list.appendChild(askItem(prompt)); });
        box.innerHTML = '';
        box.appendChild(meta);
        box.appendChild(list);
        box.hidden = false;
      });
    }

    var box = document.createElement('div');
    box.className = 'md-search-result etendo-search-result';
    box.setAttribute('data-md-component', 'etendo-search-result');
    box.hidden = true;
    scrollwrap.appendChild(box);

    var timer = null;
    var requestId = 0;

    function hide() {
      box.hidden = true;
      box.innerHTML = '';
    }

    function render(hits, query, prompts) {
      var meta = document.createElement('div');
      meta.className = 'md-search-result__meta';
      meta.textContent = hits.length === 0
        ? 'No se encontraron páginas'
        : hits.length === 1 ? 'Páginas de la wiki · 1 resultado' : 'Páginas de la wiki · ' + hits.length + ' resultados';

      var list = document.createElement('ol');
      list.className = 'md-search-result__list';
      hits.forEach(function (hit) {
        var title = hit.page_title || hit.title || '';
        var section = hit.title && hit.title !== title ? hit.title : '';
        var text = snippet(hit);

        var li = document.createElement('li');
        li.className = 'md-search-result__item';
        li.innerHTML =
          '<a class="md-search-result__link" href="' + escapeHtml(hit.url) + '" tabindex="-1">' +
            '<article class="md-search-result__article md-search-result__article--document">' +
              '<h1 class="md-search-result__title">' + (hit.page_title ? highlighted(hit, 'page_title') : highlighted(hit, 'title')) + '</h1>' +
              (section ? '<p class="etendo-search-result__section">' + highlighted(hit, 'title') + '</p>' : '') +
              (text ? '<p class="md-search-result__teaser">' + text + '</p>' : '') +
            '</article>' +
          '</a>';
        list.appendChild(li);
      });

      box.innerHTML = '';

      // Sección 1: sugerencias del asistente (preguntar lo escrito + preguntas sugeridas que coinciden)
      if (chatAvailable()) {
        var askMeta = document.createElement('div');
        askMeta.className = 'md-search-result__meta';
        askMeta.textContent = 'Sugerencias del asistente';
        var askList = document.createElement('ol');
        askList.className = 'md-search-result__list';
        askList.appendChild(askItem(query, 'Preguntar al asistente: <strong>' + escapeHtml(query) + '</strong>'));
        (prompts || []).forEach(function (hit) {
          var hl = hit._highlightResult && hit._highlightResult.prompt;
          askList.appendChild(askItem(hit.prompt, hl && hl.value ? safeHighlight(hl.value) : escapeHtml(hit.prompt)));
        });
        box.appendChild(askMeta);
        box.appendChild(askList);
      }

      // Sección 2: páginas de la wiki
      box.appendChild(meta);
      if (hits.length) box.appendChild(list);
      box.hidden = false;
    }

    function search(query) {
      var current = ++requestId;
      var highlight = { highlightPreTag: '<mark>', highlightPostTag: '</mark>' };
      var pages = index.search(query, Object.assign({
        hitsPerPage: MAX_HITS,
        attributesToRetrieve: ['title', 'page_title', 'url'],
        attributesToHighlight: ['title', 'page_title'],
        attributesToSnippet: ['content:24']
      }, highlight));
      // Las sugerencias del asistente nunca bloquean los resultados de páginas
      var prompts = chatAvailable()
        ? client.initIndex(SUGGEST_INDEX).search(query, Object.assign({
            hitsPerPage: 3, attributesToRetrieve: ['prompt'], attributesToHighlight: ['prompt']
          }, highlight)).then(function (r) { return r.hits; }).catch(function () { return []; })
        : Promise.resolve([]);
      Promise.all([pages, prompts]).then(function (results) {
        if (current !== requestId) return;   // llegó una respuesta más nueva
        render(results[0].hits, query, results[1]);
      }).catch(function (err) {
        console.error('Error de búsqueda (Algolia):', err);
      });
    }

    input.addEventListener('input', function () {
      var query = input.value.trim();
      clearTimeout(timer);
      if (!query) { requestId++; hide(); showTopSuggestions(); return; }
      timer = setTimeout(function () { search(query); }, DEBOUNCE_MS);
    });

    input.addEventListener('focus', function () { if (!input.value.trim()) showTopSuggestions(); });

    // Botón «Modo IA» dentro de la caja de búsqueda
    if (chatAvailable()) {
      var form = input.closest('.md-search__form');
      if (form && !form.querySelector('.etendo-search__ai')) {
        var ai = document.createElement('button');
        ai.type = 'button';
        ai.className = 'etendo-search__ai';
        ai.innerHTML = ICON_SPARKLES + '<span>Modo IA</span>';
        ai.addEventListener('click', function () { askAssistant(input.value.trim()); });
        form.appendChild(ai);
      }
    }

    input.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      var first = box.querySelector('.md-search-result__item:not(.etendo-ask__item) .md-search-result__link');
      if (first) { e.preventDefault(); window.location.href = first.href; }
    });

    // Al cerrar el buscador se limpian los resultados
    var toggle = document.getElementById('__search');
    if (toggle) toggle.addEventListener('change', function () { if (!toggle.checked) hide(); });
  }

  // document$ corre en la carga inicial y en cada navegación instantánea
  if (typeof document$ !== 'undefined') {
    document$.subscribe(initSearch);
  } else {
    document.addEventListener('DOMContentLoaded', initSearch);
  }
})();
