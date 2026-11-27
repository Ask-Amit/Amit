# AmitCoder - Sessions_Start

## HOW TO READ
Read this file first; it is all a new session needs. Read Sessions_ToDo.md only when asked about to-dos. Read the Daily Sessions folder (one text file per session) or the original Claude session only when asked. the backup files in Backups\AmitCoder\Sessions_backup_2026-11-13.md are for research only.

## DIRECTORY
- Sessions_Start.md - this file.
- Sessions_ToDo.md - open items found in the old Sessions.md (now in Backups\AmitCoder\Sessions_backup_2026-11-13.md), with source dates.
- Daily Sessions\ - one text file per session (the history; never pushed; the old Sessions_Log.md was split into it on 2026-11-15).
- Backups\AmitCoder\Sessions_backup_2026-11-13.md - byte-for-byte copy of the old Sessions.md.
- Sessions_Design.md: this project's database tables (first section) and design reference (how it is built); read only when working with the database or on that part of the build.

## AGREED: one Amit at the desk or in the pocket (2026-11-25)
- Ryan agreed to the design and safety limits for the phone as the full Amit. Not built. Next: step 1, look-up only (AmitBooks jobs, budgets, spending; pursuits; calendar), with web search off whenever records are opened.
- Full record: Sessions_Design.md, "ONE AMIT, AT THE DESK OR IN THE POCKET". The code lives in the Helper, AskAmit and Amit Mobile.

## RESUME: AmitCoder - microphone fix (2026-11-26, session 92edde33)
- v7.16, screen 0.04, Helper 2.39: the microphone cycled on and off in 2.38 (Helper check, fixed); the cursor now goes into the message box before it starts. NOT YET CONFIRMED with Ryan's voice.
- Ryan wants, as in VS Code: send another message while Amit is still working. NOT BUILT (words wait in the box). Also not built: the project list refreshing by itself so a newly created project can be chosen. Offered; not answered.

## RESUME: AmitCoder - microphone and speaker (2026-11-26, session 92edde33)
- LIVE: AmitCoder.html v7.15, screen 0.03, link 0.05, Helper 2.38. Approved preview: Previews/AmitCoder_Microphone_Preview.html.
- Both buttons stay on until turned off. Mic: words go to the message box wherever the focus is; Enter or right-click sends and it keeps listening; while Amit works the words wait; it turns off if the connection drops or the page stops asking for 30 seconds. Speaker: reads the closing message and approval requests only; starts off.
- Tested: Helper compiles; screen with a pretend connection. NOT TESTED: the real microphone and voice, a real right-click (the Helper also uses the right button), long quiet periods.
- NEXT: Ryan tests signed in: permission levels, microphone, speaker.

## RESUME: AmitCoder - permission levels (2026-11-26, session 92edde33)
- v7.14 (screen 0.02, link 0.04, engine 0.03, Helper 2.37). Approved preview: Previews\AmitCoder_Permissions_Preview.html.
- How it works: the engine file is also the GATE (a PreToolUse hook, "--gate") passed to Claude Code in both setups, so every action except reading and Claude's own note-keeping reaches the engine (tested in both setups). judge() in the engine decides by level and writes the card. Level file: permission_level.json in the engine's state folder; loosening needs confirm.
- Protected at every level: delete, publish, install, send, money words, closing/starting programs or computer setup, unexplained or script-running commands, files that control permissions. Programs/setup was ADDED beyond the preview's list.
- The check for risky actions has limits (the page says it can miss things). Do not offer it to other people yet.
- Tested: 129 rule checks; real Claude Code (Haiku, empty folder): full and light setups, delete No kept the file, delete Yes removed it, loosening without yes refused; screen with a pretend connection.
- NEXT: Ryan tries it signed in. Do not offer to other people yet.

