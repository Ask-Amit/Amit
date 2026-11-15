# Amit Helper - Sessions_Start.md

## HOW TO READ
Read this file first; it is all you need to start work. Read Sessions_ToDo.md only when asked about to-dos. Read the Daily Sessions folder (or the original Claude session) only when asked about the detail of an entry. the backup files in Backups\AmitHelper\Sessions_backup_2026-11-13.md are for research only. Rules for the folder are in CLAUDE.md and HELPER_RELEASE_RULES.md (follow it for every Helper release). Never push unless Ryan says so.

## DIRECTORY
- Sessions_Start.md: this file (current state and files in play).
- Sessions_ToDo.md: every open item found in the old Sessions.md (now in Backups\AmitHelper\Sessions_backup_2026-11-13.md), by theme, with a Resolved list.
- Daily Sessions\ - one text file per session (the history; never pushed; the old Sessions_Log.md was split into it on 2026-11-15).
- Backups\AmitHelper\Sessions_backup_2026-11-13.md: byte-for-byte copy of the old Sessions.md.
- Sessions_Design.md: this project's database tables (first section) and design reference (how it is built); read only when working with the database or on that part of the build.

## CURRENT STATE (built from the old Sessions.md (now in Backups\AmitHelper\Sessions_backup_2026-11-13.md), brought forward by the clean-ups of 2026-11-14 and 2026-11-15)
- What the project is: the Amit Helper, a personal bar on the right edge of the Windows screen (profiles and buttons), plus the Helper program pieces around it: Amit Mouse (each mouse told apart, numbered sets per mouse), Amit Keyboard (same for keyboards), the Amit menu (one standard locked button runs it, middle click opens it), Voice and Dictate follow-focus, and the Amit Preview window. The Helper is NOT Computer Health, though its program files sit in ComputerHealth\Watchers.
- Last recorded releases (2026-11-08 to 2026-11-11): Helper 1.90 (welcome at every sign-in with real checks, one-time sensor permission, Amit Live rename), installer 5.06 (pushed, commit fc3aad4; no longer installs Node.js or asks about a Claude account), Hub v8.77 (Amit Keyboard tab), Amit Keyboard page v1.00, Amit Mouse page v1.20, Living Testimony v1.50 noted. Helper 1.88 / installer 5.03 added Amit Keyboard. Update 2026-11-14: Helper 1.92, installer 5.07 and Hub v8.78 (with dashboard v5.13: Watch mode, hard-crash analysis, the Windows crash notice in the Hub) were pushed, commit 5fef6f5.
- Local or not pushed: the Phone-as-peripheral work is idea and Stage 0 tests only (nothing in the Helper changed). The Amit Keyboard secure-messaging idea is design notes only (KEYBOARD_SECURE_MESSAGING_DESIGN.md), nothing built.
- Added 2026-11-14 from the old Sessions.md (now in Backups\AmitHelper\Sessions_backup_2026-11-13.md): Helper 1.92 (Watch mode and the crash notice) is installed on Ryan's computer AND pushed: checked 2026-11-15, the published manifest says helperVersion 1.92 (19 files, generated 2026-11-14T12:58Z) and the installed amit_whisper.cs has the same hash as the published one. Installer 5.07: the master source says 5.07 and the pushed install-Amit.exe is the same size as the master's exe; an old AmitInstaller.cs saying 4.85 and a 77 MB exe are still in the repo under ComputerHealth\AmitInstaller\ (leftovers, not reconciled). The words-only rename ("Amit Helper" on screen instead of "Amit Live") is done in the master files, NOT released; at the next release bump Helper 1.93, dashboard v5.14, Hub v8.79, installer 5.08 and rebuild the tray exe (`AmitTracker.cs` changed, exe not rebuilt). Details are in the old log (now in the Daily Sessions folder).
- Blocked or waiting: a code-signing certificate (unknown publisher / Smart App Control blocks); a small Helper change so a phone photo opens in Show Amit (plan to be written and approved); a domain for a secure https home route; the wake phrase "voice on" awaits Ryan's choice; "Ask Amit to create this button" is only a spec and placeholder.
- Newest decisions (2026-11-11/12): phone as a peripheral lives in Amit Mobile, build option one first and every plan must include the secure https path; secure keyboard messages need real secrecy, scrambled in the chat page first, sets kept local, the online answering Amit never reads them; the installer must just install.
- Read, the reading speaker on the Amit Live ring (built and pushed 2026-10-31 as helpers 1.33 to 1.42, bridge 1.12, amit_talk.html 1.04, installer 4.69): press the speaker, then the very next click or selection is read once, in the voice saved to the person's login; double-click the speaker for the voice window; Esc or right-click removes it; reading pauses by itself while dictation runs. Checked 2026-11-15: the published helper (1.92) and the installed copy still carry Read, and amit_talk.html is identical in the master, installed and published copies. The full session is the top entry of the old log (now in the Daily Sessions folder).
- Hard rules: never go backwards to an older Helper; rebuild the installer for every Helper release; stage only paths that exist and check `git diff --cached --name-only` before committing; one way to open the Amit menu; keep every mouse/keyboard safety (primary mouse's left/right/middle never change, every other mouse keeps a left click, Ctrl+Alt+Shift+M switches all sets off).

## FILES IN PLAY
| File | What it is | Version |
|---|---|---|
| ComputerHealth\Watchers\amit_whisper.cs | Helper program (mouse, keyboard, menus, dictation, welcome, Read) | Helper 1.93 pushed (commit 1242be4, 2026-11-15) and installed on Ryan's computer, which answers 1.93; the live manifest showed 1.92 right after the push (Pages lag), re-check with verify_helper_release.ps1 -Live. 1.93 = dictation no longer locks up (one restart path in amit_whisper.html) plus the Amit Live -> Amit Helper wording rename. Needs Ryan's real-voice test. |
| ComputerHealth\Watchers\amit_talk.html | the Read speaking page and voice window | v1.04 (master, installed and published identical, checked 2026-11-15) |
| ComputerHealth\Watchers\amit_bridge_server.ps1 | shared local bridge (routes) | v1.15 in the master; its hash differs from both the published and the installed copy (checked 2026-11-15, not reconciled; v1.12 was this session's Read work, v1.13 to 1.15 came from other sessions) |
| AmitHelper\Bar\AmitBar.cs (master) | the bar program | bar v0.12 as last noted |
| Hub\amit-hub.html | Hub with Amit Helper, Amit Mouse and Amit Keyboard tabs | v8.78 |
| Hub\AmitMouse.html | Amit Mouse page | v1.20 |
| Hub\AmitKeyboard.html | Amit Keyboard page | v1.00 |
| AmitCoder\AmitPreview.html | Amit Preview window | v2.17 |
| Templates\show_preview.ps1 | sends a preview | v1.20 |
| install-Amit.exe (AmitInstaller.cs) | installer | 5.08 |
| HELPER_RELEASE_RULES.md, verify_helper_release.ps1 | release rules and PASS/FAIL check | none |
| KEYBOARD_SECURE_MESSAGING_DESIGN.md, KEYBOARD_BRIEF.md | keyboard design records | none |
| PHONE_PERIPHERAL_SEE_AMITMOBILE.md | Helper's side of the phone idea | none |
| Button_Creator_SPEC.md, Ideas_Captured.md, Ideas_Merged.md | button-creator plan and brainstorms | none |
| MOUSE_TEST_MATRIX.md | mouse test list | none |

## TO-DOS
Open to-dos: 62 numbered items in Sessions_ToDo.md (counted 2026-11-15; the numbers run to 63 and some numbers are unused), plus the pursuit-style items in its Hub-pursuits section.

## LAST CLEAN-UP
Last clean-up: 2026-11-15T12:51Z, session 4710fd10-2ff1-4bf9-9cbc-012bab59ede2.
Backlog pursuits: not initialized
What that pass did (2026-11-15): logged the Read session word for word as the top entry of the old log (now in the Daily Sessions folder); corrected the pushed/not-pushed claim for Helper 1.92; moved the Read design paragraph here from ComputerHealth\Sessions_Design.md into Sessions_Design.md; removed 43 dead [hub:] links from the old button-creator list in Sessions_ToDo.md; fixed a lost-backslash path in CLAUDE.md. It also added six Read to-dos (items 64 to 69) with six Hub pursuits; Ryan did not want them, so they were removed again the same day (the clean-up no longer adds to-dos).

## ORIGINAL SESSIONS
Original sessions were not recorded before 2026-11-13. Recorded so far: 2026-10-31 to 2026-11-15, session 4710fd10-2ff1-4bf9-9cbc-012bab59ede2 (Read; the path is in that entry's heading in the old log (now in the Daily Sessions folder)). From the next clean-up each entry names its session (name, ID, path under C:\Users\user1\.claude\projects\c--Users-user1-OneDrive-Documents---onedrive-Amit\); those files expire on Claude's schedule, which is acceptable because the log is the permanent record.


## FROM CLAUDE.md (captured 2026-11-14)

SCOPE NOW: CLAUDE.md's purpose statement and 'Current Status' describe only the right-edge bar; the real Helper is far larger: the Aurora ring (Dictate, Voice, Read, Show Amit, Mobile), hold-and-speak, Dictate window, Amit Mouse and Amit Keyboard sets, the Amit menu, the Amit Preview window, the tray launcher, and the shared bridge with updater, reload and installer. Computer Health is separate.

- CLAUDE.md 'Tables this project will use (NONE CREATED YET)' (looks out of date: migration 035 tables are logged as built).
- Hand-off pointer: removed 2026-11-14 (the old hand-off notes were folded into CLAUDE.md, Sessions_Design.md and Sessions_ToDo.md; a new session reads this file first).
- Helper release: follow HELPER_RELEASE_RULES.md; checked by verify_helper_release.ps1; global hook helper_release_hook.ps1 hands the rules over.
- RENAME STATE (2026-11-14, words only, done in master files, NOT yet released): the words a person reads now say 'Amit Helper' (101 places in 9 files). Left as 'Amit Live' on purpose: six window-title lookups and the ring window title in amit_whisper.cs, the settings page window titles, log text, comments, version notes. Ships with the next normal Helper release (bump version then); tray title and desktop shortcut change only when the installer is run again. Done 2026-11-14: living_testimony_apps.json says 'Amit Helper' (7 places); Living Testimony page rebuilt locally to v1.53, NOT on GitHub yet (push with the release). The planned 'Amit Live' entry is the characters project and was left alone.
- Measured 2026-11-14: Helper program files 1.3 MB; resting RAM about 320 MB (bridge 242, tray 44, bar 34), plus about 455 MB while the Edge voice window is up (closes about 5 minutes after last use, keepReady=5). Computer Health's three recorders add about 257 MB only while tracking or Watch mode is on.