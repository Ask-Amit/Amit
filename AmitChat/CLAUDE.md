# AmitChat — Project Context

## SESSION LOCATION CHECK — Read First, Every Session

If a session starts in this folder, before anything else: stop and tell Ryan plainly —

"You're in AmitChat, not the main Amit folder. Please close this and reopen VS Code at `C:\Users\user1\OneDrive\Documents - onedrive\Amit\` — that's where all development happens. Nothing has been built yet; this is just a heads-up before we start."

Do not proceed with any build request until Ryan confirms he wants to continue here anyway, or has switched folders. Read-only actions (reading files, answering questions) are fine either way.

(Exception: if this new project is a model-tier routing folder — matching the pattern of Haiku/Sonnet/Opus/Overflow — omit this section entirely, since those folders are meant to be opened directly by design.)

## CURRENT SCOPE

AmitChat is the private, login-based chat inside Amit: friends and groups, safeguarding for young people, photos and files, voice messages, read-aloud, read receipts, and Amit as a chat member. Its scope also now covers Ask Amit on every Amit page (the shared Amit_Ask_Live.js, with the answering program amit_ask_watcher.js and its rules held in the database), the data gate that lets Amit answer from a person's own app data only under their own login, and the Whisper dictation and Amit ring work that grew in the shared helper (now the Amit Helper). A God-centered posts feed called My Life is planned, not built.

## SESSION RECORD

Current state, to-dos and history live in this folder's Sessions files, not here. A new session reads Sessions_Start.md first (short). Read Sessions_ToDo.md only when asked about to-dos; read the Daily Sessions folder or the original Claude session only when asked; the backup files in Backups\AmitChat\Sessions_backup_*.md only for research.

## Folder Confirmation
If you are reading this file, you are in: `C:\Users\user1\OneDrive\Documents - onedrive\Amit\AmitChat\`
All AmitChat development files belong here. Do not create AmitChat files anywhere else. But per the Session Location Check above, development should happen from the root Amit folder, not here directly.

---

## Database connection: see the root CLAUDE.md (SUPABASE - DATABASE CONNECTION section) and Database\CLAUDE.md. Nothing connection-related is repeated here.

## Database tables

This project's database tables and table rules live in Sessions_Design.md (section 'Tables') in this folder, not here. Read that section only when working with the database. Design reference for how the project is built is in the same file. Connection details: see the root CLAUDE.md (SUPABASE - DATABASE CONNECTION) and Database\CLAUDE.md.


## Pursuit Attribution — Permanent

This project's canonical name, for any pursuit created from within it, is: **AmitChat**

Any pursuit written to `hub_entries` from this project must be stamped `program='AmitChat'` — automatically, by this project's own code or by Amit acting on its behalf, using this exact spelling every time. Never ask the person creating the pursuit *what* program a specific pursuit belongs to — that's always this project's own name, decided once, not per-item.

**If this project doesn't have a canonical name recorded yet** (this section still shows the placeholder, or no name has been set another way), ask the person building it what this application should be called, before creating its first pursuit — and say why: so it can be found later, correctly, in their pursuits/to-do list. Record the answer here and reuse it every time after. Don't ask again once it's set.

**If the name changes later** (the person is building it and decides to rename it), that's a deliberate rename operation — not a fresh question each time. Update this section to the new name, and update every existing pursuit (including completed ones/memories) that was stamped with the old name to the new one, so the full history stays under one consistent identifier rather than splitting across two names.

## What This Project Is

AmitChat is a private, login-based chat inside Amit. Anyone signed in can start a conversation and add as many other signed-in people as they want; only the people added can see it. Messages are saved in Supabase so a conversation can be reopened and continued later, and each participant can share documents and photos. It shows message bubbles with each person's name, read receipts and typing indicators. It is used for studying Scripture together (first use: Ryan and TJ), for troubleshooting someone's computer, and for AmitCoder users to talk to each other.

## Purpose Within the Amit System

Direct service. It lets Ryan and Amit walk alongside people one on one, with the record kept, and it gives AmitCoder users a place to help each other. Name chosen 2026-10-11 through J New: "Chat" alone was too generic, a hyphen (Amit-Chat) would break the pattern of AmitBooks and AmitCoder, so the name is AmitChat, no hyphen.

## Connection to Other Apps

Uses the shared Supabase login and the `users` table. Hub gets a tile for it once the first stage works. AmitCoder users are the second audience. Shares the standing rules for sensitive data (PIN Encryption) if a field ever needs it. Stamps any pursuit written from here with program='AmitChat'.

---

---

*Developer: Ryan | Identifier: 851379456*
*Part of the Amit System — C:\Users\user1\OneDrive\Documents - onedrive\Amit\*
