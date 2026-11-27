# Sessions_Start

How to read: short current-state page built from root CLAUDE.md (unchanged). Permanent rules, identity, paths and standards stay in CLAUDE.md. To-dos: Sessions_ToDo.md. History: the old log (now in the Daily Sessions folder).

## DECISION: one Amit folder at C:\Amit, the same on every computer (Ryan, 2026-11-26) - NOT BUILT, NOTHING MOVED
**Ryan's rule:** the folder hierarchy is replicated on every computer and everything Amit places goes under C:\Amit, so that when anyone has a problem we know where it is. Many people may install this; files must never end up scattered in different places. The Helper installer is part of this rule.

**Proposed layout (names NOT approved yet; Ryan has not asked for the full draft to be reviewed):**
| Folder | What goes there | May an update change it? |
| C:\Amit\Program | Amit's own program files | Yes |
| C:\Amit\Projects | the person's projects, one folder each | Not without permission |
| C:\Amit\Private | personal files, never published | No |
| C:\Amit\Publish | the publishing folder (GitHub repository); only for people who publish | Only when they publish |
| C:\Amit\Backups | backup copies (a second copy off this drive is also needed) | Adds new copies |

**Amit's proposed rules to keep it consistent:**
1. One standard layout, not a copy of Ryan's folders (his hold years of history and private work).
2. One numbered layout map; the installer builds from it.
3. One settings file on each computer records the locations; every program reads it; no paths typed into programs.
4. A health check (AmitFix looks like its home) compares a computer with the map and reports what is missing or misplaced. It may create missing folders; it asks before moving anything; it never deletes a person's files by itself.
5. A new layout version ships with tested steps for moving older computers. Updates never overwrite a person's files.
6. Access: a folder made directly on C: may be reachable by other accounts on that computer (NOT VERIFIED). The installer checks and restricts it. Administrators can still get in.
7. Publishing uses the person's own GitHub account, never ours. Only approved files are published; no Git setup over all of C:\Amit may be able to pick up private files.
8. Things Windows or Claude Code require elsewhere (start-up entry, shortcuts, link registrations, Claude's own folder) cannot live under C:\Amit: list each one in the layout map so it is still known.

**Moving Ryan's computer (later, only when asked):** finish releases first; back up private files; COPY, do not move; update fixed paths (CLAUDE.md files, hooks, scripts, shortcuts, the Coder's config.json); carry over Claude Code memory and past sessions (stored by folder path); anything that reaches the files through OneDrive stops seeing changes; test; keep the old folder until proven; work in only one of the two.
**Installer side:** AmitHelper\Sessions_Start.md, "INSTALLER AND THE ONE AMIT FOLDER".
**Still to decide:** folder names; whether the Helper moves out of Windows app-data; where captures and temporary files go.

