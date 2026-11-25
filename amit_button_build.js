/* button_build.js v0.1 (2026-11-24). Reads and checks the reply Amit sends when he builds a custom script button (Ask Amit "build" mode).
   Spec: AmitHelper\Button_Creator_SPEC.md section 11. Rules he follows: AmitHelper\Button_Builder_Rules_DRAFT.md (section 3 is the reply format).
   Plain code, no model call, no network. Works in Node (the engine) and in a browser (the Hub), so it uses no Node-only features except the optional hash helper.
   The AUTHORITY is the Helper (amit_script_check.ps1, run at placement and before every run); this is the same never list, read from the same file, so a bad reply is caught early. */
(function (root) {
  'use strict';
  var KINDS = ['text', 'choice', 'multi_choice', 'number', 'date', 'date_range', 'yes_no', 'file', 'folder'];
  var VAR_RX = /^[a-z][a-z0-9_]{0,39}$/;

  /* the same scan as amit_script_check.ps1: skip full-line comments and block comments, run each rule's pattern against every other line */
  function scanScript(text, rules) {
    var lines = String(text).split(/\r?\n/), out = [], inBlock = false, i, r, t, rx;
    for (i = 0; i < lines.length; i++) {
      t = lines[i].trim();
      if (inBlock) { if (/#>/.test(t)) inBlock = false; continue; }
      if (t.indexOf('<#') === 0) { if (!/#>/.test(t)) inBlock = true; continue; }
      if (t.charAt(0) === '#' && !/^#Requires/.test(t)) continue;
      for (r = 0; r < rules.length; r++) {
        try { rx = new RegExp(rules[r].pattern, 'i'); } catch (e) { continue; }
        if (rx.test(lines[i])) out.push({ ruleId: rules[r].id, plain: rules[r].plain, line: i + 1, text: t.slice(0, 120) });
      }
    }
    return out;
  }

  /* the reply has blocks, each under a header line: ### SCRIPT, ### DEFINITION, ### RECOMMENDED_QUESTIONS, ### SUMMARY.
     SCRIPT, DEFINITION and RECOMMENDED_QUESTIONS hold one fenced code block; SUMMARY is plain text. */
  function sections(text) {
    var parts = String(text).split(/^###\s*(SCRIPT|DEFINITION|RECOMMENDED_QUESTIONS|SUMMARY)\s*$/m), out = {}, i;
    for (i = 1; i < parts.length; i += 2) out[parts[i]] = parts[i + 1] || '';
    return out;
  }
  function fenced(s) { var m = /```[a-zA-Z]*\r?\n([\s\S]*?)\r?\n```/.exec(s || ''); return m ? m[1] : null; }

  function parseBuildReply(text, rules) {
    var errors = [], warnings = [], res = { ok: false, errors: errors, warnings: warnings, script: null, definition: null, questions: [], summary: '', violations: [] };
    var sec = sections(text), script = fenced(sec.SCRIPT), defText = fenced(sec.DEFINITION), qText = fenced(sec.RECOMMENDED_QUESTIONS);
    if (!script || !script.trim()) errors.push('The reply has no script block (### SCRIPT with a code block under it).');
    if (!defText) errors.push('The reply has no definition block (### DEFINITION with a JSON code block under it).');
    var def = null;
    if (defText) { try { def = JSON.parse(defText); } catch (e) { errors.push('The definition is not valid JSON: ' + e.message); } }
    if (def) {
      if (typeof def.wish !== 'string' || def.wish.trim().length < 10) errors.push('The definition needs "wish": the job in the person\'s own words.');
      if (typeof def.worst_case !== 'string' || !def.worst_case.trim()) errors.push('The definition needs "worst_case": one plain sentence about what happens if this goes wrong.');
      if (!def.test_example || typeof def.test_example !== 'object') errors.push('The definition needs "test_example": the answers given and the result that counts as right.');
      var p = def.permissions;
      if (!p || typeof p !== 'object') errors.push('The definition needs "permissions".');
      else {
        if (!(p.maxActions >= 1 && p.maxActions <= 200)) errors.push('permissions.maxActions must be a number from 1 to 200.');
        if (!(p.maxSeconds >= 5 && p.maxSeconds <= 600)) errors.push('permissions.maxSeconds must be a number from 5 to 600.');
        ['reads', 'writes', 'sends', 'spends', 'internet'].forEach(function (k) { if (typeof p[k] !== 'boolean') warnings.push('permissions.' + k + ' should be true or false.'); });
        if (p.spends === true) errors.push('A script may not spend money. Buying needs the person to confirm each purchase, which is not built yet.');
        if (p.internet === true) errors.push('This version does not allow a script to reach the internet.');
        if ((p.writes === true) && !(Array.isArray(p.folders) && p.folders.length)) warnings.push('The script may change files but names no folder; it can only use its own work folder.');
      }
      var vars = def.declared_variables;
      if (!Array.isArray(vars)) errors.push('The definition needs "declared_variables" (a list, which may be empty).');
      else vars.forEach(function (v, i) {
        if (!v || !VAR_RX.test(String(v.name || ''))) errors.push('Variable ' + (i + 1) + ' needs a name of lowercase letters, digits and underscores.');
        if (!v || !String(v.label || '').trim()) errors.push('Variable "' + (v && v.name) + '" needs a plain "label".');
        if (v && Array.isArray(v.kinds)) v.kinds.forEach(function (k) { if (KINDS.indexOf(k) < 0) errors.push('Variable "' + v.name + '" has an unknown kind "' + k + '".'); });
      });
      /* every answer the script reads must be declared, and the other way round is only a warning */
      if (script && Array.isArray(vars)) {
        var used = [], rx = /Get-AmitAnswer\s+(?:-Name\s+)?['"]([A-Za-z0-9_]+)['"]/g, m, declared = vars.map(function (v) { return v && v.name; });
        while ((m = rx.exec(script))) if (used.indexOf(m[1]) < 0) used.push(m[1]);
        used.forEach(function (u) { if (declared.indexOf(u) < 0) errors.push('The script reads the answer "' + u + '" but the definition does not declare it.'); });
        declared.forEach(function (d) { if (used.indexOf(d) < 0) warnings.push('"' + d + '" is declared but the script never reads it (it would show as "not connected yet").'); });
      }
      res.definition = def;
    }
    if (qText) {
      var q = null; try { q = JSON.parse(qText); } catch (e) { errors.push('The recommended questions are not valid JSON: ' + e.message); }
      if (q) {
        if (!Array.isArray(q)) errors.push('The recommended questions must be a list.');
        else q.forEach(function (x, i) {
          if (!x || !String(x.label || '').trim()) errors.push('Recommended question ' + (i + 1) + ' needs a "label".');
          else if (KINDS.indexOf(x.kind) < 0) errors.push('Recommended question "' + x.label + '" has an unknown kind.');
          else if (!String(x.why || '').trim()) errors.push('Recommended question "' + x.label + '" needs a "why" in plain words.');
          else if (x.kind === 'choice' || x.kind === 'multi_choice') { if (!Array.isArray(x.choices) || x.choices.length < 2) errors.push('Recommended question "' + x.label + '" needs at least two choices.'); }
          if (x && x.variable && !VAR_RX.test(String(x.variable))) errors.push('Recommended question "' + x.label + '" has a bad variable name.');
        });
        res.questions = Array.isArray(q) ? q : [];
      }
    }
    if (script && /\bOpen-AmitWebsite\b/i.test(script)) {
      var wp = (def && def.permissions) || {};
      if (wp.opensWebsites !== true) errors.push('A script that opens websites needs permissions.opensWebsites true.');
      if (!Array.isArray(wp.websites)) errors.push('A script that opens websites needs permissions.websites: the list of site names it opens (it may be empty when the person types the site).');
      if (wp.reads === true || wp.clipboard === true || /\b(Read-AmitFile|Get-AmitClipboardText|Set-AmitClipboardText)\b/i.test(script)) errors.push('A button that opens websites may not read files or use the clipboard.');
    }
    res.summary = String(sec.SUMMARY || '').trim();
    if (!res.summary) warnings.push('The reply has no plain-words summary for the person.');
    if (script) {
      res.script = script;
      if (rules && rules.length) { res.violations = scanScript(script, rules); res.violations.forEach(function (v) { errors.push('Not allowed (line ' + v.line + '): ' + v.plain); }); }
    }
    res.ok = errors.length === 0;
    return res;
  }

  /* ORDINARY STEPS (2026-11-25): when the whole job is things the ordinary buttons already do, Amit replies ### STEPS + ### SUMMARY and no script is written. Same safe types the Hub's paste box allows Amit. */
  var STEP_WORDS = { open_url: 'Open a website', open_app: 'Open an Amit app', open_program: 'Open a program', play_music: 'Play music', speak: 'Say', ask_amit: 'Ask Amit', wait: 'Wait (seconds)' };
  function isStepsReply(text) { return /^###\s*STEPS\s*$/m.test(String(text)); }
  function parseStepsReply(text) {
    var errors = [], steps = [], parts = String(text).split(/^###\s*(STEPS|SUMMARY)\s*$/m), sec = {}, i, data = null;
    for (i = 1; i < parts.length; i += 2) sec[parts[i]] = parts[i + 1] || '';
    try { data = JSON.parse(fenced(sec.STEPS) || String(sec.STEPS || '').trim()); } catch (e) { errors.push('The steps block is not valid JSON.'); }
    var list = data && (Array.isArray(data) ? data : data.steps);
    if (data && (!Array.isArray(list) || !list.length || list.length > 12)) errors.push('There must be 1 to 12 steps.');
    else if (list) list.forEach(function (s, n) {
      var t = s && s.t, v = s && s.v != null ? String(s.v).trim() : '';
      if (!Object.prototype.hasOwnProperty.call(STEP_WORDS, t) || !v) { errors.push('Step ' + (n + 1) + ' is not one of the safe steps.'); return; }
      if (t === 'open_url' && !/^https:\/\/[^\s]+$/i.test(v)) errors.push('Step ' + (n + 1) + ' must be a full website address starting with https://.');
      if (t === 'wait' && !(Number(v) >= 1 && Number(v) <= 60)) errors.push('Step ' + (n + 1) + ' must wait 1 to 60 seconds.');
      if (t === 'open_program' && /[:\\\/]|\.(ps1|bat|cmd|vbs|js)\b|\s-{1,2}\w/i.test(v)) errors.push('Step ' + (n + 1) + ' must be a program name as the Start menu shows it.');
      if (v.length > 300) errors.push('Step ' + (n + 1) + ' is too long.');
      steps.push({ t: t, v: v });
    });
    return { ok: !errors.length && !!steps.length, errors: errors, steps: steps, summary: String(sec.SUMMARY || '').trim() };
  }

  var api = { scanScript: scanScript, parseBuildReply: parseBuildReply, isStepsReply: isStepsReply, parseStepsReply: parseStepsReply, STEP_WORDS: STEP_WORDS, KINDS: KINDS };
  if (typeof module !== 'undefined' && module.exports) {
    api.fingerprint = function (text) { return require('crypto').createHash('sha256').update(Buffer.from(String(text), 'utf8')).digest('hex').toUpperCase(); };
    module.exports = api;
  } else root.AmitButtonBuild = api;
})(typeof window !== 'undefined' ? window : this);
