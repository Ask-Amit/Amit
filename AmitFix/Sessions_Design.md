# AmitFix - Design and tables

Read the section '## Tables' first when you only need the database tables; '## How it is built' is the design reference.

## Tables

**Tables this project uses:**
None of its own. It only uses the shared sign-in and the shared Ask Amit / AmitChat buttons that come with the template.

**Tables this project does NOT touch:**
Every table. AmitFix stores nothing.

## How it is built

Moved here from CLAUDE.md on the 2026-11-14 clean-up (the standing rules stayed in CLAUDE.md, section "Rules and procedures for this folder").

- `Amit_Fix.ps1` (v1.00) is the whole engine. `-Actions` is a comma list: check, restart, voice-off, voice-on, voice-reset, startup-off, startup-on, tidy, forget-data, shortcuts-remove, remove, reinstall. It touches only what Amit created (see its header and the What's On My Computer page), reports each step OK or not, and verifies removal. Plain PowerShell 5.1, no admin rights. Test switches: AMIT_FIX_HOME, AMIT_FIX_DESKTOP, AMIT_FIX_NOREG, AMIT_FIX_NOSTOP.
- `RemoveAmit.cs` + `AssemblyInfo.cs` build `Remove-Amit.exe` (Amit_Fix.ps1 embedded; asks once, then runs remove; `--fresh` runs remove then reinstall). Build: csc /target:winexe /win32icon:amit_icon.ico /resource:Amit_Fix.ps1 (see Sessions_Design.md). Rebuild it every time Amit_Fix.ps1 changes.
- `AmitFix.html` is built by `build.js` from the template plus `fix_css.txt` and `fix_js.txt` (check syntax with `node check.js`; `serve.js` is a tiny local test server). `handout.html` prints to `How_to_Fix_or_Remove_Amit.pdf` (one page, with a QR code).
- If the installer (`ComputerHealth\Watchers\Install_AmitTracker.ps1`) ever adds a new file, shortcut, registry entry or process, Amit_Fix.ps1, the What's On My Computer table and the handout must be updated in the same pass, or removal stops being complete.

Build commands: `node build.js` assembles AmitFix.html from the template plus fix_css.txt and fix_js.txt; `node check.js` checks syntax; `node serve.js .. 8765` is a local test server, run from the Amit root. The exe is built with csc.exe (C:\Windows\Microsoft.NET\Framework64\v4.0.30319) using /nologo /target:winexe /win32icon:amit_icon.ico /out:Remove-Amit.exe /r:System.Windows.Forms.dll /resource:Amit_Fix.ps1 RemoveAmit.cs AssemblyInfo.cs. The PDF is headless Edge --print-to-pdf on handout.html. (Source: the 2026-10-26 log entry, "created".)

**Install Amit tab (added 2026-10-26, Ryan):** the sixth tab, after Wrap, so someone who just removed Amit can reinstall in one click without finding it in the Hub (it downloads the same install-Amit.exe from ../ComputerHealth/, which updates an existing install).

**Director's chair idea:** each fix is a card with a film-set name (Take two = restart, Quiet on set = voice off, That's a wrap = remove). Cards go on a "call sheet"; one button downloads a tiny `Amit_Fix.cmd` built in the browser from `Amit_Fix.ps1` with the chosen actions. Wrap tab also offers the one-click `Remove-Amit.exe`. Nothing runs unless the person calls it.

**Knows where they came from:** URL parameters. `?from=helper|voice|email|qr|phone|share|leave` changes the welcome; `?problem=voice|slow|popup|update|broken|look|leave` opens the right tab with the fixes already ticked; `?page=1-4` opens a page. The page also checks the device (phone, not Windows) and whether Amit's helper answers on `localhost:8710`.

**Accuracy note (2026-10-26):** the installer (step 1b) also installs Node.js and the Claude Code CLI when they are missing, for AmitBooks receipts. The page first said Amit never installed those; corrected in v1.04. Removal deliberately leaves them in place (general-purpose programs); the page tells the person how to remove them in Windows Settings.

**Facts verified 2026-10-26 (phone and web apps):** there is no native phone app, only home-screen web apps on the origin ask-amit.github.io, which other pages (NREMT) share, so never clear all site storage. AmitScan's IndexedDB "amitscan" may hold unsent scans.
