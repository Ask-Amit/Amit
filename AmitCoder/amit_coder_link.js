/* amit_coder_link.js v0.06 (2026-11-26) - the ONE connection layer of Amit Coder.
   The coding screen talks only to AmitCoderLink. How the messages travel is a ROUTE behind it:
     local : this computer, through the shared Amit Helper at http://localhost:8710 (routes /api/coder/*)
     away  : another device reaching your computer over the internet (version 2, NOT BUILT)
   A new route is added here; the screen does not change.
   Signed in or not is shown by the page's lock, so this layer shows nothing while signed out.

   WHAT THE SCREEN CALLS (all resolve true/false or data; they never throw):
     AmitCoderLink.refresh()                       look again at which route is available
     AmitCoderLink.state()                         { code, route, computer, missing[], text }
     AmitCoderLink.onState(fn)  .onEvent(fn)       events keep the shape of the proof of concept (kind: claude | local | session | history, data)
     newSession(opts) send(text, opts) permission(id, allow) stop() name(project, piece) open(id, opts) sessions() projects()

   WHAT THE HELPER MUST PROVIDE (not built yet; this is the agreement for it):
     GET  /api/coder/status  -> { coder: true, version }                 says only that the coding routes exist; no private details
     POST /api/coder/connect { token } -> { ok, session, computer, checks: { user, claude, folder }, missing: [plain words] }
          Built in Helper 2.34 (amit_coder_routes.ps1 + amit_coder_engine.js). The Helper itself verifies the Amit sign-in (token), the person's own Claude account (root premium rule) and the Amit folder.
          It must accept only Amit's own site addresses, give each connection its own session key, and refuse preview code and other sites.
     Every later call carries the session key as ?s= and must come from the same site that connected.
     POST /api/coder/<new|send|permission|stop|name|open>     GET /api/coder/<events|sessions|projects>
     events?after=N -> { ok, events: [ { n, t, kind, data } ] }, held up to 5 seconds until there is something new. */
