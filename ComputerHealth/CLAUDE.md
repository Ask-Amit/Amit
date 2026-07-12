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

In active development, 2026-07-12 (single extended session). Live at `https://ask-amit.github.io/Amit/ComputerHealth/ComputerHealth_Dashboard.html`, version v2.43 as of last push. Repo mirror: `C:\Users\user1\GitHub\Amit\ComputerHealth\`. Dev/working copies of all scripts live in `AmitLog\Watchers\` (OneDrive) and get copied to the git repo before each push — always edit the OneDrive copy first, then copy to the repo, per the standard Amit push workflow.

**Built, tested, and pushed:**
- Five watcher/tool scripts in `AmitLog\Watchers\`: `activity_watcher2.ps1`, `resource_watcher.ps1` (pre-existing) plus `diagnostics_watcher.ps1`, `app_behavior_watcher.ps1`, `install_snapshot_watcher.ps1` (new this session).
- `amit_bridge_server.ps1` — local HTTP server (port 8710), portable via `$PSScriptRoot` (not hardcoded to Ryan's OneDrive path). Handles concurrent requests via a runspace pool (fixed a real hang bug: Windows PowerShell 5.1's `ConvertTo-Json` stalls on a cold runspace's first call — log-tail endpoints now hand-build JSON instead). Exposes `/api/device`, `/api/resource`, `/api/diagnostics`, `/api/activity`, `/api/behavior`, `/api/browser`, `/api/tracker-status`, `/api/start-tracking`, `/api/stop-tracking`, `/api/install-start`, `/api/install-compare`.
- `ComputerHealth_Dashboard.html` — tabs: Overview, Resources, Diagnostics, App Behavior, Install Watch, Browser, History. Plain-language verdict cards throughout, not raw numbers. Sign-in nudge (non-blocking), session-summary screen (`?justStopped=1`), pre-install walkthrough with a real Download link.
- `Install_AmitTracker.ps1` — idempotent, checks for an existing LibreHardwareMonitor install in common locations (Downloads, Program Files, its own folder) before downloading a duplicate — this was a real bug caught by Ryan during live testing (two LHM instances running simultaneously, one needing a .NET runtime the other didn't). Works standalone (downloads sibling files from GitHub raw if run outside a full local copy) or from a full copy. Creates `Amit.url` desktop shortcut (opens the **Hub**, not Computer Health directly — login happens there first, so device claiming ties to the right user) and registers the `amit-tracker://` protocol handler. Deliberately does NOT register any Task Scheduler/login auto-start (Ryan's explicit choice) — tracking only ever starts when a human explicitly triggers it.
- `AmitTracker.exe` — compiled C# (via `csc.exe`, no Visual Studio needed), source in `AmitLog\Watchers\AmitTracker\`. Real embedded file metadata (`FileDescription`/`ProductName` = "Amit Tracker") so Windows' permission dialogs show that name instead of "Windows PowerShell". Runs as a persistent system tray icon (not fire-and-exit) — shows "Amit Tracker - Running", right-click menu with Open Dashboard / Stop Tracker. Stop Tracker calls `/api/stop-tracking`, then opens the dashboard with `?justStopped=1` so the browser (already authenticated) logs the session-end event to Supabase — the exe itself never touches Supabase directly.
- `amit_icon.ico` (`generate_amit_icon.ps1`) — gold (`#d4af37`) Paleo-Hebrew Aleph ox-head pictograph on dark (`#12141a`) circle, rendered from the project's own `who_is_god\ancheb2.ttf` font (Hebrew Aleph codepoint U+05D0 renders as the pictograph in that font — confirmed by test render), not a generic Latin "A". Centering required measuring actual ink pixel bounds, not font metrics (the font's bounding box has large built-in whitespace that threw off naive centering).
- Supabase schema written (`migration_2026-07-12_001_computer_health.sql`, pushed to repo) — **NOT YET RUN.** Ryan must paste into Supabase SQL Editor before any device/event data can actually be written — sign-in and History are non-functional until this happens.

**Known gap, not yet built:** the dashboard's "not running" screen doesn't yet distinguish "never installed" from "installed but not currently running" — it needs to remember (via a localStorage marker set the first time `/api/device` ever succeeds) which screen to show: full install walkthrough vs. a direct "Launch Tracker" button. Without this, someone who's never installed could click Launch Tracker and have it silently fail (unregistered custom protocols fail silently in browsers, no error surfaces).

**Also raised, not yet decided:** whether "Install Amit Locally" should also have an entry point on the Hub itself (`amit-hub.html`), not just inside Computer Health's not-running screen. Not built — would mean editing Hub's shared file, which needs explicit confirmation before touching (see chat history 2026-07-12).

## Build Notes

- Watcher scripts, the bridge server, the dashboard, the installer, the tray exe, and the icon generator all live in `AmitLog\Watchers\` (dev) — they're shared infrastructure conceptually, but in practice this folder is the actual Computer Health build location. `ComputerHealth\` (this folder) holds only `CLAUDE.md` and is otherwise a staging/mirror target for the git repo.
- Device ID is generated once per machine on first run by the bridge server and stored in `device_id.txt` next to it — persists across restarts, independent of login state.
- Ownership transfer (selling/giving away a computer) is handled by updating `amit_devices.owner_user_id` and writing a row to `amit_device_ownership_history` — the device's full event history stays intact and is only visible to whoever currently owns it (RLS-enforced via `user_id` on each event). Not yet tested (blocked on the migration being run).
- File-write attribution in `app_behavior_watcher.ps1` is time-correlated, not proven via ETW — stated honestly in the dashboard, not presented as certain.
- Removal actions (from `install_snapshot_watcher.ps1 -Remove`) always back up before deleting and require an explicit approved-items list — Amit researches and recommends, the user approves, nothing self-executes.
- **Process discipline learned the hard way this session:** any local testing that could produce a visible pop-up (UAC prompts, installer windows, duplicate program instances) must be announced to Ryan *before* running it, not discovered by him mid-test. A live test surprised him with an unannounced UAC prompt and a duplicate LibreHardwareMonitor install requiring a `.NET Desktop Runtime` he didn't have — both fixed, but the real lesson is procedural: warn first, always, for anything that touches his actual screen.
- Windows icon caching is aggressive and doesn't reliably invalidate when a `.ico` file's content changes at the same path — `ie4uinit.exe -ClearIconCache` + Explorer restart is the fix when a stale icon is showing.
- `.lnk` shortcuts do not reliably support a plain web URL as `TargetPath` (silently ends up empty) — use a `.url` (Internet Shortcut, INI-format text file) for a desktop icon that opens a website.
- Git Bash mangles single-slash flags like `/target:` when calling Windows CLI tools (e.g. `csc.exe`) — use `//target:` (double slash) to escape MSYS path conversion.

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
