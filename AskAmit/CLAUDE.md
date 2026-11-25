# AskAmit — Project Context

## SESSION LOCATION CHECK — Read First, Every Session

If a session starts in this folder, before anything else: stop and tell Ryan plainly —

"You're in AskAmit, not the main Amit folder. Please close this and reopen VS Code at `C:\Users\user1\OneDrive\Documents - onedrive\Amit\` — that's where all development happens. Nothing has been built yet; this is just a heads-up before we start."

Do not proceed with any build request until Ryan confirms he wants to continue here anyway, or has switched folders. Read-only actions (reading files, answering questions) are fine either way. (A session started from the root by saying this project's name is already at the root: this warning does not apply.)

## Folder Confirmation
If you are reading this file, you are in: `C:\Users\user1\OneDrive\Documents - onedrive\Amit\AskAmit\`
All AskAmit files belong here. Development happens from the root Amit folder.

## What This Project Is
AskAmit is the ONE global Ask Amit module: the single place everything that answers a person's question should be called from. Today "Ask Amit" is spread over several separate pieces (the page buttons, the chat, the Amit Mobile answerer and an experimental voice relay), so each new ability has to be added several times. AskAmit is the stable core that replaces that: one rules set, one set of abilities, one place to change.

## CURRENT SCOPE
- Built ISOLATED, on purpose (Ryan, 2026-11-17): linked to nothing yet. It is made to work the way Ryan wants first; only then do the existing Ask Amit pieces connect to it, one at a time, in some fashion decided later.
- Whose Claude answers: for now every answer runs on Ryan's own Claude account (his computer, a locked-down Claude run). That is how it serves people coming in for troubleshooting. When a person goes Pro, AskAmit will connect to THEIR OWN Claude account instead. The design must allow that switch from the start (an account setting per person, never a hard-coded owner), but the Pro connection is not built yet.
- Abilities to build and prove here first (see Sessions_ToDo.md): measuring colours and other facts from a picture before Amit answers (so Amit quotes a real number instead of guessing); writing a self-contained BUILD BRIEF as one copy-paste block when someone asks for something Amit cannot do from where it sits; the Show Amit picture.
- v1.00 of the isolated engine is written (2026-11-18): `engine\` (the answering engine and its rules), `test\` (a test page) and a migration for the `ask_` tables. It is not linked to anything and not pushed; what is built and what is not is in Sessions_Start.md.
- Visitors who are not signed in get a small free allowance answered on Ryan's computer (Ryan, 2026-11-18); signed-in people are limited per hour and per day. Details: Sessions_Design.md, "VISITORS".

## SESSION RECORD
Current state, to-dos and history live in this folder's Sessions files, not here. A new session reads Sessions_Start.md first (short). Read Sessions_ToDo.md only when asked about to-dos; read the Daily Sessions folder or the original Claude session only when asked; Sessions_Design.md (the map of today's Ask Amit pieces, then how AskAmit is built) only when working on that part. The root `Backups\AskAmit` folder is for research only.

## Rules and procedures for this folder
- **One module, one home.** Anything that answers a person's question is called from here. Do not add an ability to an old Ask Amit piece (the page button, the chat watcher, the Mobile watcher) instead of here, unless Ryan says so.
- **Isolated until Ryan says connect.** Do not wire any existing page, watcher or table to AskAmit without his go-ahead, and do not change the existing pieces while building here.
- **Answers run locked down.** A model run may use only the tools it is explicitly given (today: web search, web fetch, and reading the one picture that came with the press). Measuring, file work and anything with side effects is done by plain code BEFORE the model is called, never by giving the model a shell.
- **Per-person Claude account, never hard-coded.** The account that answers is a setting per person (Ryan's for troubleshooting; the person's own when Pro). Capacity used is measured and recorded (see AmitCapacity).
- **The heart of Amit is kept everywhere (Ryan, 2026-11-17).** Walk beside, never cut down, always truthful, the first law: in every door, mode, answerer and per-person account. No ability, cost saving or setting may remove it; whatever cannot guarantee it is not connected to AskAmit.
- **Nothing private in this folder.** Its files are published: no keys, credentials, personal details or a client's business details.
- **Check the live source before answering "is X built?"** (root CLAUDE.md standing rule).

## Database tables
The prefix is `Ask_` (first three letters of the module word, lowercase in Postgres). The tables and their rules are in Sessions_Design.md (section "Tables"); every migration that creates a table includes its grants (root CLAUDE.md, DATABASE TABLE DATA-API GRANTS). Connection details: root CLAUDE.md (SUPABASE - DATABASE CONNECTION) and Database\CLAUDE.md.

## Pursuit Attribution — Permanent
This project's canonical name, for any pursuit created from within it, is: **AskAmit**

Any pursuit written to `hub_entries` from this project is stamped `program='AskAmit'`, using this exact spelling every time, and the person is never asked which program a pursuit belongs to. If the name changes, that is one deliberate rename: update this line and every existing pursuit stamped with the old name.

## Connections
- None built (isolated by decision). Planned later, one at a time and only on Ryan's word: the Ask Amit page buttons (`Amit_Ask_Live.js`), the chat (`amit_chat.js` and `AmitChat\amit_ask_watcher.js`), Amit Mobile (`ComputerHealth\Watchers\amit_mobile_watcher.ps1`), the voice relay (`VoiceControl_AskAmit\`).
- Related: AmitChat (today's answerer and its rules file), AmitCapacity (measuring what a person's own Claude account gives), AmitMobile.
