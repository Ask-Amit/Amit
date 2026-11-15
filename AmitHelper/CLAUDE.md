# Amit Helper — Project Context

## SESSION LOCATION CHECK — Read First, Every Session

If a session starts in this folder, before anything else: stop and tell Ryan plainly —

"You're in Amit Helper, not the main Amit folder. Please close this and reopen VS Code at `C:\Users\user1\OneDrive\Documents - onedrive\Amit\` — that's where all development happens. Nothing has been built yet; this is just a heads-up before we start."

Do not proceed with any build request until Ryan confirms he wants to continue here anyway, or has switched folders. Read-only actions (reading files, answering questions) are fine either way.

## CURRENT SCOPE

The Amit Helper is the program on a person's Windows computer that listens, speaks and shows the Aurora ring (Dictate, Voice, Read, Show Amit, Mobile) and the personal bar on the right edge. It includes hold-and-speak dictation, the Dictate window, the Amit Mouse and Amit Keyboard sets, the Amit menu, the Amit Preview window, the tray launcher, and the shared local bridge with its updater, reload and installer. Computer Health is a separate program (see the NAMES section).

## SESSION RECORD

Current state, to-dos and history live in this folder's Sessions files, not here. A new session reads Sessions_Start.md first (short). Read Sessions_ToDo.md only when asked about to-dos; read Sessions_Log.md or the original Claude session only when asked; the backup files in Backups\AmitHelper\Sessions_backup_*.md only for research.

## RELEASING THE HELPER (update / install / push / reload): READ `HELPER_RELEASE_RULES.md` FIRST
Ryan, 2026-11-07: "when I say update and install, the Helper has to be updated so it never reverts; I have explained this about 50 times". The full, ordered rules are in `AmitHelper\HELPER_RELEASE_RULES.md` and are checked by `AmitHelper\verify_helper_release.ps1` (every line must PASS before any push). A global hook (`C:\Users\user1\.claude\hooks\helper_release_hook.ps1`) hands the rules to Amit whenever a message is about updating, installing, pushing or reloading. In short: bump the Helper version; copy to every copy; rebuild the manifest; verify; push once; check the live manifest; reload locally; rebuild the installer `install-Amit.exe` (the Helper's package, small; the 72 MB `AmitSensorReader.exe` is Computer Health's and is never rebuilt for a Helper change); never go backwards; the Helper is NOT Computer Health. Computers update themselves from the published manifest.

## NAMES: THREE SEPARATE THINGS (Ryan, 2026-11-14; this CORRECTS the same-day note that called this program "Amit Live")
- **Amit Live** = the characters: who Amit is while he lives and works, "what creates Amit". Folder `AmitLive\`. It is NOT this program.
- **The Helper** (this folder, "Amit Helper") = the program on a person's computer that listens, speaks and shows the Aurora ring and the bar on the right: the ring (Dictate, Voice, Read, Show Amit, Mobile), hold-and-speak (Whisper mode; dormant while the ring is on, setting `live=1`), the Dictate window, the mouse and keyboard sets, the Amit menu and the Preview window, the tray launcher, and the shared bridge with the updater, reload and installer. Older names (Whisper mode, the Whisper window, the Aurora) are parts of it. The folder names (`AmitHelper`, `ComputerHealth\Watchers`) do not change: the updater and installers read them.
- **Computer Health** = the monitoring program: the recorders, the hardware sensor reader, the crash check, Watch mode, the dashboard, the crash analyzer, and alerts. Two programs, one installer (`install-Amit.exe`); only the 72 MB sensor reader comes separately.
**SEPARATION RULE (Ryan wants the Helper to stay small and fast):** Computer Health logic lives in Computer Health's own scripts. The shared bridge may get only thin routes a page needs. Nothing Computer Health goes into `amit_whisper.cs` (its version number excepted). Before adding anything, say which program it belongs to, how many bytes it adds to the Helper, and what RAM it costs. Measured 2026-11-14: the Helper's program files are 1.3 MB; its resting RAM is about 320 MB (bridge 242 + tray 44 + bar 34), plus about 455 MB while the Edge voice window is up (it closes about 5 minutes after last use; `keepReady=5`). Computer Health's three recorders add about 257 MB only while tracking or Watch mode is on.

## Rules carried over from the old hand-offs (2026-11-14)
- Before committing, stage ONLY paths that exist, then run `git diff --cached --name-only` BEFORE committing. On 2026-11-08 a `git add` with one missing path stopped the whole add and a half-release went out for a few minutes.
- Keep every mouse safety: the main mouse's left, right and middle never change; every other mouse keeps a way to left-click; Ctrl+Alt+Shift+M switches all mouse sets off from the keyboard; Reset a button works from the main mouse; anything that swallows mouse buttons must give the click back whenever its own state is gone. The only mouse hook is in `ComputerHealthWatchersamit_whisper.cs` (`HookCb`, `HandleButton`): do not add a second hook.
- Parse-check every script you patch (the Hub, the bridge, the page). A JavaScript `String.replace` can corrupt text containing `$'`: use a function replacer. The bridge script has Windows line endings.
- Test visible things on Ryan's real mice and say what you are about to do BEFORE doing it (a menu popping up, the Helper restarting, opening the previewer), including tests. Never close his programs.
- Never ask Ryan to explain how the installer, updater or button steps work: read the code and the notes. Read the database before telling him what a button holds. Do not claim something is installed, updated or "his button's state" without checking the real source (database, installed folder, live site).
- Previewer information lives in the Sessions files and on the Living Testimony page, never in the root CLAUDE.md (Ryan, 2026-11-07).

