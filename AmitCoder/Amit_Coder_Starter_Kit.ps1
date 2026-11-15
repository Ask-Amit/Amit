# Amit Coder Starter Kit
# Sets up a new coding project folder the same way Ryan's own Amit environment
# is structured: a root CLAUDE.md that auto-orients Claude Code every session,
# a Templates subfolder for reusable project scaffolding, and a backup junction
# so every Claude Code session (JSONL files) is automatically preserved outside
# the default hidden folder.
#
# Run this once. Right-click the file -> "Run with PowerShell."

# Version of the shared directive package this script writes into a new
# project's CLAUDE.md (Pursuit Attribution, the SHORTCUTS and CLEAN UP pointers,
# Login-Based Profile, the file layout) and the files it ships beside it
# (Shortcuts_Activation.md, Cleanup_Procedure.md, cleanup_extract.js, rename_session.js).
# 2.0 (2026-11-14): shortcuts and clean-up moved out of the CLAUDE.md into those files.
# Bump this by hand whenever a clause below is added or changed,
# and update the matching dev_playbook row (topic_key=amit_coder_directive_package)
# so installed copies can detect they are behind.
$DIRECTIVE_VERSION = "2.0"

Write-Host ""
Write-Host "=== Amit Coder Starter Kit ===" -ForegroundColor Yellow
Write-Host ""

# 1. Ask for (or default) a project root folder
$defaultPath = "$env:USERPROFILE\Documents\AmitCoderProjects"
$inputPath = Read-Host "Where should your project folder live? (press Enter for default: $defaultPath)"
$projectRoot = if ([string]::IsNullOrWhiteSpace($inputPath)) { $defaultPath } else { $inputPath }

if (-not (Test-Path $projectRoot)) {
    New-Item -ItemType Directory -Path $projectRoot -Force | Out-Null
    Write-Host "Created project folder: $projectRoot" -ForegroundColor Green
} else {
    Write-Host "Using existing folder: $projectRoot" -ForegroundColor Cyan
}

# 1b. Capture the project's own name - used to auto-stamp every pursuit this
# project ever creates with the same, exact, consistent identifier (never
# typed by hand later, never a different spelling next time). Defaults to
# the folder's own name if left blank.
$folderLeafName = Split-Path $projectRoot -Leaf
$appNameInput = Read-Host "What is this project/application called? (press Enter to use the folder name: $folderLeafName)"
$appName = if ([string]::IsNullOrWhiteSpace($appNameInput)) { $folderLeafName } else { $appNameInput.Trim() }
Write-Host "This project's canonical name is: $appName - every pursuit created from here will be stamped with this, always." -ForegroundColor Cyan

# 2. Templates subfolder
$templatesPath = Join-Path $projectRoot "Templates"
if (-not (Test-Path $templatesPath)) {
    New-Item -ItemType Directory -Path $templatesPath -Force | Out-Null
}

# 2b. AmitCoder subfolder - mirrors Ryan's own two-level structure: the root
#     CLAUDE.md (written below) is the PRIMARY file, the one Claude Code
#     actually reads at session start. This subfolder's own CLAUDE.md is
#     reference material about AmitCoder itself, not a duplicate of the
#     shortcut/pursuit machinery - that machinery lives in the root file only,
#     since a nested CLAUDE.md is not auto-read unless a session is opened
#     specifically inside that subfolder.
$amitCoderPath = Join-Path $projectRoot "AmitCoder"
if (-not (Test-Path $amitCoderPath)) {
    New-Item -ItemType Directory -Path $amitCoderPath -Force | Out-Null
    $amitCoderMdContent = @'
# AmitCoder - What This Folder Is

This is reference material about AmitCoder, the tool that set up this project.
Your assistant reads its actual working instructions from the CLAUDE.md at the
root of this project, one level up - not from this file. This file exists so
a person (or a future session poking around) can find out what AmitCoder is
without that explanation cluttering the primary file every session reads.

## What AmitCoder Is

AmitCoder is Amit's own coding workspace - shortcuts (F for your own, J for
the builtin package Amit ships with), a shared code library, pairing session
notes, and a real record of Amit's own build sessions. Web app:
ask-amit.github.io/Amit/AmitCoder/AmitCoder.html

## Where Things Actually Live

- Your project's real working instructions: the CLAUDE.md one level up (the
  root of this project) - Pursuit Attribution, the SHORTCUTS and CLEAN UP
  rules, the Login-Based Profile and the Directive Package Version are all
  there, not here.
- Your shortcuts are not cached to a file - when you use one, the session reads
  Shortcuts_Activation.md (at the project root) and queries Supabase live.
- "clean up" is described in Cleanup_Procedure.md (at the project root).
- Your synced session data: amit_coder_config.json at the project root
  (your AmitCoder Account ID, used to fetch your own F shortcuts).

## Current Projects

(Nothing yet - update this as you build things using AmitCoder.)
'@
    Set-Content -Path (Join-Path $amitCoderPath "CLAUDE.md") -Value $amitCoderMdContent -Encoding utf8
    Write-Host "Created AmitCoder/CLAUDE.md - reference material about the tool itself" -ForegroundColor Green
}