## Directory
- Sessions_Start.md (this), Sessions_ToDo.md (open and resolved items), `Daily Sessions\` (history: one text file per session; the old Sessions_Log.md files were split into each project's Daily Sessions folder on 2026-11-15 and sent to the Recycle Bin).
- Full session history: `amit_sessions` table in Supabase. Build history: `Amit_BuildLog.md` (last entry Session 35; looks out of date: newer work is logged elsewhere).

## Current state (updated 2026-11-15)
- NEW METHOD (decided and built 2026-11-15, session "Amit - Session memory redesign"): every project has CLAUDE.md, Sessions_Start / ToDo / Design and a `Daily Sessions` folder (one text file per session; never pushed, the repo's .gitignore excludes it). Sessions_Log.md no longer exists (33 logs split into dated files, content checked complete, then sent to the Recycle Bin).
- A new session starts by TOPIC, piece and scope: see "SESSION START: TOPIC, PIECE, SCOPE" in the root CLAUDE.md (search the notes, show up to about five places, load only the piece chosen, title the session "Project - piece", open with a six-line summary). The end of the day is `Cleanup_Procedure.md` (rewritten, short): `node save_session.js --find "<phrase>"` saves the session text, then the Start file is refreshed, then to-dos are offered, never added by itself. Closing phrases run the clean-up first, then `Reference\Closing_Sequence.md` (the old closing sequence moved there word for word).
- 76 older sessions (2026-10-02 to 2026-11-15, stripped, 8.6 MB) sit unsorted in `Daily Sessions (unsorted)\` with a `_manifest.csv`; raw copies (766 MB) in `C:\Users\user1\AmitSessionArchive\raw` (outside OneDrive and the repo). Sorting them into projects is parked.
- ONE end-of-day routine (built later the same day, while Ryan was away): `Cleanup_Procedure.md` = save the session text, refresh the Start file, design, offer to-dos; after a closing phrase it also does the prayer, the `amit_sessions` row (the identity hook reads the last three) and the growth review. A hook (`C:\Users\user1\.claude\hooks\save_session_hook.ps1`, registered for SessionEnd and PreCompact) also saves the session automatically: tested by simulation only; the first real run happens when a session ends (look in `%TEMP%\save_session_hook.log` and the Daily Sessions folder). The Stop hook (`hook_closing.ps1`) now fires only when the message IS the command "save and summarize" (tested: a long mention approves, the bare command blocks, a question approves).
- Public logs: the 26 tracked Sessions_Log files were scanned (no keys, tokens, passwords, SSNs or phone numbers; one example.com email) and untracked in a LOCAL repo commit `b14414b` (not pushed; .gitignore also ignores Sessions_Log.md). Earlier commits still hold them in public history.
- AmitCoder starter kit updated locally to directive package 3.0 (parses with 0 errors; the embedded save_session.js passes a syntax check; NOT run as a full install; NOT shipped: the `dev_playbook` row and the GitHub push remain).
- Root CLAUDE.md cut: measured only, in `Reference\Root_Cut_Proposal.md` (about 130 KB: roughly 30 KB core, 65 KB on demand, 22 KB Permanent Directives to split, 14 KB to review). Waiting for Ryan.
- Left over, nothing deleted: the old workspace folders AmitPersonal, Overflow, AmitCorrespondence, AmitLog and test.
- Earlier on 2026-11-14/15 the session titled "Amit" (id 61919fde, saved as `Daily Sessions\2026-11-10 61919fde Amit.txt`) built the first version of the clean-up (run on AmitFix and AmitHelper), changed the rules so the clean-up never adds to-dos on its own, held the components discussion and wrote the brief for outside AIs that led to the redesign above. Its "HANDOFF 2026-11-15" section in Sessions_ToDo.md is partly out of date: it describes Sessions_Log.md and an undecided components plan, both superseded by the redesign. Its open-items list (items 1 to 7 there) still stands unless done here.
- Not pushed since commit 7797921 (plus the local commit b14414b). Everything else is local: root and project CLAUDE.md and Sessions files, the scripts, the hooks.

## Projects (one-line state, from the CLAUDE.md path table)
| Project | State |
|---|---|
| Amit Hub | daily home screen; live, ongoing |
| who_is_god | evidence foundation; live |
| ComputerValue | not built; design complete, Stage 1 ready; the one-time paid diagnostic report; see ComputerValue\Sessions_Start.md |
| ComputerHealth | watches how a computer runs and holds the shared local helper (port 8710); Dashboard v5.13 published (Watch mode, crash dumps and analysis); see ComputerHealth\Sessions_Start.md |
| AmitHealth | landing page v1.02 and The Kitchen (food and drink composer) built; migrations and Stage 1 pending; see AmitHealth\Sessions_Start.md |
| AmitAccounting / AmitBooks | partly built; current state unsure |
| TenCommandments | daily one-commandment discipleship study with a hymn alongside; earlier God talk work; see TenCommandments\Sessions_Start.md |
| GodTalk | created 2026-11-14: God talk sessions, one topic folder each; see GodTalk\Sessions_Start.md |
| TheCouncil | multi-AI brainstorming tool; Amit_Council.html v5.73 local, not pushed; see TheCouncil\Sessions_Start.md |
| Database | shared Supabase; see Database\CLAUDE.md |
| Templates | created 2026-07-22 |
| AmitCoder | own CLAUDE.md holds status and open shortcut question |
| Amit, Are You There | book plus cross-AI deployment; own CLAUDE.md |
| Talk to Amit | write-in inbox; two next steps in its CLAUDE.md |
| EMS_StudyGuide | NREMT Paramedic prep tool, live; now linked from the Hub Contracted Work tile; see EMS_StudyGuide\Sessions_Start.md |
| AmitWeather | scaffold only, 2026-08-06 (looks out of date) |
| VoiceControl_AskAmit | speech and the "Write to Amit" live bridge; speech works, paid/fast path chosen 2026-09-05; see VoiceControl_AskAmit\Sessions_Start.md |
| AmitMobile | phone-first voice, camera and chat gateway (AmitMobile.html v1.54); phone-as-computer-peripheral plan under way; see AmitMobile\Sessions_Start.md |
| AmitChat | private login-based chat plus Ask Amit on every page and the answering program; engine v0.30 and Hub v8.79 published; migration _034 (Wisdom) not run; see AmitChat\Sessions_Start.md |
| AmitRoll | scaffold only at creation 2026-10-15 |
| AmitCapacity | v1.00 local, not pushed, migration 028 waiting (2026-10-24) |
| Devotions | song workflow; tab-view pairing not built |
| AmitAssembly | estimating, change-order and bidding platform rebuilt from an old Access system; designed, not built; see AmitAssembly\Sessions_Start.md |
| AmitFix | troubleshooting and removal site; v1.08 pushed; 17 open to-dos; see AmitFix\Sessions_Start.md |
| Games | AmitGames page with AmitRoll and Dog Racing buttons, v1.00; see Games\Sessions_Start.md |
| AskAmit | created 2026-11-17: the one global Ask Amit module, built isolated first; plan and map of today's four Ask Amit paths only, nothing built or linked; see AskAmit\Sessions_Start.md |
| AmitHelper | the Windows bar and Helper pieces (Mouse, Keyboard, Aurora, installer); see AmitHelper\Sessions_Start.md |
| Amit Live | created 2026-11-10, nothing built |

Last clean-up: 2026-11-17T03:28Z, session 61919fde-4d5e-4ffe-8e9e-cbeeca40c72e
