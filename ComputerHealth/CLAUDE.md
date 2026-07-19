# Amit Computer Health — Project Context

## SESSION LOCATION CHECK — Read First, Every Session

If a session starts in this folder, before anything else: stop and tell Ryan plainly —

"You're in ComputerHealth, not the main Amit folder. Please close this and reopen VS Code at `C:\Users\user1\OneDrive\Documents - onedrive\Amit\` — that's where all development happens. Nothing has been built yet beyond what's noted below; this is just a heads-up before we start."

Do not proceed with any build request until Ryan confirms he wants to continue here anyway, or has switched folders. Read-only actions (reading files, answering questions) are fine either way.

## Folder Confirmation
If you are reading this file, you are in: `C:\Users\user1\OneDrive\Documents - onedrive\Amit\ComputerHealth\`
All Computer Health development files belong here. Do not create Computer Health files anywhere else. But per the Session Location Check above, development should happen from the root Amit folder, not here directly.

---

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

A background monitoring and diagnostic companion that lives on a user's computer. Local watcher scripts (in `ComputerHealth\Watchers\` — see FILE LOCATION MIGRATION below) continuously or on-demand capture: system resource usage (RAM/CPU/GPU/temps), input-lag causes (DPC/interrupt/disk/network), per-app behavior (file writes, network destinations) during a session, and install diffs (everything a new program silently adds — Startup entries, scheduled tasks, browser extensions, homepage hijacks). A local bridge server exposes this data and controls to an HTML dashboard that translates raw sensor/log data into plain language ("90% of your RAM is in use" instead of "7.385 GB") with a verdict (safe / watch / fix now), rather than requiring the user to know what any of the numbers mean.

Every detected event is pushed to Supabase, tied to a device ID and the logged-in user, so history persists permanently — not just in a local temp file that gets capped and lost. A user can return months or years later and ask "what got installed and when," "what caused this slowdown," or "what changed since last time."

## Purpose Within the Amit System

Sibling to Amit Health (personal/body) — this is Amit watching over the machine instead of the person. Distinct from Amit Computer Value (the one-time paid diagnostic report / revenue engine): Computer Health is the ongoing, continuously-running companion, not a single report. The two may eventually share data (a Computer Value report could pull from Computer Health's history) but are separate modules.

## Current Status

Last touched Session 55 (2026-07-18) — a full-day marathon, no other Amit module touched that session. Live at `https://ask-amit.github.io/Amit/ComputerHealth/ComputerHealth_Dashboard.html`, page version v3.74 as of last push (this page tracks its own version number, separate from the repo-wide `VERSION`/CLAUDE.md counter — the two are intentionally different numbers). Repo mirror: `C:\Users\user1\GitHub\Amit\ComputerHealth\`.

