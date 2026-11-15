// rename_session.js - titles the CURRENT Claude session with a project name (what /rename does).
// Usage: node rename_session.js "<project name>" [--dry]
// It finds the newest session file (.jsonl) in this Amit folder's Claude project folder, checks the file ends with a
// newline, and appends ONE line: {"type":"custom-title","customTitle":"<name>","sessionId":"<id>"}.
// It never changes any other line. It skips the write if that exact title is already the last title.
// Authorized by Ryan 2026-11-14 ("authorized to write into Claude's folder"; the title "Amit" showed in VS Code).
const fs = require('fs'), path = require('path'), os = require('os');
const name = (process.argv[2] || '').trim();
const dry = process.argv.includes('--dry');
if (!name || name.startsWith('--')) { console.error('usage: node rename_session.js "<project name>" [--dry]'); process.exit(1); }
const dir = path.join(os.homedir(), '.claude', 'projects', 'c--Users-user1-OneDrive-Documents---onedrive-Amit');
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.jsonl')).map((f) => ({ f, t: fs.statSync(path.join(dir, f)).mtimeMs })).sort((a, b) => b.t - a.t);
if (!files.length) { console.error('no session file found in ' + dir); process.exit(2); }
const file = path.join(dir, files[0].f), id = files[0].f.replace(/\.jsonl$/, '');
const text = fs.readFileSync(file, 'utf8');
let last = null; const re = /"type":"custom-title"[^\n]*?"customTitle":"((?:[^"\\]|\\.)*)"/g; let m; while ((m = re.exec(text))) last = JSON.parse('"' + m[1] + '"');
if (last === name) { console.log('already titled "' + name + '" (' + id + '); nothing written'); process.exit(0); }
const line = JSON.stringify({ type: 'custom-title', customTitle: name, sessionId: id }) + '\n';
if (dry) { console.log('DRY RUN: would title ' + id + ' as "' + name + '" (current title: ' + (last || 'none') + ')'); process.exit(0); }
fs.appendFileSync(file, (text.endsWith('\n') ? '' : '\n') + line);
console.log('titled ' + id + ' as "' + name + '"');