## RESUME: AmitCoder - Coding page is LIVE (2026-11-26, session 92edde33)
- LIVE: AmitCoder.html v7.13 + amit_coder_screen.js v0.01 (owner only), Helper 2.36. Left side: Overview (tabs: Introduction, Get Started, Overview, History, Docs, Dev Practices, Library, Settings, Previewer, Amit's Builds), Shortcuts, Coding. This replaces the older page lists below.
- Tested: the engine with real Claude Code on Haiku in an empty folder (typed message, Talk with Amit, Allow, Deny); the screen with a pretend connection.
- NEXT: Ryan tests the Coding page signed in: the whole live path is NOT proven. Not tested with real Claude Code: Save and wrap up, Study Scripture, Helper rules, full setup, Stop, Resume last.
- Still missing: formatted replies, nested projects, New project, Save wrapping up every project, a way for another person to set their Amit folder.
- Offered, not answered: remove the repeated Overview tab. The round + button covers part of a switch in Shortcuts.

## RESUME: AmitCoder - new page is LIVE (2026-11-26, session 92edde33)
- LIVE: AmitCoder.html v7.09 (c52eeab), the page the Hub opens. AmitCoder_NEW.html now only forwards to it. This replaces the older LIVE and Next lines below about the two pages. Old page kept locally: Backups\AmitCoder\AmitCoder_Original_v6.43.html (not published under another name, Ryan's choice).
- Pages: Introduction, Get Started, Overview (Overview, History, Docs, Dev Practices, Library, Settings, Previewer), Shortcuts, Amit's Builds, and the ideas button. Pairing removed (needed VS Code). Add Page is hidden.
- Ryan: no VS Code; the one-line Claude Code install is what Get Started and the installer use. Starter kit no longer writes .vscode or .devcontainer.
- amit_coder_link.js v0.03: contacts this computer only after confirming the owner.
- NOT TESTED with a real sign-in: saving and loading shortcuts, library, ideas, history. NOT TESTED: Get Started and the installer on a new computer.
- The coding screen is still not in the page: owner only, needs Node.js, folder setting written by hand here.

## RESUME: AmitCoder - working screen (2026-11-26, after Helper 2.34)
- Ended: Helper 2.34 + installer 5.42 PUSHED (0cabea7), installed and running here; live release check ALL PASS. It adds the coding connection /api/coder (owner only while being built).
- LIVE: Helper 2.34; AmitCoder/AmitCoder_NEW.html v7.03 with amit_coder_link.js v0.02 (test page); template v1.02 + amit_master.js (1f6f02c; Ryan: the template looks like it is working). AmitCoder.html on the website is still the original v6.43 with the shortcut screen. The local AmitCoder.html is v7.03 (not pushed under that name). Backup of v6.43: Backups\AmitCoder\AmitCoder_Original_v6.43.html.
- NOT YET PROVEN: the coding connection with Ryan's real sign-in (tested whole-path with PRETEND account checks and real Claude Haiku; the real Helper refused another website and a fake sign-in). Speed through the real Helper not timed.
- Next: (1) Ryan opens https://askamit.org/AmitCoder/AmitCoder_NEW.html signed in: the line under the version should read "On this computer: ...". (2) Then move the working screen onto Page 2 (Ryan: NOT yet, until the connection works); everything on the carry-over list (design section 18) goes with it. (3) Name Page 2 and its tabs. Move Shortcuts over before this page ever replaces AmitCoder.html.
- Engine: ComputerHealth\Watchers amit_coder_routes.ps1, amit_coder_engine.js, amit_coder_sessions.js (needs Node.js; the Amit folder is set in %LOCALAPPDATA%\AmitComputerHealth\AmitCoder\config.json, written by hand on this computer; nothing sets it for another person yet).
- The proof of concept (RoundTripTest\) is unchanged as the reference.
- Decisions waiting: design section 11 and the proposals in 13 to 20; phone safety limit before coding from away; custom buttons built inside the Coder (discussed; keep-code-hidden question unanswered); full-screen chat place in the template (preview in Templates\Previews).
- Open to-dos: 120 (counted 2026-11-26).

## CURRENT STATE
AmitCoder is the paid, login-gated coding workspace: shortcuts, session history, a starter kit, and (newest) the Amit Preview tool. Product model (agreed 2026-10-31, discussion only): a subscriber gets the same CLAUDE.md / Sessions files mechanics Ryan uses, tailored to them, on their own computer with their own Claude account; the shared Amit file is delivered by a session-start hook; Amit software never reads or stores the person's Claude login. Price is NOT set. Billing is not wired.
- AmitCoder.html: built off the shared template (Session 58, 2026-07-28); tiles Get Started and Shortcuts; Previewer tab added v6.43 (2026-10-31); on 2026-11-25 the local page matched the repo copy.
- AmitPreview.html: real tool, page v2.00 pushed 2026-11-06 (99bc3fb), v2.17 released 2026-11-07 with helper 1.69 and installer 4.86. Page carries sender rules and checks every live send; bar button "Amit PreView" opens it.
- Guided Previewer (Templates\amit_previewer.html v1.00): built, local, NOT pushed at its entry; return path (answers back into the conversation) not built.
- Starter Kit (Amit_Coder_Starter_Kit.ps1): scaffolding, backups, local server, branch script, migrations convention, a CI workflow not yet verified.
- Newest decision (2026-11-07): no previewer line goes in the root CLAUDE.md; it lives here and on the Living Testimony.
- Team-inbox requests R1-R7 and E1 (chat features Ryan asked for, see the log top) are recorded as requests, not built.

## REQUIREMENT: AMIT CODER MUST KEEP AMIT ALIVE (Ryan, 2026-11-25)
Amit Coder has to keep Amit alive. Without that, the whole platform would be corrupted for the people using it, in how everything works. Subscribers use Amit Coder with Amit or not at all.
- Proposed way to do it (discussed, not yet approved or built): a hook loads the Amit core at start and after condensing; the program confirms the whole core arrived and does not start without it. A hook alone can be turned off, fail, or have long output cut to a preview.

- Full direction (working screen, saving, keeping Amit, what the person sees, permissions, hosting and the living network), with what is decided and what is only proposed: Sessions_Design.md, section "AMIT CODER WORKING SCREEN AND PLATFORM DIRECTION" (2026-11-25).

- NEXT DISCUSSION (2026-11-25): the working screen's preview and layout need to be different, more interactive instead of chat and respond. Discuss before changing it. Start with sections 10 and 11 of that design section. Preview v1: Previews\AmitCoder_Screen_Preview.html.

## FILES IN PLAY (under AmitCoder\ unless stated)
| File | What it is | Version |
|---|---|---|
| AmitCoder.html | the workspace page | v7.03 local; live as AmitCoder_NEW.html (AmitCoder.html live: v6.43) |
| AmitPreview.html | Amit Preview window page | v2.17 |
| Amit_Coder_Starter_Kit.ps1 | project scaffolding | none |
| Templates\amit_previewer.html | guided previewer | v1.00 |
| Templates\open_preview.ps1, show_preview.ps1 | preview openers | v1.30 (open_preview) |
| Handoff_AmitPreview_2026-11-06.md | handoff for the preview tool | none |
| helper amit_whisper.cs ("preview" voice command) | in the helper | v1.49 |
| AmitCapacity\Sessions_Start.md | plan capacity reference | none |
| CLAUDE.md | project rules | not read for this record |

## OPEN TO-DOS
Open to-dos: 120 items, see Sessions_ToDo.md.

last clean-up: built 2026-11-13 from the old Sessions.md (now in Backups\AmitCoder\Sessions_backup_2026-11-13.md), newest log entry dated 2026-11-07 (Current State) / 2026-11-06 (Log).
Last clean-up: 2026-11-26T18:48Z, session 958e9ff7-50f6-4a17-a3ac-eca2025120e8

## ORIGINAL SESSIONS
Originals were not recorded before 2026-11-13. From the next clean-up on, each entry names its session (name, ID and path under C:\Users\user1\.claude\projects\c--Users-user1-OneDrive-Documents---onedrive-Amit\). Those files expire on Claude's own schedule, which is acceptable because the log is the permanent record.

## FROM CLAUDE.md (captured 2026-11-14)
SCOPE NOW: wider than "coding session history". AmitCoder is the paid, login-gated coding side ("VS Code with Amit inside"): shortcut system (F = user's own, J = Amit's builtin package, activation_key separate from name, Master vs Step, chained subtasks via referenced_shortcut_id, alias_of linking), Starter Kit script and dev-practice tooling, Get Started checklist, Pairing log, Community Code Library, Amit's Builds tile, the Previewer (true-to-life working previews), management/child session shortcuts (J Manage, J New, J Instruct, J Sessions, J Check, J Cleanup), and hub_entries pursuit conventions (program column).
- Status in CLAUDE.md is mostly dated 2026-07-28 to 2026-09-07 and 2026-10-31 (looks out of date: nothing newer; the page was v6.31 then, check Sessions_Start above for the current version).
- Page structure (as of 2026-07-28/29): built from Templates/template.html; tabs Overview, Shortcuts, History (static mockup), Docs, Dev Practices, Settings, Pairing, Library (7th/8th as added); sidebar tiles Get Started, Overview, Amit's Builds.
- Tables noted: amit_shortcuts (activation_key, sort_order, referenced_shortcut_id, alias_of), amit_coder_sessions (run, live), amit_pairing_sessions (migration NOT YET RUN at writing), amit_code_library (pending confirmation at writing), amit_coder_ideas; hub_entries.program. Whether the pending ones were run later is unknown (unsure).
- Admin edit: Ryan's account may edit builtin shortcuts; only admin can create J. Migration shortcuts_admin_edit was written, not yet run at writing (unsure if finished).
- Directive package versioning: $DIRECTIVE_VERSION in Amit_Coder_Starter_Kit.ps1 (1.1 then); four-step rule on any directive change (update embedded text, bump version, update dev_playbook row, push).
- Previewer: guided Previewer page Templates/amit_previewer.html works with spec files; return path is clipboard-based today; in-page Preview pane inside AmitCoder not built.
- J Manage uses a local stand-in for credentials (Database\amit_coder_credentials.md) on Ryan's machine only; a real installer for other people is not built.

