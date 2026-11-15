// save_session.js - part of the end-of-day routine (see Cleanup_Procedure.md in this folder).
// Saves ONE Claude session as a plain text file in the project's "Daily Sessions" folder. It only READS the session file.
// The text is your messages and Amit's replies, word for word, with tool calls, tool output and system text removed
// (it uses cleanup_extract.js). Run again later and it REPLACES the same session's file (named with the session id).
//
// Usage (from the Amit root folder):
//   node save_session.js --find "<a distinctive phrase from this conversation>"   find this session by content
//   node save_session.js --id <session id or first 8 characters>                  or name it directly
//   optional: --project <folder>   force the project folder ("root" = the Amit root folder)
//             --title "<title>"    use this title when the session has none
//             --dry                show what it would do, write nothing
// Folder choice: the project named in the session title ("Project - piece"); else the project whose files the session
// edited most; else "Daily Sessions (unsorted)" in the root folder.
const fs = require('fs'), path = require('path'), cp = require('child_process'), os = require('os');
const ROOT = __dirname;
const PROJ = path.join(os.homedir(), '.claude', 'projects');
const EXTRACT = path.join(ROOT, 'cleanup_extract.js');
const SKIP = /^(Backups|node_modules|\.git|Previews|Daily Sessions.*|\.claude|Reference)$/;
const arg = (n) => { const i = process.argv.indexOf('--' + n); return i > -1 ? (process.argv[i + 1] || '') : null; };
const has = (n) => process.argv.includes('--' + n);
const find = arg('find'), idArg = arg('id'), forceProj = arg('project'), forceTitle = arg('title'), dry = has('dry');
if (!find && !idArg) { console.error('usage: node save_session.js --find "<phrase>"  |  --id <session id>   [--project <folder>] [--title "<t>"] [--dry]'); process.exit(1); }

// 1. locate the session file
// Claude Code names each project's session folder after its path (every character that is not a letter or digit becomes "-").
const prefix = ROOT.replace(/[^A-Za-z0-9]/g, '-').toLowerCase();
const dirs = fs.readdirSync(PROJ).filter((d) => d.toLowerCase().startsWith(prefix)).map((d) => path.join(PROJ, d));
let files = [];
for (const d of dirs) for (const f of fs.readdirSync(d)) if (f.endsWith('.jsonl')) { const p = path.join(d, f); files.push({ p, id: f.replace('.jsonl', ''), m: fs.statSync(p).mtimeMs }); }
files.sort((a, b) => b.m - a.m);
let hit = null;
if (idArg) hit = files.find((x) => x.id.startsWith(idArg));
else for (const x of files) { if (fs.readFileSync(x.p, 'utf8').includes(find)) { hit = x; break; } }
if (!hit) { console.error('No session found' + (find ? ' containing that phrase.' : ' with that id.')); process.exit(2); }

// 2. read it: title, date, text, files edited
const raw = fs.readFileSync(hit.p, 'utf8');
let title = '', first = '';
for (const line of raw.split('\n')) {
  if (!line.trim()) continue; let o; try { o = JSON.parse(line); } catch { continue; }
  if (o.type === 'custom-title' && o.customTitle) title = o.customTitle;
  if (!first && o.timestamp) first = o.timestamp;
}
if (!title && forceTitle) title = forceTitle;
const run = (extra) => cp.execFileSync('node', [EXTRACT, hit.p, ...extra], { maxBuffer: 1 << 30, stdio: ['ignore', 'pipe', 'ignore'] }).toString('utf8');
let text = run([]);
const scrub = (s) => s
  .replace(/sb_secret_[A-Za-z0-9_]+/g, '(private detail omitted)')
  .replace(/\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, '(private detail omitted)')
  .replace(/\bsk-[A-Za-z0-9_-]{20,}/g, '(private detail omitted)')
  .replace(/\bghp_[A-Za-z0-9]{20,}/g, '(private detail omitted)');
text = scrub(text);

// 3. choose the folder
const n = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
const folders = fs.readdirSync(ROOT, { withFileTypes: true }).filter((e) => e.isDirectory() && !SKIP.test(e.name)).map((e) => e.name);
let target = null, why = '';
if (forceProj) { target = forceProj.toLowerCase() === 'root' ? ROOT : path.join(ROOT, forceProj); why = 'forced by --project'; }
if (!target && title) {
  const proj = n(title.split(' - ')[0]);
  const f = folders.find((x) => n(x) === proj) || folders.find((x) => n(x) === 'amit' + proj) || folders.find((x) => n(x).replace(/^amit/, '') === proj);
  if (f) { target = path.join(ROOT, f); why = 'project named in the title'; }
  else if (proj === 'root' || proj === n(path.basename(ROOT))) { target = ROOT; why = 'the title names the root folder (work across the whole system)'; }
}
if (!target) {
  const counts = {};
  for (const l of run(['--files']).split('\n')) {
    const rel = path.relative(ROOT, l.trim()); if (!l.trim() || rel.startsWith('..') || path.isAbsolute(rel)) continue;
    const seg = rel.split(/[\\/]/)[0]; if (!seg || seg.includes('.') || SKIP.test(seg)) continue;
    counts[seg] = (counts[seg] || 0) + 1;
  }
  const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  if (best) { target = path.join(ROOT, best[0]); why = 'the folder whose files it edited most (' + best[1] + ' edits); the title does not name a project'; }
}
let unsorted = false;
if (!target) { target = ROOT; unsorted = true; why = 'no project could be told from the title or the files edited'; }
const outDir = unsorted ? path.join(ROOT, 'Daily Sessions (unsorted)') : path.join(target, 'Daily Sessions');

// 4. write
const date = new Date(first || hit.m).toLocaleDateString('sv-SE');
const id8 = hit.id.slice(0, 8);
const clean = (s) => String(s).replace(/[\\/:*?"<>|\r\n`]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 70);
const name = date + ' ' + id8 + ' ' + (clean(title) || '(untitled)') + '.txt';
const head = 'Session: ' + hit.id + '\nDate: ' + date + '\nTitle: ' + (title || '(untitled)') + '\nSaved: ' + new Date().toISOString() + '\n(Your messages and Amit\'s replies word for word; tool calls, tool output and system text removed.)\n\n';
console.log('Session ' + hit.id + '\nTitle: ' + (title || '(untitled)') + '\nFolder: ' + outDir + '   (' + why + ')\nFile: ' + name + '\nSize: ' + Math.round(Buffer.byteLength(text) / 1024) + ' KB');
if (dry) { console.log('(dry run: nothing written)'); process.exit(0); }
fs.mkdirSync(outDir, { recursive: true });
// Never replace a saved copy with a SHORTER one: the end-of-session hook can run before the transcript has its last lines.
const newBytes = Buffer.byteLength(head + text);
for (const f of fs.readdirSync(outDir)) if (f.includes(' ' + id8 + ' ') && f.endsWith('.txt') && fs.statSync(path.join(outDir, f)).size > newBytes) { console.log('Kept the longer saved copy already there (' + f + '); nothing replaced.'); process.exit(0); }
let replaced = [];
for (const d of [outDir, path.join(ROOT, 'Daily Sessions (unsorted)')]) {
  if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d)) if (f.includes(' ' + id8 + ' ') && f.endsWith('.txt') && !(d === outDir && f === name)) { fs.unlinkSync(path.join(d, f)); replaced.push(d.replace(ROOT, '.') + '\\' + f); }
}
fs.writeFileSync(path.join(outDir, name), head + text, 'utf8');
console.log(replaced.length ? 'Replaced earlier copy: ' + replaced.join('; ') : 'Saved (new file).');
