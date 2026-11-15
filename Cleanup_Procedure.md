# Cleanup procedure ("clean up")

Read this file ONLY when the person says "clean up" (or "clean up the cleanup"), or right after the conversation has been compacted. The root CLAUDE.md has the one-line rule that points here. Decided with Ryan, 2026-11-14, stage by stage. Nothing here is pushed to GitHub unless Ryan says "push".

## What it is for
A project's CLAUDE.md says what the project is. Everything that changes (state, to-dos, history, tables, design) lives in that project's Sessions files. "Clean up" keeps those files true, so that when Ryan opens a new session in VS Code and says a project name, the session reads the root CLAUDE.md, that project's CLAUDE.md and its `Sessions_Start.md`, and is ready to work. Claude's own copies of sessions expire after about 30 days; the project log is the permanent record.

## Stage 1 - Trigger and folders
- Triggers: Ryan says "clean up", OR the conversation has just been compacted (treat compaction as the trigger: the session file still holds every message, so nothing is lost). Closing phrases ("good night", "save and update") do NOT trigger it; they run only the prayer part of the closing sequence.
- Folders: every project folder the session worked in. Find them by script: `node cleanup_extract.js <this session's .jsonl> --files` lists the files written or edited; the first folder name under the Amit root (either slash direction) is the project. Skip any folder whose Sessions_Start.md says ARCHIVED, and skip ShoshoneHondaYamaha and BOSS_Inc. A folder with no Sessions_Start.md: say so and offer to create the five files; do not create them silently. Tell Ryan the list before starting.

## Stage 2 - The session and its name
- The session file is the newest `.jsonl` in `C:\Users\user1\.claude\projects\<the project name for this folder>\`. Record its ID (file name), its location and the date.
- The session's title in VS Code should be the PROJECT NAME (the folder being worked in). A title is a line `{"type":"custom-title","customTitle":"<project name>","sessionId":"<ID>"}` in that session file (what `/rename <project name>` writes). Run `node rename_session.js "<project name>"` from the root folder (it appends the title line to the newest session file and skips if already titled). Ryan authorized this on 2026-11-14 and the title showed in VS Code. If the write is ever refused, remind Ryan to type `/rename <project name>`.

## Stage 3 - The log (new items only, word for word)
- Read `Last clean-up:` in `F\Sessions_Start.md` (a timestamp). Run `node cleanup_extract.js <session.jsonl> <that timestamp>`.
- Insert at the TOP of the log part of `F\Sessions_Log.md` (newest first) a heading `## <date> - session <ID> (<path>)` and the extract: Ryan's messages and Amit's replies, word for word. No tool calls, tool output or system text. If the session covered several projects, keep only what concerns F (when unsure, keep the whole exchange with the project it mostly concerns).
- Replace any key, password, token, personal/family detail or client financial detail with `(private detail omitted)`: these files may be pushed publicly.
- A busy day is long (one session was about 323,000 characters). That is accepted: the log is read only when asked.

## Stage 4 - The start file (update from the old version)
- FIRST read the old `F\Sessions_Start.md`: it records where things stood when the last clean-up ended. Update it forward from there to where the session ended: do not rewrite it from scratch and do not drop what is still true.
- Keep it short (aim under 3,000 tokens): current state, live versus local, blocked, newest decision, files in play with their REAL current version numbers (read them from the files, never guess), the open to-do count, and `Last clean-up: <UTC timestamp of the last message just logged>, session <ID>`.
- LIVE versus LOCAL is checked, never copied from the old text: compare the folder's published file with the repo copy (`git log -- <folder>` and a hash or version check). An old "not pushed" or "live is vX" line is a claim to test, not a fact to keep. Count the open to-dos by counting the file, never by trusting the old number.
- REFRESH THE DESCRIPTIVE LINES. Every file's own header and the Start file's "HOW TO READ" and "DIRECTORY" lines describe the files (where they came from, how big, what they hold). Re-read each one after your edits and make it true now ("copied from the old Sessions.md", "it is small", "built from the old notes" go stale the moment the file changes). Remove "(looks out of date)" notes you have now resolved.

