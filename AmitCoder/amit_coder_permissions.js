/* amit_coder_permissions.js v0.02 (2026-11-28): a person's permission sets, saved under their own Hub sign-in (tables cod_*).
   No screen here: the Permissions page and the Coding page use these calls. The database lets each person see only their own rows.
   A set keeps its number, so its letter (1 = A ... 10 = J) never changes when it is renamed. */
(function (root) {
  'use strict';
  var ITEMS = ['1', '2', '3', '4', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15'];
  var NO_RULE = { 10: 1, 11: 1, 12: 1, 14: 1 };
  var MAX = 10;
  function full(kind) { var o = {}; ITEMS.forEach(function (k) { o[k] = kind === 'rule' && NO_RULE[k] ? 'allow' : kind; }); return o; }
  var STARTERS = [{ set_no: 1, name: 'Show Me Everything', kind: 'ask' }, { set_no: 2, name: 'Walk With Me', kind: 'rule' }, { set_no: 3, name: 'Full Trust', kind: 'allow' }];
  var DEFAULT_NO = 2;
  function letter(n) { return 'ABCDEFGHIJ'.charAt(n - 1); }
  // anything missing or unknown in a saved set means "ask": a damaged row never loosens
  function clean(c) { var o = {}; ITEMS.forEach(function (k) { var v = c && c[k]; o[k] = v === 'rule' || v === 'allow' || v === 'ask' ? v : 'ask'; }); return o; }
  function check(r) { if (r.error) throw new Error(r.error.message || 'The database refused that.'); return r.data; }

  function store(db, userId) {
    if (!db || !userId) throw new Error('Sign in first.');
    var sets = function () { return db.from('cod_permission_sets'); };
    async function rows() { return check(await sets().select('set_no,name,choices').eq('user_id', userId).order('set_no')); }
    async function load() {
      var list = await rows();
      if (!list.length) {
        check(await sets().upsert(STARTERS.map(function (s) { return { user_id: userId, set_no: s.set_no, name: s.name, choices: full(s.kind) }; }), { onConflict: 'user_id,set_no', ignoreDuplicates: true }));
        check(await db.from('cod_permission_prefs').upsert({ user_id: userId, default_set: DEFAULT_NO }, { onConflict: 'user_id', ignoreDuplicates: true }));
        list = await rows();
      }
      var pref = check(await db.from('cod_permission_prefs').select('default_set').eq('user_id', userId));
      var out = list.map(function (r) { return { no: r.set_no, letter: letter(r.set_no), name: r.name, choices: clean(r.choices) }; });
      var want = pref && pref[0] ? pref[0].default_set : DEFAULT_NO;
      var def = out.filter(function (s) { return s.no === want; })[0] || out[0];
      return { sets: out, defaultNo: def.no };
    }
    async function save(set) {
      var name = String(set.name || '').trim().slice(0, 40);
      if (!name || !(set.no >= 1 && set.no <= MAX)) throw new Error('A set needs a name.');
      check(await sets().upsert({ user_id: userId, set_no: set.no, name: name, choices: clean(set.choices), updated_at: new Date().toISOString() }, { onConflict: 'user_id,set_no' }));
    }
    async function create(name, choices) {
      var used = (await rows()).map(function (r) { return r.set_no; }), no = 1;
      while (used.indexOf(no) > -1) no++;
      if (no > MAX) throw new Error('You already have ' + MAX + ' sets.');
      await save({ no: no, name: name, choices: choices });
      return no;
    }
    async function setDefault(no) { check(await db.from('cod_permission_prefs').upsert({ user_id: userId, default_set: no, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })); }
    async function remove(no) {
      var now = await load();
      if (now.sets.length < 2) throw new Error('At least one set stays.');
      if (now.defaultNo === no) await setDefault(now.sets.filter(function (s) { return s.no !== no; })[0].no);
      check(await sets().delete().eq('user_id', userId).eq('set_no', no));
      check(await db.from('cod_session_permissions').delete().eq('user_id', userId).eq('set_no', no));   // those sessions start from the default again
    }
    // What one working session uses: its own saved choices, or the person's default.
    async function forSession(sessionId) {
      var now = await load();
      var row = sessionId ? (check(await db.from('cod_session_permissions').select('set_no,choices').eq('user_id', userId).eq('session_id', sessionId)) || [])[0] : null;
      var base = row && now.sets.filter(function (s) { return s.no === row.set_no; })[0];
      if (!base) { base = now.sets.filter(function (s) { return s.no === now.defaultNo; })[0]; row = null; }
      var changed = !!row && Object.keys(row.choices || {}).length > 0;
      return { no: base.no, letter: base.letter, name: base.name, choices: changed ? clean(row.choices) : base.choices, changed: changed };
    }
    // choices = null means "use the set as saved"; otherwise these apply to this session only
    async function saveSession(sessionId, no, choices) { check(await db.from('cod_session_permissions').upsert({ user_id: userId, session_id: sessionId, set_no: no, choices: choices ? clean(choices) : {}, updated_at: new Date().toISOString() }, { onConflict: 'user_id,session_id' })); }
    return { load: load, save: save, create: create, remove: remove, setDefault: setDefault, forSession: forSession, saveSession: saveSession };
  }
  var api = { ITEMS: ITEMS, NO_RULE: NO_RULE, MAX: MAX, STARTERS: STARTERS, full: full, letter: letter, clean: clean, store: store };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.AmitCoderPermissions = api;
})(this);
