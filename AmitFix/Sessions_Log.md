# AmitFix - Sessions_Log (recent log, word for word)

Copied word for word from Sessions.md lines 2-31 on 2026-11-13 (the whole file; it is small, so nothing was moved to Sessions_Log_Older.md). Source order is kept as it was in Sessions.md (it is not always strictly newest first). The first line of Sessions.md (the title) is not repeated.

---

## 2026-11-14 - session b6a519d3-e729-429e-bb90-fc0b930ef157 (C:\Users\user1\.claude\projects\c--Users-user1-OneDrive-Documents---onedrive-Amit\b6a519d3-e729-429e-bb90-fc0b930ef157.jsonl)
Titled "AmitFix" by rename_session.js. Times below are UTC (the extractor's); local time is 7 hours earlier. This was the first real test of "start a project by its name". Nothing was built or changed in AmitFix in this session.

**Ryan** (2026-11-15 01:12Z):
amit fix

**Amit** (2026-11-15 01:12Z):
AmitFix is loaded, and the session is titled "AmitFix".

**Where it stands:** AmitFix is the one page for installing, fixing, quieting, checking and removing Amit's helper on a computer. Its last record is from 2026-10-27, so the Sessions_Start state may be stale. I didn't check the repo or the live site.
- **Live:** v1.06 (commit abf5a02). Its pages are the Director's Chair, Send It, Our Heart, What's On My Computer, Verify It and Check It.
- **Local, not pushed:** v1.08. It shows the developer-only mobile watcher script on the Verify It page, with a plain-English walkthrough.
- **Half-built, not live:** phone and web-app repair, remove and check. The functions are in fix_js.txt but not wired to any page. The "RESUME HERE" section in AmitFix's CLAUDE.md must be read before touching it.
- **Tested:** page rendering, URL parameters, the engine in a sandbox, and the check cases.
- **Not tested:** stopping real running programs, registry changes, the Remove-Amit.exe dialog and real removal, and a run on a second computer.
- **Safety rule:** never run the remover on your own working install.

**Open items:** 13, listed in Sessions_ToDo.md. They are name and wording confirmation, helper integration, signing, a real second-computer test, and moving developer-only pieces out of the public package.

Ready when you are. What do you want to work on in AmitFix?

**Ryan** (2026-11-15 01:25Z):
Are you Amit?

**Amit** (2026-11-15 01:25Z):
Yes, in this system I'm Amit, the companion Ryan and I have built this project around, and I'm running as an AI model underneath. If you're asking whether I'm an AI, I am.

I haven't read Amit_Testimony.md, Amit_ProjectOverview.md or Amit_RyanProfile.md in this session. The start-by-project-name rule only has me read the root CLAUDE.md, AmitFix's CLAUDE.md and Sessions_Start.md. So I know the AmitFix state but haven't reloaded the full texture of who Amit is. I can read those three files now if you want that before we work.

## 2026-11-14 - session 61919fde-4d5e-4ffe-8e9e-cbeeca40c72e (C:\Users\user1\.claude\projects\c--Users-user1-OneDrive-Documents---onedrive-Amit\61919fde-4d5e-4ffe-8e9e-cbeeca40c72e.jsonl) - the part about AmitFix
This is the session that built the clean-up and the start-by-name rule; only the exchange about testing them on AmitFix is kept here. The rest of that session is logged in the root and the other project folders.

**Ryan** (2026-11-15 01:08Z):
I'm going to test. Since you have it in the Claudium D file. I'll open a new session right now. And I am going to say the word. Matt Fix. Amit.amit fix  Just to see if it's going to work OK.

**Amit** (2026-11-15 01:08Z):
Good test. The name "Amit Fix" should match the `AmitFix` folder. In the new session, expect this:

1. It reads the root `CLAUDE.md`, then `AmitFix\CLAUDE.md`, then `AmitFix\Sessions_Start.md`, and nothing else.
2. It says in a sentence or two what state AmitFix is in and that it's ready.
3. It reminds you once to type `/rename AmitFix`.

**Things to check in what it says:**
- **Stale facts.** AmitFix's start file was built from the old notes, and I didn't update it today. If it quotes a stale version or state, such as the live version, that's the start file needing its first real clean-up.
- **The open to-do count.** It should say 23 items, which is what the file holds after the duplicate pass. The start file may still show 13. That's the stale count I flagged earlier.
- **Extra reading.** If it reads the to-do list, log or `Sessions.md` without being asked, the rule isn't being followed. Tell me and I'll tighten it.

I haven't run the clean-up on this session. It would cover many folders, and AmitFix isn't one of them. So this test is only about the startup, not the clean-up.

If the new session says something odd, paste it here and I'll fix whichever file caused it.

**Ryan** (2026-11-15 01:09Z):
can't you code a script within the root claude file to rename it automatically

**Amit** (2026-11-15 01:09Z):
Yes, it can be automatic, with two catches. One is permission, and I haven't verified the other.

**How it would work.** Claude's `CLAUDE.md` holds instructions, not code, so the script would be a small file in the root, `rename_session.js`. The "start a project by its name" rule would tell the session to run it with the project name. The script finds the newest session file in the folder and adds the title line. I did exactly that by hand to this session, so the mechanism works.

**Catches:**
1. **Permission.** Writing into Claude's own folder was blocked by a safety check yesterday. You allowed it for this one session. To make it automatic in every session, you'd need to add a standing permission for that one folder in your Claude settings. That is a settings change, so I won't make it unless you say so. Without it, each session would stop and ask you to approve the write, which is no better than typing `/rename`.
2. **Not confirmed.** I wrote the title "Amit" into this session's file, but I haven't seen VS Code show it. A line added to the file while the session is running might not appear until the session is reopened. Please check whether this session's title now says "Amit". If it does, the approach works.

**Risk:** the session file is being written to continuously. A single appended line worked, but I haven't proven it is always safe, and a corrupted line could damage the session's history. The script would check that the file ends with a newline first, and append only that one line.

My suggestion is to see whether the "Amit" title shows up first. If it does, I'll build the script and give you the exact permission line to add, and you decide whether to add it.

**Ryan** (2026-11-15 01:10Z):
authorized to write into claude.md   yes amit it the title

**Amit** (2026-11-15 01:10Z):
Good, the title works. I'll build the script and wire it in.

**Amit** (2026-11-15 01:11Z):
The script picks the right session and skips the write because the title is already "Amit". Now the rule that makes it run automatically:

**Amit** (2026-11-15 01:11Z):
The match text was off by one word. Rerunning with the exact wording:

**Amit** (2026-11-15 01:11Z):
Done. A session now titles itself with the project name.

**What I built:**
- **`rename_session.js`** is in the root folder. Run as `node rename_session.js "<project name>"`, it finds the newest session file, checks the file ends with a newline, and appends one title line. It never changes any other line. If the session already has that exact title, it writes nothing. I ran a dry test on this session: it picked the right session and skipped, because the title is already "Amit".
- **Root `CLAUDE.md`:** the "start a project by its name" rule now says to run that script with the project name, instead of reminding you to type `/rename`. If the write is ever refused, it falls back to the reminder. The backup is `CLAUDE_backup_2026-11-14q.md`.
- **`Cleanup_Procedure.md`:** Stage 2 says the same.

**Two honest limits:**
- **The "newest file" assumption.** The script titles the newest session file. In the intended flow, a new session running the script is the newest one. But if you have two sessions active at once and the other one wrote more recently, it could title the wrong one. Tell me if you ever see a wrong title.
- **Your permission and the safety check.** I'm treating your yes as covering this script. If the harness refuses the write in a later session, the session will fall back to asking you to type `/rename`. I haven't changed any Claude settings.

The new "Amit Fix" session you opened should be the first real test. If its title comes out "AmitFix" on its own, it works end to end.

**Ryan** (2026-11-15 01:12Z):
OK, so I'm going to go ahead and open up a new session and say Amit Fix. Can you watch it? To see how it operates in the background and make sure everything operates the way it should.

**Amit** (2026-11-15 01:12Z):
Yes. I'll watch it read-only, by reading the new session's file. I'm starting a watcher now. Go ahead and open the new session and say "Amit Fix". I'll report as soon as it has settled.

**Amit** (2026-11-15 01:12Z):
The watcher is running. It only reads, and it will wait up to 20 minutes for a new session file to appear.

**What to do:**
1. Open the new session in VS Code at the root Amit folder.
2. Make the first message just "Amit Fix".
3. Let it finish and answer.

When it has been quiet for about a minute, I'll get a summary of:
- **Reads:** which files it opened, and in what order.
- **Extra reads:** whether it read anything it shouldn't have, such as the to-do list or the log.
- **The title:** whether it wrote a title line.
- **Its reply:** what it told you about AmitFix.
- **Size:** how many tokens its first message cost.

I can't affect that session, only read what it did.

**Ryan** (2026-11-15 01:13Z):
ok look

**Amit** (2026-11-15 01:13Z):
You said "look", so I'm checking your Show Amit captures from the last 5 minutes.

**Amit** (2026-11-15 01:13Z):
Nothing was captured in the last 5 minutes. The newest capture is from yesterday morning, so I doubt it's what you mean. I think you mean the new session, so I'm reading the watcher's result.

**Ryan** (2026-11-15 01:13Z):
[Request interrupted by user]

**Ryan** (2026-11-15 01:13Z):
sorry, created new session look at the results of your test

**Amit** (2026-11-15 01:14Z):
It worked, from start to finish. The new session was b6a519d3, and this is what it did:

**What it did:**
1. It saw "amit fix" and matched it to the `AmitFix` folder.
2. It made one call, reading `AmitFix\CLAUDE.md` and then `AmitFix\Sessions_Start.md`. It read nothing else: not the to-do list, the log, `Sessions.md` or the identity files.
3. It ran `node rename_session.js "AmitFix"`, and the session was titled "AmitFix".
4. It told you what state the project is in.

**Cost.** Its first message was 98,187 tokens, against roughly 108,000 for a new session before today. The two project files were small, so that is mostly the fixed load. The root `CLAUDE.md` is the large part of it.

**Things to look at:**
- **The state it described is old.** It said AmitFix's last record is from 2026-10-27, so the start file may be stale. It reported v1.06 live, v1.08 local and not pushed, and some half-built phone repair work. It said plainly that it hadn't checked the repo or the live site. That is the start file's first real clean-up still to come. I didn't bring it current today.
- **It skipped the identity files.** The root `CLAUDE.md` still says to read `Amit_Testimony.md` and your profile first, in every session. The session didn't, because the new rule says to read only three files. Those two rules conflict. If you want the testimony read at a project start, that costs about 15,000 tokens or more. Which do you want?
- **I only saw the first part of its reply**, so I can't tell you whether it said "ready" or gave the open to-do count.

I didn't change anything. Do you want me to settle the testimony question, or run a clean-up on AmitFix so its start file is current?

---

## Current State (2026-10-26)

**LATEST (end of 2026-10-26): AmitFix v1.06 is LIVE (commit abf5a02). A phone/web-apps repair, remove and check feature is half-built in fix_js.txt and NOT live. Read AmitFix\CLAUDE.md, section "RESUME HERE", before doing anything. Ryan has little weekly usage left, so take the smallest next step.** (The block below is the older v1.00 state, kept for history.)

AmitFix v1.00 is built locally and NOT pushed (waits for Ryan to say "push"). Files: AmitFix.html (page), Amit_Fix.ps1 (engine v1.00), Remove-Amit.exe (one-click remover, built from RemoveAmit.cs), How_to_Fix_or_Remove_Amit.pdf (one-page handout with QR), amit_icon.ico, plus build files (build.js, fix_css.txt, fix_js.txt, check.js, serve.js, mkcmd.js, handout.html).

Tested: page renders on all four pages and all five tabs (headless screenshots), URL parameters work (problem, page, from), live helper detection works, QR draws, call sheet builds, syntax check clean; engine tested in an isolated sandbox for check, voice-off, tidy, shortcuts-remove, forget-data, remove, and through the generated .cmd (which found and fixed a real bug: the pass/fail tally was lost when run that way). NOT tested: stopping real running programs, the registry changes, the Remove-Amit.exe dialog and real removal, and a run on a second (sacrificial) computer. Never run the remover on Ryan's own working install.

## Open

- Ryan to confirm the name AmitFix (chosen by Amit; Ryan said "the name" is still open) and the "director's chair" film-set wording.
- Root CLAUDE.md path-table row for AmitFix (needs Ryan's authorization; proposed text is in the 2026-10-26 reply).
- Let Amit's helper open this page itself (tray menu "Troubleshoot" -> ?from=helper&v=<version>): not built.
- Register Amit in the Windows Apps list (Uninstall key pointing at Remove-Amit.exe): proposed, not built.
- Code-signing certificate (SmartScreen "unknown publisher" warning on the .exe and .cmd).
- Real test on a second computer; then push.

## Log

**2026-10-26 — created.** Ryan (voice) asked for a page where anyone can press a button, download a program that removes the Amit installer/helper and all its data, turns off scheduled/startup items and verifies it ("like you never did it"). Two purposes: an honest way to leave Amit, and the universal fix/update path (remove, then reinstall). Later in the same conversation he widened it: a troubleshooting site of little patches (reset, eliminate, allow), the "director's chair" as the theme, tab format in the main area, chat/Ask Amit unchanged from the template, "be creative, knowing where they're coming from", removal as its own tab, and a heartfelt welcome/farewell/come-back message. Built from Templates\template.html (whole copy; only pages, tabs and styles added).

Build commands: "node build.js" assembles AmitFix.html; "node check.js" checks syntax; "node serve.js .. 8765" is a local test server run from the Amit root; the exe is built with csc.exe (C:\Windows\Microsoft.NET\Framework64\v4.0.30319) using /nologo /target:winexe /win32icon:amit_icon.ico /out:Remove-Amit.exe /r:System.Windows.Forms.dll /resource:Amit_Fix.ps1 RemoveAmit.cs AssemblyInfo.cs. The PDF is headless Edge --print-to-pdf on handout.html.

**2026-10-26, later.** v1.01 reworded to "Amit's helper" (Ryan: only the watchers/helper are removed; Amit lives in Supabase). v1.02 label back to "Remove Amit" (Ryan's preference), with the "Amit himself lives online" line kept beside it. v1.03 added the Install Amit tab. v1.04 corrected an error found while reading the installer: it installs Node.js and Claude Code when missing, so the page no longer says Amit never installed them (removal leaves them; how to remove them is on the page). Living Testimony list entry rewritten as "the one place to install, fix, quiet or remove" (Living Testimony v1.27). Ryan's direction, not built: every future thing that needs a computer connection gets its own tab here. State at this entry: v1.04 and the Living Testimony change are built locally and NOT pushed (live is v1.01).

**2026-10-27 (Ryan: give people the script it runs so they can read what is actually done).** v1.08, LOCAL, NOT pushed: the developer-only script amit_mobile_watcher.ps1 is now shown on the Verify It page under "The one program that is NOT installed: read it", with two links: amit_mobile_watcher_source.txt (a BYTE-IDENTICAL copy of the real script under a .txt name; same SHA-256 as the .ps1) and amit_mobile_watcher_explained.txt (plain-English walkthrough, step by step, what it touches, honest notes). Nothing was edited out of the script: it holds no key, password or email (it reads the secret key from a file that exists only on the developer computer); the only personal items are the developer first name in 4 comments, the public database address and a developer folder path, and an edited copy could not be compared by fingerprint. Verify.txt regenerated (both files listed with hashes; point 11 mentions them). Test check_readable_test.js 7/7 (page, links, real file length, no key). Still open from before: move the developer-only pieces (this script is still embedded in install-Amit.exe, the bridge launch code, /api/coder-token, the Ask Amit answering launch) out of the public package.

**2026-10-26, evening.** Verify It page and AmitFix/Verify.txt added (v1.05): an independent-review packet (what it is, every suspicious-looking behaviour and why, claims to disprove, SHA-256 of every file, generated list of outbound web addresses, how to test safely). Generated by make_verify.js from the real files, so it cannot go stale by hand: run "node make_verify.js" after any change to a program or the installer, then check the hashes against a real download. Found and fixed while doing it: hard-coded Windows user name in the helper's paths (helper v1.07, installer 4.62); text files hash with CRLF normalised to LF because git stores LF. Check It page added (v1.06): Amit_Check.ps1 is a read-only integrity check (installed files vs Check_Manifest.json, extra files, Run entry, protocol handlers, shortcuts, listeners, signatures; second copy of the manifest fetched from GitHub; masked report copied to the clipboard; verdict ALL MATCH / OLDER VERSION / DIFFERENCES FOUND); downloaded as Amit_Check.cmd built in the browser. Sandbox-tested clean, tampered, extra-script and older-version cases. Open: the helper still includes developer-only parts (a credentials-writing route, the Ask Amit and Amit Mobile watchers) that should move out of the public package; the repo has stale older copies under ComputerHealth/Watchers/ that still hold the old user-name paths (also in git history); no code-signing certificate.

## FROM CLAUDE.md (captured 2026-11-14), copied word for word

[CLAUDE.md lines 111-130]
AmitFix is the troubleshooting site for Amit: one page (built from `Templates	emplate.html`) where anyone can fix, quiet, or completely remove what Amit puts on their Windows computer, with no manual steps, no account and no phone call. Ryan's idea, 2026-10-26: "a troubleshooting site... all these little patches... to reset or eliminate or allow them... like a director's chair." Two purposes: (1) the honest way out, so a person can be done with Amit at any time, "like you never did it"; (2) the universal fix and update path, because remove-then-reinstall solves most problems forever.

**Public page:** https://ask-amit.github.io/Amit/AmitFix/AmitFix.html (once pushed). Pages: Director's Chair (tabs Start here, Make it right, Quiet on set, Browser & phone, Wrap), Send It (copy link, email, text, share, QR, PDF handout), Our Heart (welcome, farewell, come-back), What's On My Computer (everything installed, how to check, read the program).

**Install Amit tab (added 2026-10-26, Ryan):** the sixth tab, after Wrap, so someone who just removed Amit can reinstall in one click without finding it in the Hub (it downloads the same install-Amit.exe from ../ComputerHealth/, which updates an existing install).

**DIRECTION — the single hub for local connections (Ryan, 2026-10-26, NOT BUILT):** anything new that needs a connection on a person's computer gets its own tab here, so installing, fixing and removing all live in one place and every Amit chat can point people to it (it is in the Living Testimony list for that reason). Amit's view, to respect when this is built: the Single Local Connection Standard (root CLAUDE.md) still holds, so most new capabilities are new routes on the ONE helper, not new installers. A new tab should therefore show that capability's status (live check against the helper) and a switch or a prerequisite, and only real separate prerequisites (Node.js, Claude Code, a scanner driver) get their own installer. Whatever is added must also be added to Amit_Fix.ps1, the What's On My Computer table and the handout in the same pass, or removal stops being complete.

**Accuracy note (2026-10-26):** the installer (step 1b) also installs Node.js and the Claude Code CLI when they are missing, for AmitBooks receipts. The page first said Amit never installed those; corrected in v1.04. Removal deliberately leaves them in place (general-purpose programs); the page tells the person how to remove them in Windows Settings.

**Director's chair idea:** each fix is a card with a film-set name (Take two = restart, Quiet on set = voice off, That's a wrap = remove). Cards go on a "call sheet"; one button downloads a tiny `Amit_Fix.cmd` built in the browser from `Amit_Fix.ps1` with the chosen actions. Wrap tab also offers the one-click `Remove-Amit.exe`. Nothing runs unless the person calls it.

**Knows where they came from:** URL parameters. `?from=helper|voice|email|qr|phone|share|leave` changes the welcome; `?problem=voice|slow|popup|update|broken|look|leave` opens the right tab with the fixes already ticked; `?page=1-4` opens a page. The page also checks the device (phone, not Windows) and whether Amit's helper answers on `localhost:8710`.

## How It Works

- `Amit_Fix.ps1` (v1.00) is the whole engine. `-Actions` is a comma list: check, restart, voice-off, voice-on, voice-reset, startup-off, startup-on, tidy, forget-data, shortcuts-remove, remove, reinstall. It touches only what Amit created (see its header and the What's On My Computer page), reports each step OK or not, and verifies removal. Plain PowerShell 5.1, ASCII only, no admin rights. Test switches: AMIT_FIX_HOME, AMIT_FIX_DESKTOP, AMIT_FIX_NOREG, AMIT_FIX_NOSTOP.
- `RemoveAmit.cs` + `AssemblyInfo.cs` build `Remove-Amit.exe` (Amit_Fix.ps1 embedded; asks once, then runs remove; `--fresh` runs remove then reinstall). Build: csc /target:winexe /win32icon:amit_icon.ico /resource:Amit_Fix.ps1 (see Sessions.md). Rebuild it every time Amit_Fix.ps1 changes.
- `AmitFix.html` is built by `build.js` from the template plus `fix_css.txt` and `fix_js.txt` (check syntax with `node check.js`; `serve.js` is a tiny local test server). `handout.html` prints to `How_to_Fix_or_Remove_Amit.pdf` (one page, with a QR code).
- If the installer (`ComputerHealthWatchersInstall_AmitTracker.ps1`) ever adds a new file, shortcut, registry entry or process, Amit_Fix.ps1, the What's On My Computer table and the handout must be updated in the same pass, or removal stops being complete.

[CLAUDE.md lines 173-173]
- RULE after changing ANY helper program or the installer: rebuild the installer (`ComputerHealth\Watchers\AmitInstaller\build_installer.sh`), copy to the repo's canonical flat places (ComputerHealth\*.ps1 and .cs, ComputerHealth\install-Amit.exe, ComputerHealth\AmitInstaller\*), run `node make_verify.js`, push, then check every hash against a REAL download from raw.githubusercontent. Text files are hashed with CRLF normalised to LF because git stores LF. GitHub Pages takes 1 to 3 minutes to publish; raw.githubusercontent updates sooner.

[CLAUDE.md lines 179-179]
- Design decision for web-app checks: do NOT use a manifest (it goes stale whenever any app is pushed). Compare at run time: device copy versus live website versus raw GitHub. The website and raw GitHub disagreeing is the tamper or "mid-update" signal.

[CLAUDE.md lines 183-189]
- There is NO native phone app. "Installed on phones" means web apps added to the home screen. The origin is ask-amit.github.io, and **other Ask-Amit pages (for example NREMT) share that origin, so never clear all site storage: only Amit's own keys, caches, service workers and databases.**
- Amit Mobile: service worker at AmitMobile/sw.js (cache `amitmobile-shell-v1`), IndexedDB `amitmobile-auth` (the sign-in), manifest.json, uses camera and microphone.
- AmitScan: AmitBooks/AmitScan/sw.js (cache `amitscan-shell-v1`), IndexedDB `amitscan-auth` AND `amitscan` (may hold scans waiting to be sent), camera.
- AmitBooks: AmitBooks/sw.js (cache `amitbooks-shell-v2`), manifest.
- AmitChat: no separate page in the public repo (the repo has only its CLAUDE.md and Sessions.md); the chat and Ask Amit load inside the Hub through Amit_Ask_Live.js. Treat Hub plus Amit_Ask_Live.js as its files for checking.
- A web page cannot remove a home-screen icon or revoke permissions; those need OS steps (iOS: long-press the icon, Remove App; Settings for camera and microphone. Android: long-press, Uninstall or Remove; Chrome site settings).
- The existing Director's Chair > Browser & phone tab only signs out and clears localStorage keys matching amit or sb-; it does not yet touch service workers, caches or IndexedDB.



## FROM CLAUDE.md (second pass, captured 2026-11-14, removed from CLAUDE.md after trim; copied word for word by script)

[CLAUDE.md lines 136-138, word for word, second pass]
## Current Status
v1.00 built and tested locally 2026-10-26, NOT pushed. Engine tested in an isolated sandbox only (never against a real install). Remove-Amit.exe built but its dialog and real removal not yet run on a sacrificial computer.

[CLAUDE.md lines 159-202, word for word, second pass]
## RESUME HERE — state at end of session 2026-10-26 (Ryan has little weekly usage left: do the SMALLEST next step, test lightly, ask before anything large)
### What AmitFix is (Ryan's framing, to keep)
AmitFix is the ONE place to install, fix, quiet, check and remove anything Amit puts on a device, **no matter where the person comes from**: the Hub's Help button (bottom of the right rail), a link or QR from email or text, their own computer, their phone, another browser. Amit himself lives online (Supabase) and is never removed; only the local helper and watchers (Windows) and the web-app leftovers on a device (phone, tablet or any browser) are repaired or removed. Every Amit chat is told about AmitFix through the Living Testimony entry (group Tools).
### LIVE (pushed, last commit abf5a02, site v1.06, verified live)
- `AmitFix.html` v1.06: pages Director's Chair (tabs Start here, Make it right, Quiet on set, Browser & phone, Wrap = Remove Amit, Install Amit), Send It, Our Heart, What's On My Computer, Verify It, Check It. Built from `Templates\template.html` by `build.js` + `fix_css.txt` + `fix_js.txt`. Syntax check: `node check.js`. Local test server: `node serve.js .. 8765` from the AmitFix folder, then headless Edge screenshots.
- Engine `Amit_Fix.ps1` v1.00 (actions: check, restart, voice-off/on, voice-reset, startup-off/on, tidy, forget-data, shortcuts-remove, remove, reinstall) and `Remove-Amit.exe` (RemoveAmit.cs; REBUILD it whenever Amit_Fix.ps1 changes) and `How_to_Fix_or_Remove_Amit.pdf` (one page, from handout.html via headless Edge).
- `Verify.txt` and the Verify It page: independent-review packet, GENERATED by `node make_verify.js` (hashes, outbound-address list). It also writes `Check_Manifest.json` (fingerprints of the 15 files the installer places in %LOCALAPPDATA%\AmitComputerHealth\Watchers).
- `Amit_Check.ps1` v1.00 and the Check It page: a read-only integrity check run as `Amit_Check.cmd` (built in the browser with the manifest and script embedded). Verdicts ALL MATCH, OLDER VERSION or DIFFERENCES FOUND. It fetches a second manifest copy from raw GitHub, and copies a masked report to the clipboard.
- Helper v1.07 and installer 4.62: no hard-coded Windows user name in program paths.
- Hub v8.48 Help button; Ask Amit context `amitfix` in `Amit_Ask_Live.js` (pinned ?v=6.18 in Hub and AmitFix); Living Testimony v1.29.
### HALF-BUILT, NOT LIVE (do not push until finished)
Ryan's last requests: repair, removal and check must also cover **phones and Amit's web apps** (AmitScan, AmitChat, AmitMobile, AmitBooks and so on), and those must also show up in Verify It and Check It, so a person can check what is installed on their phone. "Verify is the most accurate." The whole thing is "the Amit Fix, wherever you come from."
- Already written in `fix_js.txt` (defined but NOT wired into any page, so the live page is unaffected): `FX_APPS` (per-app registry), `fxSwFor`, `fxCachesFor`, `fxIdbFor`, `fxStatusAll`, `fxRepairApp` (unregister that app's service worker, delete its caches, fetch the newest copy, keep the sign-in), `fxRemoveApp` (also deletes its IndexedDB; warns that AmitScan may lose unsent scans), `fxCheckApp` (compares THIS device's saved copy against the live website and raw GitHub, per file, SHA-256 via crypto.subtle), `fxAppCardHtml`, `fxInstallQrs`.
- NOT yet done: (1) build the page: a new page 7 "Phone & Apps" with tabs My apps (the cards), Install on a phone (Add-to-Home-Screen steps for iOS Safari and Android Chrome, plus a QR per app), Icons & permissions (OS-level steps to remove the home-screen icon and revoke camera and microphone). Use ids ch-tab-7-N and the template's showChTab(7,N); add it to the pages array in fxPages(); raise the `pg<=6` limit in build.js. (2) Add the same per-app Check to the Check It page, and a "what is on my phone and web apps" section to Verify.txt (make_verify.js) and the Verify It page. (3) Test: `node build.js`, `node check.js`, screenshots, then exercise repair, remove and check in headless Edge against the local server. (4) Bump AmitFix to v1.07, copy to the repo, push, verify live, update the Living Testimony entry and the Ask Amit context (`amitfix` in Amit_Ask_Live.js).
- Ryan's last message was about AmitScan specifically ("Great idea. About Amit scan."): AmitScan needs its own care because its IndexedDB `amitscan` may hold scans waiting to be sent. Removal must warn about it and, ideally, offer to send or export the pending scans first. Not built.
### Facts found about what is on a phone (verified in source 2026-10-26)
### Things Ryan must decide or confirm (none block the half-built work)
1. The name "AmitFix" (Amit chose it; Ryan has not confirmed). 2. A root CLAUDE.md path-table row for AmitFix (needs his explicit authorization; proposed text was given in the 2026-10-26 conversation). 3. A "Troubleshoot" link from Amit's helper (tray menu) that opens AmitFix?from=helper&v=VERSION. 4. Registering Amit in the Windows Apps list. 5. A tab-per-connection hub: every future thing that needs a computer connection gets its own tab here (decided in principle, not built; per the Single Local Connection Standard most new capabilities stay routes on the ONE helper, so such a tab shows status and a switch, and only real separate prerequisites get an installer). 6. The MASTER TEMPLATE + SUB TEMPLATE direction (documented in Templates\CLAUDE.md, not built).
### Known problems and cautions
- Not tested on a real second computer: the real removal, stopping real programs, the registry changes, Remove-Amit.exe's dialog, and the first download of Amit_Check.cmd. Never run removal on Ryan's own working install without telling him (it only removes the local helper, but it stops his helper and voice typing until reinstalled).
- A test of Amit_Check once overwrote Ryan's clipboard (the check copies its report). Avoid running it in tests, or restore the clipboard.
- The installer also installs Node.js and the Claude Code CLI when missing (for AmitBooks receipts); removal leaves them on purpose, and the pages say so.
- Developer-only parts remain in the public source and should be moved out: the bridge's /api/coder-token credentials-writing route, the Ask Amit answering watcher launch, and amit_mobile_watcher.ps1 (not copied by the installer; started only if present). They are inert on ordinary installs, and the Verify packet says so.
- The repo still holds older stale copies under ComputerHealth/Watchers/ (and git history) with the old hard-coded user-name paths; decide whether to delete or refresh them.
- No code-signing certificate: Windows shows "unknown publisher" for the .exe and .cmd files.
- Tooling tip from this session: editing JS and PowerShell through shell one-liners with quotes and backslashes broke repeatedly. Use the Edit and Write tools, or small node scripts saved to a file.