## Stage 5 - To-dos and pursuits
- In `F\Sessions_ToDo.md`: add new to-dos from the session; move finished ones to Resolved with the date; delete nothing unfinished; one entry per real to-do.
- Hub pursuits (Ryan, 2026-11-14): THE CLEAN-UP CREATES PURSUITS. Every new to-do that comes out of the session is added to `Sessions_ToDo.md` AND created as a Hub pursuit (program = the folder's project name, title in the pursuit naming style), with its id written on the line as `[hub:<id>]`. Every to-do finished in the session moves to Resolved with the date AND its linked pursuit is marked complete (done=true, kind='memory', completed_date, completed_at). A linked pursuit that Ryan completed or changed in the Hub is brought back into the to-do file. This runs in every folder the clean-up runs in. Run the DUPLICATE PURSUIT CHECK first, use the service key as the root CLAUDE.md shows, and say what you are about to write before writing.
- The OLD backlog is different: to-dos that were already in the file before (no `[hub:...]` tag on the line) are NOT mirrored by the clean-up, so hundreds of old items do not become stale pursuits. They become pursuits only when Ryan says "initialize pursuits" in that folder (next section). `Sessions_Start.md` records it: `Backlog pursuits: not initialized` or `Backlog pursuits: initialized <date>`.

## Initialize pursuits (Ryan, 2026-11-14)
Trigger: Ryan says "initialize pursuits" while working in a project folder (or names the folder). Purpose: bring that folder's existing backlog (the old to-dos with no [hub:] tag) into the Hub so he can work them off and anyone can see the project is up to date, without mirroring hundreds of old to-dos for every folder at once.
1. Work only on the one folder named. Read its `Sessions_ToDo.md` (the open items, not Resolved). Tell Ryan how many items and ask nothing else unless there are more than about 60 (then say so and ask whether to do a first batch).
2. For each open item create one Hub pursuit (kind='pursuit', program = the folder's project name, a title in the pursuit naming style such as "FIX - ...", a short note of what it is, no private details), after the DUPLICATE PURSUIT CHECK. Write the new id on the line as `[hub:<id>]`.
3. Due dates: use a date only where the item already has one or Ryan gives one. Otherwise leave it without a due date, so it cannot go overdue and become stale. Star the ones Ryan names as the focus.
4. Write `Backlog pursuits: initialized <date>` in the folder's `Sessions_Start.md`, and report: items mirrored, any skipped as duplicates, and the pursuit count now open for that folder.
5. Items from then on are kept in step by every clean-up (Stage 5), as for all folders.

## Stage 6 - Design and scope
- If tables or how something is built changed, update `F\Sessions_Design.md` (Tables section first).
- EVERY clean-up, changed or not, scan `F\CLAUDE.md` for text that is really design, status, to-dos, history or tables: how the thing is built, build and test commands, file lists with versions, "Resume here", "not built / pushed" lines, table definitions. Move it to the right Sessions file (design and build text to `Sessions_Design.md`, below the Tables section; status to Start; open items to ToDo) and leave a one-line pointer in CLAUDE.md. A project's CLAUDE.md that still holds its own build recipe has not been cleaned, even if nothing changed this session.
- Any pointer you leave or find ("see X", "described in X") must be TRUE: open X and confirm it contains what the pointer promises. A pointer to a file that exists but lacks the content is an error to fix now.
- If the work grew the project beyond its CLAUDE.md "CURRENT SCOPE" (for example the Helper began as dictation and grew into the Aurora), update that paragraph (and the purpose sentence if it understates the project) and tell Ryan exactly what changed. Remove from CLAUDE.md anything no longer true. CLAUDE.md never receives status, to-dos, history, tables or design.

## Stage 7 - Repetition check
If the same kind of request came up in each of the last three clean-ups (read the newest log headings), say so with the real count and suggest an F shortcut. Suggest only; never create one. (See `Shortcuts_Activation.md`.)

## Stage 8 - Verify the folder is ready for the next session
Before reporting, review F's `CLAUDE.md` and Sessions files together and check them:
- `CLAUDE.md` holds only purpose, current scope, location check, standing rules, the session record paragraph, and pointers; it has no status, to-dos, history, tables or design.
- `Sessions_Start.md`: consistent with the to-do file (count matches), with the log (its marker matches the newest heading), and with the real files (versions); no stale "unsure" claims left; every pointer and file name in CLAUDE.md and the Sessions files exists.
- No duplicate to-dos, no broken `[hub:...]` links, no private details, no empty or truncated file, sizes sane.
- A new session that is told the project name must be able to work from: root CLAUDE.md, F\CLAUDE.md, then F\Sessions_Start.md, and nothing else.
- POINTERS: every "see X" / "described in X" in F's CLAUDE.md and Sessions files is followed: X exists AND contains what is promised (Stage 6). Report each one checked.
- DESCRIPTIVE LINES: the header of every Sessions file and the Start file's HOW TO READ and DIRECTORY are true now (Stage 4).
- ROOT LISTS: F has a current row in BOTH root lists: the path table in the root `CLAUDE.md` and the Projects table in the root `Sessions_Start.md` (rows use the folder's own name). A missing row is added; a stale row is refreshed from F's Start file. (Root CLAUDE.md edits are authorized by Ryan for this purpose, 2026-11-14; say what you changed.)
- HUB: look up the Hub for pursuits with program = F's name (read only) and compare with the to-do file: none stray, none completed in the Hub but open in the file, no `[hub:...]` link broken.
- CHECK IT AS A NEW SESSION WOULD, not as the writer: after all edits, re-read ONLY root CLAUDE.md's start rule, F\CLAUDE.md and F\Sessions_Start.md, and answer in two lines what state the project is in and what is next. If any claim does not match the real files or the repo, fix it. Do this check last, after every edit, because it is the one that catches what the writing pass missed.
Fix what is plainly an error; list anything uncertain for Ryan.

## The report (every clean-up ends with it, Ryan 2026-11-14)
Give Ryan a plain-words report that names EVERY stage, done or skipped with the reason (a stage is never silently dropped): 1 folders (listed before starting), 2 session name (or "not retitled: this session was not started by name"), 3 log (messages logged), 4 start file (what changed, live-versus-local result, to-do count), 5 to-dos and pursuits (new, resolved, Hub lookup result), 6 design and scope (what moved out of CLAUDE.md, pointers checked), 7 repetition check (the real count, or "first clean-up, nothing to compare"), 8 verification (each check above and its result), then what is unsure, and the `/rename` reminder when it applies. Never say it worked without showing the checks that prove it.

## "Clean up the cleanup"
When Ryan asks, or when a `Sessions_Log.md` passes about 150 KB: entries older than about 30 days are folded into short dated summaries kept at the END of `F\Sessions_Log.md` under a heading `## Older entries (summarized)` (decisions, version numbers and still-open items kept; the word-for-word text of the folded entries is dropped from the main log). No backup unless Ryan asks. Never remove an open to-do or a decision.

## Safety
Do not make backups unless Ryan asks (then in the root `Backups` folder, under the project name). Edit with Node or the Edit tool and check the file size afterward. Never push. Database writes only in Stage 5 and only as described. Never touch a CLAUDE.md except in Stage 6. Nothing the person said is paraphrased in the log.