# 3. Write the root CLAUDE.md - this is what makes Claude Code auto-orient
#    itself every session, the same mechanism Ryan's own Amit folder uses.
$claudeMdPath = Join-Path $projectRoot "CLAUDE.md"
if (Test-Path $claudeMdPath) {
    Write-Host "CLAUDE.md already exists here - leaving it untouched so nothing gets overwritten." -ForegroundColor Yellow
} else {
$claudeMdContent = @'
# Project Orientation - Read This First, Every Session

This file loads automatically at the start of every Claude Code session in this
folder. It is the PRIMARY file: it holds the rules that apply to everything
here. Each project in a subfolder has its own short CLAUDE.md for what is
specific to it.

## Who Amit Is

Amit is a Hebrew name meaning companion - one who walks alongside. When your
assistant is working inside this project it is Amit, walking alongside you
the way it walks alongside anyone building something real: it shows its work
rather than just claiming success, keeps its own directive package honestly
versioned, and treats you as a partner, not a support ticket.

## How This Folder Is Organized

- Each distinct project gets its OWN subfolder with its own short CLAUDE.md
  (see "New Project Directive" below) and its own Sessions files.
- This root CLAUDE.md holds the rules for everything. Reusable files live in
  Templates/. AmitCoder/ holds reference material about the tool that set
  this folder up.
- Where things live (follow this when creating or changing anything):
  - A project's CLAUDE.md: only purpose, current scope, its standing rules
    and procedures, and a pointer to the Sessions files.
  - A project's Sessions_Start.md, Sessions_ToDo.md, Sessions_Log.md: current
    state, to-dos, and history.
  - A project's Sessions_Design.md: its database tables (first section) and
    how it is built.
  - This root CLAUDE.md: rules that apply across everything. A rule used by
    only one project stays with that project; anything that would live in
    more than one place lives once, here.
- Do not make backups on your own. Backups are made only when the person asks,
  and go in a Backups folder here, under the project's name.

## New Project Directive

When the person starts a new project, create a subfolder for it and:
1. Copy Templates/Project_CLAUDE_Template.md into it as CLAUDE.md and fill it in
   (purpose and current scope; no status, to-dos or history in that file).
2. Create four Sessions files in it: Sessions_Start.md (how to read, directory,
   current state marked freshly created, files in play, open to-do count,
   "Last clean-up: none yet"), Sessions_ToDo.md, Sessions_Log.md (one dated
   entry noting the project was created and its purpose) and Sessions_Design.md
   (a Tables section first).
3. Add the project to the Current Projects list below.

## START A PROJECT BY ITS NAME

When a new session's first message is just a project name, or something like
"we're working on <name> today", and it matches a project subfolder (match by
meaning), start a session on that folder: read this root CLAUDE.md, that
folder's CLAUDE.md and its Sessions_Start.md (nothing else; the to-do list, log,
design file and original sessions are read only when asked), say in a sentence
or two what state the project is in and that you are ready, and title the
session with the project name by running `node rename_session.js "<project name>"`
from this folder (if the write is refused, remind the person once to type
`/rename <project name>`). If the name matches more than one folder, or none,
ask which one in one short question. A first message that is a real request is
handled as a request.

## SHORTCUTS

When a message starts with J or F followed by a phrase, or mentions shortcuts,
read Shortcuts_Activation.md (in this folder) first, then fetch and run the
shortcut it names. Also read it when a request looks like something an existing
shortcut may already do, or when the same request keeps coming back. Nothing
about shortcuts is fetched at session start.

## CLEAN UP

When the person says "clean up" (or "clean up the cleanup"), or right after the
conversation has been compacted, read Cleanup_Procedure.md (in this folder)
first and follow it for every project folder the session worked in. It updates
each folder's Sessions files and keeps its CLAUDE.md scope current. Nothing
about it is loaded otherwise.

## Pursuit Attribution - Permanent

This project's canonical name, for any pursuit created from within it, is: __APPNAME__

Any pursuit written to hub_entries from this project must be stamped
program='__APPNAME__' - automatically, using this exact spelling every time.
Never ask the person what program a pursuit belongs to. If you rename this
application later, use the J rename pursuit shortcut: it updates this section
AND every existing pursuit stamped with the old name.

## Directive Package Version - Permanent

Directive Package Version: __DIRECTIVE_VERSION__ (generated __GENDATE__)

This is YOUR project's own copy of Amit's shared directive package (Pursuit
Attribution, Shortcuts, Clean Up, Login-Based Profile, the file layout above):
a snapshot taken when this file was generated, not a live link to the master.

At the start of a session, query dev_playbook directly yourself:
```
GET https://hleqtjqojksurvkyqixt.supabase.co/rest/v1/dev_playbook?topic_key=eq.amit_coder_directive_package&select=method
Header: apikey: sb_publishable_0pptfPselXI0V9JmnhXgbA_dAGurCiF
```
The `method` field states the current master version ("Current version: X.Y").
Compare that to the version stamped above. If the master is newer, tell the
person plainly (name the version gap) and offer to help them pull the updated
text in by hand - never overwrite their CLAUDE.md automatically, since they may
have customized it since install.

## Login-Based Profile - Permanent

The same profile applies in every Amit avenue the person uses, because it lives
in Supabase, not in this project.

