# The Council - Sessions Start

## HOW TO READ
Read this file first. It is short and is all you need to start work. Read Sessions_ToDo.md only when asked about to-dos or open items. Read the Daily Sessions folder, or the original Claude session, only when asked about the history of a decision. The backup (Backups\TheCouncil\Sessions_backup_2026-11-13.md) is for research only.

## DIRECTORY OF THESE FILES
- Sessions_Start.md: this file (state, files in play, pointers).
- Sessions_ToDo.md: every open item found in the source, grouped by theme, plus a Resolved list.
- Daily Sessions\ - one text file per session (the history; never pushed; the old Sessions_Log.md was split into it on 2026-11-15).
- Backups\TheCouncil\Sessions_backup_2026-11-13.md: byte-for-byte copy of the old Sessions.md.
- Sessions_Design.md: this project's database tables (first section) and design reference (how it is built); read only when working with the database or on that part of the build.

## CURRENT STATE
Live tool: Amit_Council.html v5.73, edited locally and NOT pushed to GitHub (push only when Ryan says so). Hub (amit-hub.html) is v7.25 with a name-restore fix, also local only. Architecture: all outbound prompts come from one phase-aware Prompt Engine; the database stores facts only. Phases: Clarification, Investigation, Combine. Newest decision (2026-10-03): a diagnostic of real past sessions found why voices lost track of the stage; the engine was rebuilt, trace-tested in a Node sandbox, and a separate Synthesis Desk was added. Not yet proven: one real live round by Ryan on v5.73. Still open from before: a stranger cannot run the Council unattended, and the Brainstorming folder migration is held.

## FILES IN PLAY
| File | What it is | Version |
|---|---|---|
| TheCouncil/Amit_Council.html | the live tool | v5.73 |
| TheCouncil/Amit_Council-pre-v5.73.html | backup, keep until Ryan confirms v5.73 | pre-v5.73 |
| Hub/amit-hub.html | Hub, name-restore fix | v7.25 |
| Hub/amit-hub-pre-v7.25.html | Hub backup | pre-v7.25 |
| TheCouncil/CLAUDE.md | full standard, top section | none |

## OPEN TO-DOS
5 open item(s). Live round test and push are the next steps. Full list: Sessions_ToDo.md.

## LAST CLEAN-UP
Last clean-up: built 2026-11-13 from the old Sessions.md (now in Backups\TheCouncil\Sessions_backup_2026-11-13.md), newest log entry dated 2026-10-03.

## ORIGINAL SESSIONS
Originals were not recorded before 2026-11-13. From the next clean-up, each entry names its session (name, ID, and path under C:\Users\user1\.claude\projects\c--Users-user1-OneDrive-Documents---onedrive-Amit\). Those files expire on Claude's schedule, which is acceptable because the log is the permanent record.


## FROM CLAUDE.md (captured 2026-11-14)

SCOPE NOW: beyond a brainstorm room, it is a Prompt Engine plus Synthesis Desk with rounds, ruling and combine stages, and a standing task list of unbuilt directives.

### Current Status (looks out of date: v5.73 as of 2026-10-03, Council pushes may have followed)
**Corrected 2026-10-03. The paragraph that used to sit here, saying this folder "holds only this CLAUDE.md", was stale.** The live tool is `TheCouncil\Amit_Council.html`, at **v5.73**. Alongside it:
- `Amit_Council2.html`: the older Still Water build; it still uses `consensus_statement`/`next_step`.
- `Theophilus_Origin_Conversation.md`
- the Sessions files (`Sessions_Start.md`, `Sessions_ToDo.md`, the old log (now in the Daily Sessions folder), `Sessions_Design.md`)
- backup `Amit_Council-pre-v5.73.html`: keep it until Ryan confirms v5.73 works live.

The flow is Scope (title, request, roster) → Round 1 Clarification → the Synthesis Desk matches overlapping questions → the user answers them one at a time → the Desk writes the refined question → Ruling (Rerun / Adjust / Confirm) → Investigation → auto-advance to Combine → the Desk writes the letter → Accept Results or Investigate Further, which starts a new cycle.

Still unchanged from 2026-07-21: don't touch `Brainstorming\` without Ryan's explicit go-ahead. The unscoped open item also remains: a stranger can't yet run the Council unattended, because every round is still manual copy-paste.