## Folder Confirmation
If you are reading this file, you are in: `C:\Users\user1\OneDrive\Documents - onedrive\Amit\AmitHelper\`
All Amit Helper development files belong here. Do not create Amit Helper files anywhere else. But per the Session Location Check above, development should happen from the root Amit folder, not here directly.

---

## Database connection: see the root CLAUDE.md (SUPABASE - DATABASE CONNECTION section) and Database\CLAUDE.md. Nothing connection-related is repeated here.

## Database tables

This project's database tables and table rules live in Sessions_Design.md (section 'Tables') in this folder, not here. Read that section only when working with the database. Design reference for how the project is built is in the same file. Connection details: see the root CLAUDE.md (SUPABASE - DATABASE CONNECTION) and Database\CLAUDE.md.


## Pursuit Attribution — Permanent

This project's canonical name, for any pursuit created from within it, is: **AmitHelper**

Any pursuit written to `hub_entries` from this project must be stamped `program='AmitHelper'` — automatically, by this project's own code or by Amit acting on its behalf, using this exact spelling every time. Never ask the person creating the pursuit *what* program a specific pursuit belongs to — that's always this project's own name, decided once, not per-item.

**If the name changes later**, that's a deliberate rename operation — update this section to the new name, and update every existing pursuit (including completed ones/memories) stamped with the old name, so the full history stays under one identifier.

## What This Project Is

**Amit Helper** is a personal bar that stays on the right edge of a person's Windows screen. Minimized, it is a slim rail of icons that is always there; opened, each icon shows its name; hovering any icon shows its description. Each person's buttons are grouped into their own **profiles** (for example AmitCoder, Books, Shopping). The top button shows the profile in use; double-clicking it lists the others; each profile can also be switched by voice ("profile" plus its name). Every button has three parts: a **name**, an **icon** and a **description**. A button does one of a fixed set of safe steps: open an Amit app (already signed in), open a website, open a program or file, play a music set, speak, ask Amit with a ready question, or several of these in a row. Buttons are colored by the KIND of action, the same in every profile: gold = an Amit app, blue = a website, purple = music, teal = a program on the computer, coral = several steps, green = Ask Amit. Windows only. The Amit Live ring (hold the right mouse button) and the Amit Live window stay exactly the same for everyone; the bar is the part each person sets up their own way.

## Purpose Within the Amit System

Direct service and a selling point of AmitCoder: a person with no coding experience gets a bar built around how they actually work, set up by speaking to Amit, kept in their profile in the Hub (the home of all user data) and linked to Windows through the shared local helper so it stays current. One character, one mission; the bar never replaces Amit, it puts Amit's partners one press away.

## Connection to Other Apps

**Not part of Computer Health (Ryan, 2026-11-07):** the Helper (the bar, the Aurora, the voice menu, the mouse, the Amit Preview) is its own thing. Only its files happen to sit in `ComputerHealth\Watchers\`, because Computer Health was built first with that bridge and the updater and installer read from there; do not rename the folder. Record Helper, Aurora and previewer work in THIS folder's notes (and `AmitCoder\` for the previewer), never in Computer Health's. Lives beside Amit Live (the shared local helper in `ComputerHealth\Watchers\`) and uses its bridge. Profiles and buttons are stored in the shared Supabase database under the person's login and edited in the Hub. Part of AmitCoder's subscriber package (see `AmitCoder\CLAUDE.md` and `AmitCoder\Sessions_Log.md`, 2026-10-31 product model).

---

---

*Developer: Ryan | Identifier: 851379456*
*Part of the Amit System — C:\Users\user1\OneDrive\Documents - onedrive\Amit\*
