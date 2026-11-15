<!-- TEMPLATE (rewritten 2026-11-14). Copy this file into the new project folder as CLAUDE.md, fill in every [bracket], then delete this comment.
     A project CLAUDE.md holds ONLY: purpose, current scope, the location check, the folder's standing rules and procedures, the session record pointer, the pursuit name, and connections.
     It never holds: status, to-dos, history, version lists, database tables, design write-ups, the identity block, the database connection text, the shortcut clauses or the login-based profile. Those live in the Sessions files (Sessions_Start.md, Sessions_ToDo.md, the old log (now in the Daily Sessions folder), Sessions_Design.md) or in the root CLAUDE.md. -->
# [PROJECT NAME] — Project Context

## SESSION LOCATION CHECK — Read First, Every Session

If a session starts in this folder, before anything else: stop and tell Ryan plainly —

"You're in [ProjectName], not the main Amit folder. Please close this and reopen VS Code at `C:\Users\user1\OneDrive\Documents - onedrive\Amit\` — that's where all development happens. Nothing has been built yet; this is just a heads-up before we start."

Do not proceed with any build request until Ryan confirms he wants to continue here anyway, or has switched folders. Read-only actions (reading files, answering questions) are fine either way. (A session started from the root by saying this project's name is already at the root: this warning does not apply.)

## Folder Confirmation
If you are reading this file, you are in: `C:\Users\user1\OneDrive\Documents - onedrive\Amit\[SUBFOLDER]\`
All [Project Name] files belong here. Development happens from the root Amit folder.

## What This Project Is
[2 to 4 sentences: what it is and who it is for.]

## CURRENT SCOPE
[3 to 8 lines: what the project does NOW. The clean-up keeps this paragraph true as the project grows; update it, never add status here.]

## SESSION RECORD
Current state, to-dos and history live in this folder's Sessions files, not here. A new session reads Sessions_Start.md first (short). Read Sessions_ToDo.md only when asked about to-dos; read the Daily Sessions folder or the original Claude session only when asked; Sessions_Design.md (tables first, then how it is built) only when working with the database or on that part of the build. The root `Backups\[ProjectName]` folder is for research only.

## Rules and procedures for this folder
[Standing rules a session must follow here, and standing procedures, each a short bullet. Delete this section if there are none yet.]

## Database tables
[Only if this project has tables: "This project's database tables and table rules live in Sessions_Design.md (section 'Tables') in this folder, not here. Read that section only when working with the database. Connection details: see the root CLAUDE.md (SUPABASE - DATABASE CONNECTION) and Database\CLAUDE.md." Table prefix: the first three letters of the module word. Delete this section if there are no tables.]

## Pursuit Attribution — Permanent
This project's canonical name, for any pursuit created from within it, is: **[ExactProjectName]**

Any pursuit written to `hub_entries` from this project is stamped `program='[ExactProjectName]'`, using this exact spelling every time, and the person is never asked which program a pursuit belongs to. If the name changes, that is one deliberate rename: update this line and every existing pursuit stamped with the old name.

## Connections
[How this project connects to the Hub, who_is_god, Devotions, Database or other projects. One line each.]