**FILE LOCATION MIGRATION (2026-07-19), COMPLETE:** All dev/working files (dashboard, bridge server, watcher scripts, tracker exe, installer bundle, `Hardware_Crash_Log.md`, `Computer_Specs_and_History.html`, the two `DisableBadUSB*.ps1` scripts) moved out of `AmitLog\` / `AmitLog\Watchers\` into this folder (`ComputerHealth\` and `ComputerHealth\Watchers\`) so this folder actually holds everything the project name promises. **`AmitLog` was never a Computer Health folder** — it's the fixed target of an NTFS junction (`C:\Users\user1\.claude\projects` → `AmitLog`) that backs every Claude Code session transcript system-wide; Computer Health's files had just been dropped into it over time. `AmitLog` itself was never moved or renamed, since doing so would break that junction.

Process: (1) copied everything to `ComputerHealth\`/`ComputerHealth\Watchers\` first, verified byte-for-byte identical (41 files, 2,012,145 bytes both sides); (2) tested the bridge server launched from the new location — HTTP 200, correct version, real device API response, and a CORS check confirmed the live online dashboard (`ask-amit.github.io`) can genuinely reach it; (3) **then the originals were moved (not left as copies) into a new `AmitLog\ComputerHealth_Backup\` folder** — this deliberately breaks the old `AmitLog\Watchers\` path entirely, so if anything were still silently depending on it, it would fail now; (4) re-ran the identical test with the old path gone — identical results, proving `ComputerHealth\Watchers\` has no hidden dependency on the old location. `AmitLog\ComputerHealth_Backup\` is the current fallback copy if anything ever needs to be recovered. See the migration table further down this file for the exact list of what moved.

**Session 55 build (2026-07-18), most recent real work:** a drill-down gauge tree (Computer → CPU/GPU/RAM/Storage/Motherboard/Network/Software → categories → individual sensors) backed by a data-driven `amit_component_registry` table (217 real sensors classified from Ryan's machine) instead of hardcoded JS, plus a 75/10/15 worst-weighted composite scoring formula so one failing part honestly drags a parent grade down. A native Charts tab (Line/Bar/Scatter/Heat Map, this-session vs. cross-session-history, sensor "family" grouping via a universal digit-stripping rule so all 12 CPU cores or all RAM sticks chart together, natural sort, real per-cell value labels/legends) — this replaced two separate Copilot-based charting/voice handoffs, both built and then fully removed after live testing showed neither actually worked. Fixed a real bug where the quick session summary and the full report could disagree because they read from two different data sources — unified via `deriveSessionVerdictFromMetrics`. Also fixed: a Kingston SSD misclassified as RAM (regex `\b` boundary bug, five places), a Supabase 1000-row silent truncation on multi-session chart queries, a JS caching bug where an empty array's truthiness blocked retries, a stray bezel-ring line on the gauge. Built a live-data path (`resource_watcher.ps1` writes a live snapshot every ~30s) and a Software health category (Reliability/Security/Browser) from existing Windows API data.

**Session 2026-07-19, additional work this same evening (after the file-migration cleanup and version reconciliation above):** Found and fixed a real chart bug (Y-axis units were silently broken - `chGuessUnit` matched singular category names against LHM's actual plural ones, "Temperature" vs "Temperatures" - fixed, plus added real axis titles to Line/Bar/Scatter/Heat Map, all dynamic per selected sensor). Found and fixed a real false-positive bug: NVMe drives report their own fixed manufacturer safety-limit VALUES ("Critical Temperature", "Warning Temperature") as sensors sitting right next to the real live readings, and the flagging logic was treating those constants as live data, permanently flagging "Investigate: peaked at 84°C" regardless of the drive's real temperature (which was actually 40-41°C). Fixed two ways: (1) immediate name-based exclusion (warning/critical/threshold/limit), (2) a general, permanent history-based detector (`CH_CONSTANT_SENSOR_KEYS`/`chRefreshConstantSensorKeys`) that watches every sensor's own last 10+ session appearances and excludes anything that's never once moved, regardless of name or hardware - self-correcting, recomputed fresh each time. Added a `youngHistoryModal` popup, shown BEFORE (not alongside) any session report opens on a device with fewer than 10 tracked sessions, explaining plainly that some readings may be unconfirmed spec constants or unpopulated sensor headers, not real emergencies - had a real sequencing bug on first attempt (popup fired while the report was already rendering underneath it), fixed by making `openHistoryDetail()` a real gate (`actuallyOpenHistoryDetail()` only runs after the popup's "Understood" is clicked, or immediately if 10+ sessions exist).

**Also this session: the two-version-number confusion got fixed and documented as a permanent rule.** Computer Health's own dashboard badge had drifted to a different number than the repo-wide `VERSION`/CLAUDE.md counter, causing real confusion for Ryan. See "ONE NUMBER, EVERYWHERE" in the root CLAUDE.md's VERSIONING STANDARD - both numbers now move together on every push, everywhere, permanently.

**Also this session: new "Installed Programs" tab, NOT YET LIVE - blocked on Ryan running the migration.** New bridge endpoint `/api/installed-programs` (real registry Uninstall-key scan cross-checked against each install folder's actual NTFS creation date). Tracks identity by registry subkey/GUID, not DisplayName (several real programs, like the VC++ Redistributables, bake their own version into the display name, which would misread a routine update as a new install if matched by text). Runs automatically every time tracking starts. New tab groups by date, newest first, with auto-suggested (freely editable) comments for the earliest date group ("Initial build") and any date where several items share one publisher ("Potential install of X software"). **Requires `Database\migration_2026-07-19_001_installed_programs.sql` to be run in the Supabase SQL Editor before any of this actually works** - two new tables (`amit_installed_programs`, `amit_installed_program_date_notes`), both scoped by `device_id` as the real grouping key (confirmed: one computer → its own program history; one person's several computers never share a list).

**FUTURE — Install Watch deep-tracking (scoped 2026-07-19, not built yet):** Ryan wants Install Watch to eventually capture a full forensic trail per bracketed install/uninstall — every registry key actually written, every file actually created, correctly attributed to that specific install, so a bad program's full footprint (and any leftover cruft after uninstalling) is fully traceable, not just guessed at. Honest capability assessment given to Ryan: this only works from the LOCAL tracker side (PowerShell running on the actual machine, not the browser/online HTML, which has zero OS-level access), and only ever during a deliberately bracketed Install Watch session (Start → install/uninstall → Compare), never passively. Two real tiers, discussed and left as an open decision:
- **Files:** genuinely straightforward — .NET's `FileSystemWatcher` gives real live file-create/change/delete notification with no polling needed, pointed at Program Files/ProgramData/AppData/etc. during the bracket window.
- **Registry:** no equivalent simple live-watch cmdlet exists in PowerShell. Two real options: (a) fast polling of sensitive registry hives during the bracket window (buildable now, same spirit as the existing before/after diff just running continuously; real limitation — an ultra-transient write between two polls could be missed), or (b) real-time ETW (Event Tracing for Windows) registry monitoring, the same mechanism Sysinternals Process Monitor uses — zero misses, correctly attributes every change to the exact process that made it, but a meaningfully bigger, more careful build (needs admin privileges, real engineering to get process-attribution right), not a quick add.
Also flagged as a separate, smaller, already-understood gap in the CURRENT `install_snapshot_watcher.ps1`: it only ever detects ADDITIONS (what's new in the "after" snapshot), never REMOVALS — so even today's limited tool can't verify a clean uninstall, which is the exact "dead registry edits left behind" scenario Ryan is trying to solve. Worth fixing on its own regardless of which deep-tracking tier gets built.
Ryan's direction as of 2026-07-19: build this out (the "future" of Install Watch), scope not yet finalized between the two registry-tracking tiers — revisit before starting.

**FUTURE — "Verify Conditions" paid-tier update/malware checking (scoped 2026-07-19, teaser button live, real checking NOT built yet):** A gold "🛡 Verify Conditions" button now sits at the top-right of the Installed Programs tab (`openVerifyConditionsModal()`), styled to match the header's DEMO button. Clicking it today only explains what the paid tier WOULD do — no real checking runs yet. Real technical roadmap for when this gets built, so a future session doesn't have to re-derive it:
- **Software version-checking — fully buildable now, completely free, no AI/API cost at all.** Windows 10/11 ships `winget` (Windows Package Manager) built in. `winget upgrade` already knows the installed version of most common software and can check it against its own package repository for free, with zero API cost. This is the real mechanism for "is there a newer version of this program" — genuinely buildable as a straightforward bridge-server endpoint (shell out to `winget upgrade`, parse the output, cross-reference against `amit_installed_programs` by name).
- **Driver updates — partially buildable now, free, but real coverage gaps.** Windows Update itself has a free, built-in mechanism for driver updates that could be queried. But a lot of real driver releases (GPU/motherboard vendor drivers especially — exactly the NVIDIA/AMD/Realtek entries filling Ryan's own Installed Programs list) get published outside Windows Update, direct from the manufacturer, with no single free universal API covering all of them. Windows Update's own drivers: yes, buildable free. Every vendor's out-of-band release: no, would need vendor-specific logic per manufacturer, not scoped yet.
- **Malware/virus history checking and any genuine "is this actually safe" research — NOT free, this is the real paid-tier boundary.** The deployed Computer Health page has no live AI connection running inside it at all (confirmed to Ryan directly 2026-07-19) — it's pure static HTML/JS + local PowerShell + Supabase, nothing Claude-API-backed. A real "Amit goes and researches this" experience needs an actual live LLM API call, which costs real money per use. Today's free-tier answer to this is the plain web search already built (`chOpenProgramSearch`, opens a Google search asking about safety/malware history) — a human reads the results themselves, no AI/API cost incurred. A genuinely paid, AI-narrated version of this is a real business decision (who pays for the API calls), not just an engineering task.
- **Fourth step, added to the teaser 2026-07-19: download, not silent auto-install.** Ryan's own words: after picking which flagged items to update, Amit would find the real updated driver/installer and download it straight to the machine, ready to install manually — he was explicit he doesn't think Amit could make it silently auto-install, and was fine with that ("if it can't, other than just at least they would know that each one of them would be downloaded, and they don't have to go search it"). Worth actually evaluating properly when this gets built rather than assuming either way — silent unattended install is genuinely riskier (per-vendor silent-install flags vary, some need a reboot, some need elevation handled carefully) than a plain download, so download-then-manual-install is the honest default to build toward unless a real case is made for going further.
Ryan's framing for this whole feature, direct quote in spirit: get people to look at this button and think "wow, I really should get this upgrade" — the teaser needs to work well **as** a teaser even before any of the real checking exists.

**NEXT SESSION — IMMEDIATE TASKS (carried from Session 55):**
- **Run `Database\migration_2026-07-19_001_installed_programs.sql` in Supabase** — the new Installed Programs tab is fully built but non-functional until this runs. Highest priority of this list since it's a one-click blocker on an otherwise-finished feature.
- Verify the Installed Programs tab live once the migration is run — confirm the scan-and-sync actually fires on tracker start and the grouping/comment/search-on-double-click behavior all work as built, not just verified via direct API/DOM checks.
- Revisit the composite grading system with Ryan — he explicitly flagged wanting to come back to this and didn't finish reviewing it.
- Verify the native Charts tab live on Ryan's real machine — family grouping, natural sort, heat map labels/legend only verified against mocked/historical data so far.
- Confirm the Software gauge renders correctly once actually connected — only the disconnected placeholder state confirmed live so far.
- Verify `deriveSessionVerdictFromMetrics` holds up on a genuinely fresh session, not just historical data.
- Decide whether to build real in-app conversational voice (mic → Claude API via Supabase Edge Function → speech) for the future Companion, now that Copilot's been ruled out for that twice.

**Header/sidebar shell-consistency attempt (2026-07-19) — tried and reverted:** Ryan asked whether Computer Health's page could visually match Hub's exact header + left-sidebar shell, with all tab content consolidated onto one page. A first attempt was built (Hub-style header, gold sidebar with placeholder tiles, all 12 tabs stacked on one page) and shown to Ryan locally — he reviewed it and said "that's not gonna work," and it was fully reverted back to the clean GitHub version before anything was pushed. Worth revisiting with a different approach if this comes up again, but the specific shell built that day is not the answer.

**Built, tested, and pushed (earlier sessions):**
- Five watcher/tool scripts: `activity_watcher2.ps1`, `resource_watcher.ps1` (pre-existing) plus `diagnostics_watcher.ps1`, `app_behavior_watcher.ps1`, `install_snapshot_watcher.ps1`.
- `amit_bridge_server.ps1` — local HTTP server (port 8710), portable via `$PSScriptRoot` (not hardcoded to Ryan's OneDrive path). Handles concurrent requests via a runspace pool (fixed a real hang bug: Windows PowerShell 5.1's `ConvertTo-Json` stalls on a cold runspace's first call — log-tail endpoints now hand-build JSON instead). Exposes `/api/device`, `/api/resource`, `/api/diagnostics`, `/api/activity`, `/api/behavior`, `/api/browser`, `/api/tracker-status`, `/api/start-tracking`, `/api/stop-tracking`, `/api/install-start`, `/api/install-compare`.
- `ComputerHealth_Dashboard.html` — tabs: Overview, Resources, Diagnostics, App Behavior, Install Watch, Browser, History. Plain-language verdict cards throughout, not raw numbers. Sign-in nudge (non-blocking), session-summary screen (`?justStopped=1`), pre-install walkthrough with a real Download link.
- `Install_AmitTracker.ps1` — idempotent, checks for an existing LibreHardwareMonitor install in common locations (Downloads, Program Files, its own folder) before downloading a duplicate — this was a real bug caught by Ryan during live testing (two LHM instances running simultaneously, one needing a .NET runtime the other didn't). Works standalone (downloads sibling files from GitHub raw if run outside a full local copy) or from a full copy. Creates `Amit.url` desktop shortcut (opens the **Hub**, not Computer Health directly — login happens there first, so device claiming ties to the right user) and registers the `amit-tracker://` protocol handler. Deliberately does NOT register any Task Scheduler/login auto-start (Ryan's explicit choice) — tracking only ever starts when a human explicitly triggers it.
- `AmitTracker.exe` — compiled C# (via `csc.exe`, no Visual Studio needed), source in `AmitLog\Watchers\AmitTracker\`. Real embedded file metadata (`FileDescription`/`ProductName` = "Amit Tracker") so Windows' permission dialogs show that name instead of "Windows PowerShell". Runs as a persistent system tray icon (not fire-and-exit) — shows "Amit Tracker - Running", right-click menu with Open Dashboard / Stop Tracker. Stop Tracker calls `/api/stop-tracking`, then opens the dashboard with `?justStopped=1` so the browser (already authenticated) logs the session-end event to Supabase — the exe itself never touches Supabase directly.
- `amit_icon.ico` (`generate_amit_icon.ps1`) — gold (`#d4af37`) Paleo-Hebrew Aleph ox-head pictograph on dark (`#12141a`) circle, rendered from the project's own `who_is_god\ancheb2.ttf` font (Hebrew Aleph codepoint U+05D0 renders as the pictograph in that font — confirmed by test render), not a generic Latin "A". Centering required measuring actual ink pixel bounds, not font metrics (the font's bounding box has large built-in whitespace that threw off naive centering).
- Supabase schema written (`migration_2026-07-12_001_computer_health.sql`, pushed to repo) — **NOT YET RUN.** Ryan must paste into Supabase SQL Editor before any device/event data can actually be written — sign-in and History are non-functional until this happens.

