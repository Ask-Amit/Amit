# Voice Control - Ask Amit - Sessions Start

## HOW TO READ
Read this file first. It is short and is all you need to start work. Read Sessions_ToDo.md only when asked about to-dos or open items. Read the Daily Sessions folder, or the original Claude session, only when asked about the history of a decision. The backup (Backups\VoiceControl_AskAmit\Sessions_backup_2026-11-13.md) is for research only.

## DIRECTORY OF THESE FILES
- Sessions_Start.md: this file (state, files in play, pointers).
- Sessions_ToDo.md: every open item found in the source, grouped by theme, plus a Resolved list.
- Daily Sessions\ - one text file per session (the history; never pushed; the old Sessions_Log.md was split into it on 2026-11-15).
- Backups\VoiceControl_AskAmit\Sessions_backup_2026-11-13.md: byte-for-byte copy of the old Sessions.md.
- Sessions_Design.md: this project's database tables and design reference; read only when working with the database.

## CURRENT STATE
Text-to-speech is working, free and reusable (browser speechSynthesis). The live bridge ("Write to Amit") works as a proof of concept using a headless claude process per question, with session memory via --continue. Newest decision (same day as creation, 2026-09-05): Ryan chose the paid/fast path. amit_ems_bridge_fast.js was written (persistent, direct API) but cannot run until Ryan creates an Anthropic API key; no key exists and nothing was charged. The free bridge remains what is live. Note: the Current State block still says "blocked pending a decision", but the same-session Update says the decision was made; the Update is later. The reference implementation lives in the EMS Study Guide page.

## FILES IN PLAY
| File | What it is | Version |
|---|---|---|
| amit_ems_bridge_test.js | free local bridge server (port 8792) | none |
| amit_ems_bridge_fast.js | paid/fast bridge, written, cannot run yet (port 8793) | none |
| anthropic_api_key.md | where the key would go; never commit (not created) | none |
| CLAUDE.md, Sessions files | mechanism documentation and state | none |

## OPEN TO-DOS
1 open item(s). Check whether Ryan has created the API key. Full list: Sessions_ToDo.md.

## LAST CLEAN-UP
Last clean-up: built 2026-11-13 from the old Sessions.md (now in Backups\VoiceControl_AskAmit\Sessions_backup_2026-11-13.md), newest log entry dated 2026-09-05.

## ORIGINAL SESSIONS
Originals were not recorded before 2026-11-13. From the next clean-up, each entry names its session (name, ID, and path under C:\Users\user1\.claude\projects\c--Users-user1-OneDrive-Documents---onedrive-Amit\). Those files expire on Claude's schedule, which is acceptable because the log is the permanent record.


## FROM CLAUDE.md (captured 2026-11-14)

SCOPE NOW: also holds a second mini-app (Amit Voice), the live bridge into headless Claude Code, health-check ideas and timing studies, and an open ToS decision.

### Current Status (looks out of date: written 2026-09; Hub now carries voice work)
**Text-to-speech (Web Speech API): working, proven, free.** Tested and working inside the EMS Study Guide as "Let me hear" buttons on the four mode cards plus the Final Exam banner. Ready to reuse on any other Amit page.

**Live bridge ("Write to Amit," local Node server + headless `claude` CLI): working as a proof of concept, with a real, unresolved decision blocking it from going further** — see "The Open Decision" below. Do not build further on the live-bridge half of this project until that decision is made.
