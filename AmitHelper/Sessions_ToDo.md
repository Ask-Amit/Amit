# Amit Helper - Sessions_ToDo.md

Built 2026-11-13 from the old Sessions.md (now in Backups\AmitHelper\Sessions_backup_2026-11-13.md) only (nothing invented). Each item carries the date of the log entry it came from in [brackets]. "(unsure if finished)" means a later entry may have settled it but that was not clear. Open items are numbered so they can be counted.

## A. Releases, installer and install state
1. Helper 1.90 / installer 5.05 (welcome at every sign-in, sensor permission) was logged "NOT PUSHED" on 11-10; the 11-11 entry says installer 5.06 was pushed and the Helper stays 1.90 DONE 2026-11-14: Helper 1.92 and installer 5.07 were pushed (commit 5fef6f5), so 1.90 is included. [2026-11-10, 2026-11-11]
2. New installs have no Node.js or Claude Code, so AmitBooks local receipt processing does not work there until a later prompt is built (Ryan wants the installer to offer it later; the code is kept behind `-WithClaude`). [2026-11-11]
3. The Hub's "did not answer" / "too old" notes do not point to AmitFix (offered, not done). [2026-11-11]
4. The AmitFix page still says the installer is "about 73 MB" (it is about 2 MB since 2026-11-05). [2026-11-11]
5. A code-signing certificate is the real cure for "unknown publisher", the browser hold on downloads, and Smart App Control blocks. Not obtained. [2026-11-11]
6. Not tested: a clean install of installer 4.92 on another computer, Windows 10, browsers other than Edge. [2026-11-08 morning]
7. Not verified: a clean install on a computer that never had Amit. [Current State, 2026-11-08]
8. Idle processor cost of the Helper: baseline with nobody testing still to measure (source 530 KB, host about 260 MB, about 125 ms answers measured once). [Current State, 2026-11-08; 2026-11-08 evening]

