# Computer Health - Sessions Start

## HOW TO READ
Read this file first; it is all a new session needs. Read Sessions_ToDo.md only when asked about to-dos. Read Sessions_Log.md or the original Claude session only when asked. the backup files in Backups\ComputerHealth\Sessions_backup_2026-11-13.md are for research only. The Handoff file named below (`Handoff_VoiceMenu_2026-11-06.md`) exists in this folder.

## DIRECTORY
- `Sessions_Start.md` - this file: current state and files in play.
- `Sessions_ToDo.md` - every open item found in the old Sessions.md (now in Backups\ComputerHealth\Sessions_backup_2026-11-13.md), grouped, with the date of its entry.
- `Sessions_Log.md` - the old Sessions.md lines 1-84 word for word (state blocks, Current State, dated entries 2026-11-06 back to 2026-10-23).
- `Backups\ComputerHealth\Sessions_backup_2026-11-13.md` - byte-for-byte copy of the old Sessions.md.
- `Sessions_Design.md` - this project's database tables (first section) and design reference (how it is built); read only when working with the database or on that part of the build.

## CURRENT STATE

Added 2026-11-14 from the old Sessions.md (now in Backups\ComputerHealth\Sessions_backup_2026-11-13.md): Dashboard v5.12 is PUSHED and live (Overview no longer downloads the Master Report rows; about 0.5 s and 175 KB). Dashboard v5.13 (Hard crashes section with the Watch switch, saved crashes list from `amit_device_crash_dumps`, rules-only analysis `ch_crash_analyzer.js` v1.00) is BUILT, NOT PUSHED; it ships with the Helper 1.92 release. Migration 042 was run 2026-11-14. Separation rule: Computer Health logic stays out of the Helper.
Computer Health is the Amit program that watches how a computer runs (the "monitor": diagnostics, resources, app behavior), and it is also the home of the shared local helper. The helper (bridge server `amit_bridge_server.ps1` on port 8710, the tray program, Whisper/Read/Show Amit/Voice menu, the Dictate window, the preview split) serves every Amit app that needs the desktop: per the Single Local Connection Standard new local capabilities are new routes on this bridge, never a new server. In people's words the tray program is now called "Amit Live" (renamed in visible text 2026-10-26; file, protocol and registry names are unchanged).

Live and pushed (state of 2026-11-06, end of a long session): **helper v1.68** (commit 9582292; manifest 18 files including `AmitPreview.html`) and **installer 4.85** (commit 8617821). That session built helper 1.62 to 1.68 (Voice menu opened by the middle mouse button: Voice, Mouse, Keyboard-soon tabs; the left button can never be locked by the menu). The earlier same-day pushes were helper 1.63 and installer 4.84. The Amit Preview page and its bridge routes were built the same period (see `AmitCoder\Handoff_AmitPreview_2026-11-06.md`). GitHub Pages failed to publish four times in a row that day until an empty commit re-published it; always check the live manifest after a push.

Earlier releases in the log: helper 1.56 with an updater that never goes backwards (2026-11-04, after the updater replaced the newer local 1.56 with published 1.55), the Dictate window (decides by where the person is: text box or Dictate window), helper 1.49 to 1.53 (preview split on the left/right half of the screen, double-right-click shows the Amit Helper bar, which is now a Windows edge bar), the Read speaker and voice window (1.33 to 1.42), per-part icons, memory-leak and CPU fixes, idle stop and a 4-hour restart of the monitor (2026-10-23 to 2026-10-24), start with Windows and a durable session queue (2026-10-20). The installer now updates an old install (4.61).

Dashboard: `ComputerHealth_Dashboard.html`. The Current State block in the old Sessions.md still says v3.74; the log shows v5.02 live on 2026-10-08 and v5.10 (the "Amit Live" wording) built 2026-10-26 as local and not pushed; the push status of v5.09 and v5.10 is not stated in the file.

