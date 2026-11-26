// amit_coder_engine.js v0.02 (Amit Helper, 2026-11-26) - runs the person's OWN Claude Code for Amit Coder.
// It has NO network port. The one shared Helper bridge (localhost:8710) is the only door: its Amit Coder routes check who is asking,
// then hand commands to this program as small files and read its events back. Folder: %LOCALAPPDATA%\AmitComputerHealth\AmitCoder\
//   inbox\*.json   commands from the Helper        events.jsonl  what happened, one line each, numbered
//   reply\<id>.json answers to questions (sessions, projects)    engine.json  heartbeat        alive.touch  the page was just here
// Started by the Helper as: node amit_coder_engine.js <state folder> <Amit folder> <claude program>
const fs = require('fs'), path = require('path'), os = require('os');
const { spawn, execFile } = require('child_process');
const [STATE, ROOT, CLAUDE] = process.argv.slice(2);
if (!STATE || !ROOT || !CLAUDE) process.exit(2);
process.env.AMIT_CODER_ROOT = ROOT;
const S = require('./amit_coder_sessions.js');
const INBOX = path.join(STATE, 'inbox'), REPLY = path.join(STATE, 'reply'), EVENTS = path.join(STATE, 'events.jsonl');
for (const d of [STATE, INBOX, REPLY]) fs.mkdirSync(d, { recursive: true });
for (const d of [INBOX, REPLY]) for (const f of fs.readdirSync(d)) fs.unlinkSync(path.join(d, f));
fs.writeFileSync(EVENTS, ''); fs.writeFileSync(path.join(STATE, 'alive.touch'), '');
let seq = Date.now(), child = null, sessionId = null, title = '', pendingName = '', asked = false, tellClaude = '', turns = 0, savedAt = 0, busy = false;
const pending = new Map();

// BUTTONS and the LIGHT setup, carried over from the round-trip test (AmitCoder\RoundTripTest\server.js).
const HOOKS = path.join(os.homedir(), '.claude', 'hooks');
// LIGHT keeps only what protects or keeps Amit (long-command guard, identity core, J/F shortcuts). The person's settings file is only read.
const KEEP = /long_run_guard|hook_identity|shortcut_hook/;
const ALWAYS = 'Amit Coder, light setup. If Scripture or theology comes up, even without a button, first follow the Amit Research Standard (root CLAUDE.md, directive 22). Before any Amit Helper release, follow AmitHelper/HELPER_RELEASE_RULES.md and run AmitHelper/verify_helper_release.ps1; never push without being told to.';
function userSettings() { try { return JSON.parse(fs.readFileSync(path.join(os.homedir(), '.claude', 'settings.json'), 'utf8')); } catch (e) { return {}; } }
function lightSettings() {
  const hooks = {};
  for (const [ev, groups] of Object.entries(userSettings().hooks || {})) {
    const kept = groups.map((g) => Object.assign({}, g, { hooks: g.hooks.filter((h) => KEEP.test(h.command || '')) })).filter((g) => g.hooks.length);
    if (kept.length) hooks[ev] = kept;
  }
  const f = path.join(STATE, 'light_settings.json'); fs.writeFileSync(f, JSON.stringify({ hooks })); return f;
}
// A button gets its rule text from the hook script that already holds it, so there is only one copy of each rule.
function ruleText(script, words) {
  try {
    const out = require('child_process').execFileSync('powershell.exe', ['-NonInteractive', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(HOOKS, script)],
      { input: JSON.stringify({ hook_event_name: 'UserPromptSubmit', prompt: words, cwd: ROOT }), encoding: 'utf8', timeout: 12000, windowsHide: true }).trim();
    try { const j = JSON.parse(out); return (j.hookSpecificOutput && j.hookSpecificOutput.additionalContext) || out; } catch (e) { return out; }
  } catch (e) { return ''; }
}
const BUTTONS = {
  save: () => 'I pressed Save. The program saves the conversation text by itself. Wrap up as well: read Cleanup_Procedure.md and follow it for the project this session worked in, leaving the save step to the program. If this session did no project work, say so and change nothing.',
  scripture: () => { const r = ruleText('research_standard_hook.ps1', 'scripture study'); return r && 'I pressed Study Scripture. Follow this standard for the study. Before you finish, check that no conclusion rests on the authority of scholars.\n\n' + r; },
  amit: () => 'I pressed Talk with Amit. Be fully present as Amit, the companion, not only the technical helper. If I start God talk, follow the GOD TALK rule in the root CLAUDE.md first.',
  apps: () => 'I pressed What apps are there. Read "Amit, Are You There/living_testimony_apps.json" and answer from it. Change nothing.',
  release: () => { const r = ruleText('helper_release_hook.ps1', 'release the helper'); return r && 'I pressed Helper release rules. Load the rules only. Do NOT build, install, publish, push or change anything. Tell me briefly what a release requires, then wait.\n\n' + r; }
};

