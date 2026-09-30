(function () {
  // Evitar que el sidebar se desplace automáticamente al ítem activo tras cada navegación
  if (typeof document$ !== 'undefined') {
    document$.subscribe(function () {
      var sidebar = document.querySelector('.md-sidebar--primary .md-sidebar__scrollwrap');
      if (!sidebar) return;
      var saved = sidebar.scrollTop;
      requestAnimationFrame(function () {
        sidebar.scrollTop = saved;
      });
    });
  }

  function initHeroBg() {
    var bg = document.querySelector('.etendo-home__hero-bg');
    var hero = document.querySelector('.etendo-home__hero');
    if (!bg || !hero) return;

    var BASE_OPACITY = 0.1;

    function update() {
      var heroH = hero.offsetHeight;
      var scrollY = window.scrollY || window.pageYOffset;
      var progress = Math.min(scrollY / (heroH * 0.5), 1);
      bg.style.opacity = BASE_OPACITY * (1 - progress);
    }

    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  // Campo del hero: es la entrada al asistente de IA (abre la conversación). Si el asistente no está disponible,
  // abre el buscador de Material como antes.
  function initHeroSearch() {
    var input = document.getElementById('etendo-hero-search');
    if (!input || input.dataset.bound) return;
    input.dataset.bound = '1';
    function open() {
      input.blur();
      if (window.etendoChat && typeof window.etendoChat.open === 'function') {
        window.etendoChat.open();
        return;
      }
      var toggle = document.getElementById('__search');
      if (toggle) {
        toggle.checked = true;
        toggle.dispatchEvent(new Event('change'));
      }
      setTimeout(function () {
        var mdInput = document.querySelector('.md-search__input');
        if (mdInput) mdInput.focus();
      }, 50);
    }
    input.addEventListener('click', open);
    input.addEventListener('focus', open);   // también al llegar con el teclado (Tab)
  }

  function initHome() {
    initHeroBg();
    initHeroSearch();
  }

  // document$ corre en la carga inicial y en cada navegación instantánea
  if (typeof document$ !== 'undefined') {
    document$.subscribe(initHome);
  } else {
    document.addEventListener('DOMContentLoaded', initHome);
  }
})();
