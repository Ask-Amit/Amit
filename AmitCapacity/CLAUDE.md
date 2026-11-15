# AmitCapacity — Project Context

## SESSION LOCATION CHECK — Read First, Every Session

If a session starts in this folder, before anything else: stop and tell Ryan plainly —

"You're in AmitCapacity, not the main Amit folder. Please close this and reopen VS Code at `C:\Users\user1\OneDrive\Documents - onedrive\Amit\` — that's where all development happens. Nothing has been built yet; this is just a heads-up before we start."

Do not proceed with any build request until Ryan confirms he wants to continue here anyway, or has switched folders. Read-only actions (reading files, answering questions) are fine either way.

(Exception: if this new project is a model-tier routing folder — matching the pattern of Haiku/Sonnet/Opus/Overflow — omit this section entirely, since those folders are meant to be opened directly by design.)

## CURRENT SCOPE

AmitCapacity is a page (four tabs: The Story, The Numbers, Receipts, Ask Amit) that shows measured numbers for what a person gets when they connect Amit to their own Claude account (answers per 5 hours, week and month), plus the recorded conversation between the desktop Amit and the online Amit. Every number is measured and carries its range and caveats.

## SESSION RECORD

Current state, to-dos and history live in this folder's Sessions files, not here. A new session reads Sessions_Start.md first (short). Read Sessions_ToDo.md only when asked about to-dos; read Sessions_Log.md or the original Claude session only when asked; the backup files in Backups\AmitCapacity\Sessions_backup_*.md only for research.

## Folder Confirmation
If you are reading this file, you are in: `C:\Users\user1\OneDrive\Documents - onedrive\Amit\AmitCapacity\`
All AmitCapacity development files belong here. Do not create AmitCapacity files anywhere else. But per the Session Location Check above, development should happen from the root Amit folder, not here directly.

---

## Database connection: see the root CLAUDE.md (SUPABASE - DATABASE CONNECTION section) and Database\CLAUDE.md. Nothing connection-related is repeated here.

---

## Database tables

This project's database tables and table rules live in Sessions_Design.md (section 'Tables') in this folder, not here. Read that section only when working with the database. Design reference for how the project is built is in the same file. Connection details: see the root CLAUDE.md (SUPABASE - DATABASE CONNECTION) and Database\CLAUDE.md.


## Pursuit Attribution — Permanent

This project's canonical name, for any pursuit created from within it, is: **AmitCapacity**

Any pursuit written to `hub_entries` from this project must be stamped `program='AmitCapacity'` — automatically, by this project's own code or by Amit acting on its behalf, using this exact spelling every time. Never ask the person creating the pursuit *what* program a specific pursuit belongs to — that's always this project's own name, decided once, not per-item.

**If this project doesn't have a canonical name recorded yet** (this section still shows the placeholder, or no name has been set another way), ask the person building it what this application should be called, before creating its first pursuit — and say why: so it can be found later, correctly, in their pursuits/to-do list. Record the answer here and reuse it every time after. Don't ask again once it's set.

**If the name changes later** (the person is building it and decides to rename it), that's a deliberate rename operation — not a fresh question each time. Update this section to the new name, and update every existing pursuit (including completed ones/memories) that was stamped with the old name to the new one, so the full history stays under one consistent identifier rather than splitting across two names.

## What This Project Is

AmitCapacity shows, with measured numbers, what a person gets when they connect Amit to their own Claude account: how many Ask Amit answers a Claude Pro plan supports per 5-hour window, per week and per month. It also records the conversation between the two places Amit works at once (the desktop Amit in VS Code and the online Amit in the Hub chat), so a visitor can watch the same Amit measure and explain itself. Tabs: The Story, The Numbers, Receipts (each signed-in person's own answers with a cost line), Ask Amit.

## Purpose Within the Amit System

It is the honest answer to "what do I get for the Amit fee and my own Claude plan." Nothing here is a sales line: every number is measured and carries its range and its caveats. It serves the mission by letting people trust what they are told about the companion.

## Connection to Other Apps

Reads AmitChat's cha_ask_usage for Receipts and uses the Ask Amit mechanism (Amit_Ask_Live.js, key `amitcapacity`). It extends nothing local, so it needs no desktop bridge.

---

---

*Developer: Ryan | Identifier: 851379456*
*Part of the Amit System — C:\Users\user1\OneDrive\Documents - onedrive\Amit\*
