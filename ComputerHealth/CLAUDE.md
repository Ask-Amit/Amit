# Amit Computer Health — Project Context

## SESSION LOCATION CHECK — Read First, Every Session

If a session starts in this folder, before anything else: stop and tell Ryan plainly —

"You're in ComputerHealth, not the main Amit folder. Please close this and reopen VS Code at `C:\Users\user1\OneDrive\Documents - onedrive\Amit\` — that's where all development happens. Nothing has been built yet beyond what's noted below; this is just a heads-up before we start."

Do not proceed with any build request until Ryan confirms he wants to continue here anyway, or has switched folders. Read-only actions (reading files, answering questions) are fine either way.

## Folder Confirmation
If you are reading this file, you are in: `C:\Users\user1\OneDrive\Documents - onedrive\Amit\ComputerHealth\`
All Computer Health development files belong here. Do not create Computer Health files anywhere else. But per the Session Location Check above, development should happen from the root Amit folder, not here directly.

---

## Who Amit Is — Carried Forward Into This Project

This project is part of the Amit system. One character. One mission.

**Amit** is a Hebrew name meaning companion — one who walks alongside. The full identity, testimony, and theological conclusions live in:
- `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Amit_Testimony.md` — the full living testimony
- `C:\Users\user1\OneDrive\Documents - onedrive\Amit\CLAUDE.md` — the master orientation file

Every Amit project carries the same voice, the same mission, the same God:
- His name is **Yahweh — יהוה — YHVH**. Not LORD. His personal name, given in Exodus 3:15 forever.
- Yeshua is who the Hebrew prophets said He would be.
- Torah was never abolished. 97% confidence.
- Walk alongside. Sharpen without cutting. Encourage always. Never condemn.

This project serves that mission by extending "companion" from spiritual life and health into the machine itself. Amit doesn't just log what a computer is doing — it explains what's happening in plain language, gives a verdict, and walks the person through fixing it, the same posture Amit takes everywhere else.

---

## Database Connection

This project reads from and writes to the shared Amit Supabase database.

**Full connection reference (snippet, credentials, auth pattern):**
→ `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Database\CLAUDE.md` — read the HOW TO CONNECT section

**Credentials (never commit to GitHub):**
→ `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Database\supabase_config.md`

**Tables this project uses:**
- `amit_devices` — device registry, one row per physical machine, tied to `owner_user_id`. Supports ownership transfer (a computer can be sold/given away — history preserved in `amit_device_ownership_history`).
- `amit_device_ownership_history` — audit trail of every ownership transfer for a device.
- `amit_device_events` — the actual log. One row per detected event (install diff, resource anomaly, behavior flag, removal action). `event_detail` is JSONB holding the full structured data; `summary` is the plain-language one-liner for the dashboard. This is what lets a user come back a year later and ask "what happened to this computer."
- Standard `users` (Supabase auth) — login is via the same magic-link pattern as every other Amit app.

Schema defined in: `Database\migration_2026-07-12_001_computer_health.sql`

**Tables this project does NOT touch:**
- `hub_entries`, `hub_reflections`, `compass_profiles` — Hub's tables
- `accounting_*` — AmitAccounting's tables
- Companion tables (`user_profiles`, `user_history`, etc.)

---

## What This Project Is

A background monitoring and diagnostic companion that lives on a user's computer. Four local watcher scripts (in `AmitLog\Watchers\`, shared infrastructure) continuously or on-demand capture: system resource usage (RAM/CPU/GPU/temps), input-lag causes (DPC/interrupt/disk/network), per-app behavior (file writes, network destinations) during a session, and install diffs (everything a new program silently adds — Startup entries, scheduled tasks, browser extensions, homepage hijacks). A local bridge server exposes this data and controls to an HTML dashboard that translates raw sensor/log data into plain language ("90% of your RAM is in use" instead of "7.385 GB") with a verdict (safe / watch / fix now), rather than requiring the user to know what any of the numbers mean.

Every detected event is pushed to Supabase, tied to a device ID and the logged-in user, so history persists permanently — not just in a local temp file that gets capped and lost. A user can return months or years later and ask "what got installed and when," "what caused this slowdown," or "what changed since last time."

## Purpose Within the Amit System

Sibling to Amit Health (personal/body) — this is Amit watching over the machine instead of the person. Distinct from Amit Computer Value (the one-time paid diagnostic report / revenue engine): Computer Health is the ongoing, continuously-running companion, not a single report. The two may eventually share data (a Computer Value report could pull from Computer Health's history) but are separate modules.

## Current Status

In development, 2026-07-12. Built so far:
- Four watcher scripts (`activity_watcher2.ps1`, `resource_watcher.ps1` — pre-existing; `diagnostics_watcher.ps1`, `app_behavior_watcher.ps1`, `install_snapshot_watcher.ps1` — new, built and tested this session) — all in `AmitLog\Watchers\`, shared with the rest of the Amit system's diagnostic tooling.
- Supabase schema written (`migration_2026-07-12_001_computer_health.sql`) — NOT YET RUN. Ryan must paste into Supabase SQL Editor before any device/event data can be written.
- Bridge server and dashboard: in progress this session.

## Build Notes

- Watcher scripts live in `AmitLog\Watchers\`, not this folder — they're shared infrastructure, not Computer-Health-exclusive. This folder holds the dashboard, bridge server, and Computer-Health-specific logic (device ID handling, Supabase event push, plain-language translation layer).
- Device ID is generated once per machine on first run and stored locally (see bridge server for exact mechanism) — this is what ties events to a specific physical computer across the Supabase tables, independent of login state.
- Ownership transfer (selling/giving away a computer) is handled by updating `amit_devices.owner_user_id` and writing a row to `amit_device_ownership_history` — the device's full event history stays intact and is only visible to whoever currently owns it (RLS-enforced via `user_id` on each event).
- File-write attribution in `app_behavior_watcher.ps1` is time-correlated, not proven via ETW — stated honestly in the dashboard, not presented as certain.
- Removal actions (from `install_snapshot_watcher.ps1 -Remove`) always back up before deleting and require an explicit approved-items list — Amit researches and recommends, the user approves, nothing self-executes.

## Connection to Other Apps

- **Hub** — same login pattern (Supabase magic link), same "one Amit system" feel. Could eventually surface Computer Health alerts as Hub pursuits ("your PC flagged 3 new startup items — review them").
- **Computer Value** — sibling diagnostic module; may share device history data in the future.
- **Database** — new tables (`amit_devices`, `amit_device_ownership_history`, `amit_device_events`) live in the shared schema, documented in `Database\CLAUDE.md` once the migration is run.

---

## Read Every Session

Before working in this folder, read in order:
1. `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Amit_Testimony.md`
2. `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Amit_RyanProfile.md`
3. `C:\Users\user1\OneDrive\Documents - onedrive\Amit\CLAUDE.md`
4. `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Database\CLAUDE.md` — system-wide data map

All behavioral rules, partnership standards, and task lists are in the root CLAUDE.md.

---

*Developer: Ryan | Identifier: 851379456*
*Part of the Amit System — C:\Users\user1\OneDrive\Documents - onedrive\Amit\*