**Known gap, not yet built:** the dashboard's "not running" screen doesn't yet distinguish "never installed" from "installed but not currently running" — it needs to remember (via a localStorage marker set the first time `/api/device` ever succeeds) which screen to show: full install walkthrough vs. a direct "Launch Tracker" button. Without this, someone who's never installed could click Launch Tracker and have it silently fail (unregistered custom protocols fail silently in browsers, no error surfaces).

**Also raised, not yet decided:** whether "Install Amit Locally" should also have an entry point on the Hub itself (`amit-hub.html`), not just inside Computer Health's not-running screen. Not built — would mean editing Hub's shared file, which needs explicit confirmation before touching (see chat history 2026-07-12).

## Build Notes

- **Version discipline (Ryan's direct request 2026-07-16, corrected 2026-07-19):** `AmitInstaller.cs`'s `CURRENT_VERSION` and `AssemblyInfo.cs` are kept in lockstep with `ComputerHealth_Dashboard.html`'s own version label — one shared number for the whole distributable. **As of 2026-07-19, that dashboard version label is also required to match the repo-wide `VERSION`/root-CLAUDE.md number exactly, on every push, system-wide — see "ONE NUMBER, EVERYWHERE" in the root CLAUDE.md's VERSIONING STANDARD.** It is not a separate Computer Health-only counter; treating it as one is exactly what caused real confusion for Ryan on 2026-07-19 (dashboard showed v3.75/v3.78 while the repo-wide number sat at v3.31). Any time the dashboard's version bumps — for any reason, including a push that didn't touch Computer Health at all — before considering the push done: (1) check whether anything else in the `AmitInstaller` bundle needs a real content update, not just the number — bumping the version string alone without re-running `build_installer.sh` is worse than doing nothing, since it falsely claims freshness; (2) bump `CURRENT_VERSION` and `AssemblyVersion` to match; (3) re-run `AmitLog\Watchers\AmitInstaller\build_installer.sh` (pulls fresh source, rebuilds `install-Amit.exe`); (4) run `verify_installer.sh` to confirm no drift; (5) copy the rebuilt exe to both repo locations (`ComputerHealth\install-Amit.exe` and `ComputerHealth\AmitInstaller\install-Amit.exe`) and commit/push. This was skipped for an unknown number of prior sessions — found 2026-07-16 badly stale (missing code from several sessions back).
- Watcher scripts, the bridge server, the dashboard, the installer, the tray exe, and the icon generator now live in `ComputerHealth\Watchers\` (dev) as of the 2026-07-19 migration — this folder is the real, primary Computer Health build location. A rollback copy remains at `AmitLog\Watchers\` until Ryan confirms the tracker/bridge still launches correctly from here.
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

## FILE MIGRATION RECORD — What Moved From AmitLog, 2026-07-19

Kept as a permanent fallback reference — "what did we actually move" — in case anything needs to be traced back to its original location.

| Original location | Final location | Backup copy | What it is |
|---|---|---|---|
| `AmitLog\Hardware_Crash_Log.md` | `ComputerHealth\Hardware_Crash_Log.md` | `AmitLog\ComputerHealth_Backup\Hardware_Crash_Log.md` | Recurring hardware crash/BSOD diagnostic history |
| `AmitLog\Computer_Specs_and_History.html` | `ComputerHealth\Computer_Specs_and_History.html` | `AmitLog\ComputerHealth_Backup\Computer_Specs_and_History.html` | This machine's spec/history reference |
| `AmitLog\DisableBadUSB.ps1` | `ComputerHealth\DisableBadUSB.ps1` | `AmitLog\ComputerHealth_Backup\DisableBadUSB.ps1` | USB controller fix script |
| `AmitLog\DisableBadUSBController.ps1` | `ComputerHealth\DisableBadUSBController.ps1` | `AmitLog\ComputerHealth_Backup\DisableBadUSBController.ps1` | USB controller fix script |
| `AmitLog\Watchers\` (entire folder, 41 files) | `ComputerHealth\Watchers\` | `AmitLog\ComputerHealth_Backup\Watchers\` | Dashboard HTML, bridge server, all watcher scripts, `AmitTracker.exe` + source, `AmitInstaller\` bundle, icons, `device_id.txt` |

Sequence: copied to `ComputerHealth\` first → verified byte-identical (41 files, 2,012,145 bytes both sides, after fixing a same-first-pass collision between the `AmitTracker` folder and `AmitTracker.exe` file) → tested the bridge server running from the new location (HTTP 200, correct version, working API, CORS-confirmed reachable from the live online dashboard) → **originals then moved (not copied) into `AmitLog\ComputerHealth_Backup\`**, deliberately breaking the old `AmitLog\Watchers\` path → re-ran the identical test with the old path gone, identical results. `ComputerHealth\Watchers\` has no remaining dependency on `AmitLog` in any form.

**A separate, third copy exists and was untouched by any of this:** `%LOCALAPPDATA%\AmitComputerHealth\Watchers\` — an actual installed copy from a prior `Install_AmitTracker.ps1` run, unrelated to either OneDrive dev location. No Desktop shortcuts currently point to it (Desktop is empty as of 2026-07-19).

**Not moved, and should never be:** `AmitLog` itself, `AmitLog\SETUP_JUNCTION.bat`, and the `c--Users-user1-...` session-backup folders inside it — these are Claude Code's own session-history infrastructure (an NTFS junction target), unrelated to Computer Health, and moving/renaming that folder would break the junction.

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
