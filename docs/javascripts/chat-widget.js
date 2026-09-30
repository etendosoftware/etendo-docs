/* Asistente de IA de Etendo Academy.
   Botón flotante que abre una vista de conversación a pantalla completa (sustituye al contenido de la página)
   y habla con un agente de Algolia Agent Studio (formato ai-sdk v5).
   La search-only key es pública por diseño; el agente responde solo con el índice de la wiki. */
(function () {
  var APP_ID = 'XMLZ1ZZEY7';
  var SEARCH_KEY = 'de992ae25d65509474690fe8761e2a21';
  var AGENT_ID = '315444ad-41d9-442c-b4f9-7cea08eaa4b7';
  var ENDPOINT = 'https://' + APP_ID.toLowerCase() + '.algolia.net/agent-studio/1/agents/' + AGENT_ID + '/completions?compatibilityMode=ai-sdk-5';
  var STORAGE_KEY = 'etendo-chat-history';
  var MAX_STORED = 30;

  var SUGGESTIONS = [
    '¿Cómo creo un presupuesto?',
    '¿Cómo importo contactos?',
    '¿Qué es la conciliación bancaria?'
  ];

  var ICON_CHAT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>';
  var ICON_CLOSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
  var ICON_SEND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>';
  var ICON_STOP = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>';
  var ICON_TRASH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';

  // ---------- Markdown mínimo y seguro ----------
  function escapeHtml(text) {
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function inline(text) {
    var html = escapeHtml(text);
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/(^|[\s(])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
    html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, function (_, label, url) {
      return '<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + label + '</a>';
    });
    return html;
  }

  function markdown(text) {
    var lines = String(text).split('\n');
    var out = [];
    var list = null;   // 'ul' | 'ol'
    function closeList() { if (list) { out.push('</' + list + '>'); list = null; } }
    lines.forEach(function (raw) {
      var line = raw.replace(/\s+$/, '');
      var ol = line.match(/^\s*\d+[.)]\s+(.*)$/);
      var ul = line.match(/^\s*[-*•]\s+(.*)$/);
      var heading = line.match(/^#{1,6}\s+(.*)$/);
      if (ol) {
        if (list !== 'ol') { closeList(); out.push('<ol>'); list = 'ol'; }
        out.push('<li>' + inline(ol[1]) + '</li>');
      } else if (ul) {
        if (list !== 'ul') { closeList(); out.push('<ul>'); list = 'ul'; }
        out.push('<li>' + inline(ul[1]) + '</li>');
      } else if (heading) {
        closeList();
        out.push('<p><strong>' + inline(heading[1]) + '</strong></p>');
      } else if (line.trim() === '') {
        closeList();
      } else {
        closeList();
        out.push('<p>' + inline(line) + '</p>');
      }
    });
    closeList();
    return out.join('');
  }

  // ---------- Estado ----------
  var messages = [];   // { id, role: 'user' | 'assistant', text }
  var controller = null;
  var streaming = false;

  function load() {
    try {
      var saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]');
      if (Array.isArray(saved)) messages = saved.slice(-MAX_STORED);
    } catch (e) { messages = []; }
  }

  function save() {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_STORED))); } catch (e) { /* sin almacenamiento */ }
  }

  function uid() { return 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  // ---------- Interfaz ----------
  var els = {};

  function build() {
    if (document.getElementById('etendo-chat')) return false;

    var root = document.createElement('div');
    root.id = 'etendo-chat';
    root.innerHTML =
      '<button type="button" class="etendo-chat__fab" aria-label="Abrir el asistente de IA" aria-expanded="false">' + ICON_CHAT + '<span>Pregunta al asistente</span></button>' +
      '<section class="etendo-chat__panel" role="dialog" aria-label="Asistente de Etendo Academy" aria-hidden="true">' +
        '<header class="etendo-chat__header">' +
          '<div class="etendo-chat__title"><strong>etendo</strong> Academy<span>Asistente de IA</span></div>' +
          '<button type="button" class="etendo-chat__icon-btn" data-action="clear" aria-label="Nueva conversación" title="Nueva conversación">' + ICON_TRASH + '</button>' +
          '<button type="button" class="etendo-chat__icon-btn" data-action="close" aria-label="Cerrar el asistente" title="Cerrar (Esc)">' + ICON_CLOSE + '</button>' +
        '</header>' +
        '<div class="etendo-chat__scroll" aria-live="polite"><div class="etendo-chat__thread"></div></div>' +
        '<div class="etendo-chat__dock">' +
          '<form class="etendo-chat__form">' +
            '<textarea rows="1" placeholder="Pregunta algo sobre Etendo…" aria-label="Tu pregunta" maxlength="1000"></textarea>' +
            '<button type="submit" class="etendo-chat__send" aria-label="Enviar">' + ICON_SEND + '</button>' +
          '</form>' +
          '<p class="etendo-chat__note">Las respuestas se generan con IA a partir de esta documentación y pueden contener errores.</p>' +
        '</div>' +
      '</section>';
    document.body.appendChild(root);

    els.root = root;
    els.fab = root.querySelector('.etendo-chat__fab');
    els.panel = root.querySelector('.etendo-chat__panel');
    els.scroll = root.querySelector('.etendo-chat__scroll');
    els.list = root.querySelector('.etendo-chat__thread');
    els.form = root.querySelector('.etendo-chat__form');
    els.input = root.querySelector('textarea');
    els.send = root.querySelector('.etendo-chat__send');

    els.fab.addEventListener('click', function () { toggle(); });
    root.querySelector('[data-action="close"]').addEventListener('click', function () { toggle(false); });
    root.querySelector('[data-action="clear"]').addEventListener('click', clearConversation);
    els.form.addEventListener('submit', function (e) { e.preventDefault(); submit(); });
    els.input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
    });
    els.input.addEventListener('input', autosize);
    root.addEventListener('keydown', function (e) { if (e.key === 'Escape') toggle(false); });
    // Los enlaces a la propia wiki navegan en la misma pestaña y cierran el chat; el resto se abre aparte
    els.list.addEventListener('click', function (e) {
      var a = e.target.closest('a[href]');
      if (!a) return;
      if (a.origin === location.origin) { a.removeAttribute('target'); toggle(false); }
    });
    return true;
  }

  function autosize() {
    els.input.style.height = 'auto';
    els.input.style.height = Math.min(els.input.scrollHeight, 120) + 'px';
  }

  // La vista ocupa todo el espacio bajo la cabecera (y las pestañas, si están visibles)
  function measureTop() {
    var top = 0;
    var header = document.querySelector('.md-header');
    if (header) top = header.getBoundingClientRect().bottom;
    var tabs = document.querySelector('.md-tabs');
    if (tabs && !tabs.hasAttribute('hidden')) top = Math.max(top, tabs.getBoundingClientRect().bottom);
    els.root.style.setProperty('--etendo-chat-top', Math.max(top, 0) + 'px');
  }

  function toggle(force) {
    var open = typeof force === 'boolean' ? force : !els.root.classList.contains('is-open');
    if (open) measureTop();
    els.root.classList.toggle('is-open', open);
    document.body.classList.toggle('etendo-chat-open', open);
    els.panel.setAttribute('aria-hidden', String(!open));
    els.fab.setAttribute('aria-expanded', String(open));
    if (open) { setTimeout(function () { els.input.focus(); scrollDown(); }, 180); }
  }

  function scrollDown() { els.scroll.scrollTop = els.scroll.scrollHeight; }

  function setBusy(busy) {
    streaming = busy;
    els.send.innerHTML = busy ? ICON_STOP : ICON_SEND;
    els.send.setAttribute('aria-label', busy ? 'Detener' : 'Enviar');
    els.send.type = busy ? 'button' : 'submit';
  }

  function bubble(role, html, extra) {
    var div = document.createElement('div');
    div.className = 'etendo-chat__msg etendo-chat__msg--' + role + (extra ? ' ' + extra : '');
    div.innerHTML = html;
    els.list.appendChild(div);
    scrollDown();
    return div;
  }

  function renderAll() {
    els.list.innerHTML = '';
    if (!messages.length) {
      var hero = document.createElement('div');
      hero.className = 'etendo-chat__hero';
      hero.innerHTML = '<h2>¿En qué podemos ayudarte?</h2><p>Pregúntame cómo hacer las cosas en Etendo. Respondo con lo que dice esta documentación.</p>';
      var chips = document.createElement('div');
      chips.className = 'etendo-chat__chips';
      SUGGESTIONS.forEach(function (text) {
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = text;
        b.addEventListener('click', function () { submit(text); });
        chips.appendChild(b);
      });
      hero.appendChild(chips);
      els.list.appendChild(hero);
      return;
    }
    messages.forEach(function (m) {
      bubble(m.role, m.role === 'user' ? '<p>' + escapeHtml(m.text) + '</p>' : markdown(m.text));
    });
  }

  function clearConversation() {
    if (controller) controller.abort();
    messages = [];
    save();
    setBusy(false);
    renderAll();
    els.input.focus();
  }

  // ---------- Conexión con el agente ----------
  var GENERIC_ERROR = 'Ahora mismo no puedo responder. Inténtalo de nuevo en unos minutos o usa el buscador de la wiki.';

  function submit(presetText) {
    if (streaming) { if (controller) controller.abort(); return; }
    var text = (presetText || els.input.value).trim();
    if (!text) return;
    els.input.value = '';
    autosize();

    messages.push({ id: uid(), role: 'user', text: text });
    if (messages.length === 1) els.list.innerHTML = '';
    bubble('user', '<p>' + escapeHtml(text) + '</p>');

    var reply = { id: uid(), role: 'assistant', text: '' };
    var node = bubble('assistant', '<span class="etendo-chat__typing" aria-label="Escribiendo"><i></i><i></i><i></i></span>');
    stream(reply, node);
  }

  function stream(reply, node) {
    controller = new AbortController();
    setBusy(true);

    var payload = {
      messages: messages.map(function (m) {
        return { id: m.id, role: m.role, parts: [{ type: 'text', text: m.text }] };
      })
    };

    function finish(failed) {
      setBusy(false);
      controller = null;
      if (failed && !reply.text) {
        reply.text = GENERIC_ERROR;
        node.classList.add('etendo-chat__msg--error');
        node.innerHTML = markdown(reply.text);
      }
      if (reply.text) { messages.push(reply); save(); }
      else { node.remove(); save(); }
      scrollDown();
    }

    fetch(ENDPOINT, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-algolia-application-id': APP_ID,
        'x-algolia-api-key': SEARCH_KEY
      },
      body: JSON.stringify(payload)
    }).then(function (res) {
      if (!res.ok || !res.body) throw new Error('HTTP ' + res.status);
      var reader = res.body.getReader();
      var decoder = new TextDecoder();
      var buffer = '';
      var failed = false;

      function handle(event) {
        if (event.type === 'text-delta' && typeof event.delta === 'string') {
          reply.text += event.delta;
          node.innerHTML = markdown(reply.text);
          scrollDown();
        } else if (event.type === 'error') {
          console.error('Error del agente:', event.errorText);
          failed = true;
        }
      }

      function pump() {
        return reader.read().then(function (chunk) {
          if (chunk.done) { finish(failed); return; }
          buffer += decoder.decode(chunk.value, { stream: true });
          var events = buffer.split('\n\n');
          buffer = events.pop();
          events.forEach(function (block) {
            block.split('\n').forEach(function (line) {
              if (line.indexOf('data:') !== 0) return;
              var data = line.slice(5).trim();
              if (!data || data === '[DONE]') return;
              try { handle(JSON.parse(data)); } catch (e) { /* línea parcial o de otro tipo */ }
            });
          });
          return pump();
        });
      }
      return pump();
    }).catch(function (err) {
      if (err && err.name === 'AbortError') { finish(false); return; }
      console.error('Error de conexión con el agente:', err);
      finish(true);
    });
  }

  // ---------- Arranque ----------
  function init() {
    if (!build()) return;
    load();
    renderAll();
  }

  // document$ corre en la carga inicial y en cada navegación instantánea
  if (typeof document$ !== 'undefined') {
    document$.subscribe(init);
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
