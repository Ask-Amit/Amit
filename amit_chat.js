/* ════════════════════════════════════════════════════════════════
   amit_chat.js — the ONE AmitChat engine, shared by every Amit page.
   v0.01 — created 2026-10-14. PREVIEW: it runs on SAMPLE data, saves nothing.

   Same root-level pattern as Amit_Ask_Live.js and amit_pin_encryption.js.
   Include with  <script src="../amit_chat.js"></script>  (path per depth).

   One engine, two places it can appear (AmitChat\CLAUDE.md decision 16):
     AmitChat.togglePopup()      the docked chat box (quick view, Facebook-style)
     AmitChat.mountPanel(el)     the roomy two-pane view (Communications > Chats tab)
   Both show the same conversations from the same data source.

   DATA SOURCE SEAM: everything the UI shows comes from AmitChat.source.
   Right now that is the built-in SAMPLE source below. Once Database\
   migration_2026-10-14_001_amitchat.sql has been run, a Supabase-backed
   source replaces it by calling AmitChat.useSource({...same four methods...}).
   Nothing else in this file changes.

   Colors come only from the shared Appearance tokens (--amit-*), with the
   classic look as the fallback, so every user's saved theme applies.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.AmitChat) return;

  var VERSION = 'v0.01';

  /* ── SAMPLE DATA (made-up people and words; nothing here is real) ── */
  var SAMPLE = {
    conversations: [
      { id: 's1', title: 'Sample study', members: 'You, Sam, Amit', unread: 2, last: 'Let’s look at Hebrews 10:1 next.', time: '9:06 pm',
        pinned: 'Open questions (2): What does “shadow” refer to? · Which days does the verse list?',
        messages: [
          { from: 'them', name: 'Sam', time: '9:02', text: 'Is the shadow the offerings, or the days themselves?' },
          { from: 'amit', name: 'Amit', time: '9:04', text: 'Here is what the text says, and the research is behind the eye.', eye: true },
          { from: 'me', name: 'You', time: '9:06', text: 'Let’s look at Hebrews 10:1 next.' }
        ], seen: 'Seen by Sam', typing: 'Sam is typing…' },
      { id: 's2', title: 'Sample printer help', members: 'You, Jordan', unread: 0, last: 'Step 2 didn’t work.', time: 'Yesterday',
        card: { title: 'Help me fix this', rows: ['Trying to: print a PDF', 'Device: Windows · Chrome', 'What happened: nothing prints'],
                steps: [['done', 'Restart the printer'], ['failed', 'Update the driver'], ['open', 'Print a test page']], cause: 'Likely — old driver' },
        messages: [
          { from: 'them', name: 'Jordan', time: 'Yesterday', text: 'It still will not print after the restart.' },
          { from: 'me', name: 'You', time: 'Yesterday', text: 'Okay, try updating the driver and tell me what happens.' }
        ], seen: '', typing: '' },
      { id: 's3', title: 'Sample prayer group', members: 'You, Sam, Jordan, Alex', unread: 0, last: 'Praying for you today.', time: 'Mon',
        messages: [
          { from: 'them', name: 'Alex', time: 'Mon', text: 'Praying for you today.' }
        ], seen: '', typing: '' }
    ]
  };

  var sampleSource = {
    label: 'Sample',
    listConversations: function () { return Promise.resolve(SAMPLE.conversations); },
    getConversation: function (id) {
      return Promise.resolve(SAMPLE.conversations.filter(function (c) { return c.id === id; })[0] || null);
    },
    send: function () { return Promise.reject(new Error('Preview only — nothing is saved yet.')); },
    unreadChats: function () {
      return Promise.resolve(SAMPLE.conversations.filter(function (c) { return c.unread > 0; }).length);
    }
  };

  /* ── STYLES (injected once) ── */
  var CSS = [
    '.acx-pop{position:fixed;right:76px;bottom:0;width:350px;height:480px;max-height:calc(100vh - 80px);z-index:9000;display:none;flex-direction:column;background:var(--amit-surface,#0f2338);border:1px solid rgba(var(--amit-accent-rgb,201,168,76),.35);border-bottom:none;border-radius:var(--amit-radius,12px) var(--amit-radius,12px) 0 0;box-shadow:0 -4px 24px rgba(0,0,0,.45);color:rgba(var(--amit-text-rgb,240,232,208),.92);font-size:14px;line-height:1.5}',
    '.acx-pop.open{display:flex}',
    '.acx-pop.min{height:44px}.acx-pop.min .acx-body{display:none}',
    '.acx-head{display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(var(--amit-accent-rgb,201,168,76),.12);border-bottom:1px solid rgba(var(--amit-accent-rgb,201,168,76),.25);cursor:pointer;flex-shrink:0}',
    '.acx-title{flex:1;font-family:var(--amit-font-heading,"Cinzel",serif);font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--amit-accent-bright,#e8c56a);font-weight:700}',
    '.acx-ver{font-size:10px;color:var(--amit-dim,rgba(240,232,208,.42));letter-spacing:.05em}',
    '.acx-x{background:none;border:none;color:var(--amit-muted,rgba(240,232,208,.78));font-size:16px;cursor:pointer;padding:0 4px}',
    '.acx-body{flex:1;min-height:0;display:flex}',
    '.acx-root{flex:1;min-height:0;min-width:0;display:flex;width:100%}',
    '.acx-list{width:100%;overflow-y:auto;padding:8px}',
    '.acx-root.acx-wide .acx-list{width:260px;flex-shrink:0;border-right:1px solid rgba(var(--amit-accent-rgb,201,168,76),.25)}',
    '.acx-row{display:flex;gap:8px;align-items:center;padding:9px 10px;border-radius:8px;cursor:pointer;border:1px solid transparent}',
    '.acx-row:hover{background:rgba(var(--amit-accent-rgb,201,168,76),.08)}',
    '.acx-row.on{background:rgba(var(--amit-accent-rgb,201,168,76),.14);border-color:rgba(var(--amit-accent-rgb,201,168,76),.3)}',
    '.acx-rt{flex:1;min-width:0}.acx-rn{font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.acx-rl{font-size:12px;color:var(--amit-muted,rgba(240,232,208,.78));white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.acx-rm{font-size:11px;color:var(--amit-dim,rgba(240,232,208,.42));text-align:right}',
    '.acx-pill{display:inline-block;min-width:18px;padding:0 6px;border-radius:999px;background:#d63b2f;color:#fff;font-size:11px;font-weight:700;text-align:center;line-height:18px}',
    '.acx-badge{position:absolute;top:-6px;right:-8px;min-width:18px;padding:0 5px;border-radius:999px;background:#d63b2f;color:#fff;font-size:11px;font-weight:700;line-height:18px;text-align:center;box-shadow:0 0 0 2px var(--amit-bg,#09141f)}',
    '.acx-thread{flex:1;min-width:0;min-height:0;display:flex;flex-direction:column}',
    '.acx-thead{padding:8px 12px;border-bottom:1px solid rgba(var(--amit-accent-rgb,201,168,76),.2);display:flex;gap:8px;align-items:center}',
    '.acx-back{background:none;border:none;color:var(--amit-accent-bright,#e8c56a);cursor:pointer;font-size:14px;padding:0}',
    '.acx-tt{font-weight:600}.acx-ts{font-size:12px;color:var(--amit-dim,rgba(240,232,208,.42))}',
    '.acx-msgs,.acx-list{scrollbar-width:thin;scrollbar-color:rgba(var(--amit-accent-rgb,201,168,76),.35) transparent}',
    '.acx-msgs::-webkit-scrollbar,.acx-list::-webkit-scrollbar{width:5px}',
    '.acx-msgs::-webkit-scrollbar-thumb,.acx-list::-webkit-scrollbar-thumb{background:rgba(var(--amit-accent-rgb,201,168,76),.3);border-radius:3px}',
    '.acx-msgs{flex:1;min-height:0;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px}',
    '.acx-pin{border:1px solid rgba(var(--amit-accent-rgb,201,168,76),.4);background:rgba(var(--amit-accent-rgb,201,168,76),.1);border-radius:8px;padding:6px 10px;font-size:12px}',
    '.acx-b{max-width:82%;padding:7px 11px;border-radius:12px;border:1px solid rgba(var(--amit-accent-rgb,201,168,76),.2)}',
    '.acx-b small{display:block;font-size:11px;color:var(--amit-dim,rgba(240,232,208,.42))}',
    '.acx-b.them{align-self:flex-start;background:rgba(var(--amit-overlay-rgb,255,255,255),.05)}',
    '.acx-b.me{align-self:flex-end;background:rgba(var(--amit-accent-rgb,201,168,76),.18)}',
    '.acx-b.amit{align-self:flex-start;background:rgba(var(--amit-accent-rgb,201,168,76),.08);border-color:rgba(var(--amit-accent-rgb,201,168,76),.5)}',
    '.acx-meta{align-self:flex-end;font-size:11px;color:var(--amit-dim,rgba(240,232,208,.42))}',
    '.acx-typing{font-size:12px;font-style:italic;color:var(--amit-muted,rgba(240,232,208,.78))}',
    '.acx-card{border:1px solid rgba(var(--amit-accent-rgb,201,168,76),.4);border-radius:8px;padding:8px 10px;font-size:13px;background:rgba(var(--amit-overlay-rgb,255,255,255),.04)}',
    '.acx-card b{color:var(--amit-accent-bright,#e8c56a)}',
    '.acx-st-done{color:#6fbf86}.acx-st-failed{color:#e07a67}',
    '.acx-comp{display:flex;gap:6px;align-items:center;padding:8px 10px;border-top:1px solid rgba(var(--amit-accent-rgb,201,168,76),.2)}',
    '.acx-comp .acx-in{flex:1;padding:7px 10px;border:1px solid rgba(var(--amit-accent-rgb,201,168,76),.25);border-radius:8px;background:rgba(var(--amit-overlay-rgb,255,255,255),.04);color:var(--amit-dim,rgba(240,232,208,.42))}',
    '.acx-ic{opacity:.55;font-size:15px}',
    '.acx-sample{font-size:11px;text-align:center;padding:3px 8px;color:var(--amit-accent-bright,#e8c56a);background:rgba(var(--amit-accent-rgb,201,168,76),.1);border-bottom:1px solid rgba(var(--amit-accent-rgb,201,168,76),.2)}',
    '.acx-empty{flex:1;display:flex;align-items:center;justify-content:center;text-align:center;padding:20px;color:var(--amit-muted,rgba(240,232,208,.78))}',
    '.acx-panel{height:100%;min-height:0;display:flex;flex-direction:column;border:1px solid rgba(var(--amit-accent-rgb,201,168,76),.25);border-radius:var(--amit-radius,12px);overflow:hidden}',
    '@media (max-width:700px){.acx-pop{right:0;left:0;width:auto;height:100%;max-height:none;border-radius:0}.acx-pop.min{height:44px;top:auto}}'
  ].join('\n');
  function injectCss() {
    if (document.getElementById('acx-css')) return;
    var s = document.createElement('style'); s.id = 'acx-css'; s.textContent = CSS; document.head.appendChild(s);
  }

  /* ── small DOM helper (text is always set as text, never as markup) ── */
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  /* ── RENDER ── */
  function renderThread(conv, opts) {
    var t = el('div', 'acx-thread');
    var h = el('div', 'acx-thead');
    if (opts.back) {
      var b = el('button', 'acx-back', '←'); b.onclick = opts.back; h.appendChild(b);
    }
    var hw = el('div');
    hw.appendChild(el('div', 'acx-tt', conv.title));
    hw.appendChild(el('div', 'acx-ts', 'Members: ' + conv.members));
    h.appendChild(hw); t.appendChild(h);
    var m = el('div', 'acx-msgs');
    if (conv.pinned) m.appendChild(el('div', 'acx-pin', 'Pinned · ' + conv.pinned));
    if (conv.card) {
      var c = el('div', 'acx-card');
      c.appendChild(el('b', null, conv.card.title));
      conv.card.rows.forEach(function (r) { c.appendChild(el('div', null, r)); });
      conv.card.steps.forEach(function (s) {
        var mark = s[0] === 'done' ? '☑ ' : s[0] === 'failed' ? '☒ ' : '☐ ';
        c.appendChild(el('div', 'acx-st-' + s[0], mark + s[1] + (s[0] === 'failed' ? '  (didn’t work)' : '')));
      });
      c.appendChild(el('div', null, 'Cause: ' + conv.card.cause));
      m.appendChild(c);
    }
    conv.messages.forEach(function (x) {
      var bub = el('div', 'acx-b ' + x.from);
      bub.appendChild(el('small', null, x.name + ' · ' + x.time));
      bub.appendChild(document.createTextNode(x.text));
      if (x.eye) { var ey = el('span', null, ' 👁️'); ey.title = 'Research'; bub.appendChild(ey); }
      m.appendChild(bub);
    });
    if (conv.seen) m.appendChild(el('div', 'acx-meta', conv.seen));
    if (conv.typing) m.appendChild(el('div', 'acx-typing', conv.typing));
    t.appendChild(m);
    /* open on the newest message, like every chat app */
    setTimeout(function () { m.scrollTop = m.scrollHeight; }, 0);
    var comp = el('div', 'acx-comp');
    comp.appendChild(el('span', 'acx-ic', '＋'));
    comp.appendChild(el('span', 'acx-ic', '📷'));
    comp.appendChild(el('span', 'acx-ic', '🎤'));
    comp.appendChild(el('div', 'acx-in', 'Preview only — not connected yet'));
    t.appendChild(comp);
    return t;
  }

  function renderRoot(container, wide) {
    container.innerHTML = '';
    var root = el('div', 'acx-root' + (wide ? ' acx-wide' : ''));
    container.appendChild(root);
    var sel = null;

    function draw(list) {
      root.innerHTML = '';
      var l = el('div', 'acx-list');
      list.forEach(function (c) {
        var r = el('div', 'acx-row' + (wide && sel === c.id ? ' on' : ''));
        var t = el('div', 'acx-rt');
        t.appendChild(el('div', 'acx-rn', c.title));
        t.appendChild(el('div', 'acx-rl', c.last));
        r.appendChild(t);
        var right = el('div', 'acx-rm', c.time);
        if (c.unread) { right.appendChild(document.createElement('br')); right.appendChild(el('span', 'acx-pill', c.unread)); }
        r.appendChild(right);
        r.onclick = function () { sel = c.id; draw(list); };
        l.appendChild(r);
      });
      if (!wide && sel) {
        AmitChat.source.getConversation(sel).then(function (conv) {
          root.innerHTML = '';
          root.appendChild(renderThread(conv, { back: function () { sel = null; draw(list); } }));
        });
        return;
      }
      root.appendChild(l);
      if (wide) {
        if (sel) {
          AmitChat.source.getConversation(sel).then(function (conv) { root.appendChild(renderThread(conv, {})); });
        } else {
          root.appendChild(el('div', 'acx-empty', 'Choose a conversation on the left.'));
        }
      }
    }
    AmitChat.source.listConversations().then(function (list) {
      sel = wide && list.length ? list[0].id : null;
      draw(list);
    });
  }

  /* ── POPUP (docked chat box) ── */
  var pop = null;
  function buildPopup() {
    if (pop) return pop;
    injectCss();
    pop = el('div', 'acx-pop'); pop.id = 'acxPopup';
    var head = el('div', 'acx-head');
    head.appendChild(el('div', 'acx-title', 'AmitChat'));
    head.appendChild(el('div', 'acx-ver', AmitChat.source.label + ' · ' + VERSION));
    var x = el('button', 'acx-x', '✕'); x.title = 'Close';
    x.onclick = function (e) { e.stopPropagation(); pop.classList.remove('open'); };
    head.appendChild(x);
    head.onclick = function () { pop.classList.toggle('min'); };
    pop.appendChild(head);
    var body = el('div', 'acx-body');
    if (AmitChat.source.label === 'Sample') body.appendChild(el('div', 'acx-sample', 'SAMPLE — made-up chats, nothing is saved'));
    body.style.flexDirection = 'column';
    var holder = el('div'); holder.style.cssText = 'flex:1;min-height:0;display:flex';
    body.appendChild(holder);
    pop.appendChild(body);
    document.body.appendChild(pop);
    renderRoot(holder, false);
    return pop;
  }

  /* ── PUBLIC API ── */
  var AmitChat = {
    version: VERSION,
    source: sampleSource,
    preview: /[?&]chatpreview=1/.test(location.search),
    useSource: function (s) { AmitChat.source = s; },
    togglePopup: function () {
      var p = buildPopup();
      if (p.classList.contains('open')) { p.classList.remove('open'); }
      else { p.classList.add('open'); p.classList.remove('min'); }
    },
    mountPanel: function (target) {
      if (!target) return;
      injectCss();
      target.innerHTML = '';
      var wrap = el('div', 'acx-panel');
      if (AmitChat.source.label === 'Sample') wrap.appendChild(el('div', 'acx-sample', 'SAMPLE — made-up chats, nothing is saved. This is how your conversations will look.'));
      var holder = el('div'); holder.style.cssText = 'flex:1;min-height:0;display:flex';
      wrap.appendChild(holder); target.appendChild(wrap);
      renderRoot(holder, true);
    },
    /* number of chats with something unread; updates every place that shows it */
    setUnread: function (n) {
      var b = document.getElementById('rail-chat-badge');
      if (b) { b.textContent = n; b.style.display = n > 0 ? '' : 'none'; }
      var tab = document.getElementById('ch-tab-btn-comm-chats');
      if (tab) tab.textContent = n > 0 ? 'Chats (' + n + ')' : 'Chats';
      var top = document.getElementById('commUnreadTop');
      if (top) { top.textContent = n > 0 ? 'Unread chats ' + n : ''; top.style.display = n > 0 ? '' : 'none'; }
    },
    refreshUnread: function () {
      /* the sample count is shown only when the page is opened with ?chatpreview=1,
         so no real visitor ever sees a made-up number */
      if (AmitChat.source.label === 'Sample' && !AmitChat.preview) { AmitChat.setUnread(0); return; }
      AmitChat.source.unreadChats().then(AmitChat.setUnread);
    }
  };
  window.AmitChat = AmitChat;
})();