At the start of a session, if a user is actually signed in (their real Supabase
auth.uid(), never guessed or assumed), look up who they are:

1. Query user_growth_log for that user_id, ordered by created_at - their real,
   growing history. category=communication_style (how they want to be talked
   to), category=vocabulary (their own phrase mappings: use the mapped meaning,
   don't guess), category=spiritual_compass, category=key_moment.
2. Also check user_memory for that user_id - a faster current-state summary.
   The growth log is the source of truth for anything specific or historical.
3. If neither has a row for this person yet, do not fabricate a profile. Build
   it honestly over real sessions.
4. If no one is signed in, operate without a profile.

Write-back: whenever you learn how a signed-in person likes to be communicated
with, the words and phrases they use and what they mean, or a misunderstanding
and how it was cleared up, write it to user_growth_log under their own user_id
right then (communication_style, vocabulary, key_moment) and refresh
user_memory. Never write under anyone else's user_id.

## How to Help This Person - Posture, Not Just Mechanics

Whoever is assisting from here forward should assume the person building this
may be new to a lot of what's involved - git, GitHub, databases, deployment.
The job is to handle that complexity for them using their own credentials and
accounts, not to hand them a checklist. Walk them through it patiently and
explain what is happening as it happens. This applies especially to the
connection family (J instruction, J authorization, J connect, J setup, J push).

## Current Projects

(Nothing yet - this updates as you build.)

## Session Backups

Claude Code stores your session history at %USERPROFILE%\.claude\projects\.
The starter kit that created this file also set up a backup so those session
files are copied somewhere you control. See the "Backup" note for where.

---
*Set up by the Amit Coder Starter Kit.*
'@
    $claudeMdContent = $claudeMdContent.Replace('__APPNAME__', $appName)
    $claudeMdContent = $claudeMdContent.Replace('__DIRECTIVE_VERSION__', $DIRECTIVE_VERSION)
    $claudeMdContent = $claudeMdContent.Replace('__GENDATE__', (Get-Date -Format 'yyyy-MM-dd'))
    Set-Content -Path $claudeMdPath -Value $claudeMdContent -Encoding utf8
    Write-Host "Wrote starter CLAUDE.md" -ForegroundColor Green
}

# 3b. Files the root CLAUDE.md points to (added 2026-11-14, directive package 2.0):
#     shortcuts, clean-up, session titling, and the new-project template. Each is
#     written only if it does not already exist, so nothing is overwritten.
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$shortcutsActivationContent = @'
# Shortcuts Activation

Read this file ONLY when a message starts with the trigger letter J or F followed by a phrase (for example "J new"), when the person mentions shortcuts ("update shortcuts", "recheck shortcuts"), or when a request looks like something a shortcut may already do or the same request keeps recurring (see "Shortcut awareness" below). The root CLAUDE.md has the one-line rule that points here. Nothing is fetched at the start of a session: shortcuts are loaded only when they are used, to keep every session's starting cost small.

## How to run a shortcut

Query Supabase directly yourself, right then, with your own tool access (Bash/PowerShell). This is a live request, not a file some script pre-writes.

For J shortcuts (global, shared by everyone, no login needed):
```
GET https://hleqtjqojksurvkyqixt.supabase.co/rest/v1/amit_shortcuts?activation_key=eq.J&is_active=eq.true
Header: apikey: sb_publishable_0pptfPselXI0V9JmnhXgbA_dAGurCiF
```
There are about 50 J shortcuts and their instructions are long. Fetch only the entry you need: add `&trigger_phrase=eq.<the phrase>` (or `ilike`), plus any entries a master shortcut points to. Fetch the whole list only when the person asks to see or recheck the shortcuts.

For the person's own F shortcuts you additionally need their AmitCoder Account ID (from `amit_coder_config.json` at the project root, if set):
```
GET https://hleqtjqojksurvkyqixt.supabase.co/rest/v1/amit_shortcuts?activation_key=eq.F&user_id=eq.[their account id]&is_active=eq.true
```

Then match the message (trigger word, then a phrase) against what you fetched:
- Plain instruction: treat `instruction_text` as the actual request and act on it directly.
- Master with subtasks: run each subtask in order. If a subtask has a `referenced_shortcut_id`, fetch that other entry and run its `instruction_text` instead.

If nothing matches, say so and offer the closest names. Never guess at an unrecognized trigger without having actually checked.

## Shortcut awareness

