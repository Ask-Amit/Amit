# Computer Health - Sessions ToDo

Every open, pending, blocked, not-yet-tested or "next" item found in the old Sessions.md (now in Backups\ComputerHealth\Sessions_backup_2026-11-13.md) and nowhere else. The [date] is the entry it came from ("Current State" = the undated block). Where the file does not show whether something was finished it says "(unsure if finished)".

## Blocked or deferred (Current State block)
1. Run `Database\migration_2026-07-19_001_installed_programs.sql`; the Installed Programs tab does not work until it is run. [Current State]
2. Rename `AmitTracker.exe` to `Amit.exe` with purpose-aware launch; deliberately deferred (touches protocol handler, shortcuts, installer). The deep rename of Tracker to Amit Live is a separate deferred pass. [Current State, 2026-10-26] (also CLAUDE.md: the amit-tracker:// handler needs a ?purpose=scan or ?purpose=track argument so AmitBooks' Scan Now does not pop the Computer Health window; show the version number in the visible window; only the --tray-only case is done, 2026-09-05)
3. Composite grading system: Ryan wanted to revisit; review unfinished. [Current State]
4. "Verify Conditions" paid tier: only a teaser button; real checking (winget version check, driver updates, malware research) not built. [Current State] (also CLAUDE.md: winget version check is free and buildable now, driver updates partial coverage, malware/safety research is the paid boundary; plus a fourth step, download the real update, not silent auto-install; scoped 2026-07-19)
5. Mac: no equivalent of the local agent built. [Current State] (also CLAUDE.md, added 2026-08-02: the local agent, process_inbox.bat and WIA scanning have no Mac equivalent; needs a parallel build with a shell script, launchd and Image Capture; scope when a real Mac user needs it)

## Push, install and release state
6. Check the live manifest after any push (four Pages deployments failed on 2026-11-06). [2026-11-06]
7. `AmitPreview.html` was "not yet in the six helper file lists" and later the manifest lists 18 files including it (unsure if finished). [2026-11-06]
8. Helper 1.54 (Show Amit quick snap) was installed locally only, waiting for Ryan's hand test and "push" (unsure if finished; later versions were pushed). [2026-11-01]
9. Icon files are not in the self-update lists (`amit_update.ps1` allow-list, `make_helper_manifest.ps1`, bridge `/api/helper/status`); needs Ryan's go-ahead since it touches the update system (unsure if finished). [2026-10-31]
10. The stray untracked `ComputerHealth/AmitInstaller/amit_whisper.cs` in the repo mirror was left out on purpose. [2026-10-31]
11. Dashboard v5.09 and v5.10: push status not stated (v5.09 push "waits for Ryan"; v5.10 local) (unsure if finished). [2026-10-23, 2026-10-26]
12. `amit_mobile_watcher.ps1` is missing from the installer's copy list (older gap). [2026-10-26]
13. Installer 4.53 `amit-helper://` link not yet run on a fresh Windows by Ryan; clean-Windows test (Sandbox needs one restart) not done. [2026-10-22, 2026-10-20]
14. Installer 4.61 old-install update not tested on a real second computer (shortcuts, registry, restart). [2026-10-26]
15. The running tray program on Ryan's computer still shows the old name until the installer is run again; words like "Start Tracking" in the dashboard were not changed. [2026-10-26]

## Not tested or not verified
16. Windows 10, browsers other than Edge, the clipboard path of Read, a program that does not share its text, and other people's computers updating themselves. [2026-10-31]
17. Double-right-click showing the Amit Helper bar (1.53) was not yet tested by hand (unsure if finished). [2026-10-31]
18. Whisper mode real-voice test. [2026-10-26] (unsure if finished)
19. Idle stop: the History save of a session ended by idle stop, and a real 10-minute idle with no test pages running, not verified end to end. [2026-10-23]
20. Hours-long memory of the watchers after the leak fixes, and the bridge's slow floor (cause of the step from 135 to 245 MB unknown). [2026-10-24]
21. Dictate window: Journal database connection not done; Windows 10 and non-Edge testing not done. [2026-11-04]

## Open questions and unexplained
22. Two stuck "Print from the screen" windows after choosing Print from the menu (1.63); not reproduced. [2026-11-06]
23. The `data\pending` queue held 12 finished sessions waiting for the Hub to save them, several short tests; Ryan to decide whether to dismiss them. [2026-10-24]
24. Whether `activity_watcher2` stays in the auto-started monitor; startup auto-start reliability (watchers started 12 minutes after the bridge on 2026-10-23). [2026-10-23]
25. Voice commands have no icon of its own yet; Computer Health keeps the aleph icon. [2026-10-31]
26. The dashboard does not yet read the `data\pending` queue (its own reconcile still works). [2026-10-20]
27. The bridge reads only the newest 25 reliability records; heartbeat for past runs needs a new table (Ryan's call). [2026-10-08]

## Resolved (kept so the judgment can be checked)
- "To do before the next installer / push" (make the installer carry helper 1.30 and bridge 1.10): marked DONE 2026-10-31 (installer 4.72, helper 1.49).
- The updater putting the older published helper back: fixed by publishing the manifest (2026-10-31) and by the never-go-backwards updater (1.56, 2026-11-04).
- Eight "unexpected shutdowns": root cause found and fixed 2026-10-08 (tracker blocked Windows shutdown).
- Left button dead after the menu: fixed by 1.67; none reported since 1.68 (2026-11-06).
- A session saving after Stop in the new dashboard "not yet confirmed" (2026-10-08): not shown again later (unsure if finished).


## FROM CLAUDE.md (captured 2026-11-14)

Items named in CLAUDE.md that are not already listed above (blocked/deferred items 1-5 above already cover the Installed Programs migration, the Amit.exe rename, composite grading, Verify Conditions and Mac).
Install Watch and Verify Conditions (future, scoped 2026-07-19)
- Install Watch deep-tracking: capture every registry key and file written per bracketed install/uninstall (files via FileSystemWatcher; registry via polling or a second tier, not yet chosen); the current install_snapshot_watcher.ps1 only detects additions, never removals. Ryan wants it built; scope between the two registry tiers not finalized.
- App Behavior "stop and analyze" occasionally taking over a minute versus the normal ~10 s: not reproduced, to be determined.
Next-session tasks carried from Session 55 (2026-07-18), all (unsure if finished)
- Verify the Installed Programs tab live once the migration is run (scan-and-sync fires on tracker start; grouping, comment and search-on-double-click).
- Verify the native Charts tab on Ryan's real machine (family grouping, natural sort, heat map labels and legend only verified on mocked data).
- Confirm the Software gauge renders once actually connected; verify deriveSessionVerdictFromMetrics on a genuinely fresh session.
- Decide whether to build real in-app conversational voice (mic to Claude API via a Supabase Edge Function to speech) for the future Companion.
- Known gap: the dashboard's "not running" screen does not distinguish "never installed" from "installed but not running" (needs a localStorage marker).
- Undecided: whether "Install Amit Locally" also gets an entry point on the Hub (not built; would edit the Hub).
- Header/sidebar shell-consistency with the Hub was tried and reverted 2026-07-19; revisit only if Ryan asks.
Platform
- AmitTracker.exe vanishing after ~17 minutes (2026-09-05): root cause unconfirmed; check %TEMP%\amit_tracker_crash.log first if it recurs.
- Migration migration_2026-07-12_001_computer_health.sql: confirm it was run (unsure if finished).


## FROM THE HUB PURSUITS (added 2026-11-14; nothing was changed in the Hub)

### Part of: Where we left off on 2026-07-12
- Ryan does the real first test of the single-button Launch Tracker flow (v2.62) - untested live by Amit [P5] - No notes in the pursuit; part of: Where we left off on 2026-07-12. (old Hub pursuit deleted 2026-11-14, not a live link)
- Real accumulated tracking history needed before Computer Health's demo-mode showcase has anything to show [P5] - No notes in the pursuit; part of: Where we left off on 2026-07-12. (old Hub pursuit deleted 2026-11-14, not a live link)

### Part of: Where we left off on 2026-07-14

### Top-level pursuits
- APP - Computer Health results support multiple user-selectable display modes: raw numbers/percent, line chart, bar chart, and ring/circle overlays [due 2026-07-15] [P2] [starred] - Ryan's directive (2026-07-15): the health/performance data should not be locked to one visual format. Give the user a choice of view for the same underlying data - raw numbers with percent (current/baseline), line chart (trend over time),... (old Hub pursuit deleted 2026-11-14, not a live link)

### Part of: Where we left off on 2026-07-15
- Get one real outside person through Computer Health install -> live session -> History end to end - still the actual test of whether continued investment there is worth it. [due 2026-07-16] [P5] [starred] - No notes in the pursuit; part of: Where we left off on 2026-07-15. (old Hub pursuit deleted 2026-11-14, not a live link)
- Decide: pursue a code-signing certificate - still the concrete blocker before any outsider can install without a scary SmartScreen warning. [due 2026-07-16] [P5] [starred] - No notes in the pursuit; part of: Where we left off on 2026-07-15. (old Hub pursuit deleted 2026-11-14, not a live link)
- Consider adding remaining Diagnostics signals (Interrupt%, Network throughput, Page Faults/sec, Paging/sec) as their own Performance/Diagnostics cards - already flagged in the tabs own Future checklist, not yet built. [due 2026-07-16] [P5] [starred] - No notes in the pursuit; part of: Where we left off on 2026-07-15. (old Hub pursuit deleted 2026-11-14, not a live link)
- Watch for recurrence of the original 3-minute stop-delay mystery now that CLOSED/exit-reason logging is in place - if it happens again there is finally hard evidence to read instead of reconstructing after the fact. [due 2026-07-16] [P5] [starred] - No notes in the pursuit; part of: Where we left off on 2026-07-15. (old Hub pursuit deleted 2026-11-14, not a live link)

### Part of: Where we left off on 2026-07-20
- Get Ryan's live browser confirmation that Computer Health's tracker stop/console-error fixes hold up in real use [due 2026-07-21] [P5] - No notes in the pursuit; part of: Where we left off on 2026-07-20. (old Hub pursuit deleted 2026-11-14, not a live link)

### Part of: Where we left off on 2026-10-26
- FIX - Installer: take the Claude sign-in out of Install_AmitTracker.ps1, add the AmitFix line, rebuild the installer and the fingerprint list [due 2026-10-27] [P5] - No notes in the pursuit; part of: Where we left off on 2026-10-26. (Claude sign-in part done in installer 5.06; the AmitFix line and the fingerprint list are not shown as done) (old Hub pursuit deleted 2026-11-14, not a live link)

## FROM THE HUB PURSUITS, LEFTOVERS PLACED BY RYAN (2026-11-14; nothing changed in the Hub for these)
- APP - Amit Stewardship lets everything you own vouch for itself - the same way the PC does, for the whole household [due 2026-09-01] [PP3] - Amit Stewardship: extend the Computer Value idea to the house, vehicle, appliances and tools: run health checks, generate pursuits for maintenance, log when repairs are done. Ryan (2026-11-14): goes under Computer Health's to-do list. (old Hub pursuit deleted 2026-11-14, not a live link)

## FROM THE OLD ROOT TASK LIST (moved 2026-11-14)

- Build the Test Sessions/Reports schema (generic sessions + readings tables) — still the real foundation for the paid Diagnostic Event/Report tier. [from root CLAUDE.md]

## ADDED 2026-11-14 from the newer Sessions.md (now in Backups\ComputerHealth\Sessions_backup_2026-11-13.md)
- Push dashboard v5.13 with the one Helper release (rules in AmitHelperHELPER_RELEASE_RULES.md). [2026-11-14]
- Build dashboard v5.14: stop saving Master Reports (a derived summary; no date range needed). [2026-11-14]
- Fix the Overview's slow History download. [2026-11-14]
- Save the crash analysis back into the `analysis` column of `amit_device_crash_dumps` (not done yet). [2026-11-14]
