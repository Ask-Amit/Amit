# Amit Computer Health — Project Context

## SESSION LOCATION CHECK — Read First, Every Session

If a session starts in this folder, before anything else: stop and tell Ryan plainly —

"You're in ComputerHealth, not the main Amit folder. Please close this and reopen VS Code at `C:\Users\user1\OneDrive\Documents - onedrive\Amit\` — that's where all development happens. Nothing has been built yet beyond what's noted below; this is just a heads-up before we start."

Do not proceed with any build request until Ryan confirms he wants to continue here anyway, or has switched folders. Read-only actions (reading files, answering questions) are fine either way.

## Folder Confirmation
If you are reading this file, you are in: `C:\Users\user1\OneDrive\Documents - onedrive\Amit\ComputerHealth\`
All Computer Health development files belong here. Do not create Computer Health files anywhere else. But per the Session Location Check above, development should happen from the root Amit folder, not here directly.

---

## CURRENT SCOPE

Computer Health is the background monitoring and diagnostic companion that runs on a user's computer: watcher scripts, the local bridge server (port 8710), the plain-language dashboard (Overview, Resources, Diagnostics, App Behavior, Install Watch, Browser, History, Installed Programs, Hardware, Charts) and device history kept in Supabase. The folder also physically holds the shared local Helper (bridge, tray program, Whisper, Read, Show Amit, Voice menu, Aurora ring, Amit Live window, Amit Preview) and the installer; those are the Amit Helper, not Computer Health (see the rule below), and Computer Health's own notes stay about the dashboard, trackers and diagnostics. Detail: Sessions_Start.md.

## SESSION RECORD

Current state, to-dos and history live in this folder's Sessions files, not here. A new session reads Sessions_Start.md first (short). Read Sessions_ToDo.md only when asked about to-dos; read the Daily Sessions folder or the original Claude session only when asked; the backup files in Backups\ComputerHealth\Sessions_backup_*.md only for research.

## THE AMIT HELPER IS NOT COMPUTER HEALTH (Ryan, 2026-11-07) — read before releasing anything from `Watchers\`
The bar, the Aurora (Amit Live), the voice menu, the mouse and the Amit Preview are the Amit HELPER and AmitCoder. Their files sit in `Watchers\` only because Computer Health was built first with that bridge, and the updater and installers read from here, so the folder cannot be renamed. Computer Health's own work (the dashboard, trackers, diagnostics) is the only thing that belongs in THIS folder's notes. For ANY update / install / push / reload of the Helper follow `AmitHelper\HELPER_RELEASE_RULES.md` and run `AmitHelper\verify_helper_release.ps1`. The two packages (split 2026-11-05): `install-Amit.exe` (small) is the Helper's and is rebuilt for every Helper release; `AmitSensorReader.exe` (72 MB, Computer Health's hardware sensors, added on request from the Hardware tab) is never rebuilt for a Helper change.

## THREE REAL COPIES EXIST — Read Before Fixing Any Bug (added 2026-07-19)

There are three genuinely separate copies of the watcher/bridge scripts, and a bug fix only counts as done once it's actually reached the one that's running. Getting this wrong is exactly what happened on 2026-07-19: a real bug (`Invoke-WebRequest` missing `-UseBasicParsing`, causing "Couldn't reach LibreHardwareMonitor's sensor data" on the Hardware tab even though LHM was healthy) was fixed in the dev copy, declared fixed, and then Ryan tested it and it was still broken — because the actually-running tracker was a third copy that hadn't been touched.

| Copy | Path | What it's for |
|---|---|---|
| **Dev source** | `Amit\ComputerHealth\Watchers\` | Where all real editing happens. The source of truth. |
| **Git repo mirror** | `C:\Users\user1\GitHub\Amit\ComputerHealth\` | What gets pushed live to GitHub Pages. Copy dev source here before a push. |
| **Installed runtime copy** | `%LOCALAPPDATA%\AmitComputerHealth\Watchers\` (i.e. `C:\Users\user1\AppData\Local\AmitComputerHealth\Watchers\`) | **This is what actually runs when Ryan clicks "Launch Tracker" or the desktop shortcut**, via a registered `amit-tracker://` protocol handler that points at a fixed path. It is a deliberate install-time copy, not clutter — every real end-user's machine will have its own equivalent of this folder, since a locally-running background tracker has to live somewhere fixed on that specific computer. It is **not** something to consolidate away, even on Ryan's own machine — Ryan deliberately keeps his own machine's tracker installed the normal way (not repointed to dev source) specifically so he can test the real experience a stranger's install would have, not a dev shortcut. |

