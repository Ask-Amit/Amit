/* ════════════════════════════════════════════════════════════════════════════════════════════
   askamit_visitor_source.js  v1.00 (2026-11-18)  —  AskAmit's DOOR for the real Amit chat box.

   Ryan's rule (2026-11-18): the chat box that pops up when anyone presses Ask Amit (amit_chat.js, AmitChat.openHelp) is already the door: when Amit is the only one in it, every
   message is a question to him. It is built on a swappable "source" (AmitChat.useSource). This file is a source for a VISITOR (not signed in): the SAME box, looking and behaving the
   same, but its questions go to AskAmit (ask_submit) and its answers come back by polling (ask_status). amit_chat.js is NOT changed: it is loaded as it is.

   Use (after amit_chat.js and a supabase client exist):
       AskAmitDoor.connect(db);                 // db = supabase.createClient(url, publishableKey)
       AmitChat.appName = 'hub';                // which app the press comes from (the page sets this as it does today)
       AmitChat.placeProvider = function () { return { page: 'x', label: 'the page' }; };
       AmitChat.openHelp();                     // opens the box

   What a visitor gets here: the Ask Amit box, with the messages kept in this browser tab only. What needs an account (friends, files, photos, voice messages, other chats, Show Amit, sending to
   the team) answers "That is for signed-in people. Signing up is free." The 6th question and any limit message arrive as an ordinary message from Amit (fixed words from the database).
   ════════════════════════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.AskAmitDoor) return;
  /* v1.10 (2026-11-18): the SAME door now also serves a SIGNED-IN person (makeSignedSource / AskAmitDoor.connectSigned): earlier questions come back from ask_my_history, a picture (Show Amit, a photo or a
     file the person chose) is uploaded to the private bucket askamit-shots in their own folder and travels with their next question (the engine measures it, Amit looks at it, then it is deleted). The voice
     message and live-transcript buttons are hidden (dictation and transcription are the Aurora's job), and the picture button opens Show Amit through the Helper when the Helper can, else the file picker. */
  var VERSION = '1.10', CONV = 'askamit-visitor', MSGKEY = 'askamit_visitor_msgs', GUESTKEY = 'askamit_guest', BUCKET = 'askamit-shots', HELPER = 'http://localhost:8710';
  var SIGNIN = 'That is for signed-in people. Signing up is free.';
  var SIGNED_GREETING = 'Hello again. I’m Amit. What would you like to ask? You can also send me a picture with the camera button.';
  var GREETING ='Hello, and welcome! I’m Amit. I can tell you about what Amit’s applications do and how they could help you. What would you like to know?';
  var NEEDS_ACCOUNT = ['decideLoop', 'respondInvite', 'respondFriend', 'removeFriend', 'requestFriend', 'friends', 'friendsOf', 'userByCode', 'myCode', 'invites', 'claimInvite', 'guardianDecide',
    'guardianQueue', 'requestGuardian', 'myGuardians', 'setSetting', 'setBirthDate', 'setVisibility', 'setTimezone', 'sendAttachment', 'sendVoice', 'sendShot', 'sendFixCard', 'sendTranscript',
    'sendToOwner', 'createConversation', 'renameChat', 'hideChat', 'requestDelete', 'cancelDelete', 'exportChat', 'editMessage', 'unsendMessage', 'pin', 'addItem', 'setItemState', 'deleteItem',
    'deleteNote', 'signedUrl', 'searchMessages', 'helpOpenMobile', 'helpOpenDay', 'repliesToMe', 'loops', 'listen', 'summonAmit'];

  function mem(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) {} return null; }
  function guestId() {
    var g = ''; try { g = localStorage.getItem(GUESTKEY) || ''; } catch (e) {}
    if (!/^[A-Za-z0-9_-]{16,64}$/.test(g)) {
      var a = new Uint8Array(16); (window.crypto || {}).getRandomValues ? crypto.getRandomValues(a) : a.forEach(function (_, i) { a[i] = Math.floor(Math.random() * 256); });
      g = Array.prototype.map.call(a, function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
      try { localStorage.setItem(GUESTKEY, g); } catch (e) {}
    }
    return g;
  }

  function makeVisitorSource(db, opts) {
    opts = opts || {};
    var signed = !!opts.userId, MK = signed ? MSGKEY + '_' + opts.userId : MSGKEY, loaded = false, pendingShot = null;
    var msgs = []; try { msgs = JSON.parse(mem(MK) || '[]') || []; } catch (e) { msgs = []; }
    var seq = msgs.length, cur = null, onlineAt = 0, online = true, GUEST = signed ? null : guestId();
    function save() { mem(MK, JSON.stringify(msgs.slice(-60))); }
    function uid() { var a = new Uint8Array(8); crypto.getRandomValues(a); return Array.prototype.map.call(a, function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''); }
    /* a picture: shrink it, put it in the person's own folder of the private bucket, remember it for their next question. One picture waits at a time; a replaced one is deleted. */
    function shrink(file) {
      return new Promise(function (resolve) {
        if (!/^image\/(png|jpe?g|webp|gif)$/i.test(file.type || '')) return resolve(null);
        var img = new Image(), u = URL.createObjectURL(file);
        img.onload = function () {
          try {
            var max = 1800, w = img.naturalWidth, h = img.naturalHeight, k = Math.min(1, max / Math.max(w, h));
            if (k === 1 && file.size < 1.5 * 1024 * 1024) { URL.revokeObjectURL(u); return resolve({ blob: file, type: file.type, name: file.name }); }
            var c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
            c.toBlob(function (b) { URL.revokeObjectURL(u); resolve(b ? { blob: b, type: 'image/png', name: (file.name || 'picture').replace(/\.[A-Za-z0-9]+$/, '') + '.png' } : { blob: file, type: file.type, name: file.name }); }, 'image/png');
          } catch (e) { URL.revokeObjectURL(u); resolve({ blob: file, type: file.type, name: file.name }); }
        };
        img.onerror = function () { URL.revokeObjectURL(u); resolve(null); };
        img.src = u;
      });
    }
    function putShot(file, meta) {
      meta = meta || {};
      return shrink(file).then(function (p) {
        if (!p) throw new Error('Pictures only, for now (png, jpg, webp or gif).');
        if (p.blob.size > 10 * 1024 * 1024) throw new Error('That picture is over 10 MB.');
        var nm = String(meta.name || p.name || 'picture.png').replace(/[^A-Za-z0-9._-]+/g, '_').slice(-60);
        var path = opts.userId + '/' + uid() + '-' + nm;
        return db.storage.from(BUCKET).upload(path, p.blob, { contentType: p.type, upsert: false }).then(function (up) {
          if (up && up.error) throw new Error(up.error.message || 'The picture could not be saved.');
          if (pendingShot) db.storage.from(BUCKET).remove([pendingShot.path]).then(function () {}, function () {});
          pendingShot = { path: path, name: nm, title: String(meta.title || '').slice(0, 200), text: String(meta.text || '').slice(0, 600) };
          return pendingShot;
        });
      });
    }
    function add(from, text) {
      var d = new Date();
      var m = { id: 'v' + (++seq) + '-' + d.getTime(), from: from, name: from === 'me' ? 'You' : 'Amit', time: d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }), iso: d.toISOString(), text: String(text || ''),
        removed: false, edited: false, sender: from === 'me' ? 'visitor' : 'amit', replyTo: null, type: 'text', payload: {}, waitingAmit: false };
      msgs.push(m); save(); return m;
    }
    function checkOnline() {
      if (Date.now() - onlineAt < 20000) return Promise.resolve(online);
      onlineAt = Date.now();
      return db.rpc('ask_online').then(function (r) { online = !(r && r.error) ? !!r.data : true; return online; }, function () { return online; });
    }
    function reject() { return Promise.reject(new Error(SIGNIN)); }
    /* collect the reply of the question in flight (the engine wrote it into the same row) */
    function poll() {
      if (!cur || cur.done) return Promise.resolve(cur && cur.last || null);
      return db.rpc('ask_status', { p_id: cur.id, p_guest: GUEST }).then(function (r) {
        if (r && r.error) { cur.done = true; add('amit', 'I could not get my answer back just now. Please ask again in a moment.'); return null; }
        var s = (r && r.data) || {}; cur.last = s;
        if (s.status === 'answered') { cur.done = true; add('amit', s.answer || ''); }
        else if (s.failed) { cur.done = true; add('amit', 'I could not answer that just now. Please ask again in a moment.'); }
        return s;
      }, function () { return cur.last || null; });
    }
    var src = {
      live: true, label: 'Visitor', me: 'visitor', amit: 'amit', amitReady: Promise.resolve(),
      nameOf: function (id) { return id === 'visitor' ? 'You' : 'Amit'; },
      listConversations: function () { return Promise.resolve([]); },
      unreadChats: function () { return Promise.resolve(0); },
      touchChat: function () { return Promise.resolve(); },
      markRead: function () { return Promise.resolve(); },
      ping: function () { return Promise.resolve(); },
      profile: function () { return Promise.resolve(null); },
      getSettings: function () { return Promise.resolve({}); },
      /* the Ask Amit button: the visitor's one chat with Amit, greeted in fixed words by the door (no AskAmit question is used for it) */
      helpOpen: function () {
        var first = (signed && !loaded && !msgs.length) ? db.rpc('ask_my_history', { p_limit: 12 }).then(function (r) {
          loaded = true; var rows = (r && !r.error && Array.isArray(r.data)) ? r.data : [];
          rows.forEach(function (x) { var t = new Date(x.at); [['me', x.q], ['amit', x.a]].forEach(function (p) {
            msgs.push({ id: 'h' + (++seq) + '-' + x.id.slice(0, 6), from: p[0], name: p[0] === 'me' ? 'You' : 'Amit', time: t.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }), iso: t.toISOString(), text: String(p[1] || ''),
              removed: false, edited: false, sender: p[0] === 'me' ? 'visitor' : 'amit', replyTo: null, type: 'text', payload: {}, waitingAmit: false }); }); });
          if (!rows.length) add('amit', opts.greeting || SIGNED_GREETING); else save();
        }, function () { loaded = true; add('amit', opts.greeting || SIGNED_GREETING); }) : Promise.resolve();
        return first.then(function () {
          if (!msgs.length) add('amit', opts.greeting || (signed ? SIGNED_GREETING : GREETING));
          return checkOnline();
        }).then(function (on) { return { id: CONV, number: null, created: false, greeted: true, listening: false, online: on }; });
      },
      /* a picture: Show Amit's own button (the Amit Live window or a page), the picture button, or a file the person chose. It waits for the next question and travels with it. */
      sendShot: function (id, file, meta) {
        if (!signed) return reject();
        return putShot(file, meta).then(function (s) { return { path: s.path, url: null, name: s.name, mime: 'image/png' }; });
      },
      sendAttachment: function (id, file) {
        if (!signed) return reject();
        return putShot(file, {}).then(function (s) { add('me', '📷 ' + s.name + ' (attached: now ask your question about it)'); return { data: true }; });
      },
      getConversation: function () {
        return poll().then(function () {
          var last = msgs.length ? msgs[msgs.length - 1] : null;
          return { items: [], pin: null, deleteAt: null, creator: true, purpose: 'help', solo: true, times: [], id: CONV, title: 'Ask Amit', members: 'You, Amit',
            messages: msgs.slice(), seen: '', typing: '', hasMore: false, oldest: msgs.length ? msgs[0].iso : null, lastId: last ? last.id : null, myLastRead: last ? last.id : null, amitIn: true, amitId: 'amit' };
        });
      },
      send: function (id, text) {
        var t = String(text || '').trim(); if (!t) return Promise.reject(new Error('Type a message first.'));
        return Promise.resolve({ data: add('me', t) });
      },
      /* one press = one question to AskAmit. The 6th question (or any refusal) is shown as Amit's own message, in the database's fixed words. */
      ask: function (id, o) {
        o = o || {}; var tz = ''; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
        var place = {}; try { var from = (o.place && o.place.from) || {}; place = { page: String(from.page || '').slice(0, 60), label: String(from.label || '').slice(0, 80) }; } catch (e) {}
        var question = String(o.note || '').trim(); if (!question) return Promise.resolve({ online: online });
        var shot = signed ? pendingShot : null;
        if (shot) { place.shot = { path: shot.path, name: shot.name, title: shot.title, text: shot.text }; if (o.place && o.place.from && o.place.from.attachment) add('me', '📷 ' + shot.name + (shot.title ? ' — ' + shot.title : '') + '\n' + question); }
        return db.rpc('ask_submit', { p_app: o.app || 'unknown', p_place: place, p_style: 'chat', p_question: question, p_tz: tz || null, p_guest: GUEST }).then(function (r) {
          if (r && r.error) { cur = { id: null, done: true, last: { status: 'answered' } }; add('amit', r.error.message || 'I could not take that question just now.'); return { online: online }; }
          pendingShot = null;                /* the picture left with this question (the engine deletes it when the answer is done) */
          var d = r.data || {}; cur = { id: d.id, done: false, last: { status: 'new', ahead: d.ahead || 0 } }; online = d.online !== false; onlineAt = Date.now();
          return { id: d.id, number: null, ahead: d.ahead || 0, online: online };
        });
      },
      askStatus: function () {
        return Promise.all([poll(), checkOnline()]).then(function (res) {
          var s = res[0], on = res[1], pending = !!(cur && !cur.done);
          return { id: cur && cur.id, status: pending ? ((s && s.status) || 'new') : 'answered', ahead: (s && s.ahead) || 0, online: on, listening: false, listening_by: null, thinking: pending && s && s.status === 'working', others_online: 0, online_names: [] };
        });
      }
    };
    src.label = signed ? 'Signed in' : 'Visitor'; if (signed) { src.me = opts.userId; src.nameOf = function (id) { return id === opts.userId ? 'You' : 'Amit'; }; }
    NEEDS_ACCOUNT.forEach(function (n) { if (!src[n]) src[n] = reject; });
    return src;
  }

  /* THE TYPING SPACE AND THE TWO VOICES (Ryan, 2026-11-18): in the box the text box shared one row with every button, so it shrank to three letters wide; and both sides looked alike.
     Fixed here as a style layered on top of the box (amit_chat.js is not changed): the text box gets its OWN full-width row, styled as the person's own message bubble (right side, gold), and GROWS
     downward as they type; the buttons sit in a row beneath it. Amit's bubbles are blue-teal and offset from the left, the person's are gold and offset from the right. */
  var CSS = [
    /* THE SIZE OF THE SMALL BOX (Ryan, 2026-11-18: "it's awful small"; then "not by the pixel size: by the size of the current monitor"): 25% of the width and 50% of the height of the MONITOR the page is on
       (sizeBox() below reads it from the browser and sets these two variables; the fallback is the window). Phone-size windows (700 px and under) keep the box's own full-screen layout, and a minimised box
       keeps its 44 px bar. The maximise arrow is unchanged. */
    '@media (min-width: 701px) { .acx-pop.acx-pop:not(.min) { width: var(--askamit-box-w, 25vw); height: var(--askamit-box-h, 50vh); max-height: none; } }',
    '.acx-pop .acx-comp, .acx-panel .acx-comp { flex-wrap: wrap; align-items: center; row-gap: 6px; padding: 8px 10px 10px; }',
    '.acx-pop .acx-comp textarea, .acx-panel .acx-comp textarea { order: -1; flex: 1 1 100%; margin-left: 12%; min-width: 0; box-sizing: border-box; min-height: 68px; max-height: 38vh; overflow-y: auto;',
    '  padding: 10px 13px; font-size: 15px; line-height: 1.4; border-radius: 14px 14px 4px 14px; background: rgba(214,170,60,.38); border: 1px solid rgba(232,197,106,.85); color: #fff8e4; resize: none; }',
    '.acx-pop .acx-comp textarea { max-height: 22vh; }',
    '.acx-pop .acx-comp textarea:focus, .acx-panel .acx-comp textarea:focus { outline: none; border-color: rgba(232,197,106,.95); box-shadow: 0 0 0 2px rgba(201,168,76,.25); }',
    '.acx-pop .acx-comp .acx-btn.go, .acx-panel .acx-comp .acx-btn.go { margin-left: auto; }',
    '.acx-pop .acx-b, .acx-panel .acx-b { max-width: 86%; }',
    '.acx-pop .acx-b.amit, .acx-pop .acx-b.them, .acx-panel .acx-b.amit, .acx-panel .acx-b.them { align-self: flex-start; margin-right: 8%; background: rgba(55,125,215,.40); border-color: rgba(125,185,245,.8); border-radius: 12px 12px 12px 4px; }',
    '.acx-pop .acx-b.me, .acx-panel .acx-b.me { align-self: flex-end; margin-left: 8%; background: rgba(214,170,60,.38); border-color: rgba(232,197,106,.85); border-radius: 12px 12px 4px 12px; }',
    '.acx-pop .acx-b.amit small, .acx-pop .acx-b.them small, .acx-panel .acx-b.amit small, .acx-panel .acx-b.them small { color: rgba(170,210,255,.95); }',
    '.acx-pop .acx-b.me small, .acx-panel .acx-b.me small { color: rgba(240,205,120,.95); text-align: right; }',
    /* dictation and transcription are the Aurora's job now (Ryan, 2026-11-18): no voice-message or live-transcript button in this box */
    '.acx-comp .acx-ib[title^="Record a voice"], .acx-comp .acx-ib[title^="Live transcript"] { display: none !important; }'
  ].join('\n');

  /* THE PICTURE BUTTON (Ryan, 2026-11-18): it opens Show Amit (capture an area, upload, or take one from the phone); Show Amit's own Ask Amit button then sends the picture into this chat. When the Helper
     cannot open Show Amit (not installed, an older Helper, a phone, another computer) the button does what it always did: the file or camera picker. Show Amit's pending picture is claimed through the
     same "seen" mark the Amit Live window uses, so only one of the two posts it. */
  var showAmitOk = false, probeAt = 0, watching = 0;
  function probeShowAmit() {
    if (Date.now() - probeAt < 60000) return; probeAt = Date.now();
    try { fetch(HELPER + '/api/menus', { signal: AbortSignal.timeout(1500) }).then(function (r) { return r.json(); }).then(function (j) {
      showAmitOk = !!(j && Array.isArray(j.menus) && j.menus.some(function (m) { return m && m.id === 'show-amit' && m.buttonOk; }));
    }).catch(function () { showAmitOk = false; }); } catch (e) { showAmitOk = false; }
  }
  function watchShot() {
    var until = Date.now() + 5 * 60000, n = ++watching;
    var t = setInterval(function () {
      if (n !== watching || Date.now() > until) { clearInterval(t); return; }
      fetch(HELPER + '/api/showamit/pending').then(function (r) { return r.json(); }).then(function (j) {
        if (!j || !j.id) return; var seen = ''; try { seen = localStorage.getItem('amit_shot_seen') || ''; } catch (e) {}
        if (seen === j.id) return; try { localStorage.setItem('amit_shot_seen', j.id); } catch (e) {}
        clearInterval(t);
        fetch(HELPER + '/api/showamit/pending.png?id=' + encodeURIComponent(j.id)).then(function (r) { if (!r.ok) throw new Error('the picture is no longer available'); return r.blob(); })
          .then(function (blob) { return AmitChat.sendShot(new File([blob], j.name || 'shot.png', { type: 'image/png' }), { title: j.title, text: j.text, name: j.name }); })
          .then(function () { if (AmitChat.showHelpChat) AmitChat.showHelpChat(); }).catch(function () {});
      }).catch(function () {});
    }, 2500);
  }
  function hookPictureButton() {
    document.addEventListener('click', function (e) {
      var b = e.target && e.target.closest && e.target.closest('.acx-comp .acx-ib[title="Send a photo"]'); if (!b) return;
      if (!showAmitOk) return;                                     /* no Show Amit available: the ordinary picker opens */
      e.stopImmediatePropagation(); e.preventDefault();
      fetch(HELPER + '/api/menu/open?id=show-amit').then(function (r) { return r.json(); }).then(function (j) { if (j && j.ok) watchShot(); else { showAmitOk = false; b.click(); } }).catch(function () { showAmitOk = false; b.click(); });
    }, true);
    probeShowAmit(); document.addEventListener('click', function (e) { if (e.target && e.target.closest && e.target.closest('#rail-chat')) probeShowAmit(); }, true);
  }
  function grow(t) {
    try {
      var cap = parseFloat(getComputedStyle(t).maxHeight); if (!cap || isNaN(cap)) cap = Math.round(window.innerHeight * 0.38);   /* the cap comes from the style: 22% of the window in the small box, 38% full screen */
      t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight + 2, cap) + 'px';
    } catch (e) {}
  }
  /* 25% of the width and 50% of the height of the monitor the page is on, never bigger than the browser window itself. Read again when the window changes size, comes back into focus (it may have been
     moved to another monitor) and when the Ask Amit button is pressed. */
  function sizeBox() {
    try {
      var sw = (screen && (screen.availWidth || screen.width)) || window.innerWidth, sh = (screen && (screen.availHeight || screen.height)) || window.innerHeight;
      var w = Math.min(Math.round(sw * 0.25), window.innerWidth - 24), h = Math.min(Math.round(sh * 0.5), window.innerHeight - 24);
      var st = document.documentElement.style; st.setProperty('--askamit-box-w', w + 'px'); st.setProperty('--askamit-box-h', h + 'px');
      if (window.AmitChat && typeof AmitChat.reposition === 'function') AmitChat.reposition();
      return { screenW: sw, screenH: sh, w: w, h: h };
    } catch (e) { return null; }
  }
  var styled = false;
  function injectStyle() {
    if (styled) return; styled = true;
    sizeBox(); hookPictureButton();
    window.addEventListener('resize', sizeBox); window.addEventListener('focus', sizeBox);
    document.addEventListener('click', function (e) { if (e.target && e.target.closest && e.target.closest('#rail-chat')) sizeBox(); }, true);
    var s = document.createElement('style'); s.id = 'askamit-door-css'; s.textContent = CSS; document.head.appendChild(s);
    /* the box has its own input handler (amit_chat.js line 1992) that caps the text box at 110 px; this one runs AFTER it (the bubbling phase, not the capturing phase) and lets the text box grow
       up to 38% of the window instead */
    document.addEventListener('input', function (e) { var t = e.target; if (t && t.tagName === 'TEXTAREA' && t.closest && t.closest('.acx-comp')) grow(t); }, false);
  }

  window.AskAmitDoor = {
    version: VERSION,
    makeVisitorSource: makeVisitorSource,
    injectStyle: injectStyle,
    sizeBox: sizeBox,
    /* wires the real chat box to AskAmit for a visitor; the page then calls AmitChat.openHelp() as it does today */
    connect: function (db, opts) {
      if (!window.AmitChat) throw new Error('amit_chat.js must be loaded first');
      injectStyle();
      var src = makeVisitorSource(db, opts);
      /* a visitor has no storage login: no picture or file buttons (they appear after signing in) */
      if (!document.getElementById('askamit-visitor-css')) { var vs = document.createElement('style'); vs.id = 'askamit-visitor-css'; vs.textContent = '.acx-comp .acx-ib[title^="Attach a file"], .acx-comp .acx-ib[title="Send a photo"] { display: none !important; }'; document.head.appendChild(vs); }
      window.AmitChat.live = { me: 'visitor', db: db };
      window.AmitChat.useSource(src);
      return src;
    },
    /* the same box for a SIGNED-IN person (db already signed in; userId = their auth id). Questions go to AskAmit under their own login; pictures are allowed. */
    connectSigned: function (db, userId, opts) {
      if (!window.AmitChat) throw new Error('amit_chat.js must be loaded first');
      if (!userId) throw new Error('connectSigned needs the signed-in person’s id');
      injectStyle();
      var src = makeVisitorSource(db, Object.assign({}, opts || {}, { userId: userId }));
      window.AmitChat.live = { me: userId, db: db };
      window.AmitChat.useSource(src);
      return src;
    }
  };
})();
