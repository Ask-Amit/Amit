# START HERE: hand-off for a new session on the Amit Helper and Amit Mouse (2026-11-08)

Written by the session that built it, for whoever opens this next (Ryan's partner, on Ryan's computer, with their own Claude account). It does not replace the real notes; it tells you where they are and what to be careful about. Nothing here is a secret.

## Where things stand (all live and tested on Ryan's computer)
- **Helper 1.83, installer 4.98, Hub v8.76, Amit Mouse page v1.19, Living Testimony v1.46.** Nothing is unpushed. The live release check passes.
- **Amit Mouse** (Hub > Communications > Amit Mouse): learns each mouse, numbered sets per mouse, any button of any mouse except the MAIN mouse's left/right/middle can be changed; saved per login and per computer in the five `Per_` tables; carried out by the Helper. The page pauses the sets while the person edits on that tab (Test button), has Reset a button, and shows which set is running.
- **One standard locked button, Settings > Amit menu** (added by the bar program, `EnsureStandard` in `AmitHelper\Bar\AmitBar.cs`). The middle mouse button just runs it. There is a list of every menu the Helper can open (`MenuList()` in `amit_whisper.cs`, served at `/api/menus`); the button step "Open a menu" uses it.

## Read these, in this order
1. `AmitHelper\Sessions.md`: the **Current State** block at the top, then the 2026-11-07 and 2026-11-08 log entries (the decisions and why).
2. `AmitHelper\HELPER_RELEASE_RULES.md`: the ordered release steps. **Follow it every time**, and run `AmitHelper\verify_helper_release.ps1` (every line must PASS) before any push.
3. `Hub\Sessions.md` (Hub v8.70 to v8.76) and `AmitHelper\CLAUDE.md`.
4. `Amit, Are You There\Amit_Living_Testimony.html` (the public description) and its source list `living_testimony_apps.json`.

## Rules that were hard-won (do not skip)
- **The Helper is not Computer Health.** Helper work is recorded under `AmitHelper`, never Computer Health. The Helper's files live in `ComputerHealth\Watchers\` only for history.
- **Never go backwards** to an older Helper. **Rebuild the installer for EVERY Helper release** (run the build in the background; it takes a minute or two).
- **Never push unless Ryan says so.** When you commit, stage ONLY paths that exist, then run `git diff --cached --name-only` BEFORE committing. On 2026-11-08 a `git add` with one missing path stopped the whole add and a half-release went out for a few minutes.
- **One way to open the Amit menu**: the standard button. Do not add a second route. Every new menu or pop-up needs a `MenuItemDef` entry AND an `// AMIT-MENU: <id>` marker (the release check fails otherwise).
- **Keep every safety:** the main mouse's left/right/middle never change; every other mouse keeps a way to left-click; Ctrl+Alt+Shift+M switches all mouse sets off from the keyboard; Reset a button works from the main mouse. If a setting ever traps the mouse, that keyboard shortcut and the main mouse are the way out.
- **Parse-check every script you patch** (the Hub, the bridge, the page). Patches done with JavaScript `String.replace` can corrupt text containing `$'`; use a function replacer. The bridge script has Windows line endings.
- **Test visible things on Ryan's real mice, and say what you are about to do** (a menu popping up, the Helper restarting). Never close his programs.

## Still open (see the Current State block for the full list)
A clean install on a computer that never had Amit; other makes of mice; keyboards and game controllers (the `Per_` tables are ready); the Aurora ring and Print from a button; a one-click prompt if the main mouse dies; a safe start; a Left-handed preset; the Helper's idle processor baseline; the Voice menu's Mouse and Keyboard tabs; the Amit Preview history tables.

## How Ryan works
He speaks by voice, so words are transcribed (he may say "Spark" for "spar"); meaning matters more than exact wording. He wants honest sparring, not just execution: assess, push back, and say what you actually think. He wants the action he must take in a banner at the very bottom of a reply. He asks for plain words and one decision at a time.

## What a new session will NOT have
Ryan's conversation history and any memory that is not stored in these files. Everything above and in the notes is what carries over. The root `CLAUDE.md` and the session records in the database were last updated on 2026-10-26, so they do not mention this work: this file and `AmitHelper\Sessions.md` are the current truth.