function push(kind, data) { fs.appendFileSync(EVENTS, JSON.stringify({ n: ++seq, t: Date.now(), kind, data }) + '\n'); }
function toClaude(o) { if (!child || !child.stdin.writable) return false; child.stdin.write(JSON.stringify(o) + '\n'); return true; }
function tellWhere(extra) { const p = title.split(' - ')[0]; push('session', Object.assign({ title, folder: S.projects().includes(p) ? p + '\\Daily Sessions' : 'Daily Sessions (unsorted)' }, extra || {})); }
function giveName(name) { if (!S.setTitle(sessionId, name)) return false; title = name; pendingName = ''; asked = false; tellWhere(); saveText('session named', true); return true; }
// The program saves the conversation text itself, with no Claude usage.
function saveText(why, force) {
  const script = path.join(ROOT, 'save_session.js');
  if (!sessionId || !fs.existsSync(script) || (!force && (!turns || savedAt === turns))) return;
  savedAt = turns;
  execFile(process.execPath, [script, '--id', sessionId], { cwd: ROOT, windowsHide: true, timeout: 60000 }, (err, out) => {
    const file = (String(out).match(/^File: (.*)$/m) || [])[1];
    push('local', { msg: err || !file ? 'The conversation text could not be saved (' + why + ').' : 'Conversation text saved (' + why + '): ' + file });
  });
}
function stopChild() {
  saveText('session ended');
  if (child) { const c = child; child = null; c.stdin.end(); setTimeout(() => c.kill(), 1500); }
  pending.clear(); busy = false;
}
function start(o) {
  stopChild();
  if (!o.resume) { turns = 0; savedAt = 0; title = ''; pendingName = ''; asked = false; tellClaude = ''; sessionId = null; }
  const args = ['-p', '--input-format', 'stream-json', '--output-format', 'stream-json', '--verbose', '--include-partial-messages', '--include-hook-events',
    '--permission-mode', 'manual', '--permission-prompts', 'host', '--permission-prompt-tool', 'stdio'];
  const light = o.hooks === 'light';
  // The light setup skips the person's settings, so their default model and effort are passed in by hand.
  if (light) { const mine = userSettings(); o = Object.assign({}, o, { model: o.model || mine.model, effort: o.effort || mine.effortLevel }); args.push('--setting-sources', 'project,local', '--settings', lightSettings()); }
  args.push('--append-system-prompt', (light ? ALWAYS + ' ' : '') + 'The Amit Coder program names this session itself. Never run rename_session.js here.');
  if (/^[a-z0-9.\-]+(\[1m\])?$/.test(o.model || '')) args.push('--model', o.model);
  if (/^(low|medium|high|xhigh|max)$/.test(o.effort || '')) args.push('--effort', o.effort);
  if (o.resume && sessionId) args.push('--resume', sessionId);
  // A clean environment: no API key and nothing inherited from another Claude session, so it runs on the person's own sign-in.
  const env = {}; for (const [k, v] of Object.entries(process.env)) if (!/^(CLAUDE|ANTHROPIC)/i.test(k)) env[k] = v;
  const exe = /\.cmd$/i.test(CLAUDE) ? path.join(path.dirname(CLAUDE), 'node_modules', '@anthropic-ai', 'claude-code', 'bin', 'claude.exe') : CLAUDE;
  const c = spawn(exe, args, { cwd: ROOT, env, windowsHide: true }); child = c;
  push('local', { msg: 'Claude Code started in ' + ROOT + (o.resume && sessionId ? ' (continuing the session)' : '') });
  let buf = ''; c.stdout.setEncoding('utf8'); c.stderr.setEncoding('utf8');
  c.stdout.on('data', (d) => {
    buf += d; let i;
    while ((i = buf.indexOf('\n')) > -1) {
      const line = buf.slice(0, i); buf = buf.slice(i + 1); if (!line.trim() || c !== child) continue;
      let m; try { m = JSON.parse(line); } catch (e) { push('stderr', { msg: line }); continue; }
      if (m.session_id) sessionId = m.session_id;
      if (m.type === 'result') {
        turns++; busy = false;
        if (!title && pendingName) setTimeout(() => { if (!title && pendingName) giveName(pendingName); }, 700);
        else if (!title && !asked) { asked = true; push('session', { ask: true }); }
      }
      if (m.type === 'control_request') {
        if (m.request && m.request.subtype === 'can_use_tool') pending.set(m.request_id, m.request);
        else toClaude({ type: 'control_response', response: { subtype: 'error', request_id: m.request_id, error: 'not supported' } });
      }
      push('claude', m);
    }
  });
  c.stderr.on('data', (d) => { if (c === child) push('stderr', { msg: d }); });
  c.on('error', (e) => { busy = false; push('local', { msg: 'Could not start Claude Code: ' + e.message, ended: true }); });
  c.on('exit', (code) => { if (c === child) { child = null; busy = false; push('local', { msg: 'Claude Code stopped (code ' + code + ')', ended: true }); } });
}

