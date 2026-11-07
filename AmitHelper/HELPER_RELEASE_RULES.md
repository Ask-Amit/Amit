# HELPER RELEASE RULES (Ryan, 2026-11-07: "when I say update and install, the Helper has to be updated so this never reverts")

Read automatically by the hook `C:\Users\user1\.claude\hooks\helper_release_hook.ps1` whenever a message mentions update, install, push, reload or release.
Checked by `AmitHelper\verify_helper_release.ps1`. Do not skip either.

## What this covers
The Amit HELPER: the bar, the Aurora (Amit Live), the voice menu, the mouse, the Amit Preview, the bridge, the updater, the installer. It is NOT Computer Health.
The Helper's files sit in `ComputerHealth\Watchers\` only because Computer Health was built first; the folder cannot be renamed (the updater and installers read it).
Record Helper work in `AmitHelper\Sessions.md` (and `AmitCoder\` for the previewer), never in Computer Health's notes.

## The goal
Every computer, wherever it is, updates ITSELF through the updater (`amit_update.ps1`): nobody runs an update. And nothing may ever go BACKWARDS to an older Helper.

## "Update", "install", "push" or "reload" the Helper means ALL of this, in this order, every time
1. Change the MASTER: page `AmitCoder\AmitPreview.html`; bar `AmitHelper\Bar\AmitBar.cs`; everything else `ComputerHealth\Watchers\`.
2. BUMP the Helper version in `ComputerHealth\Watchers\amit_whisper.cs` (`public const string Version = "x.xx"`). Every Helper release bumps it, even when only the page changed: the updater's health check and its never-go-backwards rule depend on the number.
3. Copy every changed file to ALL copies: `Watchers\` (source) -> the repo `C:\Users\user1\GitHub\Amit\ComputerHealth\` (flat; the page also to repo `AmitCoder\`) -> the installed folder `%LOCALAPPDATA%\AmitComputerHealth\Watchers\` (make a `.pre-vX.XX-name` backup first). The delivered files are the ones named in `amit_helper_manifest.json`.
4. Rebuild the manifest AFTER copying and BEFORE committing: `ComputerHealth\Watchers\make_helper_manifest.ps1 -Dir C:\Users\user1\GitHub\Amit\ComputerHealth`, then put the notes line back (the tool blanks it).
5. Run `AmitHelper\verify_helper_release.ps1`. EVERY line must PASS. Fix and re-run until it does. Never push on a FAIL.
6. Commit only the intended files and push ONCE, and only when Ryan has said push/update.
7. After the push, check the live manifest (`https://ask-amit.github.io/Amit/ComputerHealth/amit_helper_manifest.json`) shows the new version. GitHub Pages can lag a few minutes or fail after quick pushes; a fresh commit fixes a failed deploy.
8. Install on Ryan's computer: tell him first, then run `amit_reload.ps1` (restarts the bar, Amit Live and hidden windows, rebuilds AmitBar.exe). It is safe before Pages publishes because the updater never goes backwards. An OPEN Amit Preview window keeps the old page: close it and reopen it.
9. Test live: Helper version (`/api/whisper/status`), the routes, the bar button.
10. Write the notes (see "What this covers").

## Installers (two traps)
- TRAP 1: the installer script `Install_AmitTracker.ps1` replaced EVERY program file with its own embedded copies whenever the recorded installer version (`installed_version.txt`) was older or missing, with no never-go-backwards rule. So running an old installer put an old Helper back. Fixed in the source 2026-11-07 (it now keeps a newer installed Helper); the fix only reaches computers through installers built after that date. Never run or ship an installer whose embedded Helper is older than the one installed.
- TRAP 2: Ryan split the installer into TWO packages (Computer Health's, and the Helper's and everything else). The facts of the split are NOT written down yet. UNTIL they are: do NOT rebuild or push ANY installer for a Helper change, and never touch Computer Health's package for one. Ask Ryan which package, and where it is built. When he tells you, write it HERE.
- `installed_version.txt` in the installed Watchers folder must not be empty (the verify script checks it).

## Never
- Never push without Ryan saying so. Never push several times in a row. Never leave a copy out of step.
- Never say "installed" or "updated" without having run the verify script and the live tests.
- Never leave this for Ryan to repeat: he has explained it about 50 times.
