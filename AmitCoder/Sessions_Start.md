# AmitCoder - Sessions_Start

## HOW TO READ
Read this file first; it is all a new session needs. Read Sessions_ToDo.md only when asked about to-dos. Read the Daily Sessions folder (one text file per session) or the original Claude session only when asked. the backup files in Backups\AmitCoder\Sessions_backup_2026-11-13.md are for research only.

## DIRECTORY
- Sessions_Start.md - this file.
- Sessions_ToDo.md - open items found in the old Sessions.md (now in Backups\AmitCoder\Sessions_backup_2026-11-13.md), with source dates.
- Daily Sessions\ - one text file per session (the history; never pushed; the old Sessions_Log.md was split into it on 2026-11-15).
- Backups\AmitCoder\Sessions_backup_2026-11-13.md - byte-for-byte copy of the old Sessions.md.
- Sessions_Design.md: this project's database tables (first section) and design reference (how it is built); read only when working with the database or on that part of the build.

## CURRENT STATE
AmitCoder is the paid, login-gated coding workspace: shortcuts, session history, a starter kit, and (newest) the Amit Preview tool. Product model (agreed 2026-10-31, discussion only): a subscriber gets the same CLAUDE.md / Sessions files mechanics Ryan uses, tailored to them, on their own computer with their own Claude account; the shared Amit file is delivered by a session-start hook; Amit software never reads or stores the person's Claude login. Price is NOT set. Billing is not wired.
- AmitCoder.html: built off the shared template (Session 58, 2026-07-28); tiles Get Started and Shortcuts; Previewer tab added v6.43 (2026-10-31, local, not pushed at that entry).
- AmitPreview.html: real tool, page v2.00 pushed 2026-11-06 (99bc3fb), v2.17 released 2026-11-07 with helper 1.69 and installer 4.86. Page carries sender rules and checks every live send; bar button "Amit PreView" opens it.
- Guided Previewer (Templates\amit_previewer.html v1.00): built, local, NOT pushed at its entry; return path (answers back into the conversation) not built.
- Starter Kit (Amit_Coder_Starter_Kit.ps1): scaffolding, backups, local server, branch script, migrations convention, a CI workflow not yet verified.
- Newest decision (2026-11-07): no previewer line goes in the root CLAUDE.md; it lives here and on the Living Testimony.
- Team-inbox requests R1-R7 and E1 (chat features Ryan asked for, see the log top) are recorded as requests, not built.

## FILES IN PLAY (under AmitCoder\ unless stated)
| File | What it is | Version |
|---|---|---|
| AmitCoder.html | the workspace page | v6.43 (local at last mention) |
| AmitPreview.html | Amit Preview window page | v2.17 |
| Amit_Coder_Starter_Kit.ps1 | project scaffolding | none |
| Templates\amit_previewer.html | guided previewer | v1.00 |
| Templates\open_preview.ps1, show_preview.ps1 | preview openers | v1.30 (open_preview) |
| Handoff_AmitPreview_2026-11-06.md | handoff for the preview tool | none |
| helper amit_whisper.cs ("preview" voice command) | in the helper | v1.49 |
| AmitCapacity\Sessions_Start.md | plan capacity reference | none |
| CLAUDE.md | project rules | not read for this record |

## OPEN TO-DOS
Open to-dos: 105 items, see Sessions_ToDo.md.

last clean-up: built 2026-11-13 from the old Sessions.md (now in Backups\AmitCoder\Sessions_backup_2026-11-13.md), newest log entry dated 2026-11-07 (Current State) / 2026-11-06 (Log).

## ORIGINAL SESSIONS
Originals were not recorded before 2026-11-13. From the next clean-up on, each entry names its session (name, ID and path under C:\Users\user1\.claude\projects\c--Users-user1-OneDrive-Documents---onedrive-Amit\). Those files expire on Claude's own schedule, which is acceptable because the log is the permanent record.

## FROM CLAUDE.md (captured 2026-11-14)
SCOPE NOW: wider than "coding session history". AmitCoder is the paid, login-gated coding side ("VS Code with Amit inside"): shortcut system (F = user's own, J = Amit's builtin package, activation_key separate from name, Master vs Step, chained subtasks via referenced_shortcut_id, alias_of linking), Starter Kit script and dev-practice tooling, Get Started checklist, Pairing log, Community Code Library, Amit's Builds tile, the Previewer (true-to-life working previews), management/child session shortcuts (J Manage, J New, J Instruct, J Sessions, J Check, J Cleanup), and hub_entries pursuit conventions (program column).
- Status in CLAUDE.md is mostly dated 2026-07-28 to 2026-09-07 and 2026-10-31 (looks out of date: nothing newer; the page was v6.31 then, check Sessions_Start above for the current version).
- Page structure (as of 2026-07-28/29): built from Templates/template.html; tabs Overview, Shortcuts, History (static mockup), Docs, Dev Practices, Settings, Pairing, Library (7th/8th as added); sidebar tiles Get Started, Overview, Amit's Builds.
- Tables noted: amit_shortcuts (activation_key, sort_order, referenced_shortcut_id, alias_of), amit_coder_sessions (run, live), amit_pairing_sessions (migration NOT YET RUN at writing), amit_code_library (pending confirmation at writing), amit_coder_ideas; hub_entries.program. Whether the pending ones were run later is unknown (unsure).
- Admin edit: Ryan's account may edit builtin shortcuts; only admin can create J. Migration shortcuts_admin_edit was written, not yet run at writing (unsure if finished).
- Directive package versioning: $DIRECTIVE_VERSION in Amit_Coder_Starter_Kit.ps1 (1.1 then); four-step rule on any directive change (update embedded text, bump version, update dev_playbook row, push).
- Previewer: guided Previewer page Templates/amit_previewer.html works with spec files; return path is clipboard-based today; in-page Preview pane inside AmitCoder not built.
- J Manage uses a local stand-in for credentials (Database\amit_coder_credentials.md) on Ryan's machine only; a real installer for other people is not built.