(function () {
  'use strict';
  if (window.AmitCoderLink) return;
  var HELPER = 'http://localhost:8710';
  var stateNow = { code: 'signed-out', route: null, computer: '', missing: [], text: '' };
  var stateFns = [], eventFns = [], lastError = '', waitUntil = 0, held = null, session = null, route = null, streamStop = null, looking = null;

  async function call(url, opts, ms) {
    var c = new AbortController(), t = setTimeout(function () { c.abort(); }, ms || 6000);
    try { var r = await fetch(url, Object.assign({ cache: 'no-store', signal: c.signal }, opts || {})); var j = null; try { j = await r.json(); } catch (e) {} return { status: r.status, ok: r.ok, data: j }; }
    catch (e) { return { status: 0, ok: false, data: null }; }
    finally { clearTimeout(t); }
  }
  async function token() {
    try {
      var client = AmitCoderLink.client || (typeof db !== 'undefined' ? db : null);
      var r = await client.auth.getSession(); return (r && r.data && r.data.session && r.data.session.access_token) || null;
    } catch (e) { return null; }
  }
  // While the coding connection is being built it is for the owner only. For anyone else this page looks for no Helper and sends nothing.
  var ownerMemo = { token: null, yes: false };
  async function isOwner(tok) {
    if (ownerMemo.token === tok) return ownerMemo.yes;
    try {
      var client = AmitCoderLink.client || (typeof db !== 'undefined' ? db : null);
      var r = await client.rpc('cha_is_owner');
      if (r.error) return false;
      ownerMemo = { token: tok, yes: r.data === true }; return ownerMemo.yes;
    } catch (e) { return false; }
  }
  function set(code, extra) {
    var x = Object.assign({ code: code, route: null, computer: '', missing: [] }, extra || {});
    var words = {
      'signed-out': '',
      'checking': 'Checking connection…',
      'local-ready': 'On this computer: ' + x.computer,
      'local-not-ready': 'On this computer: ' + x.computer + ' · coding not ready',
      'none': 'No coding computer connected'
    };
    x.text = words[code] || ''; stateNow = x;
    stateFns.forEach(function (f) { try { f(x); } catch (e) {} });
    paint(x); return x;
  }

  /* ── ROUTE: this computer ── */
  var localRoute = {
    name: 'local',
    look: async function (tok) {
      var dev = await call(HELPER + '/api/device', {}, 3000);
      if (!dev.ok || !dev.data || !dev.data.deviceId) return null;                       // no Helper answered here
      var computer = dev.data.deviceName || 'this computer';
      var st = await call(HELPER + '/api/coder/status', {}, 4000);
      if (!st.ok || !st.data || st.data.coder !== true) return { ready: false, computer: computer, missing: ['This Amit Helper does not have the coding connection yet.'] };
      // The sign-in is sent only to a Helper that says it has the coding routes; the Helper does the checking.
      // A failed check is not repeated every few seconds: it asks the account servers and Claude Code each time.
      if (held && Date.now() < waitUntil) return held;
      var c = await call(HELPER + '/api/coder/connect', { method: 'POST', body: JSON.stringify({ token: tok }) }, 20000), d = c.data || {}, k = d.checks || {};
      if (c.ok && d.ok && d.session && k.user === true && k.claude === true && k.folder === true) return { ready: true, computer: d.computer || computer, session: d.session, missing: [] };
      held = { ready: false, computer: computer, missing: d.missing && d.missing.length ? d.missing : ['The Helper could not confirm the coding connection.'] }; waitUntil = Date.now() + 120000;
      return held;
    },
    post: async function (what, body) {
      var r = await call(HELPER + '/api/coder/' + what + '?s=' + session, { method: 'POST', body: JSON.stringify(body || {}) }, 45000);
      lastError = r.data && r.data.error ? r.data.error : '';
      return !!(r.ok && r.data && r.data.ok !== false);
    },
    get: async function (what, more) { var r = await call(HELPER + '/api/coder/' + what + '?s=' + session + (more || ''), {}, 35000); return r.ok && r.data && r.data.ok ? r.data.data : null; },
    // The Helper holds each request open until there is something new (or 5 seconds pass), so replies are passed on as they arrive.
    listen: function (onEvent, onLost) {
      var stopped = false, last = 0, mine = session, fails = 0;
      (async function () {
        while (!stopped) {
          var r = await call(HELPER + '/api/coder/events?s=' + mine + '&after=' + last, {}, 12000);
          if (stopped) return;
          if (r.ok && r.data && r.data.events) { fails = 0; r.data.events.forEach(function (e) { if (e.n > last) { last = e.n; onEvent(e); } }); continue; }
          if (r.status === 401 || r.status === 410 || ++fails > 4) { onLost(); return; }
          await new Promise(function (res) { setTimeout(res, 1500); });
        }
      })();
      return function () { stopped = true; };
    }
  };
  /* ── ROUTE: away (version 2). NOT BUILT: it reports nothing until it is. It will offer the same look / post / get / listen. ── */
  var awayRoute = { name: 'away', look: async function () { return null; } };
  var ROUTES = [localRoute, awayRoute];   // this computer is tried first

  function disconnect() { if (streamStop) streamStop(); streamStop = null; session = null; route = null; }
  async function lookNow() {
    var tok = await token();
    if (!tok) { disconnect(); return set('signed-out'); }
    if (!(await isOwner(tok))) { disconnect(); return set('signed-out'); }
    if (stateNow.code === 'signed-out') set('checking');
    for (var i = 0; i < ROUTES.length; i++) {
      if (route && route === ROUTES[i] && session) {   // already connected: only make sure it still answers
        var alive = await call(HELPER + '/api/coder/status', {}, 4000);
        if (alive.ok) return stateNow; disconnect();
      }
      var found = await ROUTES[i].look(tok);
      if (!found) continue;
      if (found.ready) {
        disconnect(); route = ROUTES[i]; session = found.session;
        streamStop = route.listen(function (e) { eventFns.forEach(function (f) { try { f(e); } catch (x) {} }); }, function () { disconnect(); set('checking'); setTimeout(refresh, 500); });
        return set(route.name + '-ready', { route: route.name, computer: found.computer });
      }
      return set(ROUTES[i].name + '-not-ready', { route: ROUTES[i].name, computer: found.computer, missing: found.missing });
    }
    disconnect();
    return set('none', { missing: ['No Amit Helper answered on this device. It may be stopped, not installed, or the browser may be blocking it.'] });
  }
  function refresh() { if (!looking) looking = lookNow().finally(function () { looking = null; }); return looking; }

  /* ── the small label in the header that says which way the page is connected ── */
  function paint(x) {
    var el = document.getElementById('coder-route');
    if (!el) {
      var title = document.getElementById('pageVersion'); if (!title) return;
      el = document.createElement('div'); el.id = 'coder-route';
      el.style.cssText = 'display:none;margin-top:3px;font-size:12px;line-height:1.3;color:var(--amit-text-soft,#f0e8d0);cursor:default;white-space:nowrap';
      title.parentNode.appendChild(el);
    }
    el.style.display = x.text ? '' : 'none';
    var dot = x.code === 'local-ready' ? '#50d78c' : x.code === 'away-ready' ? '#5aa9ff' : x.code === 'checking' ? '#e8be46' : x.code === 'local-not-ready' ? '#e8be46' : '#9a9a9a';
    el.textContent = ''; var d = document.createElement('span'); d.style.cssText = 'display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:6px;background:' + dot;
    el.appendChild(d); el.appendChild(document.createTextNode(x.text)); el.title = x.missing.join(' ');
  }

  async function post(what, body) { return route && session ? route.post(what, body) : false; }
  async function get(what, more) { return route && session ? route.get(what, more) : null; }
  window.AmitCoderLink = {
    version: '0.06', client: null,
    refresh: refresh, state: function () { return stateNow; }, lastError: function () { return lastError; },
    onState: function (f) { stateFns.push(f); }, onEvent: function (f) { eventFns.push(f); },
    newSession: function (o) { return post('new', o); },
    send: function (text, o) { return post('send', Object.assign({ text: text }, o || {})); },
    permission: function (id, allow) { return post('permission', { id: id, allow: !!allow }); },
    stop: function () { return post('stop'); },
    mic: function (action) { return post('mic', { action: action }); },
    micWords: function (after) { return get('mic-words', '&after=' + after); },
    say: function (text) { return post('say', { text: text }); },
    sayStop: function () { return post('say', { stop: true }); },
    sayState: function () { return get('say-state'); },
    level: function (to, confirm) { return post('level', to ? { level: to, confirm: !!confirm } : {}); },
    name: function (project, piece) { return post('name', { project: project, piece: piece }); },
    open: function (id, o) { return post('open', Object.assign({ id: id }, o || {})); },
    sessions: function () { return get('sessions'); },
    projects: function () { return get('projects'); }
  };
  function start() {
    refresh();
    try { var cl = AmitCoderLink.client || db; cl.auth.onAuthStateChange(function () { setTimeout(function () { held = null; disconnect(); refresh(); }, 300); }); } catch (e) {}
    setInterval(function () { if (document.visibilityState === 'visible') refresh(); }, 20000);
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') refresh(); });
  }
  if (document.readyState === 'complete') setTimeout(start, 0); else window.addEventListener('load', function () { setTimeout(start, 200); });
})();
