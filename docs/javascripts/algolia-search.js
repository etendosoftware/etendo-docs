/* Buscador de Etendo Academy con Algolia.
   Se engancha a la caja de búsqueda de Material y sustituye sus resultados (lunr)
   por los del índice de Algolia. La search-only key es pública por diseño. */
(function () {
  var APP_ID = 'XMLZ1ZZEY7';
  var SEARCH_KEY = 'de992ae25d65509474690fe8761e2a21';
  var INDEX_NAME = 'etendo_go_docs_index_es';
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

    var index = algoliasearch(APP_ID, SEARCH_KEY).initIndex(INDEX_NAME);

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

    function render(hits, query) {
      var meta = document.createElement('div');
      meta.className = 'md-search-result__meta';
      meta.textContent = hits.length === 0
        ? 'No se encontraron resultados'
        : hits.length === 1 ? '1 resultado' : hits.length + ' resultados';

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
      box.appendChild(meta);
      if (hits.length) box.appendChild(list);
      box.hidden = false;
    }

    function search(query) {
      var current = ++requestId;
      index.search(query, {
        hitsPerPage: MAX_HITS,
        attributesToRetrieve: ['title', 'page_title', 'url'],
        attributesToHighlight: ['title', 'page_title'],
        attributesToSnippet: ['content:24'],
        highlightPreTag: '<mark>',
        highlightPostTag: '</mark>'
      }).then(function (res) {
        if (current !== requestId) return;   // llegó una respuesta más nueva
        render(res.hits, query);
      }).catch(function (err) {
        console.error('Error de búsqueda (Algolia):', err);
      });
    }

    input.addEventListener('input', function () {
      var query = input.value.trim();
      clearTimeout(timer);
      if (!query) { requestId++; hide(); return; }
      timer = setTimeout(function () { search(query); }, DEBOUNCE_MS);
    });

    input.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      var first = box.querySelector('.md-search-result__link');
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