## B. Amit Mouse and the Amit menu
9. Other makes of mice not verified (buttons a mouse's own program changes before Windows sees them, e.g. Logitech wheel tilt, cannot be matched to a mouse). [Current State]
10. Not verified live: the secondary mouse's middle button changed to a different action; Act as another mouse button; double-click gestures. [Current State; 2026-11-07 night]
11. Not tested: a wheel set action, a key action and double-click on a mapped button while Voice or dictation is on; middle press with Voice kept alive. [2026-11-08 evening]
12. Keyboards and game controllers for the mouse mechanism: `Per_` tables ready; game controllers not built. [Current State]
13. The Aurora ring and Print are listed as not-by-button-yet (a Helper-side Open delegate for them is not built). [Current State; 2026-11-08 evening]
14. Per-person custom pop-ups in a table: not built. [2026-11-08 evening]
15. A one-click Left-handed preset: idea only (swapping Left/Right per mouse is the new part). [Current State; 2026-11-08 night later]
16. A one-click "make this mouse my main one" offer if the primary mouse dies: proposed, not built. [Current State; 2026-11-08 night last]
17. A safe start (Shift held when the Helper starts leaves all sets off): idea only. [Current State; 2026-11-08 night later]
18. "Make this my main mouse" inside the Amit menu's Mouse tab: left out on purpose (the flag lives in the login; the Hub tab has the button). [2026-11-08 night]
19. Spoken set phrases and voice switching of mouse sets ("mouse <name> set two"): not built. [2026-11-08 night; Current State]
20. Pending preview fix: the Finished button on the Learn tab needs a hover helper (do with the next change to that preview). [2026-11-06 design entry] (unsure if finished)
21. Open: must the mouse voice commands work with no internet? Amit's listening page uses the browser's online recognition; confirm before promising offline voice. [2026-11-06 night architecture]
22. Open: whether a long middle press on the primary mouse should pass through as a normal middle press (it currently does nothing). [2026-11-06 later] (unsure if finished)
23. Known limit: the ring (hold right) and the bar (double right-click) are not paused while the Amit Mouse tab is open. [2026-11-08 late night]
24. Not tested live: the real Hub tab-visibility signal and a real middle press during editing. [2026-11-08 late night]
25. Not tested by a person: the drawn ON/OFF switch and Open button in the real Amit menu; the middle click on both mice after Helper 1.83; Ryan to try the 1.74 middle click. [2026-11-08 night, end of day, 1.74] (unsure if finished: later entries show Ryan testing the menu live)
26. Amit Mouse page v1.20 "Use a saved setup" (Move, Copy, Delete a saved mouse): not yet tried by Ryan on his real mice. [2026-11-09]
27. Hub pursuit for Amit Preview history tables (Pre_History, Pre_Versions) and for the Voice menu Mouse and Keyboard tabs: named as open. [Current State; 2026-11-06 later] (unsure if finished)
28. Button step "Open a menu": pressing a real bar button with this step is not tested live. [2026-11-08 night]
29. The mouse-hook watchdog message "Mouse hook stopped answering ... putting it back" (4 times in two days) was not investigated. [2026-11-10]

## C. Amit Keyboard
30. Not tested: a real second physical keyboard or macro pad, AltGr, dead keys and input methods, key repeat feel, a KVM switch, typing speed with a full secret-code set, the page inside the Hub with a real login save. [2026-11-09 night]
31. Not built on purpose: the spoken command "keyboard NAME set N" and a bar-button step "switch keyboard set". [2026-11-09 night]
32. Offered, "I like it", not confirmed built: adjustable hold time for pairs and a warning when a standard shortcut (Ctrl+C etc.) is given a job. [2026-11-09 preview] (unsure if finished)
33. Real test of Space held + 1 on the main keyboard in a Set 2, and a set up of a macro pad. [2026-11-09 night]

## D. Amit Keyboard: secure messages between people (design only, nothing built)
34. Review the full record `KEYBOARD_SECURE_MESSAGING_DESIGN.md` before any build; a build needs a preview first and a real test with two people. [2026-11-11]
35. Amit's five suggestions (work without the Hub, hide the key not the method, say only what is true to customers, chat page first with local sets loaded once under a PIN, study end-times passages from the original text before writing for others) are NOT yet decided. [2026-11-11]
36. Characters not on a US keyboard (Hebrew, emoji): a fallback is still to settle; English only for now. [2026-11-11]
37. Backup of the local sets for a dead computer: a separate FUTURE build. [2026-11-11]
38. A security design this serious should be reviewed by a professional before customers are told it is secure. [2026-11-11]

## E. Phone / device as a peripheral (idea and Stage 0 only)
39. Requirement: a photo from the phone goes into Pictures\Show Amit and Show Amit pops up with it. Needs a small Helper change (Show Amit has no outside "open this picture" entry point); a Helper release plan must be written and approved first. [2026-11-12]
40. Decided to build option one now (the Amit Mobile app tells whether it is at home and hops to the Helper's home page; internet route stays default); a domain is being obtained for a secure https home route; every plan must include that path. [2026-11-12]
41. Open: the name (Amit Mobile with two routes, or Amit Devices); `.jpg` versus the `.png` named in the root "look" rule; Android untested. [2026-11-12]
42. The Helper must reproduce the touchpad use (relative and absolute moves, wheel, Ctrl-wheel zoom that always releases Ctrl, safeties, master off switch); a screen view must come from the trusted Helper, opt-in, visible, paired, encrypted. [2026-11-12]
43. Confirm direction first: a direct same-Wi-Fi link was cancelled by Ryan on 2026-09-05. [2026-11-11]

## F. Amit welcome and sensor permission (Helper 1.90)
44. Not tested: the silent (switch OFF) path; the first sign-in after a real restart (card open at logon); a fresh computer's first-time permission flow end to end. [2026-11-10]
45. A real spoken dictation test after the rename to "Amit Live (listening)" is still to be done by a person. [2026-11-10]
46. Replacing the listening engine (the one speech page) is a future build; offline whisper.cpp assessed and shelved; not now. [2026-11-10]
47. Open: a split-second flash after Yes in the Windows permission box; the Program Files copy of the reader is made at the one-time OK (a later new reader needs the OK again); a reader already running at start suppresses the question until the next sign-in. [2026-11-10]
48. No menu button yet for the "full welcome at every sign-in" switch. [2026-11-10]
49. The welcome card can hide behind a maximized browser at sign-in: accepted as is. [2026-11-10] (accepted by Robin; kept as a known limit)

## G. Helper bar, button steps and creator
50. "Ask Amit to create this button": plan settled in `Button_Creator_SPEC.md`; 43 Hub pursuits (program AmitHelper); resume about 2026-11-08, stage 1 first; first version on ONE button on Ryan's computer. Only a placeholder exists. [2026-11-01 afternoon] (also: spoken creation of buttons (stage 2) needs the person's own Claude session; until then buttons are made by hand in the Hub [CLAUDE.md 2026-11-14])
51. Not tried by a person: real file-picker window, Test opening a file, pressing a file button; a real audio device switch; the Print choice window, area drag and a real print. [2026-11-01 entries]
52. Hands-on test item (due 2026-11-02) for Open a file, the pickers and Audio setting. [2026-11-01 afternoon]
53. Windows 10/11 differences in the Windows settings pages (Touchpad, Power, Startup apps, Phone) are not labelled yet. [2026-11-01 evening]
54. Known gaps in the bar: an "ask Amit" step opens Ask Amit but does not pass the ready question; the Amit Live tab in the Hub is a placeholder; the rail width setting is ignored by the bar. [2026-11-01 morning] (unsure if finished) (also: CLAUDE.md note that both Hub pages, Amit Live page and Amit Helper page under Communications > Amit Live tab, still had to be made [2026-11-14])
55. Optional migration 036 (open_file as a real step type) is drafted and NOT run. [2026-11-01 afternoon]
56. Bar autostart with Windows is OFF; `install_bar.ps1 -Autostart` only if Ryan approves. [2026-10-31 late night] (unsure if finished)
57. The double-right-click against the Amit Live ring (context menu flash) and the bar fixes of 2026-11-01 after midnight: to be tested by hand. [2026-10-31 late night; 2026-11-01 just after midnight] (unsure if finished)

## H. Amit Preview
59. Nothing creates the "Amit Coder" profile and button on a subscriber's computer yet (installer work). [2026-11-07]
60. Live test of `/api/bar/press` and the verdict printing waited for the Helper restart. [2026-11-07] (unsure if finished)
61. AmitPreview.html named in the six helper file lists: was to do. [2026-11-06 v1.06 and v1.10] (unsure if finished)

## I. Voice
62. Wake phrase ("voice on"): NOT built, not approved. Open decision for Ryan: 1 "Voice on", 2 "Amit voice", 3 both. First step would be a log-only test mode. [To do - Voice, 2026-11-08]

## J. Dictation (Helper 1.77)
63. Ryan once saw words in both the Dictate window and the VS Code box at once; likely a second speech-to-text; not reproduced. The short gap while typing dictation restarts can cost a word. [2026-11-08 morning]

## Resolved (kept so the judgment can be checked)
- Mouse tab of the Amit menu follows the mouse that opened it: built and tested in 1.86 and 1.87. [2026-11-08 night]
- Keyboards using the same mechanism as the mice (PLAN, NOT STARTED in Current State): built as Amit Keyboard in 1.88. [2026-11-09 night]
- Mouse in a different USB port: tested, accepted as it is, no "Is this your mouse?" feature planned. [Current State]
- "Run a Helper button", Switch set, keys, hold and drag actions: verified live on Ryan's mice. [2026-11-07 night]
- Hub button editor not knowing the Amit Preview steps: fixed in Helper 1.70 / Hub v8.69. [2026-11-07]
- The Helper release written rule, hook and check: done. [2026-11-07]
- Dictation losing words when focus leaves a text box: fixed in 1.76/1.77, tested live. [2026-11-08 morning]
- Helper bar icons off-center: fixed in 1.75. [2026-11-08 later]
- Middle button hard-wired: replaced by the one standard button Settings > Amit menu in 1.83. [2026-11-08 end of day]
- Voice menu Esc to close: done in 1.64. [2026-11-06 later]
- Hub tab, bar sync, icons to the bar, tables (migration 035): built, pushed, installed. [2026-11-01]
- Installer wrongly asking about a Claude account / installing Node.js: removed in 5.06. [2026-11-11]
- Wake card's ticking lines being timed: now real checks. [2026-11-10]
- Left-click lockout on non-primary mice: fixed in 1.79 / page v1.08. [2026-11-08 later]
- Two mouse-attribution questions: answered, closed. [2026-11-06 night]


## FROM CLAUDE.md (captured 2026-11-14)

### Release and rename
- Full rename of titles and logs waits for one planned release (window-title lookups must accept both the old and new titles).
- Push with the next release: living_testimony_apps.json and the Living Testimony page v1.53 (copy both to the repo and push together).
- Next normal Helper release carries the 101 word changes (bump the version then); installer must be run again on a computer for the tray title and shortcut to change.

### Hub and bar
- Open question: the Helper holds no login, so a bar change reaches it only when an Amit page is open; limited read-only access for the helper is a later decision.
- Before adding anything to the Helper: say which program it belongs to, how many bytes it adds, and what RAM it costs (separation rule).

## FROM THE HUB PURSUITS (added 2026-11-14; nothing was changed in the Hub)

### Top-level pursuits
- APP - A button can carry a sealed code packet that installs and runs on the computer (stage 1, proved with one button for Ryan) [due 2026-11-08] [P1] [starred] - Full plan: AmitHelper\Button_Creator_SPEC.md. Merged ideas from six AIs: AmitHelper\Ideas_Merged.md (raw: Ideas_Captured.md). Stage 1 = the machinery. The code is never shown or editable; (stage 1 of the umbrella item 50) (stage 2 of the umbrella item 50) [hub:49ad492a-4ac5-44ac-8759-896feec41f4a]
- APP - Ask Amit to create this button: the person speaks, Amit builds and seals the packet (stage 2) [due 2026-11-15] [P1] [starred] - Full plan: AmitHelper\Button_Creator_SPEC.md. Merged ideas from six AIs: AmitHelper\Ideas_Merged.md (raw: Ideas_Captured.md). Stage 2 = the creation chat in the existing Ask Amit. [hub:b38b3d08-1c9a-4cbf-905a-f4e8ddb594eb]
- APP - Other people can create buttons: a hosted stamping service and access to Ask Amit (stage 3) [due 2026-11-22] [P2] - Full plan: AmitHelper\Button_Creator_SPEC.md. Merged ideas from six AIs: AmitHelper\Ideas_Merged.md (raw: Ideas_Captured.md). The secret stamp cannot live on other people computers; real cost and care. Decide how others reach Ask Amit. [hub:8ac4b135-2ac8-48a6-b65e-da1909308ec1]
- DESIGN - An icon library from open licenses that the bar can draw (stage 4a) [due 2026-11-29] [P3] - Full plan: AmitHelper\Button_Creator_SPEC.md. Merged ideas from six AIs: AmitHelper\Ideas_Merged.md (raw: Ideas_Captured.md). Today the Hub icons are emoji and the bar draws them in one color. [hub:3f87912a-d405-41cd-808d-60f0a35a3cb6]
- APP - Building blocks from the six AI lists, easy dropdown ones first (stage 4b) [due 2026-11-29] [P2] - Full plan: AmitHelper\Button_Creator_SPEC.md. Merged ideas from six AIs: AmitHelper\Ideas_Merged.md (raw: Ideas_Captured.md). [hub:b78ed8a2-8cb0-49ce-99fc-5d5f63a2ae34]
- SPEC - Mouse: once Voice is on, the middle button menus through the built-in voice commands so mouse and voice work together [due 2026-11-08] [P5] [starred] - Ryan, 2026-11-06. Once Voice is active (single middle click on the primary mouse), the middle scroll button should menu through the built-in (hard-coded) voice commands only, so a person can use the mouse and the voice at the same time. [hub:bdd41361-ba06-46a3-bd15-847cac6ff598]

### Part of: APP - A button can carry a sealed code packet that installs and runs on the computer (stage 1, proved with one button for Ryan)
- WIRE - Helper checks the stamp and the login match before a button code reaches the bar file [due 2026-11-08] [P1] - Public stamp checker ships in the helper; the Hub sends the signed-in id with the bar. Uses the six file lists + a one-time handover (memory reference_helper_file_lists.md). [hub:1ab7f8e8-da1a-48da-a80c-565b2ecc6b66]
- WIRE - Bar runs a button code only after the person approves it on this computer (approval tied to a hash of the code) [due 2026-11-08] [P1] - Plain-words summary in the approval dialog; any change asks again; dated backup before anything writes to files. [hub:db99663b-3b20-462a-b0d8-9481d2249f6a]
- APP - Button pop-up gets an Insert packet box and a Test on this computer button; the code is never shown [due 2026-11-08] [P1] - Test asks the helper to run the button (new helper route). [hub:faf1e41d-9e2c-44ff-99a2-40710b03127a]
- APP - Stamping software on Ryan computer checks the packet against the never list, then seals it [due 2026-11-08] [P1] - Runs where the Ask Amit watcher runs. Private key in a local-only file, never in GitHub, never in the Hub, never in the helper. The model never stamps. [hub:54af0d76-8946-4ecc-8d04-4b7c41362014]
- WIRE - The helper reports its computer name and id; record which computers approved each button [due 2026-11-08] [P2] - Code is never sent down to a computer that has not approved it. [hub:d419049b-d8b2-46ef-9592-eb4cb1c838b1]
- APP - First real button works end to end: Ryan spreadsheet (file, tab, date and a second value) [due 2026-11-08] [P1] - Needs from Ryan: where the file is, which tab, what goes in each time. He said "today date and today books": ask what the second value is (a number or text he types?). [hub:3061a30b-c29c-4aeb-a038-59afe19fa2d4]
- WIRE - Database: add code and recipe columns to hel_buttons (migration written; Ryan runs it by hand) [due 2026-11-08] [P1] - Own rows only already. Include Data API grants in the same migration. [hub:2a8f3f4b-5177-4da5-ba42-8a30c02740ac]

### Part of: APP - Ask Amit to create this button: the person speaks, Amit builds and seals the packet (stage 2)
- TRAINING - Button Builder instructions and the interview question set go into Amit rules [due 2026-11-15] [P1] - Draft and a tryout prompt are in Button_Creator_SPEC.md sections 5 and 9. Publishing rules to the live answering Amit waits for Ryan (see memory project_answering_amit_safety_2026-10-26). [hub:0ee20e4a-cdee-459f-b6cf-be151fd0203f]
- APP - The checker: never list and size rules run before anything is stamped [due 2026-11-15] [P1] - Never list: deleting or emptying, system or security settings, download and run, passwords or personal data, send/post/buy, admin rights, hiding what it does. [hub:5dd685f9-304b-4d58-b7de-1be6d7900ae8]
- APP - Changing a button: Amit starts from the recipe and sends a new packet that replaces the old one [due 2026-11-15] [P2] - Chat history is kept. [hub:867b8cd9-3f68-4a0a-b6b9-3b11e37fd520]
- WIRE - Amit is handed, with the person consent, the profiles, installed programs, Amit apps and what the helper can do [due 2026-11-15] [P1] - The person is told what is shared. Sources: hl profiles, /api/programs, the Living Testimony list, the step list. [hub:f61af059-3816-44ba-a37d-019c36e01ad9]
- APP - Use this packet button under Amit message puts the button in the right profile in one click [due 2026-11-15] [P1] - Copy and paste stays as the fallback. The packet carries name, icon, profile, description, recipe, steps or code. [hub:9566cee1-f17e-43ba-a593-423326b66e86]
- RESEARCH - Run the interview on Ryan own computer (tryout), then adjust the questions [due 2026-11-08] [P2] - Tell Amit: run the button builder tryout. No stamping in the tryout. [hub:a718ff41-770d-4d12-9e63-1ca71c1441e9]
- WIRE - Hub opens Ask Amit in button-creation mode with a safe handoff (the same handoff gives Ask Amit with the prepared question) [due 2026-11-15] [P1] - The Hub Ask Amit takes nothing in the address on purpose. Placeholder button already in the pop-up. [hub:86de58e3-2db4-4f49-b5f1-7ddbebb9f68d]

### Part of: APP - Other people can create buttons: a hosted stamping service and access to Ask Amit (stage 3)
- APP - A hosted stamping service [due 2026-11-22] [P2] - No notes in the pursuit; part of: APP - Other people can create buttons: a hosted stamping service and access to Ask Amit (stage 3). [hub:d44af24c-bb60-4185-9fa1-9041ae251742]
- SPEC - Where the secret stamp lives and who pays for the answers (about 31k input tokens per answer measured earlier) [due 2026-11-22] [P2] - No notes in the pursuit; part of: APP - Other people can create buttons: a hosted stamping service and access to Ask Amit (stage 3). [hub:b6e7f617-572c-402a-b350-502c85a60fdb]
- SPEC - How other people reach Ask Amit (today it is answered on Ryan computer) [due 2026-11-22] [P2] - No notes in the pursuit; part of: APP - Other people can create buttons: a hosted stamping service and access to Ask Amit (stage 3). [hub:4b4e88f3-d90d-404e-8d7d-07b84e776839]

### Part of: DESIGN - An icon library from open licenses that the bar can draw (stage 4a)
- RESEARCH - Check the license of each candidate icon set before using it [due 2026-11-29] [P3] - Lucide, Tabler, Bootstrap Icons, Material Symbols. Also whether the answering Amit can search the web (unchecked; the plan does not depend on it). [hub:6d18872a-161a-47ba-8215-a9218279c3e4]
- APP - Hub icon picker with search and categories (Amit suggests from the library and says why) [due 2026-11-29] [P3] - No notes in the pursuit; part of: DESIGN - An icon library from open licenses that the bar can draw (stage 4a). [hub:dcba6e1d-5084-4659-8e58-bad68160a9bb]
- WIRE - The bar draws library icons (today emoji in one color) [due 2026-11-29] [P3] - No notes in the pursuit; part of: DESIGN - An icon library from open licenses that the bar can draw (stage 4a). [hub:9965b75b-ff32-448b-951a-e5bc87989acf]

### Part of: APP - Building blocks from the six AI lists, easy dropdown ones first (stage 4b)
- APP - Window control: focus and arrange (3 of 6; Medium-Large) [due 2026-11-29] [P3] - The bar must remember which window an earlier step opened. See Ideas_Merged.md. [hub:3ccc789a-0b39-4402-b839-f7a1cd123e05]
- APP - Ready here? column in the button table: ready, needs setup, not installed (3 of 6; Medium) [due 2026-11-29] [P3] - Do not fail silently on a second computer. See Ideas_Merged.md. [hub:f8a19933-31d9-46d8-b29c-efebfe8136a4]
- APP - Ready-made button gallery with templates with blanks (6 of 6; Medium) [due 2026-11-29] [P3] - Start with 10 to 15 good buttons; each shows its steps; blanks filled on add. See Ideas_Merged.md. [hub:3b511e78-64e3-4a32-8418-34605854f2a1]
- APP - Portable resource names bound per computer, like My work folder (2 of 6; Large) [due 2026-11-29] [P3] - See Ideas_Merged.md. [hub:bece24b1-bd1a-4614-8327-4f93c8fda0c6]
- APP - Email draft: person presses Send (3 of 6; Small-Medium) [due 2026-11-29] [P3] - mailto: with to, subject, body; contacts list. See Ideas_Merged.md. [hub:09f59c32-5e4d-4dc2-9f2c-fd22a55dc8f5]
- APP - Timer or reminder (4 of 6; Medium) [due 2026-11-29] [P3] - The bar keeps running after the steps and notifies. See Ideas_Merged.md. [hub:ee2b8cc5-0c6f-4c3a-82fa-5d222bb8542a]
- APP - Copy a text snippet to the clipboard, with a snippet list (4 of 6; Small-Medium) [due 2026-11-29] [P3] - See Ideas_Merged.md. [hub:ec2c01c9-4ba9-419a-94dd-0e363f672dcc]
- APP - Searchable picker and a search box in the bar (2 of 6; Small-Medium) [due 2026-11-29] [P3] - See Ideas_Merged.md. [hub:a4f927ef-5c0a-4c38-a0f8-aca315156e87]
- APP - Volume and mute (6 of 6; Medium) [due 2026-11-29] [P3] - New bar code for Windows audio. See Ideas_Merged.md. [hub:11823453-f4f9-4234-bb25-9e7479b61e95]
- APP - Open a file with a recent-files list and a per-computer binding (6 of 6; Large) [due 2026-11-29] [P3] - BUILT AND LIVE 2026-11-01 (Hub v8.63, helper 1.53 files, bar rebuilt from source). Tested with made-up data and against the live helper (programs 103, recent files 30, bind, Ready check, bar sync ignores a page-supplied path, foreign... (notes say BUILT AND LIVE 2026-11-01; kept here in case it still needs a check) [hub:542da187-9d27-4d69-a312-641ff5ed4551]
- RESEARCH - Check whether Do Not Disturb and switching the audio output device are possible at all (2 of 6 each; Large) [due 2026-11-29] [P3] - Source 3 says Windows has no stable public control for Do Not Disturb. See Ideas_Merged.md. [hub:360d6ca0-ebb1-4be6-a78a-8b05e20be425]
- APP - Search the web: provider and phrase (2 of 6; Small) [due 2026-11-29] [P3] - Two values. Easy build. See Ideas_Merged.md. [hub:6316db84-8cc9-4b06-bcfb-78e087d6b85e]
- APP - Open a Windows settings page: a dropdown of settings (5 of 6 AIs; Small) [due 2026-11-29] [P3] - Shipped catalog of ms-settings: addresses; new step type; easy build. See Ideas_Merged.md. [hub:fa3626ee-052a-4686-8fe6-d18134137b04]
- APP - Media control: play, pause, next, previous (3 of 6; Small) [due 2026-11-29] [P3] - The bar sends the standard media keys. Easy build. See Ideas_Merged.md. [hub:cf2056bf-3d95-4ce3-be80-9fac702af91b]
- APP - Lock or sleep (2 of 6; Small) [due 2026-11-29] [P3] - Easy build. See Ideas_Merged.md. [hub:19be892f-6d36-4370-b3f9-7cf102392207]
- APP - Saved websites by name: bookmarks list or Amit favorites (5 of 6; Medium) [due 2026-11-29] [P3] - New table Hel_Favorites. See Ideas_Merged.md. [hub:9c6bf97f-3088-40a5-b7d8-7234318d5de8]
- APP - Open a folder by name: Documents, Downloads, Desktop, Pictures, Music, Videos, OneDrive (5 of 6; Medium) [due 2026-11-29] [P3] - Resolved on each computer so it is portable by name; new step type; easy build. See Ideas_Merged.md. [hub:919bd9d9-c085-49e9-9ad7-563fb2e5c8f1]

## FROM THE OLD HAND-OFF NOTES (2026-11-14)
- The "Amit PreView" button (profile "Amit Coder") opens an EMPTY previewer and asks nothing. Ryan's real intent: pressing it asks what to preview, from a list; then the previewer says what the page does and writes that to the previewer. Proposed (not approved): a chooser in the previewer's start screen fed by the Hub's own list of apps (`living_testimony_apps.json`), picking one loads the hosted page into the picture and pre-fills the Goal from the app description with no AI; "Ask Amit to write these" builds the request for How it works and Variables. Not built; Ryan: "not right now". [2026-11-07]
- Delete the three "Preview check test" entries in the Amit Preview window's History (Ryan can use "Delete this preview"). [2026-11-07]
- Question for Ryan: the per-button Lock on the Amit Mouse page: per set, or across all sets? The page was built with the lock kept per set; no decision of Ryan's is recorded. [2026-11-06]

## ADDED 2026-11-14 from the newer Sessions.md (now in Backups\AmitHelper\Sessions_backup_2026-11-13.md)
- Release Helper 1.92 / installer 5.07 (prepared, verify script ALL PASS) only on Ryan's word; stage only existing paths, check `git diff --cached --name-only`, then `verify_helper_release.ps1 -Live`. [2026-11-14]
- At the rename release: bump Helper 1.93, dashboard v5.14, Hub v8.79, installer 5.08, and rebuild the tray exe (AmitTracker.cs is changed, exe not rebuilt). [2026-11-14]
- Push the Living Testimony v1.53 and `living_testimony_apps.json` rename with that release. [2026-11-14]
