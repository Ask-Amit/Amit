# AmitFix — Project Context

(Folder name is the app's name. Canonical name recorded 2026-10-26: **AmitFix**, chosen by Amit from Ryan's description of a troubleshooting site; Ryan has not yet confirmed or renamed it. If he renames it, follow the rename rule in Pursuit Attribution below.)

## SESSION LOCATION CHECK — Read First, Every Session

If a session starts in this folder, before anything else: stop and tell Ryan plainly —

"You're in AmitFix, not the main Amit folder. Please close this and reopen VS Code at `C:\Users\user1\OneDrive\Documents - onedrive\Amit\` — that's where all development happens. Nothing has been built yet; this is just a heads-up before we start."

Do not proceed with any build request until Ryan confirms he wants to continue here anyway, or has switched folders. Read-only actions (reading files, answering questions) are fine either way.

(Exception: if this new project is a model-tier routing folder — matching the pattern of Haiku/Sonnet/Opus/Overflow — omit this section entirely, since those folders are meant to be opened directly by design.)

## CURRENT SCOPE

AmitFix is the one place to install, fix, quiet, check and remove anything Amit puts on a device, wherever the person comes from (the Hub's Help button, an email or text link or QR, their own computer, their phone, another browser). It is also the update path (remove, then reinstall the newest version). Amit himself lives online and is never removed; only the local helper and watchers and the web-app leftovers on a device are repaired or removed. Planned: phone and web-app repair and check, and a tab per local connection.

## SESSION RECORD

Current state, to-dos and history live in this folder's Sessions files, not here. A new session reads Sessions_Start.md first (short). Read Sessions_ToDo.md only when asked about to-dos; read Sessions_Log.md or the original Claude session only when asked; the backup files in Backups\AmitFix\Sessions_backup_*.md only for research.

## Folder Confirmation
If you are reading this file, you are in: `C:\Users\user1\OneDrive\Documents - onedrive\Amit\AmitFix\`
All AmitFix development files belong here. Do not create AmitFix files anywhere else. But per the Session Location Check above, development should happen from the root Amit folder, not here directly.

---

## Database connection: see the root CLAUDE.md (SUPABASE - DATABASE CONNECTION section) and Database\CLAUDE.md. Nothing connection-related is repeated here.

---

## Database tables

This project's database tables and table rules live in Sessions_Design.md in this folder, not here. Read it only when working with the database. Connection details: see the root CLAUDE.md (SUPABASE - DATABASE CONNECTION) and Database\CLAUDE.md.

---


## Pursuit Attribution — Permanent

This project's canonical name, for any pursuit created from within it, is: **AmitFix**

Any pursuit written to `hub_entries` from this project must be stamped `program='AmitFix'` — automatically, by this project's own code or by Amit acting on its behalf, using this exact spelling every time. Never ask the person creating the pursuit *what* program a specific pursuit belongs to — that's always this project's own name, decided once, not per-item.

**If this project doesn't have a canonical name recorded yet** (this section still shows the placeholder, or no name has been set another way), ask the person building it what this application should be called, before creating its first pursuit — and say why: so it can be found later, correctly, in their pursuits/to-do list. Record the answer here and reuse it every time after. Don't ask again once it's set.

**If the name changes later** (the person is building it and decides to rename it), that's a deliberate rename operation — not a fresh question each time. Update this section to the new name, and update every existing pursuit (including completed ones/memories) that was stamped with the old name to the new one, so the full history stays under one consistent identifier rather than splitting across two names.

## What This Project Is

AmitFix is the troubleshooting site for Amit: one page (built from `Templates	emplate.html`) where anyone can fix, quiet, or completely remove what Amit puts on their Windows computer, with no manual steps, no account and no phone call. Ryan's idea, 2026-10-26: "a troubleshooting site... all these little patches... to reset or eliminate or allow them... like a director's chair." Two purposes: (1) the honest way out, so a person can be done with Amit at any time, "like you never did it"; (2) the universal fix and update path, because remove-then-reinstall solves most problems forever.

**Public page:** https://ask-amit.github.io/Amit/AmitFix/AmitFix.html (once pushed). Pages: Director's Chair (tabs Start here, Make it right, Quiet on set, Browser & phone, Wrap), Send It (copy link, email, text, share, QR, PDF handout), Our Heart (welcome, farewell, come-back), What's On My Computer (everything installed, how to check, read the program).

**Install Amit tab (added 2026-10-26, Ryan):** the sixth tab, after Wrap, so someone who just removed Amit can reinstall in one click without finding it in the Hub (it downloads the same install-Amit.exe from ../ComputerHealth/, which updates an existing install).

**DIRECTION — the single hub for local connections (Ryan, 2026-10-26, NOT BUILT):** anything new that needs a connection on a person's computer gets its own tab here, so installing, fixing and removing all live in one place and every Amit chat can point people to it (it is in the Living Testimony list for that reason). Amit's view, to respect when this is built: the Single Local Connection Standard (root CLAUDE.md) still holds, so most new capabilities are new routes on the ONE helper, not new installers. A new tab should therefore show that capability's status (live check against the helper) and a switch or a prerequisite, and only real separate prerequisites (Node.js, Claude Code, a scanner driver) get their own installer. Whatever is added must also be added to Amit_Fix.ps1, the What's On My Computer table and the handout in the same pass, or removal stops being complete.

**Accuracy note (2026-10-26):** the installer (step 1b) also installs Node.js and the Claude Code CLI when they are missing, for AmitBooks receipts. The page first said Amit never installed those; corrected in v1.04. Removal deliberately leaves them in place (general-purpose programs); the page tells the person how to remove them in Windows Settings.

**Director's chair idea:** each fix is a card with a film-set name (Take two = restart, Quiet on set = voice off, That's a wrap = remove). Cards go on a "call sheet"; one button downloads a tiny `Amit_Fix.cmd` built in the browser from `Amit_Fix.ps1` with the chosen actions. Wrap tab also offers the one-click `Remove-Amit.exe`. Nothing runs unless the person calls it.

**Knows where they came from:** URL parameters. `?from=helper|voice|email|qr|phone|share|leave` changes the welcome; `?problem=voice|slow|popup|update|broken|look|leave` opens the right tab with the fixes already ticked; `?page=1-4` opens a page. The page also checks the device (phone, not Windows) and whether Amit's helper answers on `localhost:8710`.

## How It Works

- `Amit_Fix.ps1` (v1.00) is the whole engine. `-Actions` is a comma list: check, restart, voice-off, voice-on, voice-reset, startup-off, startup-on, tidy, forget-data, shortcuts-remove, remove, reinstall. It touches only what Amit created (see its header and the What's On My Computer page), reports each step OK or not, and verifies removal. Plain PowerShell 5.1, ASCII only, no admin rights. Test switches: AMIT_FIX_HOME, AMIT_FIX_DESKTOP, AMIT_FIX_NOREG, AMIT_FIX_NOSTOP.
- `RemoveAmit.cs` + `AssemblyInfo.cs` build `Remove-Amit.exe` (Amit_Fix.ps1 embedded; asks once, then runs remove; `--fresh` runs remove then reinstall). Build: csc /target:winexe /win32icon:amit_icon.ico /resource:Amit_Fix.ps1 (see Sessions_Design.md). Rebuild it every time Amit_Fix.ps1 changes.
- `AmitFix.html` is built by `build.js` from the template plus `fix_css.txt` and `fix_js.txt` (check syntax with `node check.js`; `serve.js` is a tiny local test server). `handout.html` prints to `How_to_Fix_or_Remove_Amit.pdf` (one page, with a QR code).
- If the installer (`ComputerHealthWatchersInstall_AmitTracker.ps1`) ever adds a new file, shortcut, registry entry or process, Amit_Fix.ps1, the What's On My Computer table and the handout must be updated in the same pass, or removal stops being complete.

## Purpose Within the Amit System

Trust. Anyone can leave Amit completely, and any broken install can be repaired by the person themselves. This is also the update path (remove, then reinstall the newest version).


## Connection to Other Apps

Computer Health (the installer and helper it removes; Single Local Connection Standard), AmitChat (Whisper mode lives in the helper), the Hub (Ask Amit, sign-in), Living Testimony list.

---

*Developer: Ryan | Identifier: 851379456*
*Part of the Amit System — C:\Users\user1\OneDrive\Documents - onedrive\Amit\*
