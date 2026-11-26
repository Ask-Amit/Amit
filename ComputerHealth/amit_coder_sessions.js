// amit_coder_sessions.js (Amit Helper): session names, the list of past sessions, and their past conversation. The program does this itself; it does not rely on Claude.
const fs = require('fs'), path = require('path'), os = require('os');
const ROOT = process.env.AMIT_CODER_ROOT || process.cwd();   // the person's own Amit folder, given by the Helper
const DIR = path.join(os.homedir(), '.claude', 'projects', ROOT.replace(/[^A-Za-z0-9]/g, '-'));
const SKIP = /^(Backups|node_modules|\.git|Previews|Daily Sessions.*|\.claude|Reference)$/;
const projects = () => fs.readdirSync(ROOT, { withFileTypes: true })
  .filter((e) => e.isDirectory() && !SKIP.test(e.name) && fs.existsSync(path.join(ROOT, e.name, 'Sessions_Start.md'))).map((e) => e.name);
const words = (s) => ' ' + String(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() + ' ';

// Which project does a first message name? Only a short message or "working on ..." counts, so ordinary requests are not guessed at.
function detect(message) {
  let m = words(message);
  const on = m.match(/ work(?:ing)? (?:on|in) (?:the )?(.*)$/);
  const count = m.trim().split(' ').length;
  if (on) m = ' ' + on[1].split(' ').slice(0, 4).join(' ').trim() + ' ';
  else if (count > 6) return [];
  const hits = [];
  for (const p of projects()) {
    const spaced = words(p.replace(/([a-z])([A-Z])/g, '$1 $2')).trim(), joined = spaced.replace(/ /g, '');
    const forms = [spaced, joined];
    if (/^amit /.test(spaced) && (on || count <= 3)) forms.push(spaced.slice(5));   // "helper", "books", "coder"
    const found = forms.filter((f) => f && m.includes(' ' + f + ' ')).sort((a, b) => b.length - a.length)[0];
    if (found) hits.push({ p, found });
  }
  // "computer health" wins over "health" from AmitHealth.
  return hits.filter((h) => !hits.some((o) => o !== h && o.found.length > h.found.length && (' ' + o.found + ' ').includes(' ' + h.found + ' '))).map((h) => h.p);
}

const fileOf = (id) => /^[0-9a-f-]{36}$/.test(id || '') ? path.join(DIR, id + '.jsonl') : null;
function read(file) {
  const r = { title: '', entry: '', turns: [] }; let cur = null;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    let o; try { o = JSON.parse(line); } catch { continue; }
    if (o.type === 'custom-title' && o.customTitle) r.title = o.customTitle;
    if (o.entrypoint) r.entry = o.entrypoint;
    const c = o.message && o.message.content; if (!c || o.isSidechain) continue;
    const text = (typeof c === 'string' ? c : c.filter((x) => x.type === 'text').map((x) => x.text).join('\n'));
    if (o.type === 'user' && !o.isMeta) {
      const typed = text.replace(/<(ide_[a-z_]+|system-reminder|command-[a-z]+|task-notification)>[\s\S]*?<\/\1>/g, '').replace(/^\[SYSTEM NOTIFICATION[\s\S]*/, '').trim();
      if (typed) r.turns.push(cur = { you: typed, reply: '' });
    } else if (o.type === 'assistant' && cur && text.trim()) cur.reply = text.trim();   // the last text of each turn is its result
  }
  return r;
}
function get(id) { const f = fileOf(id); return f && fs.existsSync(f) ? read(f) : null; }
function list(limit) {
  return fs.readdirSync(DIR).filter((f) => /^[0-9a-f-]{36}\.jsonl$/.test(f))
    .map((f) => ({ id: f.slice(0, 36), at: fs.statSync(path.join(DIR, f)).mtimeMs })).sort((a, b) => b.at - a.at).slice(0, limit)
    .map((s) => { const r = read(fileOf(s.id)); return { ...s, title: r.title, first: r.turns[0] ? r.turns[0].you.replace(/\s+/g, ' ').slice(0, 90) : '', messages: r.turns.length, where: /vscode/i.test(r.entry) ? 'VS Code' : 'Coder' }; })
    .filter((s) => s.messages);
}
// The same one-line title VS Code's rename writes, added to the named session's own file. No other line is touched.
function setTitle(id, title) {
  const f = fileOf(id); if (!f || !fs.existsSync(f)) return false;
  const text = fs.readFileSync(f, 'utf8');
  fs.appendFileSync(f, (text.endsWith('\n') ? '' : '\n') + JSON.stringify({ type: 'custom-title', customTitle: title, sessionId: id }) + '\n');
  return true;
}
module.exports = { projects, detect, list, get, setTitle };
