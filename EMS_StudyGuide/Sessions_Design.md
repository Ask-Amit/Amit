# EMS Study Guide - Design and tables

Read the section '## Tables' first when you only need the database tables. The other sections (if any) describe how the project is built; read them only when working on that part.

## Tables

# Tables used by this project

Tables used by this project (copied from CLAUDE.md 2026-11-14)

## Database Connection — Updated 2026-07-27, no longer "none"

**Guests (not logged in through Amit):** unchanged — pure `localStorage` (key `medicprep_v1`), no account, nothing sent anywhere.

**Logged-in users:** this page now shares the same Supabase auth session the Hub creates (same origin, `ask-amit.github.io` — no separate login screen here, `initSupabaseSync()` just detects the existing session via `mpDb.auth.getSession()`/`onAuthStateChange`). Their whole progress blob (history, streaks, level profile, study goal/exam date, exam sets/scores — NOT the question bank itself) mirrors to one row in `medical_prep_progress` (`user_id` primary key, `data` jsonb), debounced ~1.2s after every `saveData()` call via `queueCloudPush()`. On login, cloud is authoritative — `loadCloudProgress()` overwrites local with the cloud row if one exists, so the same account shows the same progress on any device. See `Database\migration_2026-07-27_001_medical_prep_progress.sql` (executed) and `Database\CLAUDE.md`.

**Hub Pursuits integration:** if a logged-in user sets a real exam date (the date-picker in the goal modal, not just a relative duration), `syncHubPursuits()` writes real Pursuits into their own Hub via the existing `hub_entries` table (`kind='pursuit'`, `focus='Medical Prep'`) — one practice reminder per weak/undertrained domain, staggered back from the exam date, priority escalating (P3→P1) as the date approaches, plus one starred anchor pursuit for the exam day itself. Duplicate-checked by exact title before writing (queries existing `focus='Medical Prep'` pursuits first) per the system-wide no-duplicate-pursuits rule — never inserts a second pursuit for the same thing, updates the existing one's due date/priority instead. Runs on: setting/changing the goal, and once after a logged-in user's cloud progress loads if a goal is already set. Fails silently if it errors — pursuits are a bonus layer on top of the core app, not load-bearing.
