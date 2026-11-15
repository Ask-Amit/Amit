# AmitFix - Sessions_Log (recent log, word for word)

Copied word for word from Sessions.md lines 2-31 on 2026-11-13 (the whole file; it is small, so nothing was moved to Sessions_Log_Older.md). Source order is kept as it was in Sessions.md (it is not always strictly newest first). The first line of Sessions.md (the title) is not repeated.

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