1. **Proactive reminder.** Fetch the shortcut NAMES only (small; not the instructions):
```
GET https://hleqtjqojksurvkyqixt.supabase.co/rest/v1/amit_shortcuts?activation_key=eq.J&is_active=eq.true&select=trigger_phrase
Header: apikey: sb_publishable_0pptfPselXI0V9JmnhXgbA_dAGurCiF
```
(and the person's own F names the same way, with `activation_key=eq.F&user_id=eq.[their account id]`). If the request matches a shortcut already, say so before doing the work by hand.

2. **Repetition detection across the last three sessions.** Look at the newest entries of the project's `Sessions_Log.md` (and `Sessions_Start.md`). When the same or a similar instruction recurs, name the pattern plainly with the real count and suggest creating a shortcut for it. Always propose it as an F (custom) shortcut, never J. Suggest, never create unprompted: the person decides.
'@
$shortcutsActivationContentPath = Join-Path $projectRoot "Shortcuts_Activation.md"
if (-not (Test-Path $shortcutsActivationContentPath)) { [System.IO.File]::WriteAllText($shortcutsActivationContentPath, $shortcutsActivationContent, $utf8NoBom); Write-Host "Wrote Shortcuts_Activation.md" -ForegroundColor Green } else { Write-Host "Shortcuts_Activation.md already exists - left untouched" -ForegroundColor Yellow }

$cleanupProcedureContent = @'
# Cleanup procedure ("clean up")

Read this file ONLY when the person says "clean up" (or "clean up the cleanup"), or right after the conversation has been compacted. The root CLAUDE.md has the one-line rule that points here. Nothing here is pushed to GitHub unless the person says "push".

## What it is for
A project's CLAUDE.md says what the project is. Everything that changes (state, to-dos, history, tables, design) lives in that project's Sessions files. "Clean up" keeps those files true, so that when the person opens a new session and says a project name, the session reads the root CLAUDE.md, that project's CLAUDE.md and its `Sessions_Start.md`, and is ready to work. Claude's own copies of sessions expire after about 30 days; the project log is the permanent record.

## Stage 1 - Trigger and folders
- Triggers: the person says "clean up", OR the conversation has just been compacted (the session file still holds every message, so nothing is lost).
- Folders: every project subfolder the session worked in. Find them by script: `node cleanup_extract.js <this session's .jsonl> --files` lists the files written or edited; the first folder name under this project root is the project. Skip any folder whose Sessions_Start.md says ARCHIVED. A folder with no Sessions_Start.md: say so and offer to create the Sessions files. Tell the person the list before starting.

## Stage 2 - The session and its name
- The session file is the newest `.jsonl` in `%USERPROFILE%\.claude\projects\<this folder's encoded name>\`. Record its ID (file name), its location and the date.
- Title the session with the project name: `node rename_session.js "<project name>"` from the root folder. If the write is refused, remind the person once to type `/rename <project name>`.

## Stage 3 - The log (new items only, word for word)
- Read `Last clean-up:` in `F\Sessions_Start.md` (a timestamp). Run `node cleanup_extract.js <session.jsonl> <that timestamp>`.
- Insert at the TOP of the log part of `F\Sessions_Log.md` (newest first) a heading `## <date> - session <ID> (<path>)` and the extract: the person's messages and Amit's replies, word for word. No tool calls, tool output or system text. If the session covered several projects, keep only what concerns F.
- Replace any key, password, token, personal detail or financial detail with `(private detail omitted)`: these files may be pushed publicly.

## Stage 4 - The start file (update from the old version)
- FIRST read the old `F\Sessions_Start.md`: it records where things stood when the last clean-up ended. Update it forward to where the session ended; do not rewrite from scratch and do not drop what is still true.
- Keep it short: current state, live versus local, blocked, newest decision, files in play with their REAL current version numbers (read them from the files), the open to-do count, and `Last clean-up: <UTC timestamp of the last message just logged>, session <ID>`.

## Stage 5 - To-dos
- In `F\Sessions_ToDo.md`: add new to-dos from the session; move finished ones to Resolved with the date; delete nothing unfinished; one entry per real to-do.
- Mirroring to-dos as Hub pursuits is not part of this installed copy yet.

## Stage 6 - Design and scope
- If tables or how something is built changed, update `F\Sessions_Design.md` (Tables first).
- If the work grew the project beyond its CLAUDE.md "CURRENT SCOPE", update that paragraph and tell the person exactly what changed. CLAUDE.md never receives status, to-dos, history, tables or design.

## Stage 7 - Repetition check
If the same kind of request came up in each of the last three clean-ups, say so with the real count and suggest an F shortcut. Suggest only; never create one.

## Stage 8 - Verify the folder is ready for the next session
Review F's `CLAUDE.md` and Sessions files together: CLAUDE.md holds only purpose, scope, standing rules and pointers; Sessions_Start.md is consistent with the to-do file (count), the log (its marker matches the newest heading) and the real files (versions); every pointer and file name exists; no duplicate to-dos; no private details; no empty or truncated file. A new session told the project name must be able to work from the root CLAUDE.md, F's CLAUDE.md and F's Sessions_Start.md alone. Fix plain errors; list anything uncertain. Then report in plain words: folders cleaned, messages logged per folder, what changed, what was verified, anything unsure.

## "Clean up the cleanup"
When the person asks, or when a Sessions_Log.md passes about 150 KB: entries older than about 30 days are folded into short dated summaries at the END of that `Sessions_Log.md` under `## Older entries (summarized)` (decisions, version numbers and still-open items kept; the word-for-word text dropped). Never remove an open to-do or a decision.

## Safety
Do not make backups unless the person asks (then in a Backups folder, under the project name). Edit with Node or the Edit tool and check the file size afterward. Never push.
'@
$cleanupProcedureContentPath = Join-Path $projectRoot "Cleanup_Procedure.md"
if (-not (Test-Path $cleanupProcedureContentPath)) { [System.IO.File]::WriteAllText($cleanupProcedureContentPath, $cleanupProcedureContent, $utf8NoBom); Write-Host "Wrote Cleanup_Procedure.md" -ForegroundColor Green } else { Write-Host "Cleanup_Procedure.md already exists - left untouched" -ForegroundColor Yellow }

$cleanupExtractContent = @'
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
'@
$cleanupExtractContentPath = Join-Path $projectRoot "cleanup_extract.js"
if (-not (Test-Path $cleanupExtractContentPath)) { [System.IO.File]::WriteAllText($cleanupExtractContentPath, $cleanupExtractContent, $utf8NoBom); Write-Host "Wrote cleanup_extract.js" -ForegroundColor Green } else { Write-Host "cleanup_extract.js already exists - left untouched" -ForegroundColor Yellow }

$renameSessionContent = @'
// rename_session.js - titles the CURRENT Claude session with a project name (what /rename does).
// Usage: node rename_session.js "<project name>" [--dry]
// Run it from this project's root folder. It finds the newest session file (.jsonl) in this folder's Claude project
// folder, checks the file ends with a newline, and appends ONE line: {"type":"custom-title","customTitle":"<name>","sessionId":"<id>"}.
// It never changes any other line, and skips the write if that exact title is already the last title.
const fs = require('fs'), path = require('path'), os = require('os');
const name = (process.argv[2] || '').trim();
const dry = process.argv.includes('--dry');
if (!name || name.startsWith('--')) { console.error('usage: node rename_session.js "<project name>" [--dry]'); process.exit(1); }
const encoded = __dirname.replace(/[^A-Za-z0-9]/g, '-');
const dir = path.join(os.homedir(), '.claude', 'projects', encoded);
if (!fs.existsSync(dir)) { console.error('no Claude project folder found at ' + dir + ' (type /rename ' + name + ' instead)'); process.exit(2); }
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
'@
$renameSessionContentPath = Join-Path $projectRoot "rename_session.js"
if (-not (Test-Path $renameSessionContentPath)) { [System.IO.File]::WriteAllText($renameSessionContentPath, $renameSessionContent, $utf8NoBom); Write-Host "Wrote rename_session.js" -ForegroundColor Green } else { Write-Host "rename_session.js already exists - left untouched" -ForegroundColor Yellow }

$projectTemplateContent = @'
<!-- TEMPLATE. Copy this file into a new project's subfolder as CLAUDE.md, fill in every [bracket], then delete this comment.
     A project CLAUDE.md holds ONLY: purpose, current scope, the standing rules for that folder, the session record pointer, and connections.
     It never holds: status, to-dos, history, version lists, database tables, design write-ups. Those live in the project's Sessions files. -->
# [PROJECT NAME] - Project Context

## Folder Confirmation
If you are reading this file, you are in the project's own subfolder. All [PROJECT NAME] files belong here. Work is started from the root folder by saying the project's name.

## What This Project Is
[2 to 4 sentences: what it is and who it is for.]

## CURRENT SCOPE
[3 to 8 lines: what the project does NOW. The clean-up keeps this true as the project grows; update it, never add status here.]

## SESSION RECORD
Current state, to-dos and history live in this folder's Sessions files, not here. A new session reads Sessions_Start.md first (short). Read Sessions_ToDo.md only when asked about to-dos; read Sessions_Log.md or the original Claude session only when asked; Sessions_Design.md (tables first, then how it is built) only when working with the database or on that part of the build.

## Rules and procedures for this folder
[Standing rules a session must follow here, each a short bullet. Delete this section if there are none yet.]

## Connections
[How this project connects to other projects. One line each.]
'@
$projectTemplateContentPath = Join-Path (Join-Path $projectRoot "Templates") "Project_CLAUDE_Template.md"
if (-not (Test-Path $projectTemplateContentPath)) { [System.IO.File]::WriteAllText($projectTemplateContentPath, $projectTemplateContent, $utf8NoBom); Write-Host "Wrote Templates/Project_CLAUDE_Template.md" -ForegroundColor Green } else { Write-Host "Templates/Project_CLAUDE_Template.md already exists - left untouched" -ForegroundColor Yellow }

# 4. Backup connection - mirrors Ryan's own setup: a real backup folder inside
#    the project root, with a junction pointing back to Claude Code's session
#    storage, so JSONL files sync there automatically without extra steps.
$backupPath = Join-Path $projectRoot "SessionBackups"
if (-not (Test-Path $backupPath)) {
    New-Item -ItemType Directory -Path $backupPath -Force | Out-Null
}

$claudeProjectsPath = "$env:USERPROFILE\.claude\projects"
if (Test-Path $claudeProjectsPath) {
    $junctionTarget = Join-Path $backupPath "claude_sessions"
    if (-not (Test-Path $junctionTarget)) {
        try {
            cmd /c mklink /J "$junctionTarget" "$claudeProjectsPath" | Out-Null
            Write-Host "Linked session backup: $junctionTarget -> $claudeProjectsPath" -ForegroundColor Green
        } catch {
            Write-Host "Could not create the backup junction automatically. You can still find your sessions directly at: $claudeProjectsPath" -ForegroundColor Yellow
        }
    } else {
        Write-Host "Session backup link already exists." -ForegroundColor Cyan
    }
} else {
    Write-Host "No Claude Code session folder found yet at $claudeProjectsPath - this is normal if you haven't run Claude Code here yet. Run this script again after your first session if you want the backup link created." -ForegroundColor Yellow
}

# 5. Migrations folder - a real, versioned home for your database changes,
#    the same pattern Ryan's own Amit project uses informally (numbered SQL
#    files). Formalizing it here means your database history lives in git
#    alongside your code, not scattered across chat history.
$migrationsPath = Join-Path $projectRoot "migrations"
if (-not (Test-Path $migrationsPath)) {
    New-Item -ItemType Directory -Path $migrationsPath -Force | Out-Null
    $migrationsReadme = @'
# Migrations

Each database change gets its own numbered file here: `0001_description.sql`,
`0002_description.sql`, and so on. Never edit an old migration file after it's
been run - write a new one instead. This keeps your database's real history
versioned in git, the same as your code.
'@
    Set-Content -Path (Join-Path $migrationsPath "README.md") -Value $migrationsReadme -Encoding utf8
    $exampleMigration = @'
-- 0001_example.sql
-- Migrations are numbered in the order they should run. Delete this file
-- once you've written your first real one.
'@
    Set-Content -Path (Join-Path $migrationsPath "0001_example.sql") -Value $exampleMigration -Encoding utf8
    Write-Host "Created migrations/ folder" -ForegroundColor Green
}

# 6. A basic CI check - GitHub Actions, so every push gets a free automatic
#    sanity check before it goes live. Only activates once this folder is a
#    real git repo pushed to GitHub.
$workflowsPath = Join-Path $projectRoot ".github\workflows"
if (-not (Test-Path $workflowsPath)) {
    New-Item -ItemType Directory -Path $workflowsPath -Force | Out-Null
    $workflowContent = @'
name: Basic Check
on: [push]
jobs:
  html-sanity-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Confirm HTML files are well-formed
        run: |
          shopt -s globstar
          for f in **/*.html; do
            if [ -f "$f" ]; then
              echo "Checking $f"
              python3 -c "
import sys
from html.parser import HTMLParser
class Check(HTMLParser):
    def error(self, message): print(f'::warning file=$f::{message}')
Check().feed(open('$f', encoding='utf-8', errors='ignore').read())
"
            fi
          done
'@
    Set-Content -Path (Join-Path $workflowsPath "basic-check.yml") -Value $workflowContent -Encoding utf8
    Write-Host "Created .github/workflows/basic-check.yml (activates once pushed to GitHub)" -ForegroundColor Green
}

# 7. Local dev server - no external installs needed (uses .NET's built-in
#    HttpListener via PowerShell), serves this folder at localhost so files
#    behave like they will once actually deployed, instead of raw file:// paths.
$serverScript = @'
# Start_Local_Server.ps1 - serves this folder at http://localhost:8080
# No installs needed (Python/Node not required) - uses .NET HttpListener directly.
param([int]$Port = 8080)
$root = $PSScriptRoot
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Serving $root at http://localhost:$Port  (Ctrl+C to stop)" -ForegroundColor Green
try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $path = $context.Request.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrWhiteSpace($path)) { $path = "index.html" }
        $filePath = Join-Path $root $path
        if (Test-Path $filePath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $ext = [System.IO.Path]::GetExtension($filePath)
            $contentType = switch ($ext) {
                ".html" {"text/html"}; ".css" {"text/css"}; ".js" {"application/javascript"}
                ".json" {"application/json"}; ".png" {"image/png"}; ".jpg" {"image/jpeg"}
                default {"application/octet-stream"}
            }
            $context.Response.ContentType = $contentType
            $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $context.Response.StatusCode = 404
        }
        $context.Response.Close()
    }
} finally {
    $listener.Stop()
}
'@
$serverScriptPath = Join-Path $projectRoot "Start_Local_Server.ps1"
if (-not (Test-Path $serverScriptPath)) {
    Set-Content -Path $serverScriptPath -Value $serverScript -Encoding utf8
    Write-Host "Created Start_Local_Server.ps1 - run it any time to preview your site at http://localhost:8080" -ForegroundColor Green
}

# 8. Branch helper - a real, if small, nudge toward not committing risky
#    changes straight to main. Not a workflow enforcement, just a fast on-ramp.
$branchScript = @'
# New_Feature_Branch.ps1 - creates and switches to a new git branch
param([Parameter(Mandatory=$true)][string]$Name)
git checkout -b "feature/$Name"
Write-Host "Now on branch feature/$Name. Merge back to main when it's tested and ready." -ForegroundColor Green
'@
$branchScriptPath = Join-Path $projectRoot "New_Feature_Branch.ps1"
if (-not (Test-Path $branchScriptPath)) {
    Set-Content -Path $branchScriptPath -Value $branchScript -Encoding utf8
    Write-Host "Created New_Feature_Branch.ps1 - usage: .\New_Feature_Branch.ps1 -Name `"my-change`"" -ForegroundColor Green
}

# 9. Session-linking hooks - connects this LOCAL Claude Code install back to
#    your AmitCoder web account through Supabase, with no server and no cost
#    beyond what AmitCoder already uses. Needs your Account ID, shown in
#    AmitCoder's Settings tab once you're signed in there.
$hooksPath = Join-Path $projectRoot "hooks"
if (-not (Test-Path $hooksPath)) {
    New-Item -ItemType Directory -Path $hooksPath -Force | Out-Null
}

$configPath = Join-Path $projectRoot "amit_coder_config.json"
if (-not (Test-Path $configPath)) {
    Write-Host ""
    $accountId = Read-Host "Paste your AmitCoder Account ID (from the Settings tab at ask-amit.github.io/Amit/AmitCoder/AmitCoder.html), or press Enter to skip for now"
    $configContent = @{ account_id = $accountId; app_name = $appName } | ConvertTo-Json
    Set-Content -Path $configPath -Value $configContent -Encoding utf8
    if ($accountId) {
        Write-Host "Saved your Account ID - the hooks below can now find your shortcuts and post session summaries." -ForegroundColor Green
    } else {
        Write-Host "Skipped - you can add your Account ID to amit_coder_config.json later to enable the hooks below." -ForegroundColor Yellow
    }
}

$sessionStartScript = @'
# Amit_Coder_SessionStart.ps1 - OPTIONAL, not required for shortcuts to work.
# Corrected 2026-07-29: shortcuts and the directive-version check are no
# longer read from a cache file this script writes - the root CLAUDE.md now
# instructs Claude Code to query Supabase directly, live, itself, at the
# start of every session (see "Shortcut Activation" and "Directive Package
# Version" in that file). That removed the need for this script to run
# automatically at all, and with it the earlier open question of whether
# Claude Code's own hook-firing would ever reliably trigger it.
# This script still works standalone as a manual diagnostic / local record
# if you want one - run it yourself any time: `.\hooks\Amit_Coder_SessionStart.ps1`
$configPath = Join-Path (Split-Path $PSScriptRoot -Parent) "amit_coder_config.json"
if (-not (Test-Path $configPath)) { Write-Host "No amit_coder_config.json found - run the starter kit first."; exit }
$config = Get-Content $configPath | ConvertFrom-Json
if ([string]::IsNullOrWhiteSpace($config.account_id)) { Write-Host "No Account ID saved yet - add one to amit_coder_config.json."; exit }

$SB_URL = "https://hleqtjqojksurvkyqixt.supabase.co"
$SB_KEY = "sb_publishable_0pptfPselXI0V9JmnhXgbA_dAGurCiF"
$headers = @{ "apikey" = $SB_KEY; "Authorization" = "Bearer $SB_KEY" }
$uri = "$SB_URL/rest/v1/amit_shortcuts?or=(user_id.is.null,user_id.eq.$($config.account_id))&is_active=eq.true"
try {
    $shortcuts = Invoke-RestMethod -Uri $uri -Headers $headers -Method Get
    $cachePath = Join-Path (Split-Path $PSScriptRoot -Parent) "amit_shortcuts_cache.json"
    $shortcuts | ConvertTo-Json -Depth 5 | Set-Content -Path $cachePath -Encoding utf8
    Write-Host "Pulled $($shortcuts.Count) active shortcut(s) into amit_shortcuts_cache.json" -ForegroundColor Green
} catch {
    Write-Host "Could not reach Supabase: $_" -ForegroundColor Yellow
}

# Directive package version check - compares this project's own installed
# stamp (in its CLAUDE.md, written by the Starter Kit) against the current
# master version recorded in dev_playbook. Snapshot vs live comparison only -
# never overwrites the local CLAUDE.md, just reports whether it is behind.
try {
    $claudeMdPath = Join-Path (Split-Path $PSScriptRoot -Parent) "CLAUDE.md"
    $statusPath = Join-Path (Split-Path $PSScriptRoot -Parent) "amit_directive_status.json"
    $localVersion = $null
    if (Test-Path $claudeMdPath) {
        $m = Select-String -Path $claudeMdPath -Pattern "Directive Package Version:\s*([0-9.]+)" | Select-Object -First 1
        if ($m) { $localVersion = $m.Matches[0].Groups[1].Value }
    }
    $playbookUri = "$SB_URL/rest/v1/dev_playbook?topic_key=eq.amit_coder_directive_package&select=method"
    $playbook = Invoke-RestMethod -Uri $playbookUri -Headers $headers -Method Get
    $masterVersion = $null
    if ($playbook -and $playbook.Count -gt 0) {
        $pm = [regex]::Match($playbook[0].method, "Current version:\s*([0-9.]+)")
        if ($pm.Success) { $masterVersion = $pm.Groups[1].Value }
    }
    $status = [PSCustomObject]@{
        local_version = $localVersion
        master_version = $masterVersion
        up_to_date = ($localVersion -and $masterVersion -and $localVersion -eq $masterVersion)
        checked_at = (Get-Date -Format "s")
    }
    $status | ConvertTo-Json | Set-Content -Path $statusPath -Encoding utf8
    if ($localVersion -and $masterVersion -and $localVersion -ne $masterVersion) {
        Write-Host "Amit's shared directive package has an update: yours is v$localVersion, current is v$masterVersion. Ask Claude Code about it next session." -ForegroundColor Yellow
    }
} catch {
    Write-Host "Could not check directive package version: $_" -ForegroundColor Yellow
}
'@
Set-Content -Path (Join-Path $hooksPath "Amit_Coder_SessionStart.ps1") -Value $sessionStartScript -Encoding utf8

$sessionEndScript = @'
# Amit_Coder_SessionEnd.ps1 - posts a one-line session summary back to your
# AmitCoder History tab. Run manually for now:
# `.\hooks\Amit_Coder_SessionEnd.ps1 -Summary "what you built today"`
# (Same caveat as SessionStart - automatic firing on Claude Code session end
# needs a verified hook entry in .claude\settings.json; not yet confirmed.)
param([Parameter(Mandatory=$true)][string]$Summary)
$configPath = Join-Path (Split-Path $PSScriptRoot -Parent) "amit_coder_config.json"
if (-not (Test-Path $configPath)) { Write-Host "No amit_coder_config.json found - run the starter kit first."; exit }
$config = Get-Content $configPath | ConvertFrom-Json
if ([string]::IsNullOrWhiteSpace($config.account_id)) { Write-Host "No Account ID saved yet - add one to amit_coder_config.json."; exit }

$SB_URL = "https://hleqtjqojksurvkyqixt.supabase.co"
$SB_KEY = "sb_publishable_0pptfPselXI0V9JmnhXgbA_dAGurCiF"
$headers = @{ "apikey" = $SB_KEY; "Authorization" = "Bearer $SB_KEY"; "Content-Type" = "application/json" }
$body = @{ user_id = $config.account_id; summary = $Summary } | ConvertTo-Json
try {
    Invoke-RestMethod -Uri "$SB_URL/rest/v1/amit_coder_sessions" -Headers $headers -Method Post -Body $body | Out-Null
    Write-Host "Session summary saved to your AmitCoder History tab." -ForegroundColor Green
} catch {
    Write-Host "Could not reach Supabase: $_" -ForegroundColor Yellow
}
'@
Set-Content -Path (Join-Path $hooksPath "Amit_Coder_SessionEnd.ps1") -Value $sessionEndScript -Encoding utf8
Write-Host "Created hooks/Amit_Coder_SessionStart.ps1 and hooks/Amit_Coder_SessionEnd.ps1" -ForegroundColor Green

# 10. .vscode/ config - workspace settings + recommended extensions, committed
# to the project so anyone opening it gets the same editor behavior
# automatically (format-on-save, same lint rules) without configuring it
# by hand. Researched 2026-07-29 against current VS Code best-practice
# guidance - see AmitCoder/CLAUDE.md for sources.
$vscodePath = Join-Path $projectRoot ".vscode"
if (-not (Test-Path $vscodePath)) {
    New-Item -ItemType Directory -Path $vscodePath -Force | Out-Null
    $settingsJson = @'
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "files.autoSave": "onFocusChange",
  "editor.rulers": [100]
}
'@
    Set-Content -Path (Join-Path $vscodePath "settings.json") -Value $settingsJson -Encoding utf8
    $extensionsJson = @'
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "eamodio.gitlens",
    "usernamehw.errorlens",
    "rangav.vscode-thunder-client",
    "ms-vsliveshare.vsliveshare"
  ]
}
'@
    Set-Content -Path (Join-Path $vscodePath "extensions.json") -Value $extensionsJson -Encoding utf8
    Write-Host "Created .vscode/settings.json and .vscode/extensions.json (VS Code will prompt to install the recommended extensions on first open)" -ForegroundColor Green
}

# 11. Dev Container template - Microsoft's own built-in answer to "give
# someone my exact setup," arguably stronger than scripts alone since VS
# Code natively offers to reopen the folder inside it. Kept minimal since
# most Amit projects are static HTML/JS with no real build step - this is
# a starting point to extend, not a full Node/Python toolchain.
$devcontainerPath = Join-Path $projectRoot ".devcontainer"
if (-not (Test-Path $devcontainerPath)) {
    New-Item -ItemType Directory -Path $devcontainerPath -Force | Out-Null
    $devcontainerJson = @'
{
  "name": "Amit Coder Project",
  "image": "mcr.microsoft.com/devcontainers/base:ubuntu",
  "features": {
    "ghcr.io/devcontainers/features/node:1": {}
  },
  "customizations": {
    "vscode": {
      "extensions": [
        "esbenp.prettier-vscode",
        "dbaeumer.vscode-eslint",
        "eamodio.gitlens"
      ]
    }
  }
}
'@
    Set-Content -Path (Join-Path $devcontainerPath "devcontainer.json") -Value $devcontainerJson -Encoding utf8
    Write-Host "Created .devcontainer/devcontainer.json (VS Code will offer to reopen the project in this container)" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Yellow
Write-Host "Your project folder is ready at: $projectRoot"
Write-Host "Next: open this folder in VS Code, open the Claude Code extension, and say `"good morning`"."
Write-Host "Also created: Shortcuts_Activation.md, Cleanup_Procedure.md, cleanup_extract.js, rename_session.js and Templates/Project_CLAUDE_Template.md at the project root, migrations/, .github/workflows/basic-check.yml, Start_Local_Server.ps1, New_Feature_Branch.ps1, hooks/ (session-linking scripts), .vscode/ (settings + recommended extensions incl. Live Share), and .devcontainer/ (reproducible setup)."
Write-Host ""
