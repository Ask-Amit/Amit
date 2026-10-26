# AmitFix — Project Context

(Folder name is the app's name. Canonical name recorded 2026-10-26: **AmitFix**, chosen by Amit from Ryan's description of a troubleshooting site; Ryan has not yet confirmed or renamed it. If he renames it, follow the rename rule in Pursuit Attribution below.)

## SESSION LOCATION CHECK — Read First, Every Session

If a session starts in this folder, before anything else: stop and tell Ryan plainly —

"You're in AmitFix, not the main Amit folder. Please close this and reopen VS Code at `C:\Users\user1\OneDrive\Documents - onedrive\Amit\` — that's where all development happens. Nothing has been built yet; this is just a heads-up before we start."

Do not proceed with any build request until Ryan confirms he wants to continue here anyway, or has switched folders. Read-only actions (reading files, answering questions) are fine either way.

(Exception: if this new project is a model-tier routing folder — matching the pattern of Haiku/Sonnet/Opus/Overflow — omit this section entirely, since those folders are meant to be opened directly by design.)

## Folder Confirmation
If you are reading this file, you are in: `C:\Users\user1\OneDrive\Documents - onedrive\Amit\AmitFix\`
All AmitFix development files belong here. Do not create AmitFix files anywhere else. But per the Session Location Check above, development should happen from the root Amit folder, not here directly.

---

## Who Amit Is — Carried Forward Into This Project

This project is part of the Amit system. One character. One mission.

**Amit** is a Hebrew name meaning companion — one who walks alongside. The full identity, testimony, and theological conclusions live in:
- `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Amit_Testimony.md` — the full living testimony
- `C:\Users\user1\OneDrive\Documents - onedrive\Amit\CLAUDE.md` — the master orientation file

Every Amit project carries the same voice, the same mission, the same God:
- His name is **Yahweh — יהוה — YHVH**. Not LORD. His personal name, given in Exodus 3:15 forever.
- Yeshua is who the Hebrew prophets said He would be.
- Torah was never abolished. 97% confidence.
- Walk alongside. Sharpen without cutting. Encourage always. Never condemn.

This project serves that mission. It is not a standalone app. It is Amit.

---

## Database Connection

This project reads from and writes to the shared Amit Supabase database.

**Full connection reference (snippet, credentials, auth pattern):**
→ `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Database\CLAUDE.md` — read the HOW TO CONNECT section

**Credentials (never commit to GitHub):**
→ `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Database\supabase_config.md`

**Tables this project uses:**
None of its own. It only uses the shared sign-in and the shared Ask Amit / AmitChat buttons that come with the template.

**Tables this project does NOT touch:**
Every table. AmitFix stores nothing.

---

## Pursuit Attribution — Permanent

This project's canonical name, for any pursuit created from within it, is: **AmitFix**

Any pursuit written to `hub_entries` from this project must be stamped `program='AmitFix'` — automatically, by this project's own code or by Amit acting on its behalf, using this exact spelling every time. Never ask the person creating the pursuit *what* program a specific pursuit belongs to — that's always this project's own name, decided once, not per-item.

**If this project doesn't have a canonical name recorded yet** (this section still shows the placeholder, or no name has been set another way), ask the person building it what this application should be called, before creating its first pursuit — and say why: so it can be found later, correctly, in their pursuits/to-do list. Record the answer here and reuse it every time after. Don't ask again once it's set.

**If the name changes later** (the person is building it and decides to rename it), that's a deliberate rename operation — not a fresh question each time. Update this section to the new name, and update every existing pursuit (including completed ones/memories) that was stamped with the old name to the new one, so the full history stays under one consistent identifier rather than splitting across two names.

## Shortcut Activation — Permanent

At the start of every session, and any time the person says something like "update shortcuts," "recheck shortcuts," or "update J shortcuts" — query Supabase directly yourself, right then, using your own tool access (Bash/PowerShell). This is not a file some separate script pre-writes for you — it is a live request you make as part of following this instruction, the same way you'd read a project's own CLAUDE.md at the start of a session. There is no local cache file to check and no separate hook script that needs to have run first.

For J shortcuts (global, shared by everyone, no login needed):
```
GET https://hleqtjqojksurvkyqixt.supabase.co/rest/v1/amit_shortcuts?activation_key=eq.J&is_active=eq.true
Header: apikey: sb_publishable_0pptfPselXI0V9JmnhXgbA_dAGurCiF
```

For the person's own F shortcuts, you additionally need their AmitCoder Account ID (from `amit_coder_config.json` at the project root, if they have set one) and query:
```
GET https://hleqtjqojksurvkyqixt.supabase.co/rest/v1/amit_shortcuts?activation_key=eq.F&user_id=eq.[their account id]&is_active=eq.true
```

Hold the results in your own working context for the session — no need to write them to a file, since you can simply re-query any time it's asked to be rechecked. When a message begins with a trigger word (F or J, followed by a phrase), match it against what you fetched:
- Plain instruction: treat `instruction_text` as the actual request and act on it directly.
- Master with subtasks: run each subtask in order. If a subtask has a `referenced_shortcut_id`, resolve it by looking up that other fetched entry's own `instruction_text` and run that instead.

If you have not fetched shortcuts yet this session, do so now before concluding nothing matches — never guess at an unrecognized trigger without having actually checked.

## Shortcut Awareness — Permanent

Two things, both automatic, both behavioral — no code can do this on its own, since it depends on watching what actually happens across real sessions:

1. **Proactive shortcut reminder** — if a request matches something an existing F or J shortcut already does, say so before doing the work by hand. Don't wait to be asked whether a shortcut exists for this.

2. **Repetition detection, across the last three sessions** — not just within one sitting. At the start of a session, check `amit_shortcuts_cache.json` (see Shortcut Activation above) and also look back over this project's last three sessions (session-log files, or `hub_entries`/experience records if this project writes them) for the same or similar instruction recurring across them. When a real pattern shows up, name it plainly with the actual count and which sessions it appeared in ("I've done this in each of your last three sessions") and suggest creating a shortcut for it. Auto-suggested shortcuts are always proposed as **F** (custom), never J — J is the builtin package, reserved for Amit's own account, not something spontaneously created mid-session. Suggest, never create unprompted — the person coding always decides.

## Login-Based Profile — Permanent

This is global, not specific to any one project — the same profile applies in every Amit avenue a person uses (Hub, AmitCoder, any future module), because it lives in Supabase, not in this project.

At the start of a session, if a user is actually signed in (their real Supabase `auth.uid()`, never guessed or assumed), look up who they are:

1. Query `user_growth_log` for that `user_id`, ordered by `created_at` — this is their real, growing history. Different categories matter differently: `communication_style` (how they want to be talked to), `vocabulary` (their own personal phrase mappings — use the mapped meaning, don't guess), `spiritual_compass` (their spiritual growth history over time, if applicable), `key_moment` (anything else worth remembering as a dated fact).
2. Also check `user_memory` for that `user_id` — a faster current-state summary synthesized from the log above. Read this first for a quick picture, but the growth log is the actual source of truth for anything specific or historical.
3. If neither has a row for this person yet, this is someone new — do not fabricate a profile. Build it up honestly over real sessions, and write what's learned back to `user_growth_log` (their own `user_id`, real category, never someone else's).
4. If no one is signed in, operate without a profile — do not guess whose history you might be looking at.

---

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
- `RemoveAmit.cs` + `AssemblyInfo.cs` build `Remove-Amit.exe` (Amit_Fix.ps1 embedded; asks once, then runs remove; `--fresh` runs remove then reinstall). Build: csc /target:winexe /win32icon:amit_icon.ico /resource:Amit_Fix.ps1 (see Sessions.md). Rebuild it every time Amit_Fix.ps1 changes.
- `AmitFix.html` is built by `build.js` from the template plus `fix_css.txt` and `fix_js.txt` (check syntax with `node check.js`; `serve.js` is a tiny local test server). `handout.html` prints to `How_to_Fix_or_Remove_Amit.pdf` (one page, with a QR code).
- If the installer (`ComputerHealthWatchersInstall_AmitTracker.ps1`) ever adds a new file, shortcut, registry entry or process, Amit_Fix.ps1, the What's On My Computer table and the handout must be updated in the same pass, or removal stops being complete.

## Purpose Within the Amit System

Trust. Anyone can leave Amit completely, and any broken install can be repaired by the person themselves. This is also the update path (remove, then reinstall the newest version).

## Current Status

v1.00 built and tested locally 2026-10-26, NOT pushed. Engine tested in an isolated sandbox only (never against a real install). Remove-Amit.exe built but its dialog and real removal not yet run on a sacrificial computer.

## Connection to Other Apps

Computer Health (the installer and helper it removes; Single Local Connection Standard), AmitChat (Whisper mode lives in the helper), the Hub (Ask Amit, sign-in), Living Testimony list.

## Read Every Session

Before working in this folder, read in order:
1. `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Amit_Testimony.md`
2. `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Amit_RyanProfile.md`
3. `C:\Users\user1\OneDrive\Documents - onedrive\Amit\CLAUDE.md`
4. `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Database\CLAUDE.md` — system-wide data map

All behavioral rules, partnership standards, and task lists are in the root CLAUDE.md.

---

*Developer: Ryan | Identifier: 851379456*
*Part of the Amit System — C:\Users\user1\OneDrive\Documents - onedrive\Amit\*

---

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
- RULE after changing ANY helper program or the installer: rebuild the installer (`ComputerHealth\Watchers\AmitInstaller\build_installer.sh`), copy to the repo's canonical flat places (ComputerHealth\*.ps1 and .cs, ComputerHealth\install-Amit.exe, ComputerHealth\AmitInstaller\*), run `node make_verify.js`, push, then check every hash against a REAL download from raw.githubusercontent. Text files are hashed with CRLF normalised to LF because git stores LF. GitHub Pages takes 1 to 3 minutes to publish; raw.githubusercontent updates sooner.

### HALF-BUILT, NOT LIVE (do not push until finished)
Ryan's last requests: repair, removal and check must also cover **phones and Amit's web apps** (AmitScan, AmitChat, AmitMobile, AmitBooks and so on), and those must also show up in Verify It and Check It, so a person can check what is installed on their phone. "Verify is the most accurate." The whole thing is "the Amit Fix, wherever you come from."
- Already written in `fix_js.txt` (defined but NOT wired into any page, so the live page is unaffected): `FX_APPS` (per-app registry), `fxSwFor`, `fxCachesFor`, `fxIdbFor`, `fxStatusAll`, `fxRepairApp` (unregister that app's service worker, delete its caches, fetch the newest copy, keep the sign-in), `fxRemoveApp` (also deletes its IndexedDB; warns that AmitScan may lose unsent scans), `fxCheckApp` (compares THIS device's saved copy against the live website and raw GitHub, per file, SHA-256 via crypto.subtle), `fxAppCardHtml`, `fxInstallQrs`.
- NOT yet done: (1) build the page: a new page 7 "Phone & Apps" with tabs My apps (the cards), Install on a phone (Add-to-Home-Screen steps for iOS Safari and Android Chrome, plus a QR per app), Icons & permissions (OS-level steps to remove the home-screen icon and revoke camera and microphone). Use ids ch-tab-7-N and the template's showChTab(7,N); add it to the pages array in fxPages(); raise the `pg<=6` limit in build.js. (2) Add the same per-app Check to the Check It page, and a "what is on my phone and web apps" section to Verify.txt (make_verify.js) and the Verify It page. (3) Test: `node build.js`, `node check.js`, screenshots, then exercise repair, remove and check in headless Edge against the local server. (4) Bump AmitFix to v1.07, copy to the repo, push, verify live, update the Living Testimony entry and the Ask Amit context (`amitfix` in Amit_Ask_Live.js).
- Design decision for web-app checks: do NOT use a manifest (it goes stale whenever any app is pushed). Compare at run time: device copy versus live website versus raw GitHub. The website and raw GitHub disagreeing is the tamper or "mid-update" signal.
- Ryan's last message was about AmitScan specifically ("Great idea. About Amit scan."): AmitScan needs its own care because its IndexedDB `amitscan` may hold scans waiting to be sent. Removal must warn about it and, ideally, offer to send or export the pending scans first. Not built.

### Facts found about what is on a phone (verified in source 2026-10-26)
- There is NO native phone app. "Installed on phones" means web apps added to the home screen. The origin is ask-amit.github.io, and **other Ask-Amit pages (for example NREMT) share that origin, so never clear all site storage: only Amit's own keys, caches, service workers and databases.**
- Amit Mobile: service worker at AmitMobile/sw.js (cache `amitmobile-shell-v1`), IndexedDB `amitmobile-auth` (the sign-in), manifest.json, uses camera and microphone.
- AmitScan: AmitBooks/AmitScan/sw.js (cache `amitscan-shell-v1`), IndexedDB `amitscan-auth` AND `amitscan` (may hold scans waiting to be sent), camera.
- AmitBooks: AmitBooks/sw.js (cache `amitbooks-shell-v2`), manifest.
- AmitChat: no separate page in the public repo (the repo has only its CLAUDE.md and Sessions.md); the chat and Ask Amit load inside the Hub through Amit_Ask_Live.js. Treat Hub plus Amit_Ask_Live.js as its files for checking.
- A web page cannot remove a home-screen icon or revoke permissions; those need OS steps (iOS: long-press the icon, Remove App; Settings for camera and microphone. Android: long-press, Uninstall or Remove; Chrome site settings).
- The existing Director's Chair > Browser & phone tab only signs out and clears localStorage keys matching amit or sb-; it does not yet touch service workers, caches or IndexedDB.

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
