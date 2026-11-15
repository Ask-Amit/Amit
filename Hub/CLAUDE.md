# Amit Hub — Project Context

## SESSION LOCATION CHECK — Read First, Every Session

If a session starts in this folder, before anything else: stop and tell Ryan plainly —

"You're in Hub, not the main Amit folder. Please close this and reopen VS Code at `C:\Users\user1\OneDrive\Documents - onedrive\Amit\` — that's where all development happens. Nothing has been built yet; this is just a heads-up before we start."

Do not proceed with any build request until Ryan confirms he wants to continue here anyway, or has switched folders. Read-only actions (reading files, answering questions) are fine either way.

## Folder Confirmation
If you are reading this file, you are in: `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Hub\`
All Hub development files belong here. Do not create Hub files anywhere else. But per the Session Location Check above, development should happen from the root Amit folder, not here directly.

## CURRENT SCOPE

The Hub is the daily home screen and face of the Amit system, free to everyone: Morning Altar, Pursuits and calendar (including the three Hebrew calendars), Word for Today, About Me (voice, greeting, access PIN), Communications (Email, Chats, Amit Helper, Amit Mouse), the AmitChat engine, the Connect Amit flow, and a sidebar of the Amit tools. The profile architecture and the Hebrew calendar architecture below are the permanent design. Detail: Sessions_Start.md.

## SESSION RECORD

Current state, to-dos and history live in this folder's Sessions files, not here. A new session reads Sessions_Start.md first (short). Read Sessions_ToDo.md only when asked about to-dos; read Sessions_Log.md or the original Claude session only when asked; the backup files in Backups\Hub\Sessions_backup_*.md only for research.

## PROFILE ARCHITECTURE — How a Person's History Actually Connects (added 2026-07-29)

Two tables, two different jobs — do not confuse them or write to the wrong one:

- **`user_growth_log`** — the real history. One row per observation, many rows per person, `category` + `entry` + `created_at`, never overwritten. This is where communication-style preferences (see the "how I talk" shortcut), spiritual-compass tier changes (see `_syncCompass()` below), key moments, and anything else worth remembering as a dated fact all live. If a future session needs to know someone's actual history — not just their current state — query this table by `user_id`, ordered by `created_at`.
- **`user_memory`** — the current synthesis. One row per person, big text fields (`summary`, `communication_style`, `spiritual_background`, `known_facts`) representing the latest understanding. This is what gets read quickly at session start. It should be periodically re-synthesized FROM `user_growth_log`, not hand-maintained as a separate source of truth.
- **`users.compass_score/compass_tier/compass_signals`** — the fast current-state compass reading, written by `_syncCompass()` on every signal change (unchanged, still fires every time). As of 2026-07-29, `_syncCompass()` also writes a dated row to `user_growth_log` (`category='spiritual_compass'`) whenever the tier itself actually changes — a real milestone, not a row per tiny signal increment. This is the connection Ryan asked to make sure existed: the Hub's spiritual-growth tracking is not just a snapshot that gets silently overwritten anymore, it has a real dated history now.

Any future module reading someone's profile should follow this same pattern: read `user_memory` for the fast current picture, query `user_growth_log` when the actual history/timeline matters.

## Pending Work
Pending work lives in this folder's Sessions_ToDo.md, not here.

This is the Amit Hub. The daily home screen. The entry point for everything.

## What This Is
The Hub is the face of the entire Amit system. Free to everyone. When someone installs Amit, this is what they see first — every morning, every day.

## Current Build File
`amit-hub.html` — self-contained, opens in any browser, no server required. All state in localStorage.

---

## HEBREW CALENDAR — CURRENT ARCHITECTURE (Ryan's final directive, session 3)

Design reference: moved to Sessions_Design.md (section 'HEBREW CALENDAR — CURRENT ARCHITECTURE (Ryan's final directive, session 3)') - the Hebrew calendar design: one grid, two sides, cell layout, visual theology, feasts, Shemita, Jubilee and date conversion.

## File Paths
- Hub file: `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Hub\amit-hub.html`
- Who Is God: `C:\Users\user1\OneDrive\Documents - onedrive\Amit\who_is_god\who_is_god.html`
- Companion: `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Companion\Amit_Companion.html`
- Computer Value: `C:\Users\user1\OneDrive\Documents - onedrive\Amit\ComputerValue\` (not yet built)

## Connection to the Amit System
This is part of the Amit system — one character, one mission. The Hub is the daily face. Everything flows through here. Computer Value funds it. Who Is God grounds it. The Companion walks alongside.
