// cleanup_extract.js - part of the "clean up" mechanism (see Cleanup_Procedure.md in this folder).
// Reads ONE Claude session file (.jsonl) and prints the back-and-forth as markdown: the person's messages and
// Amit's replies, word for word, oldest first. No tool calls, no tool output, no system or hook text.
// It only READS. It never edits the session file.
//
// Usage: node cleanup_extract.js <session.jsonl> [sinceISO] [--files]
//   sinceISO  only messages after this time (the "last clean-up" marker); omit for the whole session
//   --files   instead print the project-relative files that were written or edited (to find the folders touched)
const fs = require('fs');
const file = process.argv[2];
const since = process.argv[3] && !process.argv[3].startsWith('--') ? Date.parse(process.argv[3]) : 0;
const wantFiles = process.argv.includes('--files');
if (!file) { console.error('usage: node cleanup_extract.js <session.jsonl> [sinceISO] [--files]'); process.exit(1); }

const strip = (s) => String(s)
  .replace(/<system-reminder[\s\S]*?<\/system-reminder[^>]*>/g, '')
  .replace(/<task-notification>[\s\S]*?<\/task-notification>/g, '')
  .replace(/<local-command-[a-z]+>[\s\S]*?<\/local-command-[a-z]+>/g, '')
  .replace(/<command-(name|message|args)>[\s\S]*?<\/command-\1>/g, '')
  .replace(/\[SYSTEM NOTIFICATION - NOT USER INPUT\][\s\S]*$/m, '')
  .trim();
const textOf = (m) => {
  if (!m) return '';
  const c = m.content;
  if (typeof c === 'string') return c;
  if (Array.isArray(c)) return c.filter((p) => p && p.type === 'text').map((p) => p.text).join('\n');
  return '';
};

const out = [], files = new Set();
for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
  if (!line.trim()) continue;
  let o; try { o = JSON.parse(line); } catch { continue; }
  const ts = o.timestamp ? Date.parse(o.timestamp) : 0;
  if (wantFiles) {
    if (o.type === 'assistant' && o.message && Array.isArray(o.message.content)) {
      for (const p of o.message.content) {
        if (p && p.type === 'tool_use' && p.input && (p.name === 'Write' || p.name === 'Edit') && p.input.file_path) files.add(p.input.file_path);
      }
    }
    continue;
  }
  if (since && ts && ts <= since) continue;
  if (o.type === 'user' && !o.isMeta && !o.isSidechain) {
    const raw = textOf(o.message);
    if (!raw || /^\s*\[?tool_result/.test(raw)) continue;
    const t = strip(raw);
    if (t && !/^Another Claude session sent a message/.test(t) && !/^\[Subagent hand-back\]/.test(t)) out.push({ ts, who: 'Ryan', t });
  } else if (o.type === 'attachment' && o.attachment && o.attachment.type === 'queued_command' && o.attachment.prompt) {
    const t = strip(o.attachment.prompt);
    if (t) out.push({ ts, who: 'Ryan', t });
  } else if (o.type === 'assistant' && !o.isSidechain) {
    const t = strip(textOf(o.message));
    if (t) out.push({ ts, who: 'Amit', t });
  }
}
if (wantFiles) { console.log([...files].sort().join('\n')); process.exit(0); }
const fmt = (ts) => (ts ? new Date(ts).toISOString().replace('T', ' ').slice(0, 16) + 'Z' : '');
console.log(out.map((x) => '**' + x.who + '** (' + fmt(x.ts) + '):\n' + x.t).join('\n\n'));
console.error('messages: ' + out.length + '  characters: ' + out.reduce((n, x) => n + x.t.length, 0));