Blocked or pending (from the Current State block): the Installed Programs migration (`Database\migration_2026-07-19_001_installed_programs.sql`) must be run before that tab works; the rename of `AmitTracker.exe` to `Amit.exe` is deferred; composite grading needs a revisit; the "Verify Conditions" paid tier is only a teaser; a Mac version of the local agent does not exist. There are three real copies of the code (dev source `ComputerHealth\Watchers\`, the git repo mirror, the installed runtime under `%LOCALAPPDATA%\AmitComputerHealth\Watchers\`); a fix only counts when it reaches the installed copy, and a new helper file must be named in six file lists.

## FILES IN PLAY
| File | What it is | Version |
|---|---|---|
| `ComputerHealth_Dashboard.html` | the dashboard (live at ask-amit.github.io/Amit/ComputerHealth/) | v5.02 live 2026-10-08; v5.10 local 2026-10-26; Current State text says v3.74 (stale) |
| `ComputerHealth_Dashboard_classic.html` | the old dashboard kept for rollback | v4.60 |
| `Watchers\amit_whisper.cs` | the helper program (mouse, Whisper, Read, Show Amit, Voice menu, preview split) | v1.68 |
| `Watchers\amit_bridge_server.ps1` | the shared local bridge | v1.13 at 2026-10-31 (later version not stated) |
| `Watchers\amit_talk.html` | the Read speaking page | v1.04 |
| `Watchers\amit_dictate.html` | the Dictate window | none shown |
| `AmitPreview.html` | Amit Preview window page | none shown |
| `install-Amit.exe` (`CURRENT_VERSION`) | the installer | 4.85 |
| `amit_helper_manifest.json` | what the updater compares | helper 1.68, 18 files |
| `AmitTracker.cs` / `AmitTracker.exe` | the tray program | none shown |
| `Install_AmitTracker.ps1`, `AmitInstaller.cs`, `build_installer.sh`, `amit_update.ps1`, `make_helper_manifest.ps1` | install and update lists | none shown |
| `amit_ch_sync.js` (Amit root) | Hub-to-helper session sync | v1.03 |
| `Handoff_VoiceMenu_2026-11-06.md` | hand-off for the Voice menu work | none |

## OPEN TO-DOS
Open to-dos: ~48 items, see Sessions_ToDo.md.

## LAST CLEAN-UP
Last clean-up: built 2026-11-13 from the old Sessions.md (now in Backups\ComputerHealth\Sessions_backup_2026-11-13.md), newest log entry dated 2026-11-06.

## ORIGINAL SESSIONS
The original session for each entry was not recorded before 2026-11-13. From the next clean-up on, each entry will name its session (name, ID and path under `C:\Users\user1\.claude\projects\c--Users-user1-OneDrive-Documents---onedrive-Amit\`). Those files expire on Claude's own schedule, which is acceptable: the log is the permanent record.


## FROM CLAUDE.md (captured 2026-11-14)

SCOPE NOW: CLAUDE.md's purpose statement says Computer Health is a background monitoring and diagnostic companion (watchers, bridge, plain-language dashboard, history in Supabase). Real scope has grown: the folder also holds the shared local helper (bridge server, tray program, Whisper, Read, Show Amit, Voice menu, Aurora ring, Amit Live window, Amit Preview) and the installer, although CLAUDE.md itself says the Helper is NOT Computer Health and its release follows AmitHelper\HELPER_RELEASE_RULES.md. Computer Health's own notes should stay about the dashboard, trackers and diagnostics.

Status and build facts in CLAUDE.md (dated entries are copied word for word into Sessions_Log.md):
- "Current Status" section is a stack of dated entries, newest 2026-09-08 (looks out of date: Sessions_Start.md above carries the state to 2026-11-06). It records: Amit Mobile watcher fixes (curl.exe instead of Invoke-RestMethod after 401s, BOM-less UTF-8 write-back, UTF-8 stdout, single-instance mutex guard, installer 4.46 -> 4.47); tray-only launch flag and crash logging in AmitTracker.exe (installer 4.43 -> 4.44, vanishing-after-17-minutes cause never reproduced); installer bundle caught 22 versions stale and rebuilt (2026-08-02); bridge now also serves /scan for AmitBooks; file migration from AmitLog complete (2026-07-19); Session 55 (2026-07-18) drill-down gauge tree and component registry; sensor reading no longer depends on LibreHardwareMonitor's GUI (v3.99, 2026-07-19); new Installed Programs tab built but blocked on a migration; Verify Conditions teaser button.
- Dashboard version in CLAUDE.md: "v3.74 as of last push" (looks out of date: v5.02 live, v5.10 local per the log).
- Built and tested earlier: five watcher scripts (activity_watcher2, resource_watcher, diagnostics_watcher, app_behavior_watcher, install_snapshot_watcher), the bridge server on port 8710 (runspace pool), the dashboard with tabs (Overview, Resources, Diagnostics, App Behavior, Install Watch, Browser, History), Install_AmitTracker.ps1, AmitTracker.exe, the Amit icon. Supabase schema migration_2026-07-12_001_computer_health.sql written; it was "NOT YET RUN" at the time (unsure if finished: later history entries show device data, so it was likely run).
- Mobile watcher / receipts: the bridge fires process_inbox.bat from /amit-process-inbox; Node.js and the Claude Code CLI installed on Ryan's machine 2026-08-01 (RESOLVED); /api/claude-status endpoint added 2026-09-05; the unattended process must never hold the service-role key (credential rule); the one-time per-person auth step cannot be automated.
- Version discipline: AmitInstaller.cs CURRENT_VERSION and AssemblyInfo.cs are kept in step with the dashboard's own label (rule as of 2026-07-19; the log later shows installer 4.85 and dashboard 5.x, so this lockstep looks out of date).
- Permanent rules that stay in CLAUDE.md: the Helper is not Computer Health; three real copies (dev source, git mirror, installed runtime) and the re-install-before-verify rule; Pursuit Attribution (program='Computer Health', focus per watcher, first AppWatch); Amit Live and the Aurora description; connections to Hub, Computer Value, Database; the file migration record.
