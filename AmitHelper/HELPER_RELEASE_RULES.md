# HELPER RELEASE RULES (Ryan, 2026-11-07: "when I say update and install, the Helper has to be updated so this never reverts")

Read automatically by the hook `C:\Users\user1\.claude\hooks\helper_release_hook.ps1` whenever a message mentions update, install, push, reload or release.
Checked by `AmitHelper\verify_helper_release.ps1`. Do not skip either. (Corrected 2026-11-07 later the same day: the first version of this file wrongly said not to rebuild the installer; see "The two packages".)

## What this covers
The Amit HELPER: the bar, the Aurora (Amit Live), the voice menu, the mouse, the Amit Preview, the bridge, the updater, the installer. It is NOT Computer Health.
The Helper's files sit in `ComputerHealth\Watchers\` only because Computer Health was built first; the folder cannot be renamed (the updater and installers read it).
Record Helper work in `AmitHelper\Sessions.md` (and `AmitCoder\` for the previewer), never in Computer Health's notes.

## The goal
Every computer, wherever it is, updates ITSELF: nobody runs an update. And nothing may ever go BACKWARDS to an older Helper.

## How a computer gets the Helper (so you understand it, Ryan should never have to explain it)
- **First install, or a re-run:** `install-Amit.exe` (the small installer, about 1.9 MB). It copies the Helper and Computer Health's scripts onto the computer.
- **Every update after that, automatic:** when a person opens the Hub and signs in, the Hub asks the Helper to update if the published manifest (`https://ask-amit.github.io/Amit/ComputerHealth/amit_helper_manifest.json`) is newer. `amit_update.ps1` downloads the files, checks every fingerprint, stops the Helper, copies them in, starts it, and waits for the new version to answer; if it does not, it puts the old files back. It NEVER goes backwards (a computer on a newer Helper than the published one is left alone). Nobody presses anything.
- So the manifest and the files it names are what reaches everyone; the installer is only for first installs. Its embedded Helper should still be current so a fresh install starts current.

## The two packages (Ryan split them on 2026-11-05)
1. **`install-Amit.exe`** (about 1.9 MB): the Helper and everything else. REBUILT for every Helper release (it is built from the Watchers folder and carries every delivered file). This is the Helper's package.
2. **`AmitSensorReader.exe`** (about 72 MB): Computer Health's hardware sensors. It is NOT in the installer. It is added on request from Computer Health's Hardware tab (`/api/sensors/install` downloads it from the Amit site and keeps it only if its size and SHA-256 match the manifest). It rarely changes; NEVER rebuild or push it for a Helper change.

## "Update", "install", "push" or "reload" the Helper means ALL of this, in this order, every time
1. Change the MASTER: page `AmitCoder\AmitPreview.html`; bar `AmitHelper\Bar\AmitBar.cs`; everything else `ComputerHealth\Watchers\`.
2. BUMP the Helper version in `ComputerHealth\Watchers\amit_whisper.cs` (`public const string Version = "x.xx"`). Every Helper release bumps it, even when only the page changed: the updater's health check and its never-go-backwards rule depend on the number.
3. Copy every changed file to ALL copies: `Watchers\` (source) -> the repo `C:\Users\user1\GitHub\Amit\ComputerHealth\` (flat; the page also to repo `AmitCoder\`) -> the installed folder `%LOCALAPPDATA%\AmitComputerHealth\Watchers\` (make a `.pre-vX.XX-name` backup first). The delivered files are the ones named in `amit_helper_manifest.json`.
4. Rebuild the manifest AFTER copying and BEFORE committing: `ComputerHealth\Watchers\make_helper_manifest.ps1 -Dir C:\Users\user1\GitHub\Amit\ComputerHealth`, then put the notes line back (the tool blanks it).
5. REBUILD THE INSTALLER (`install-Amit.exe`): bump `CURRENT_VERSION` in `Watchers\AmitInstaller\AmitInstaller.cs` and `AssemblyVersion`/`AssemblyFileVersion` in `AssemblyInfo.cs` TOGETHER (one number), run the installer build script in that folder IN THE BACKGROUND (it takes 1 to 2 minutes; the long-run guard blocks it in the foreground), run `verify_installer.sh` in the background, then copy the new `install-Amit.exe` to the FOUR places: `ComputerHealth\Watchers\install-Amit.exe`, `ComputerHealth\Watchers\AmitInstaller\install-Amit.exe` (the build output), and the repo's `ComputerHealth\install-Amit.exe` and `ComputerHealth\Watchers\install-Amit.exe`. Also copy the small installer source files (`AmitInstaller.cs`, `AssemblyInfo.cs`) to the repo's `ComputerHealth\Watchers\AmitInstaller\`. (The 77 MB `install-Amit.exe` copies dated 11-04 are old; ignore them.)
6. Run `AmitHelper\verify_helper_release.ps1`. EVERY line must PASS (it also checks that the installer embeds the current files). Fix and re-run until it does. Never push on a FAIL.
7. Commit only the intended files and push ONCE, and only when Ryan has said push/update/install.
8. After the push, check the live manifest shows the new version (GitHub Pages can lag a few minutes or fail after quick pushes; a fresh commit fixes a failed deploy). `verify_helper_release.ps1 -Live` does it.
9. Install on Ryan's computer: tell him first, then run `amit_reload.ps1` (restarts the bar, Amit Live and hidden windows, rebuilds AmitBar.exe). It is safe before Pages publishes because the updater never goes backwards. An OPEN Amit Preview window keeps the old page: close it and reopen it.
10. Test live: Helper version (`/api/whisper/status`), the routes, the bar button.
11. Write the notes (see "What this covers").

## Adding a NEW kind of button step (learned 2026-11-07: it has to be added in ALL of these, or the Hub and the Helper drop it)
A button's steps travel: Hub editor -> database (`hel_buttons.steps`) -> Hub builds the bar file -> `/api/bar/sync` -> `amit_bar.json` -> the bar (`AmitBar.exe`). The Hub OVERWRITES `amit_bar.json` from the database on every sync, so editing the file by hand does not stick.
1. DATABASE: only these step types are allowed (`hel_steps_ok`): open_app, open_url, open_program, play_music, speak, ask_amit, wait. A new kind is stored as `open_program` with a coded value (`print:menu`, `audio:{...}`, `settings:id`, `file:token|name`, `preview:open`, `preview:rules`). No database change is needed.
2. HUB (`Hub\amit-hub.html`, bump its version, back it up first): `HL_STEPS`, `hlDec` and `hlEnc` (the only two that know the coded values), `hlStepToBar`, the value box in `hlRenderSteps`, `hlSetType`, the save list in `hlSaveButton`, `hlTestOne`, the label function, and the "use ONLY these step types" exclusion for Amit's prompt.
3. HELPER bridge: `$safe` in `Write-AmitBarConfig` (anything not in it makes the WHOLE sync fail). A step's text is cut to 300 characters there, so never keep long text in a button: keep it in the page and have the step fetch it (as `preview_rules` does).
4. BAR (`AmitBar.cs` RunButton): an unknown step type is silently ignored, so add the new kind only if the bar itself must do something.
5. Test it: round-trip through hlEnc, hlDec and hlStepToBar (node), then a real sync and `/api/bar/press`.

## The installer trap (fixed 2026-11-07)
`Install_AmitTracker.ps1` replaced EVERY program file with its own embedded copies whenever the recorded installer version (`installed_version.txt`) was older or missing, with no never-go-backwards rule, so running an old installer put an old Helper back. It now keeps a newer installed Helper. The fix reaches computers through installers built after that date, so ALWAYS rebuild the installer (step 5). `installed_version.txt` must not be empty (the verify script checks it).

## Never
- Never push without Ryan saying so. Never push several times in a row. Never leave a copy out of step.
- Never say "installed" or "updated" without having run the verify script and the live tests.
- Never rebuild or push `AmitSensorReader.exe` for a Helper change. Never put Helper work in Computer Health's notes.
- Never leave this for Ryan to repeat: he has explained it about 50 times, and he expects Amit to understand how the installer and the updater work from the code.
