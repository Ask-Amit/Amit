/* ════════════════════════════════════════════════════════════════
   amit_master.js — the shared connection layer of the Amit master template.
   v0.01 — 2026-11-26. First step of the "master template + sub template" direction (Templates\CLAUDE.md).

   WHAT IT DOES, the way Hub\amit-hub.html does it, for every app built from Templates\template.html:
     - Ask Amit: opens the person's own AmitChat when signed in, the guest pop-up when signed out.
       A new app needs no wiring: its key comes from its title. A real entry in PAGE_CONTEXTS
       (Amit_Ask_Live.js) is used when there is one; otherwise an honest general one is added here.
     - AmitChat hooks: voice (the same About Me contact row as the Hub), speaking icon, birth date
       (sends the person to the Hub's About Me), full screen (opens the Hub's Chats), where the person is.
     - ?ask=amit in the address.
     - Right rail: Watcher eye (owner only), Helper light (signed in), Help (AmitFix).
     - Sign-in window: email and password like the Hub, with the emailed link kept as a second way.
     - Header middle title follows the open page and tab.
     - Colors: the older pop-ups and the imported TemplateViews layouts follow the saved Appearance theme.
   Local things are reached only through the one shared Amit bridge, http://localhost:8710.
   It reads and writes no table of its own and never creates its own database client.

   HOW TO INCLUDE (in <head>, after Amit_Ask_Live.js; adjust the path to the page's depth):
     <script src="../amit_master.js?v=0.01"></script>
   The page declares its own Supabase client as `db` (as the template does).

   OPTIONAL settings, only if an app needs them:
     window.AMIT_APP = { name:'My App', askKey:'myapp',
       openFullChat: function(chatId){}, openBirthDate: function(){}, place: function(){ return {page,label}; } };

   If this file cannot load, the page still shows and its own simple sign-in and Ask Amit still work.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.AmitMaster) return;

  var VERSION = '0.01';
  var BASE = (function () { var s = document.currentScript; return s && s.src ? s.src.replace(/[?#].*$/, '').replace(/[^\/]*$/, '') : '../'; })();
  var HUB = BASE + 'Hub/amit-hub.html';
  var BRIDGE = 'http://localhost:8710';
  var OWNER_UID = '8b95d057-fd6b-44ec-abe7-658e08872d1a';   /* the Amit account id: the quick "yes, owner", exactly as the Hub does it */
  var OWNER_CONTACT_V = '1.01', SPEAKING_V = '4.00';

  function cfg() { return window.AMIT_APP || {}; }
  function client() { try { return (typeof db !== 'undefined' && db && db.auth) ? db : null; } catch (e) { return null; } }
  function txt(sel) { var n = document.querySelector(sel); return n ? (n.textContent || '').trim() : ''; }
  function byId(id) { return document.getElementById(id); }

  var user = null;

  /* ── THE APP'S NAME AND KEY ─────────────────────────────── */
  function appName() { return String(cfg().name || txt('#pageTitle') || document.title || 'Amit app').replace(/\s+/g, ' ').slice(0, 60); }
  function appKey() {
    if (cfg().askKey) return cfg().askKey;
    var slug = appName().toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40) || 'page';
    try { var hit = Object.keys(PAGE_CONTEXTS).filter(function (k) { return k.toLowerCase() === slug; })[0]; if (hit) return hit; } catch (e) {}
    return slug;
  }
  /* A page with no written description of its own gets an honest general one, so the guest pop-up works instead of "not connected here yet". */
  function registerAsk() {
    var key = appKey(), name = appName();
    try {
      if (!PAGE_CONTEXTS[key]) {
        PAGE_CONTEXTS[key] = '## WHERE THIS CONVERSATION STARTED — ' + name + '\n\nThe person is on ' + name + ', an application inside the Amit system. A detailed description of this application has not been written yet, so do not assume or invent what it does or what is on the screen. Ask them what they are looking at and what they would like help with.';
        console.info('Amit: "' + key + '" has no description of its own in PAGE_CONTEXTS (Amit_Ask_Live.js); using the general one. Write a real one when the app is ready.');
      }
      if (!PAGE_DISPLAY_NAMES[key]) PAGE_DISPLAY_NAMES[key] = name;
    } catch (e) {}
    return key;
  }

  /* ── WHERE THE PERSON IS ────────────────────────────────── */
  function activePageName() { return txt('.sidebar .page-nav.active .page-name'); }
  function activeTabName() { return txt('.detail.active .ch-tab-btn.active'); }
  function place() {
    if (typeof cfg().place === 'function') return cfg().place();
    var p = activePageName(), t = activeTabName();
    return { page: appKey(), label: (appName() + (p ? ': ' + p : '') + (t ? ' / ' + t : '')).slice(0, 80) };
  }
  /* the title in the middle of the top bar follows the open page and tab (the Hub does the same) */
  function paintContext() {
    var a = byId('pageContext'), b = byId('pageContextSub'), name = activePageName();
    if (!name) return;
    var sub = activeTabName() || txt('.sidebar .page-nav.active .page-sub');
    if (sub === '—') sub = '';
    if (a) a.textContent = name;
    if (b) b.textContent = sub.toUpperCase();
  }
  function navigated() {
    paintContext();
    try { if (window.AmitChat && AmitChat.onNavigate) AmitChat.onNavigate(); } catch (e) {}
  }

  /* ── A SMALL NOTICE (uses the template's own Popup) ─────── */
  function notice(title, body, linkText, href) {
    if (typeof window.popupOpen !== 'function') { window.alert(title + '\n\n' + body + (href ? '\n\n' + href : '')); return; }
    var wrap = document.createElement('div'), h = document.createElement('div'), p = document.createElement('div');
    h.style.cssText = "font-family:var(--amit-font-heading,'Cinzel',serif);font-size:15px;letter-spacing:.06em;color:var(--gold2,#e8c56a);margin-bottom:10px;padding-right:70px";
    h.textContent = title;
    p.style.cssText = 'font-size:15px;line-height:1.7;color:var(--text2,#f0e8d0)';
    p.textContent = body;
    wrap.appendChild(h); wrap.appendChild(p);
    if (href) {
      var a = document.createElement('a');
      a.href = href; a.target = '_blank'; a.textContent = linkText;
      a.style.cssText = "display:inline-block;margin-top:16px;padding:10px 16px;text-decoration:none;background:var(--amit-btn-bg,rgba(201,168,76,.12));border:1px solid var(--amit-btn-border,rgba(201,168,76,.45));color:var(--amit-btn-text,#e8c56a);border-radius:var(--amit-btn-radius,7px);font-family:var(--amit-font-heading,'Cinzel',serif);font-size:12px;letter-spacing:.08em";
      wrap.appendChild(a);
    }
    window.popupOpen(wrap.outerHTML);
  }

  /* ── VOICE: the same About Me contact row the Hub uses (amit_owner_contact.js) ── */
  var contact = null;
  function userName() {
    var n = ''; try { n = localStorage.getItem('amit_user_name') || ''; } catch (e) {}
    return n || (user && user.user_metadata && user.user_metadata.name) || '';
  }
  async function ownerContact() {
    if (contact || !user || !client() || typeof getOrCreateOwnerContact !== 'function') return contact;
    var forId = user.id, c = null;
    try { c = await getOrCreateOwnerContact(client(), forId, userName(), user.email); } catch (e) {}
    if (user && user.id === forId) contact = c;
    return contact;
  }
  async function chatVoice() {
    var c = await ownerContact();
    var voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
    if (window.speechSynthesis && !voices.length) {
      await new Promise(function (r) { var t = setTimeout(r, 1500); window.speechSynthesis.onvoiceschanged = function () { clearTimeout(t); r(); }; });
      voices = window.speechSynthesis.getVoices();
    }
    var voice = (typeof resolveVoiceFromContact === 'function') ? resolveVoiceFromContact(voices, c, null) : null;
    var D = (typeof AMIT_DEFAULT_VOICE !== 'undefined') ? AMIT_DEFAULT_VOICE : { voice_rate: 1.1, voice_pitch: 1, voice_volume: 1, voice_pause_scale: 1 };
    return {
      voice: voice,
      rate: c && c.voice_rate ? Number(c.voice_rate) : D.voice_rate,
      pitch: c && c.voice_pitch ? Number(c.voice_pitch) : D.voice_pitch,
      volume: c && c.voice_volume != null ? Number(c.voice_volume) : D.voice_volume,
      pauseScale: c && c.voice_pause_scale ? Number(c.voice_pause_scale) : D.voice_pause_scale
    };
  }
  async function saveVoice(fields) {
    var c = await ownerContact();
    if (!c || typeof saveOwnerContactFields !== 'function') return false;
    var ok = await saveOwnerContactFields(client(), c.id, fields);
    if (ok) Object.assign(c, fields);
    return ok;
  }

  /* ── AMITCHAT HOOKS ─────────────────────────────────────── */
  var waitingForBirthDate = false;
  function needBirthDate() {
    if (typeof cfg().openBirthDate === 'function') { cfg().openBirthDate(); return; }
    waitingForBirthDate = true;
    notice('Your birth date is needed', 'Chat needs your birth date once. It is entered in the Hub, under About Me. Open the Hub, go to About Me, save it, then come back to this page.', 'OPEN THE HUB', HUB);
  }
  function fullChat(id) {
    if (typeof cfg().openFullChat === 'function') { cfg().openFullChat(id); return; }
    /* until the app has its own full-screen chat place: the Hub's, which already opens on the same chat */
    window.open(HUB + '?chat=' + encodeURIComponent(id || ''), '_blank');
  }
  function hookChat() {
    var C = window.AmitChat; if (!C) return;
    C.appName = appKey();
    if (!C.placeProvider) C.placeProvider = place;
    if (!C.voiceProvider) C.voiceProvider = chatVoice;
    if (!C.voiceSaver) C.voiceSaver = saveVoice;
    if (!C.onSpeak) C.onSpeak = function (on) { try { if (on) { if (typeof startSpeakingPulse === 'function') startSpeakingPulse(); } else if (typeof stopSpeakingPulse === 'function') stopSpeakingPulse(); } catch (e) {} };
    if (!C.onNeedBirthDate) C.onNeedBirthDate = needBirthDate;
    if (!C.onMaximize) C.onMaximize = fullChat;
  }
  function syncChat() {
    var C = window.AmitChat; if (!C) return;
    try {
      hookChat();
      var d = client();
      if (user && d) { C.connect(d, user.id); C.refreshUnread(); }
      else { C.disconnect(); if (!C.preview) C.setUnread(0); }
    } catch (e) {}
  }

  /* ── ASK AMIT ───────────────────────────────────────────── */
  function ask() {
    var key = registerAsk();
    var C = window.AmitChat;
    if (user && C) { hookChat(); watcherEnsure(); }
    if (user && C && C.live) { C.openHelp(); return; }
    if (typeof askAmitLive === 'function') askAmitLive(key);
    else notice('Ask Amit could not load', 'Check your connection and reload the page. You can also ask Amit from the Hub.', 'OPEN THE HUB', HUB + '?ask=amit');
  }
  /* an address ending ?ask=amit opens the Ask Amit box once signed in and the chat is live (nothing private is passed in the address) */
  function handleAskAddress() {
    var url; try { url = new URL(location.href); } catch (e) { return; }
    if (url.searchParams.get('ask') !== 'amit') return;
    var tries = 0, t = setInterval(function () {
      tries++;
      if (window.AmitChat && AmitChat.live && user) {
        clearInterval(t); url.searchParams.delete('ask');
        try { history.replaceState(null, '', url.pathname + url.search + url.hash); } catch (e) {}
        ask();
      } else if (tries > 60) clearInterval(t);
    }, 500);
  }

  /* ── WATCHER EYE (owner only, decided the way the Hub decides it) ── */
  var watcherState = 'off', watcherBusy = false, ownerFor = null, ownerYes = false;
  async function isOwner() {
    var d = client(); if (!user || !d) return false;
    if (user.id === OWNER_UID) return true;
    if (ownerFor === user.id) return ownerYes;
    var id = user.id;
    try { var r = await d.rpc('cha_is_owner'); if (r && !r.error) { ownerYes = r.data === true; ownerFor = id; } else return false; } catch (e) { return false; }
    return !!(user && user.id === id && ownerYes);
  }
  async function watcherOnline() { try { var r = await client().rpc('cha_amit_online'); return !!(r && r.data === true); } catch (e) { return false; } }
  function watcherPaint(state, ownerNow) {
    watcherState = state;
    var item = byId('rail-watcher'), icon = byId('rail-watcher-icon'), sub = byId('rail-watcher-sub'); if (!item) return;
    var owner = (ownerNow !== undefined) ? !!ownerNow : !!(user && (user.id === OWNER_UID || (ownerFor === user.id && ownerYes)));
    item.style.display = owner ? '' : 'none'; if (!owner) return;
    icon.classList.add('plug-badge'); icon.classList.toggle('connected', state === 'on'); icon.classList.toggle('disconnected', state !== 'on');
    icon.style.opacity = state === 'starting' ? '.6' : '1'; item.classList.toggle('active', state === 'on');
    sub.textContent = state === 'on' ? 'Answering' : (state === 'starting' ? 'Starting…' : 'Not Running');
    item.dataset.tip = state === 'on' ? 'Watcher — Amit is answering' : (state === 'starting' ? 'Watcher — starting…' : 'Watcher — press to start');
    item.title = state === 'on' ? "Amit's answering computer is running" : (state === 'starting' ? 'Starting the watcher…' : "Amit's answering computer is not running — press to start it");
  }
  async function watcherRefresh() {
    if (watcherBusy) return;
    if (!(await isOwner())) { watcherPaint('off', false); return; }
    watcherPaint((await watcherOnline()) ? 'on' : 'off', true);
  }
  /* pressing Ask Amit also makes sure Amit's answering computer is running (the owner's own computer only, through the shared bridge, silently) */
  async function watcherEnsure() {
    try {
      if (!(await isOwner())) return;
      if (await watcherOnline()) { watcherPaint('on', true); return; }
      if (watcherBusy) return;
      watcherBusy = true; watcherPaint('starting', true);
      try { await fetch(BRIDGE + '/api/ask-watcher-start', { method: 'POST' }); } catch (e) {}
      for (var i = 0; i < 12; i++) { if (await watcherOnline()) break; await new Promise(function (r) { setTimeout(r, 2500); }); }
      watcherBusy = false; watcherPaint((await watcherOnline()) ? 'on' : 'off', true);
    } catch (e) { watcherBusy = false; }
  }
  async function watcherClick() {
    if (watcherBusy || watcherState === 'on') return;
    if (!(await isOwner())) return;
    watcherBusy = true; watcherPaint('starting', true);
    var msg = '';
    try {
      var r = await fetch(BRIDGE + '/api/ask-watcher-start', { method: 'POST' }), j = await r.json();
      if (!r.ok || j.error) msg = j.error || 'The helper could not start the watcher.';
      else for (var i = 0; i < 25; i++) { if (await watcherOnline()) { watcherBusy = false; watcherPaint('on', true); return; } await new Promise(function (res) { setTimeout(res, 3000); }); }
      if (!msg) msg = 'The watcher was started but has not checked in yet. Give it a minute, then look at the eye again.';
    } catch (e) { msg = "Amit's helper is not running on this computer, so this page cannot start the watcher. Start it once with AmitChat\\start_amit_ask_watcher.cmd."; }
    watcherBusy = false; watcherPaint('off', true); window.alert(msg);
  }

  /* ── HELPER LIGHT (anyone signed in): is Amit's helper running on this computer? ── */
  var helperUp = false;
  async function helperAnswers() {
    var c = typeof AbortController !== 'undefined' ? new AbortController() : null, t = c ? setTimeout(function () { c.abort(); }, 3000) : null;
    try { var r = await fetch(BRIDGE + '/api/device', { cache: 'no-store', signal: c ? c.signal : undefined }), j = await r.json(); return !!(j && j.deviceId); }
    catch (e) { return false; }
    finally { if (t) clearTimeout(t); }
  }
  function helperPaint() {
    var item = byId('rail-helper'), icon = byId('rail-helper-icon'), sub = byId('rail-helper-sub'); if (!item) return;
    item.style.display = user ? '' : 'none'; if (!user) return;
    icon.classList.add('plug-badge'); icon.classList.toggle('connected', helperUp); icon.classList.toggle('disconnected', !helperUp); item.classList.toggle('active', helperUp);
    sub.textContent = helperUp ? 'Running' : 'Not Running';
    item.dataset.tip = helperUp ? 'Helper — running' : 'Helper — press to start';
    item.title = helperUp ? "Amit's helper is running on this computer" : "Amit's helper is not running on this computer — press to start it";
  }
  async function helperRefresh() {
    if (!user) { helperPaint(); return; }
    helperUp = await helperAnswers(); helperPaint();
  }
  async function waitForHelper(seconds) {
    for (var i = 0; i < seconds; i++) { if (await helperAnswers()) return true; await new Promise(function (r) { setTimeout(r, 1000); }); }
    return false;
  }
  function openProtocol(url) { if (typeof window.__amvOpenProtocol === 'function') return window.__amvOpenProtocol(url); window.location.href = url; }
  async function helperClick() {
    if (helperUp) return;
    var sub = byId('rail-helper-sub'); if (sub) sub.textContent = 'Starting…';
    /* the same two links the Hub tries, in the same order */
    openProtocol('amit-helper://start');
    var up = await waitForHelper(8);
    if (!up) { openProtocol('amit-tracker://start'); up = await waitForHelper(6); }
    helperUp = up; helperPaint();
    if (!up) notice("Amit's helper did not start", 'If it is not installed on this computer yet, the Hub downloads it and walks you through each step: open the Hub and press the Helper light there.', 'OPEN THE HUB', HUB);
  }

  /* ── RAIL ITEMS THE MASTER ADDS ─────────────────────────── */
  function railItem(id, tip, icon, name, sub, onclick, badge) {
    var d = document.createElement('div');
    d.className = 'page-nav'; d.id = id; d.setAttribute('data-tip', tip);
    d.innerHTML = '<div class="page-icon' + (badge ? ' plug-badge disconnected' : '') + '" id="' + id + '-icon">' + (badge ? '<span class="plug-icon-glyph">' + icon + '</span>' : icon) + '</div>' +
      '<div class="page-info"><div class="page-name" id="' + id + '-name">' + name + '</div><div class="page-sub" id="' + id + '-sub">' + sub + '</div></div>';
    d.addEventListener('click', onclick);
    return d;
  }
  /* same order as the Hub: Ask Amit, Chats, Sign In, Demo, Watcher, Helper, Home, Help */
  function ensureRail() {
    var rail = byId('rightRail'), home = byId('rail-home');
    if (!rail || !home || home.parentNode !== rail) return false;
    if (!byId('rail-watcher')) {
      var w = railItem('rail-watcher', 'Watcher', '👁️', 'Watcher', 'Not Running', watcherClick, true); w.style.display = 'none'; rail.insertBefore(w, home);
    }
    if (!byId('rail-helper')) {
      var h = railItem('rail-helper', 'Helper', '🖥️', 'Helper', 'Not Running', helperClick, true); h.style.display = 'none'; rail.insertBefore(h, home);
    }
    if (!byId('rail-help')) {
      rail.insertBefore(railItem('rail-help', 'Help: fix, quiet or remove Amit', '🛟', 'Help', 'Fix · Quiet · Remove',
        function () { window.open(BASE + 'AmitFix/AmitFix.html?from=' + encodeURIComponent(appKey()), 'amitFixTab'); }, false), home.nextSibling);
    }
    watcherPaint(watcherState); helperPaint();
    return true;
  }
  function watchRail() {
    ensureRail();
    var rail = byId('rightRail'); if (!rail || typeof MutationObserver === 'undefined') return;
    new MutationObserver(function () { if (!byId('rail-help') && byId('rail-home')) ensureRail(); }).observe(rail, { childList: true });
  }

  /* ── SIGN-IN WINDOW: email and password like the Hub; the emailed link stays as a second way ── */
  var FIELD = 'width:100%;background:var(--amit-input-bg,rgba(255,255,255,.07));border:1px solid var(--amit-input-border,rgba(201,168,76,.3));border-radius:var(--amit-input-radius,8px);padding:13px 15px;color:var(--amit-input-text,#fff);font-size:16px;outline:none;margin-bottom:12px;font-family:inherit';
  var QUIET = 'color:rgba(var(--amit-text-rgb,240,232,208),.6)';
  function signInHtml() {
    return '<div style="color:rgba(var(--amit-accent-rgb,201,168,76),.9);font-family:var(--amit-font-heading,\'Cinzel\',serif);font-size:22px;letter-spacing:.06em;margin-bottom:8px">Sign In</div>' +
      '<div style="' + QUIET + ';font-size:14px;line-height:1.7;margin-bottom:18px">The same sign-in as the Amit Hub.</div>' +
      '<form id="amSignInForm" autocomplete="on">' +
      '<input id="amSiEmail" type="email" name="email" autocomplete="username" placeholder="your@email.com" style="' + FIELD + '">' +
      '<input id="amSiPassword" type="password" name="password" autocomplete="current-password" placeholder="Password" style="' + FIELD + '">' +
      '<button id="amSiButton" type="submit" style="width:100%;background:var(--amit-btn-bg,rgba(201,168,76,.12));border:1px solid var(--amit-btn-border,rgba(201,168,76,.45));color:var(--amit-btn-text,rgba(201,168,76,.9));padding:13px;border-radius:var(--amit-btn-radius,8px);cursor:pointer;font-family:var(--amit-font-heading,\'Cinzel\',serif);font-size:13px;letter-spacing:.08em">SIGN IN →</button>' +
      '</form>' +
      '<div id="amSiNote" style="min-height:18px;margin-top:10px;font-size:13px;line-height:1.5;color:var(--amit-text-soft,#f0e8d0)"></div>' +
      '<div id="amSiLink" style="margin-top:6px;font-size:12px;cursor:pointer;text-decoration:underline;' + QUIET + '">Email me a sign-in link instead</div>' +
      '<div style="display:flex;justify-content:space-between;gap:10px;margin-top:16px;font-size:12px;letter-spacing:.03em">' +
      '<a href="' + HUB + '" target="_blank" style="text-decoration:none;' + QUIET + '">NEW HERE? CREATE ACCOUNT IN THE HUB</a>' +
      '<a href="' + HUB + '" target="_blank" style="text-decoration:none;text-align:right;' + QUIET + '">FORGOT PASSWORD? (HUB)</a></div>' +
      '<div id="amSiCancel" style="margin-top:16px;font-size:11px;cursor:pointer;letter-spacing:.1em;' + QUIET + '">CANCEL</div>';
  }
  function showSignIn() {
    var m = byId('syncModal'), card = m && m.querySelector('.sync-modal-card'), d = client();
    if (!card) return false;
    card.style.maxWidth = '440px';
    card.innerHTML = signInHtml();
    var note = byId('amSiNote'), button = byId('amSiButton');
    byId('amSignInForm').addEventListener('submit', async function (e) {
      e.preventDefault();
      var email = byId('amSiEmail').value.trim(), password = byId('amSiPassword').value;
      if (!email || !password) { note.textContent = 'Enter your email and your password.'; return; }
      if (!d) { note.textContent = 'The database could not be reached. Reload the page.'; return; }
      button.disabled = true; button.textContent = 'Signing in…';
      var error = null;
      try { error = (await d.auth.signInWithPassword({ email: email, password: password })).error; } catch (er) { error = er; }
      button.disabled = false; button.textContent = 'SIGN IN →';
      if (error) { note.textContent = error.message || 'Could not sign in.'; return; }
      m.style.display = 'none';
    });
    byId('amSiLink').addEventListener('click', async function () {
      var email = byId('amSiEmail').value.trim();
      if (!email) { note.textContent = 'Type your email first, then press this again.'; return; }
      if (!d) { note.textContent = 'The database could not be reached. Reload the page.'; return; }
      note.textContent = 'Sending…';
      var error = null;
      try { error = (await d.auth.signInWithOtp({ email: email })).error; } catch (er) { error = er; }
      note.textContent = error ? (error.message || 'Could not send the link.') : 'Link sent. Check your email and click the link to sign in.';
    });
    byId('amSiCancel').addEventListener('click', function () { m.style.display = 'none'; });
    m.style.display = 'flex';
    return true;
  }
  function wrapSignIn() {
    var original = window.openSyncModal;
    window.openSyncModal = function () {
      if (!user && showSignIn()) return;
      if (typeof original === 'function') return original.apply(this, arguments);   /* signed in: the page's own "Sign out?" question */
    };
  }

  /* ── COLORS for shared pop-ups that carry fixed classic colors. Every fallback is that classic color, so with no saved theme nothing changes. ── */
  function themeSharedPopups() {
    var css = [];
    ['#askAmitLiveModal .aal-box', '#amitInboxReplyModal .air-box'].forEach(function (s) {
      css.push('html body ' + s + '{background:var(--amit-surface-raised,#0f1a2e);border-color:var(--amit-accent,#c9a84c);color:var(--amit-text-soft,#f0e8d0);font-family:var(--amit-font-body,Georgia,serif)}');
    });
    css.push('html body #askAmitLiveModal h3,html body #amitInboxReplyModal h3{color:var(--amit-accent-bright,#e8c56a);font-family:var(--amit-font-heading,Georgia,serif)}');
    css.push('html body #askAmitLiveModal p{color:var(--amit-text-soft,#f0e8d0)}');
    css.push('html body #askAmitLiveModal button{font-family:var(--amit-font-body,Georgia,serif);border-color:var(--amit-accent,#c9a84c)}');
    css.push('html body #askAmitLiveModal .aal-primary,html body #amitInboxReplyModal button{background:var(--amit-accent,#c9a84c);color:var(--amit-bg,#1a1206);border-color:var(--amit-accent,#c9a84c)}');
    css.push('html body #askAmitLiveModal .aal-secondary,html body #askAmitLiveModal .aal-status{color:var(--amit-accent-bright,#e8c56a)}');
    css.push('html body #askAmitLiveModal input,html body #askAmitLiveModal textarea{background:var(--amit-input-bg,rgba(255,255,255,.05));color:var(--amit-input-text,#f0e8d0);border-color:var(--amit-input-border,rgba(201,168,76,.3));font-family:var(--amit-font-body,Georgia,serif)}');
    css.push('html body #amitInboxReplyModal .air-msg{background:rgba(var(--amit-accent-rgb,201,168,76),.08);border-left-color:var(--amit-accent,#c9a84c)}');
    var tag = document.createElement('style'); tag.id = 'amit-master-theme'; tag.textContent = css.join('\n');
    document.head.appendChild(tag);
  }

  /* Rewrites the fixed classic colors in a block of CSS to the Appearance tokens (used on the layouts imported from TemplateViews.html).
     Anything already inside var(...) is left exactly as written. With no saved theme every fallback equals the original color. */
  var COLOR_RULES = [
    [/rgba\(\s*201\s*,\s*168\s*,\s*76\s*,/gi, 'rgba(var(--amit-accent-rgb,201,168,76),'],
    [/rgba\(\s*240\s*,\s*232\s*,\s*208\s*,/gi, 'rgba(var(--amit-text-rgb,240,232,208),'],
    [/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,/gi, 'rgba(var(--amit-overlay-rgb,255,255,255),'],
    [/#c9a84c\b/gi, 'var(--amit-accent,#c9a84c)'],
    [/#e8c56a\b/gi, 'var(--amit-accent-bright,#e8c56a)'],
    [/#0f2338\b/gi, 'var(--amit-surface,#0f2338)'],
    [/#09141f\b/gi, 'var(--amit-bg,#09141f)'],
    [/#f0e8d0\b/gi, 'var(--amit-text-soft,#f0e8d0)'],
    [/([;{]\s*color\s*:\s*)#fff\b/gi, '$1var(--amit-text,#fff)']
  ];
  function themeCss(css) {
    var out = '', i = 0;
    /* the calendar's day cells are cream "paper" with dark ink: they stay paper on every theme (a light theme's soft text color is dark) */
    css = css.replace(/(\.cv-cell\{[^}]*?background:)var\(--text2\)/, '$1var(--amit-paper,#f0e8d0)');   /* wrapped in var() so the rules below leave it alone */
    function rewrite(part) { COLOR_RULES.forEach(function (r) { part = part.replace(r[0], r[1]); }); return part; }
    while (i < css.length) {
      var at = css.indexOf('var(', i);
      if (at === -1) { out += rewrite(css.slice(i)); break; }
      out += rewrite(css.slice(i, at));
      var depth = 0, j = at + 3;
      for (; j < css.length; j++) { if (css[j] === '(') depth++; else if (css[j] === ')') { depth--; if (!depth) { j++; break; } } }
      out += css.slice(at, j); i = j;
    }
    return out;
  }

  /* ── START ──────────────────────────────────────────────── */
  function onUser(next) {
    var changed = (user && user.id) !== (next && next.id);
    user = next || null;
    if (changed) { contact = null; ownerFor = null; ownerYes = false; helperUp = false; }
    syncChat();
    ensureRail();
    watcherRefresh();
    helperRefresh();
  }
  function start() {
    registerAsk();
    themeSharedPopups();
    wrapSignIn();
    watchRail();
    paintContext();
    /* the rail and pages are built a moment after load */
    var n = 0, t = setInterval(function () { paintContext(); if (++n >= 10) clearInterval(t); }, 500);
    var d = client();
    if (d) {
      /* deferred with setTimeout: no database call may run inside this callback (supabase-js v2 can lock up) */
      d.auth.onAuthStateChange(function (event, session) { setTimeout(function () { onUser(session ? session.user : null); }, 0); });
    }
    handleAskAddress();
    setInterval(function () { watcherRefresh().catch(function () {}); }, 15000);
    setInterval(function () { if (user && document.visibilityState === 'visible') helperRefresh(); }, 20000);
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState !== 'visible') return;
      watcherRefresh();
      if (user) helperRefresh();
      if (waitingForBirthDate && window.AmitChat && AmitChat.recheck) { waitingForBirthDate = false; try { AmitChat.recheck(); } catch (e) {} }
    });
  }

  /* The chat engine and its helpers, loaded from beside this file. Added while the page is still loading, so they are in place before
     Amit_Ask_Live.js looks for them. The chat and data-tool version labels come from Amit_Ask_Live.js, so they are set in one place. */
  function load(file, version, done) {
    var s = document.createElement('script');
    s.src = BASE + file + (version ? '?v=' + version : ''); s.async = false;
    if (done) s.onload = done;
    s.onerror = function () { console.warn('Amit: could not load ' + file); };
    document.head.appendChild(s);
  }
  if (typeof getOrCreateOwnerContact !== 'function') load('amit_owner_contact.js', OWNER_CONTACT_V);
  if (typeof startSpeakingPulse !== 'function') load('amit_speaking_indicator.js', SPEAKING_V);
  if (!window.AmitChat) load('amit_chat.js', typeof AMIT_CHAT_ENGINE_V !== 'undefined' ? AMIT_CHAT_ENGINE_V : '', syncChat);
  if (!window.AmitData) load('amit_data_tools.js', typeof AMIT_DATA_TOOLS_V !== 'undefined' ? AMIT_DATA_TOOLS_V : '');

  window.AmitMaster = {
    version: VERSION, ask: ask, navigated: navigated, themeCss: themeCss,
    appKey: appKey, appName: appName, place: place,
    watcherClick: watcherClick, helperClick: helperClick
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
