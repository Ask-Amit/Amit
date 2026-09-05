# Amit Computer Health — Sessions Log

Fast, no-bloat running record of current state. Read this first when opening a new session in this folder — say "read Sessions Computer Health" and this is what should load. Full behavioral/identity rules still come from root CLAUDE.md; this file is state only, not character.

**Update rule:** update the "Current State" block below continuously while working — don't wait for session close. At save-and-summarize/compact, add one short dated entry to the Log below (what changed, why) and refresh Current State. Keep entries terse.

---

## Current State

- **Dashboard:** `ComputerHealth_Dashboard.html`, page v3.74 as of last push. Live at `https://ask-amit.github.io/Amit/ComputerHealth/ComputerHealth_Dashboard.html`.
- **Installer:** `install-Amit.exe`, `CURRENT_VERSION` 4.34 — rebuilt and hash-verified 2026-08-02 after being found 22 versions stale.
- **Three real copies exist** — dev source (`ComputerHealth\Watchers\`), git repo mirror (`GitHub\Amit\ComputerHealth\`), installed runtime (`%LOCALAPPDATA%\AmitComputerHealth\Watchers\`). A fix only counts once it reaches the installed runtime copy — always re-run `Install_AmitTracker.ps1 -Force` and restart the bridge process after any watcher/bridge script change.
- **Bridge server** (`amit_bridge_server.ps1`, port 8710) now serves more than Computer Health — added `/scan` endpoint (2026-08-01) for AmitBooks' AmitScan, and `/amit-inbox` + `/amit-process-inbox` for unattended receipt processing via local Claude Code CLI. This is the shared "one local Amit Agent" per the Single Local Connection Standard — any new app needing local/desktop access extends this bridge, never builds its own.
- **Mac:** browser-facing pages already work (no OS dependency). Local agent (`amit_bridge_server.ps1`, WIA scanning, `process_inbox.bat`) is Windows-only — no Mac equivalent built, not started.
- **Blocked / pending:**
  - `Database\migration_2026-07-19_001_installed_programs.sql` — Installed Programs tab built but non-functional until run in Supabase.
  - Rename `AmitTracker.exe` → `Amit.exe` + purpose-aware launch (`?purpose=scan` vs `?purpose=track`) — deliberately deferred, touches protocol handler/shortcuts/installer together.
  - Composite grading system — Ryan flagged wanting to revisit, unfinished review.
  - "Verify Conditions" paid tier — teaser button live, real checking (winget version-check, driver updates, malware research) not built.

---

## Log

**2026-09-05 — Performance tracking now auto-starts by default (changed for Amit Mobile's "Connect Amit" feature, affects Computer Health's own default behavior).** `amit_bridge_server.ps1` now auto-calls its own `/api/start-tracking` a couple seconds after the bridge starts, unless `$env:TEMP\amit_tracking_disabled.flag` exists. `/api/stop-tracking` now creates that flag (stopping tracking via the dashboard's existing button now also survives a bridge restart, not just the current run); `/api/start-tracking` clears it. No new endpoints, no change to what Start-Tracking()/Stop-Tracking() themselves do — this only changes when Start-Tracking() gets called automatically. Dev source only (`ComputerHealth\Watchers\amit_bridge_server.ps1`) — the installed runtime copy at `%LOCALAPPDATA%\AmitComputerHealth\Watchers\` was not re-synced this pass; re-run `Install_AmitTracker.ps1 -Force` and restart the bridge before this is live on Ryan's actual running instance. See `AmitMobile\CLAUDE.md`'s "Connect Amit" section for the full origin/reasoning.

**Also caught and fixed while making that change: a real pre-existing parse-breaking bug, unrelated to the tracking feature itself.** The Amit Mobile listener's `Write-Host` line (added in an earlier 2026-09-05 session) contained a literal em dash inside a double-quoted string — confirmed via `[System.Management.Automation.Language.Parser]::ParseFile()` to corrupt PowerShell 5.1's parsing of the ENTIRE rest of the file (the exact failure mode already documented above under "an em dash in a new string literal corrupted PowerShell 5.1's parsing" from the `/scan` endpoint work — it had recurred). Replaced with a plain hyphen; full-file parse now confirmed clean (0 errors). This means the dev-source bridge script was silently broken (would have failed to even load) before this fix — worth flagging since it wasn't part of the original ask.

**2026-08-04 — Sessions.md system stood up (cross-project, not Computer Health-specific).**
This file, and matching `Sessions.md` files, were created across every live-HTML project folder (AmitBooks, ComputerHealth, Hub, who_is_god, Companion, ComputerValue, AmitCoder, TheCouncil, EMS_StudyGuide, "Amit, Are You There", AmitHealth). Root CLAUDE.md now has a SESSION FILE CHECK directive requiring the local Sessions.md be read before responding to the first message of any session opened in a folder that has one. New `J Save` shortcut created (trigger: `save`) to snapshot Current State + append a Log entry, without pushing to GitHub.

**2026-08-02 — Installer drift caught and fixed.** Dashboard got Watch/Investigate click-through tutorials + detail views on Performance cards, pushed v4.34. Ryan asked whether the installer needed updating too — found `CURRENT_VERSION` still `"4.12"`, 22 versions stale. Rebuilt via `build_installer.sh`, verified byte-identical, hash-confirmed across dev/runtime/installer copies, pushed.

**2026-08-01 — Bridge server extended for AmitBooks.** Added `/scan` (WIA scanner/printer capture) and the unattended-processing pipeline (`/amit-inbox`, `/amit-process-inbox` → `process_inbox.bat` → local Claude Code CLI one-shot run, triggered by "Send Selected to Local Processing," not a polling loop). Uses the signed-in user's own access token, never the Supabase service-role key, so RLS still scopes data per-user even in the unattended path. Node.js + Claude Code CLI added to installer setup steps.

**2026-07-19 — File location migration + real bug fixes.** All dev files moved from `AmitLog\` (never actually a Computer Health folder — just where the Claude Code session-junction happened to live) into `ComputerHealth\`/`ComputerHealth\Watchers\`, verified byte-identical, old path deliberately broken to confirm nothing depended on it. Fixed NVMe false-positive temperature flagging (manufacturer safety-limit constants misread as live readings), chart Y-axis unit bug, two-version-number confusion (Computer Health badge vs. repo-wide VERSION).

**2026-07-18 — Session 55, full-day build.** Drill-down gauge tree backed by `amit_component_registry` (217 real sensors), 75/10/15 worst-weighted composite scoring, native Charts tab, unified session-verdict logic, Kingston SSD misclassification fix.

---

*Part of the Amit System. Full identity/behavioral rules: root CLAUDE.md.*
