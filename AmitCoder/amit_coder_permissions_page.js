/* amit_coder_permissions_page.js v0.01 (2026-11-28): the Permissions page and the "this session" permission control on the Coding page.
   Plain look on purpose: Ryan will redesign it. Saving is in amit_coder_permissions.js; the rules are enforced by the engine on the person's computer.
   The engine is the truth for the running session: this page only loads a session's saved set when the engine says it has none yet. */
(function () {
  'use strict';
  if (window.AmitCoderPermsUI) return;
  var P = function () { return window.AmitCoderPermissions; };
  var ITEMS = [['1', 'Deleting', 'Our rule: Amit’s own unchanged throwaway files do not ask.'], ['2', 'Publishing', 'Our rule: asks.'], ['3', 'Installing', 'Our rule: asks.'], ['4', 'Sending', 'Your information, messages, online records.'],
    ['6', 'Computer and program changes', 'Our rule: asks before disruption or changes.'], ['7', 'Commands that can hide what they do', 'Our rule: the same unchanged one asks once a session.'], ['8', 'Protected places', 'Rules, settings and key files.'],
    ['9', 'Extra tools', 'Tools Amit does not recognize.'], ['10', 'Reading files', ''], ['11', 'Searching files', ''], ['12', 'Starting agents', ''], ['13', 'Web search and pages', 'Our rule: asks if private information may be sent.'],
    ['14', 'Explained commands', 'Commands no other item covers.'], ['15', 'Changing files', 'Our rule: asks only if no undo copy can be kept.']];
  var WORD = { ask: 'Ask me', rule: 'Our rule', allow: 'Don’t ask' }, RANK = { ask: 0, rule: 1, allow: 2 };
  var CSS = '.cp{width:100%;font-size:14px;line-height:1.45}.cp button,.cp select,.cp input{font:inherit;background:transparent;color:inherit;border:1px solid rgba(201,168,76,.45);border-radius:7px;padding:5px 10px;cursor:pointer}.cp select option{background:#171e2e;color:#e8e4d8}.cp input{cursor:text}.cp button.on{background:#c9a84c;color:#09141f;font-weight:700}.cp button:disabled{opacity:.4;cursor:default}.cp .bar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:7px 0}.cp .row{display:flex;gap:10px;flex-wrap:wrap;align-items:center;border:1px solid rgba(201,168,76,.22);border-radius:8px;padding:7px 10px;margin:5px 0}.cp .row .t{flex:1;min-width:170px}.cp .row .t span{display:block;opacity:.7;font-size:12.5px}.cp .row.changed{border-color:#c98cff}.cp .row.changed b{color:#dcb4ff}.cp .box{border:2px solid #c9a84c;border-radius:9px;padding:9px 12px;margin:7px 0}.cp .note{border:1px solid #8a3a3a;border-radius:8px;padding:7px 10px;font-size:12.5px;margin-top:9px}.cp .bad{color:#ff9d9d}.cp .dim{opacity:.7;font-size:12.5px}';
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x !== undefined) e.textContent = x; return e; }
  function btn(x, fn, on, off) { var b = el('button', on ? 'on' : '', x); b.type = 'button'; b.disabled = !!off; b.onclick = fn; return b; }
  function copy(o) { return JSON.parse(JSON.stringify(o)); }
  function same(a, b) { return P().ITEMS.every(function (k) { return a[k] === b[k]; }); }
  function looser(a, b) { return P().ITEMS.some(function (k) { return RANK[b[k]] > RANK[a[k]]; }); }
  function style() { if (!document.getElementById('cp-css')) { var s = el('style'); s.id = 'cp-css'; s.textContent = CSS; document.head.appendChild(s); } }

  var api = { client: null, link: null };
  var data = null, loadError = '', view = null, busy = false;
  async function store() {
    var db0 = api.client || (typeof db !== 'undefined' ? db : null);
    var r = db0 && await db0.auth.getSession(), uid = r && r.data && r.data.session && r.data.session.user.id;
    return P().store(db0, uid);   // says "Sign in first." when nobody is signed in
  }
  async function reload() { try { data = await (await store()).load(); loadError = ''; } catch (e) { loadError = e.message; } paintPage(); paintSession(); }
  async function act(fn) { if (busy) return; busy = true; try { await fn(await store()); loadError = ''; } catch (e) { loadError = e.message; } busy = false; await reload(); }

  function rows(choices, onSet, base) {
    var box = el('div');
    ITEMS.forEach(function (i) {
      var k = i[0], r = el('div', 'row' + (base && base[k] !== choices[k] ? ' changed' : '')), t = el('div', 't'), ch = el('div', 'bar');
      t.append(el('b', '', i[1]), el('span', '', i[2]));
      (P().NO_RULE[k] ? ['ask', 'allow'] : ['ask', 'rule', 'allow']).forEach(function (v) { ch.appendChild(btn(WORD[v], function () { if (choices[k] !== v) onSet(k, v); }, choices[k] === v)); });
      r.append(t, ch); box.appendChild(r);
    });
    return box;
  }
  function note() { return el('div', 'note', 'Checked in every set: changes to Amit’s own permissions ask you, and detected passwords and keys are blocked from web searches and addresses. These checks look for words, paths and patterns, so they can miss things: a script could get past them. Undo copies are saved when possible.'); }

  /* ── the Permissions page ── */
  var pageRoot = null;
  function paintPage() {
    if (!pageRoot) return;
    pageRoot.textContent = '';
    if (loadError) pageRoot.appendChild(el('p', 'bad', loadError));
    if (!data) { pageRoot.appendChild(el('p', '', loadError ? '' : 'Loading your sets…')); pageRoot.appendChild(btn('Try again', reload)); return; }
    var s = data.sets.filter(function (x) { return x.no === view; })[0] || data.sets.filter(function (x) { return x.no === data.defaultNo; })[0]; view = s.no;
    pageRoot.appendChild(el('p', '', 'Make a set for each kind of work, up to 10. The star marks the one new sessions start with. Changes here are saved at once. A running session keeps what it has until you choose the set again on the Coding page.'));
    var bar = el('div', 'bar');
    data.sets.forEach(function (x) { bar.appendChild(btn((x.no === data.defaultNo ? '★ ' : '') + x.letter + ' · ' + x.name, function () { view = x.no; paintPage(); }, x.no === view)); });
    bar.appendChild(btn('+ New set (copy of this one)', function () {
      act(async function (st) { var n = 'My set', i = 2, used = data.sets.map(function (x) { return x.name.toLowerCase(); }); while (used.indexOf(n.toLowerCase()) > -1) n = 'My set ' + i++; view = await st.create(n, s.choices); });
    }, false, data.sets.length >= P().MAX));
    pageRoot.appendChild(bar);
    var ed = el('div', 'bar'), name = el('input'); name.value = s.name; name.maxLength = 40;
    name.onchange = function () { var v = name.value.trim(); if (v && v !== s.name) act(function (st) { return st.save({ no: s.no, name: v, choices: s.choices }); }); };
    ed.append(el('b', '', 'Set ' + s.letter), name,
      btn(s.no === data.defaultNo ? '★ Default for new sessions' : 'Make this my default', function () { act(function (st) { return st.setDefault(s.no); }); }, false, s.no === data.defaultNo),
      btn('Delete set', function (e) { var b = e.target; if (b.textContent !== 'Press again to delete') { b.textContent = 'Press again to delete'; return; } act(function (st) { return st.remove(s.no); }); }, false, data.sets.length < 2));
    var starter = P().STARTERS.filter(function (x) { return x.set_no === s.no; })[0];
    if (starter) ed.appendChild(btn('Put back to “' + starter.name + '” choices', function () { act(function (st) { return st.save({ no: s.no, name: s.name, choices: P().full(starter.kind) }); }); }));
    pageRoot.append(ed, rows(s.choices, function (k, v) { var c = copy(s.choices); c[k] = v; act(function (st) { return st.save({ no: s.no, name: s.name, choices: c }); }); }), note());
  }

  /* ── the control on the Coding page: this session only ── */
  var sessRoot = null, hooks = {}, cur = null, sid = null, pending = null, open = false, supported = false, since = 0, saying = '';
  function remember() { if (sid && cur && cur.no) store().then(function (st) { return st.saveSession(sid, cur.no, cur.changed ? cur.choices : null); }).catch(function (e) { saying = 'This session’s choice was not saved: ' + e.message; paintSession(); }); }
  async function send(next, save) {
    var ok = await api.link().permissions(next, true);
    if (ok) { cur = next; saying = ''; if (save) remember(); } else saying = 'Your computer did not accept that change.';
    paintSession();
  }
  // a change the person made: anything that lets Amit do more waits for their yes
  function change(next) { if (cur && !looser(cur.choices, next.choices)) { pending = null; send(next, true); } else { pending = next; paintSession(); } }
  function fromSet(s) { return { no: s.no, letter: s.letter, name: s.name, choices: copy(s.choices), changed: false }; }
  async function loadFor(id) {
    try { var st = await store(); data = await st.load(); var s = await st.forSession(id); loadError = ''; await send(s, !!id); }
    catch (e) { saying = 'Your permission sets could not be loaded (' + e.message + '). Amit asks about everything until they are.'; if (!cur) await api.link().permissions({ letter: '', name: 'Show Me Everything (until your set is loaded)', choices: P().full('ask') }, false); paintSession(); }
    paintPage();
  }
  // what the engine says it is using. Old messages replayed after a refresh are ignored.
  function engineSays(d, t) {
    if (t && t < since) return;
    supported = true; if (hooks.supported) hooks.supported();
    if (d.session) sid = d.session;
    if (d.choices && d.letter) {
      var no = 'ABCDEFGHIJ'.indexOf(d.letter) + 1, saved = data && data.sets.filter(function (x) { return x.no === no; })[0];
      cur = { no: no, letter: d.letter, name: d.name, choices: d.choices, changed: saved ? !same(saved.choices, d.choices) : false };
      if (!data) reload(); else paintSession();
    } else { cur = null; pending = null; paintSession(); loadFor(d.session || null); }
  }
  function connected() { since = Date.now() - 5000; cur = null; pending = null; setTimeout(function () { api.link().permissions(); }, 250); }
  function sessionId(id) { if (id && id !== sid) { sid = id; remember(); } }
  function newSessionStarting() { sid = null; pending = null; }
  function paintSession() {
    if (!sessRoot) return;
    sessRoot.textContent = '';
    if (!supported) return;
    var bar = el('div', 'bar'), sel = el('select');
    if (data) data.sets.forEach(function (x) { var o = el('option', '', x.letter + ' · ' + x.name); o.value = x.no; sel.appendChild(o); });
    if (cur && cur.no) sel.value = cur.no;
    sel.onchange = function () { var s = data.sets.filter(function (x) { return x.no === +sel.value; })[0]; if (s) { if (cur) sel.value = cur.no; change(fromSet(s)); } };
    sel.disabled = !data;
    bar.append(el('b', '', 'Permissions for this session'), sel, btn(open ? 'Hide details' : 'Adjust this session', function () { open = !open; paintSession(); }, false, !cur || !data), el('span', 'dim', cur ? (cur.letter ? (cur.changed ? 'Changed for this session only.' : '') : cur.name) : 'Loading…'));
    sessRoot.appendChild(bar);
    if (saying) sessRoot.appendChild(el('p', 'bad', saying));
    if (pending) {
      var box = el('div', 'box'), a = el('div', 'bar');
      box.appendChild(el('b', '', 'This lets Amit do more without asking (' + pending.letter + ' · ' + pending.name + (pending.changed ? ', changed' : '') + '). Use it for this session?'));
      a.append(btn('Yes, for this session', function () { var n = pending; pending = null; send(n, true); }, true), btn('No, keep it as it is', function () { pending = null; paintSession(); }));
      box.appendChild(a); sessRoot.appendChild(box);
    }
    if (open && cur && data) {
      var base = data.sets.filter(function (x) { return x.no === cur.no; })[0];
      if (base && cur.changed) {
        var c = el('div', 'bar');
        c.append(el('span', 'dim', 'Purple items differ from your saved set.'), btn('Save as a new set', function () {
          var name = (base.name + ' (changed)').slice(0, 40), choices = cur.choices;
          act(async function (st) { var no = await st.create(name, choices); cur = { no: no, letter: P().letter(no), name: name, choices: choices, changed: false }; await api.link().permissions(cur, false); remember(); });
        }, false, data.sets.length >= P().MAX), btn('Undo my changes', function () { change(fromSet(base)); }));
        sessRoot.appendChild(c);
      }
      sessRoot.append(rows(cur.choices, function (k, v) { var n = copy(cur); n.choices[k] = v; n.changed = !base || !same(base.choices, n.choices); change(n); }, base && base.choices), note());
    }
  }

  api.link = function () { return window.AmitCoderLink; };
  api.mountPage = function (host) { if (!host) return; style(); if (!pageRoot) { pageRoot = el('div', 'cp'); host.appendChild(pageRoot); reload(); } else if (pageRoot.parentNode !== host) host.appendChild(pageRoot); };
  api.mountSession = function (host, h) { if (!host) return; style(); hooks = h || {}; if (!sessRoot) sessRoot = el('div', 'cp'); if (sessRoot.parentNode !== host) host.appendChild(sessRoot); paintSession(); };
  api.engineSays = engineSays; api.connected = connected; api.sessionId = sessionId; api.newSessionStarting = newSessionStarting;
  api.signInChanged = function () { data = null; view = null; reload(); };
  window.AmitCoderPermsUI = api;
})();
