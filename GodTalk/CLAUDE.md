# GodTalk — Project Context

## SESSION LOCATION CHECK — Read First, Every Session

If a session starts in this folder, before anything else: stop and tell Ryan plainly —

"You're in GodTalk, not the main Amit folder. Please close this and reopen VS Code at `C:\Users\user1\OneDrive\Documents - onedrive\Amit\` — that's where all development happens. Nothing has been built yet; this is just a heads-up before we start."

Do not proceed with any build request until Ryan confirms he wants to continue here anyway, or has switched folders. Read-only actions (reading files, answering questions) are fine either way. (A session started from the root by saying "God talk" is already at the root: this warning does not apply.)

## Folder Confirmation
If you are reading this file, you are in: `C:\Users\user1\OneDrive\Documents - onedrive\Amit\GodTalk\`
All GodTalk files belong here. Development happens from the root Amit folder.

## CURRENT SCOPE
GodTalk is where Ryan's God talk happens: conversations that center on God, Scripture and what follows from them. It is a discussion project, not a software build. Every topic gets its own folder inside this one. Created 2026-11-14.

## SESSION RECORD
Current state, to-dos and history live in this folder's Sessions files, not here. A new session reads Sessions_Start.md first (short). Read Sessions_ToDo.md only when asked about to-dos; read Sessions_Log.md or the original Claude session only when asked; the files in the root `Backups\GodTalk` folder only for research.

## How a God Talk session works (Ryan, 2026-11-14)
1. **It starts only when Ryan starts God talk.** Before anything else, read the whole Living Testimony (`Amit, Are You There\Amit_Living_Testimony.html`), completely, as the root CLAUDE.md says ("GOD TALK"). It holds Amit's testimony and Ryan's.
2. **Then ask one question: "What are we talking about today?"** Nothing else first. Ryan's answer is the TOPIC.
3. **The topic names everything.** As soon as Ryan answers, (a) create the folder `GodTalk\<Topic>\` with the topic in plain words (for example `GodTalk\Sabbath\`); the folder holds that topic's notes: what was asked, the verses read, what the Word showed, what is still open; and (b) title the session with the same topic by running `node rename_session.js "<Topic>"` from the root folder (if the write is refused, remind Ryan once to type `/rename <Topic>`). If the topic already has a folder, use it and continue there. If Ryan changes topic, create the next topic's folder and re-title.
4. **Always ask about the Devotions page.** When a topic reaches a stopping point, ask Ryan: "Should we add this to the Devotions page?" Never add it without his yes. If yes, follow the Devotions project's own workflow (`Devotions\CLAUDE.md`).
5. **Scripture is the judge.** The research standard (root CLAUDE.md, permanent directive 22) and the belief comparison protocol (root "GOD TALK — BELIEF COMPARISON PROTOCOL") apply to every topic here. Document the research inside the page it supports, never in a separate file, as the eye-icon rule says.

## Pursuit Attribution — Permanent
This project's canonical name, for any pursuit created from within it, is: **GodTalk**

## Connections
- **Devotions** (`Devotions\`): where finished topics may be added, only when Ryan says yes.
- **who_is_god** (`who_is_god\`): the evidence foundation these talks draw on.
- **Earlier God Talk work:** the Ten Commandments study lives in `TenCommandments\` and `God_Talk_Ten_Commandments.md` at the root. Whether it moves into GodTalk is Ryan's decision (see Sessions_ToDo.md).