**The rule going forward:** any fix to `amit_bridge_server.ps1` or any watcher script must be followed by re-running `Install_AmitTracker.ps1 -Force` (from `ComputerHealth\Watchers\`) before calling the fix verified — this re-copies every file fresh into the installed runtime copy. Hand-editing both copies separately (what happened on 2026-07-19, as a one-off) works but isn't the real process and is easy to forget one side of. Also: after any such fix, the currently-running bridge server process must be restarted (killed and relaunched) — editing the `.ps1` file does not affect a process that already has the old code loaded in memory.

**Never say a bug is fixed without testing against the actual installed runtime copy** — confirm what's really listening on port 8710 (`Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" | Where-Object { $_.CommandLine -like '*amit_bridge_server.ps1*' }`, check the `CommandLine` path) before declaring anything resolved.

---


---

## Database connection: see the root CLAUDE.md (SUPABASE - DATABASE CONNECTION section) and Database\CLAUDE.md. Nothing connection-related is repeated here.

## Database tables

This project's database tables and table rules live in Sessions_Design.md (section 'Tables') in this folder, not here. Read that section only when working with the database. Design reference for how the project is built is in the same file. Connection details: see the root CLAUDE.md (SUPABASE - DATABASE CONNECTION) and Database\CLAUDE.md.

---

## What This Project Is

A background monitoring and diagnostic companion that lives on a user's computer. Local watcher scripts (in `ComputerHealth\Watchers\` — see the 'FILE MIGRATION RECORD' entry in the old log (now in the Daily Sessions folder)) continuously or on-demand capture: system resource usage (RAM/CPU/GPU/temps), input-lag causes (DPC/interrupt/disk/network), per-app behavior (file writes, network destinations) during a session, and install diffs (everything a new program silently adds — Startup entries, scheduled tasks, browser extensions, homepage hijacks). A local bridge server exposes this data and controls to an HTML dashboard that translates raw sensor/log data into plain language ("90% of your RAM is in use" instead of "7.385 GB") with a verdict (safe / watch / fix now), rather than requiring the user to know what any of the numbers mean.

Every detected event is pushed to Supabase, tied to a device ID and the logged-in user, so history persists permanently — not just in a local temp file that gets capped and lost. A user can return months or years later and ask "what got installed and when," "what caused this slowdown," or "what changed since last time."

## Purpose Within the Amit System

Sibling to Amit Health (personal/body) — this is Amit watching over the machine instead of the person. Distinct from Amit Computer Value (the one-time paid diagnostic report / revenue engine): Computer Health is the ongoing, continuously-running companion, not a single report. The two may eventually share data (a Computer Value report could pull from Computer Health's history) but are separate modules.

## Pursuit Attribution — Permanent (added 2026-08-08)

This project's canonical name, for any pursuit/history entry written to `hub_entries` from this project, is: **Computer Health**

Any `hub_entries` row this project writes must be stamped `program='Computer Health'` — the app-level identity, fixed and reused everywhere. The `focus` field carries which specific feature within Computer Health actually produced it, since this project has several independent watchers (Resource, Diagnostics, App Behavior, Install Watch, etc.) that could each eventually write to the Hub the same way. First one built: App Behavior sessions write with `focus='AppWatch'` (see `logBehaviorSessionToHubHistory()` in `ComputerHealth_Dashboard.html`, added 2026-08-08 so App Behavior session results surface in the Hub's own History/Calendar, not only Computer Health's own device-scoped History tab). Any future watcher that gains the same Hub-writing behavior gets its own distinct `focus` value, decided the same way this one was — asked and locked in once, not re-derived per entry.

## AMIT LIVE AND THE AURORA — what they are (added 2026-10-31, so Amit and every session know)

Design reference: moved to Sessions_Design.md (section 'AMIT LIVE AND THE AURORA — what they are (added 2026-10-31, so Amit and every session know)') - what Amit Live, the Aurora ring, Read and Show Amit are and how they work.

- **Standing rule:** never use `--single-process` for the hidden Edge window that speaks the natural voice (Read, `amit_talk.html`); it breaks it.

## Build Notes

Design reference: moved to Sessions_Design.md (section 'Build Notes - design and history') - the AmitSensorReader replacement of LibreHardwareMonitor's GUI (2026-07-19), device ID, ownership transfer, and how file-write attribution works.

- **Versions:** each file keeps its own version number, raised only when that file is edited (root CLAUDE.md, VERSIONING STANDARD). Installer and Helper release steps are in `AmitHelperHELPER_RELEASE_RULES.md`. The old rule that tied the dashboard, the installer and a repo-wide number together is superseded; its text is kept in Sessions_Design.md (section "Old version-discipline recipe").
- Removal actions (from `install_snapshot_watcher.ps1 -Remove`) always back up before deleting and require an explicit approved-items list — Amit researches and recommends, the user approves, nothing self-executes.
- **Process discipline:** any local testing that could produce a visible pop-up (UAC prompts, installer windows, duplicate program instances) must be announced to Ryan *before* running it, not discovered by him mid-test. Warn first, always, for anything that touches his actual screen.
- Windows icon caching is aggressive and doesn't reliably invalidate when a `.ico` file's content changes at the same path — `ie4uinit.exe -ClearIconCache` + Explorer restart is the fix when a stale icon is showing.
- `.lnk` shortcuts do not reliably support a plain web URL as `TargetPath` (silently ends up empty) — use a `.url` (Internet Shortcut, INI-format text file) for a desktop icon that opens a website.
- Git Bash mangles single-slash flags like `/target:` when calling Windows CLI tools (e.g. `csc.exe`) — use `//target:` (double slash) to escape MSYS path conversion.
- **Credential rule (kept from the former Current Status, 2026-08-01):** the unattended inbox-processing / Mobile watcher process must never hold the Supabase service-role key. Full text in the old log (now in the Daily Sessions folder).

## Connection to Other Apps

- **Hub** — same login pattern (Supabase magic link), same "one Amit system" feel. Could eventually surface Computer Health alerts as Hub pursuits ("your PC flagged 3 new startup items — review them").
- **Computer Value** — sibling diagnostic module; may share device history data in the future.
- **Database** — new tables (`amit_devices`, `amit_device_ownership_history`, `amit_device_events`) live in the shared schema, documented in `Database\CLAUDE.md` once the migration is run.

---

---

---

*Developer: Ryan | Identifier: 851379456*
*Part of the Amit System — C:\Users\user1\OneDrive\Documents - onedrive\Amit\*