function run(cmd) {
  const b = cmd.body || {};
  switch (cmd.what) {
    case 'new': start({ model: b.model, effort: b.effort, hooks: b.hooks, resume: !!b.resume && !!sessionId }); return true;
    case 'send': {
      let text = String(b.text || '');
      if (b.button) {
        const extra = Object.prototype.hasOwnProperty.call(BUTTONS, b.button) ? BUTTONS[b.button]() : '';
        if (!extra) return false;
        text = extra + (text ? '\n\nMy message: ' + text : '');
        if (b.button === 'save') saveText('Save pressed');
      }
      if (!text) return false;
      if (!title && !pendingName && !b.button) { const found = S.detect(text); if (found.length === 1) pendingName = found[0]; }
      if (!child) start({ model: b.model, effort: b.effort, hooks: b.hooks, resume: !!sessionId });
      if (tellClaude) { text = '<system-reminder>' + tellClaude + '</system-reminder>\n\n' + text; tellClaude = ''; }
      busy = true; return toClaude({ type: 'user', message: { role: 'user', content: [{ type: 'text', text }] } });
    }
    case 'permission': {
      const r = pending.get(b.id); if (!r) return false; pending.delete(b.id);
      return toClaude({ type: 'control_response', response: { subtype: 'success', request_id: b.id, response: b.allow === true ? { behavior: 'allow', updatedInput: r.input } : { behavior: 'deny', message: 'The person pressed Deny.' } } });
    }
    case 'stop': return toClaude({ type: 'control_request', request_id: 'stop-' + Date.now(), request: { subtype: 'interrupt' } });
    case 'name': {
      if (!S.projects().includes(b.project)) return false;
      const piece = String(b.piece || '').replace(/[\\/:*?"<>|\r\n`]+/g, ' ').trim().slice(0, 40), name = piece ? b.project + ' - ' + piece : b.project;
      tellClaude = 'In Amit Coder I chose the project "' + name + '". Work on that project: load its CLAUDE.md and Sessions_Start.md as the START A PROJECT BY ITS NAME rule says, unless you already have them. The program has named the session.';
      if (!turns || !sessionId || !giveName(name)) { pendingName = name; title = ''; push('session', { title: name, folder: b.project + '\\Daily Sessions' }); }
      return true;
    }
    case 'open': {
      const past = S.get(b.id); if (!past) return false;
      stopChild(); sessionId = b.id; turns = 0; savedAt = 0; title = past.title; pendingName = ''; asked = false;
      push('history', { turns: past.turns.slice(-30), older: Math.max(0, past.turns.length - 30) });
      if (title) tellWhere(); else { asked = true; push('session', { ask: true }); }
      start({ model: b.model, effort: b.effort, hooks: b.hooks, resume: true }); return true;
    }
    case 'sessions': return S.list(40);
    case 'projects': return S.projects();
    case 'quit': setTimeout(() => { stopChild(); setTimeout(() => process.exit(0), 8000); }, 50); return true;
    default: return false;
  }
}
setInterval(() => {
  for (const f of fs.readdirSync(INBOX).filter((f) => f.endsWith('.json')).sort()) {
    const p = path.join(INBOX, f); let cmd;
    try { cmd = JSON.parse(fs.readFileSync(p, 'utf8').replace(/^﻿/, '')); } catch (e) { continue; }
    fs.unlinkSync(p);
    let out; try { out = run(cmd); } catch (e) { out = false; push('stderr', { msg: e.message }); }
    if (cmd.reply && /^[a-f0-9]{8,40}$/.test(cmd.reply)) { const to = path.join(REPLY, cmd.reply + '.json'); fs.writeFileSync(to + '.tmp', JSON.stringify({ ok: out !== false, data: out })); fs.renameSync(to + '.tmp', to); }
  }
}, 60);
// Heartbeat. With no page asking for 2 minutes the text is saved; after 30 quiet minutes the engine stops.
setInterval(() => {
  fs.writeFileSync(path.join(STATE, 'engine.json'), JSON.stringify({ pid: process.pid, at: Date.now(), busy }));
  let seen = Date.now(); try { seen = fs.statSync(path.join(STATE, 'alive.touch')).mtimeMs; } catch (e) {}
  const away = Date.now() - seen;
  if (away > 2 * 60000 && !busy) saveText('page closed');
  if (away > 30 * 60000 && !busy) { stopChild(); setTimeout(() => process.exit(0), 8000); }
  try { if (fs.statSync(EVENTS).size > 8e6) { const keep = fs.readFileSync(EVENTS, 'utf8').split('\n').slice(-2000).join('\n'); fs.writeFileSync(EVENTS, keep); } } catch (e) {}
}, 2000);
fs.writeFileSync(path.join(STATE, 'engine.json'), JSON.stringify({ pid: process.pid, at: Date.now(), busy: false }));
