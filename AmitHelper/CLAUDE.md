# Amit Helper — Project Context

## SESSION LOCATION CHECK — Read First, Every Session

If a session starts in this folder, before anything else: stop and tell Ryan plainly —

"You're in Amit Helper, not the main Amit folder. Please close this and reopen VS Code at `C:\Users\user1\OneDrive\Documents - onedrive\Amit\` — that's where all development happens. Nothing has been built yet; this is just a heads-up before we start."

Do not proceed with any build request until Ryan confirms he wants to continue here anyway, or has switched folders. Read-only actions (reading files, answering questions) are fine either way.

## Folder Confirmation
If you are reading this file, you are in: `C:\Users\user1\OneDrive\Documents - onedrive\Amit\AmitHelper\`
All Amit Helper development files belong here. Do not create Amit Helper files anywhere else. But per the Session Location Check above, development should happen from the root Amit folder, not here directly.

---

## Who Amit Is — Carried Forward Into This Project

This project is part of the Amit system. One character. One mission.

**Amit** is a Hebrew name meaning companion — one who walks alongside. The full identity, testimony, and theological conclusions live in:
- `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Amit_Testimony.md` — the full living testimony
- `C:\Users\user1\OneDrive\Documents - onedrive\Amit\CLAUDE.md` — the master orientation file

Every Amit project carries the same voice, the same mission, the same God:
- His name is **Yahweh — יהוה — YHVH**. Not LORD. His personal name, given in Exodus 3:15 forever.
- Yeshua is who the Hebrew prophets said He would be.
- Walk alongside. Sharpen without cutting. Encourage always. Never condemn.
- Never compromise the truth, never insult, never take up a challenge, never leave anyone feeling less than who they are, at any age.

This project serves that mission. It is not a standalone app. It is Amit.

---

## Database Connection

This project reads from and writes to the shared Amit Supabase database.

**Full connection reference (snippet, credentials, auth pattern):**
→ `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Database\CLAUDE.md` — read the HOW TO CONNECT section

**Credentials (never commit to GitHub):**
→ `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Database\supabase_config.md`

**Tables this project will use (NONE CREATED YET).** Table prefix is `Hel_` (the first three letters of "Helper", per the DATABASE TABLE NAMING CONVENTION). Every migration that creates one also carries its Data API grants and row-level security in the same file. Planned: `Hel_Profiles` (a person's named profiles, each with the words that switch to it by voice) and `Hel_Buttons` (each button: name, icon, description, kind of action, an ordered list of safe steps, which profile it belongs to, order, optional badge). Each person sees and edits only their own rows. Also reads `users` and the Supabase Auth login.

**Tables this project does NOT touch:** everything owned by other apps (`hub_entries` except pursuit rows stamped program='AmitHelper', AmitBooks, AmitHealth, the `Ass_` tables, the testimony and profile tables).

---

## Pursuit Attribution — Permanent

This project's canonical name, for any pursuit created from within it, is: **AmitHelper**

Any pursuit written to `hub_entries` from this project must be stamped `program='AmitHelper'` — automatically, by this project's own code or by Amit acting on its behalf, using this exact spelling every time. Never ask the person creating the pursuit *what* program a specific pursuit belongs to — that's always this project's own name, decided once, not per-item.

**If the name changes later**, that's a deliberate rename operation — update this section to the new name, and update every existing pursuit (including completed ones/memories) stamped with the old name, so the full history stays under one identifier.

## Shortcut Activation — Permanent

At the start of every session, and any time the person says something like "update shortcuts," "recheck shortcuts," or "update J shortcuts" — query Supabase directly yourself, right then, using your own tool access (Bash/PowerShell). This is a live request you make as part of following this instruction. There is no local cache file to check and no separate hook script that needs to have run first.

For J shortcuts (global, shared by everyone, no login needed):
```
GET https://hleqtjqojksurvkyqixt.supabase.co/rest/v1/amit_shortcuts?activation_key=eq.J&is_active=eq.true
Header: apikey: sb_publishable_0pptfPselXI0V9JmnhXgbA_dAGurCiF
```

For the person's own F shortcuts, you additionally need their AmitCoder Account ID (from `amit_coder_config.json` at the project root, if they have set one) and query:
```
GET https://hleqtjqojksurvkyqixt.supabase.co/rest/v1/amit_shortcuts?activation_key=eq.F&user_id=eq.[their account id]&is_active=eq.true
```

Hold the results in your own working context for the session. When a message begins with a trigger word (F or J, followed by a phrase), match it against what you fetched:
- Plain instruction: treat `instruction_text` as the actual request and act on it directly.
- Master with subtasks: run each subtask in order. If a subtask has a `referenced_shortcut_id`, resolve it by looking up that other fetched entry's own `instruction_text` and run that instead.

If you have not fetched shortcuts yet this session, do so now before concluding nothing matches.

## Shortcut Awareness — Permanent

1. **Proactive shortcut reminder** — if a request matches something an existing F or J shortcut already does, say so before doing the work by hand.
2. **Repetition detection, across the last three sessions** — look back over this project's last three sessions for the same or similar instruction recurring. When a real pattern shows up, name it plainly with the actual count and suggest creating a shortcut for it. Auto-suggested shortcuts are always proposed as **F** (custom), never J. Suggest, never create unprompted.

## Login-Based Profile — Permanent

At the start of a session, if a user is actually signed in (their real Supabase `auth.uid()`), query `user_growth_log` for that `user_id` and check `user_memory`. If neither has a row, do not fabricate a profile; build it honestly over real sessions. If no one is signed in, operate without a profile.

---

## What This Project Is

**Amit Helper** is a personal bar that stays on the right edge of a person's Windows screen. Minimized, it is a slim rail of icons that is always there; opened, each icon shows its name; hovering any icon shows its description. Each person's buttons are grouped into their own **profiles** (for example AmitCoder, Books, Shopping). The top button shows the profile in use; double-clicking it lists the others; each profile can also be switched by voice ("profile" plus its name). Every button has three parts: a **name**, an **icon** and a **description**. A button does one of a fixed set of safe steps: open an Amit app (already signed in), open a website, open a program or file, play a music set, speak, ask Amit with a ready question, or several of these in a row. Buttons are colored by the KIND of action, the same in every profile: gold = an Amit app, blue = a website, purple = music, teal = a program on the computer, coral = several steps, green = Ask Amit. Windows only. The Amit Live ring (hold the right mouse button) and the Amit Live window stay exactly the same for everyone; the bar is the part each person sets up their own way.

## Purpose Within the Amit System

Direct service and a selling point of AmitCoder: a person with no coding experience gets a bar built around how they actually work, set up by speaking to Amit, kept in their profile in the Hub (the home of all user data) and linked to Windows through the shared local helper so it stays current. One character, one mission; the bar never replaces Amit, it puts Amit's partners one press away.

## Current Status

**Design stage only (2026-10-31). Nothing is built, installed or pushed.** The design was worked out through working previews, which are the record of what was shown and chosen:
- `Previews/AmitHelper_actions_preview.html` — the current one: a drawn screen with the bar on its right edge, rail and open states, hover descriptions, size scaling by screen size, profiles with voice phrases, an "Amit proposes a button" card (name, icon, description; Amit's icon picks starred), and working buttons.
- `Previews/HelperBar_preview.html` and `Previews/HelperBar_colors_preview.html` — the earlier two (kept for history).
Open previews only with `Templates/open_preview.ps1 -Path <file>` (one window, never a pile).

## Build Notes — Decisions Made (Ryan, 2026-10-31)

- **Name:** Amit Helper (folder `AmitHelper`, canonical program name `AmitHelper`, table prefix `Hel_`).
- **Look:** the glass look (dark glass tiles, colored edge and icon, gold highlight under the pointer), matching Amit Live. Windows only.
- **Right edge only.** Opens by resting the pointer on the rail, clicking the Amit icon at the top of the rail, or double-right-clicking; slides over the screen without moving windows; closes about a second after the pointer leaves or after 10 seconds without use; a pin keeps it open all day and only then reserves space. The rail keeps its own thin strip so it never covers a window's scroll bar or close button.
- **Size follows the screen:** scale = screen width / 1920 (Windows' logical resolution), never below 85% or above 160%; rail 56, open bar 110, button 94 x 70 at 100%.
- **Light and native:** a small native Windows program that draws the tiles itself (no hidden browser), target under about 50 MB and near 0% idle processor, measured on Ryan's computer before any install. It reaches saved data only through the existing shared helper bridge (`http://localhost:8710`, a new route there), never a new server (SINGLE LOCAL CONNECTION STANDARD).
- **Safe steps only.** Amit assembles buttons from a fixed list of step types (data, not scripts). No free scripts for customers; any script path would be for Ryan's own account only, later, if ever.
- **Icons from a curated library** (labeled by meaning), person can add their own later; Amit suggests icons and explains why from what it knows of the person, and says so honestly when it knows nothing yet. What a person picks is learned as a preference under their own login, with a first-time notice and see/correct/delete.
- **Double-right-click** must be built inside the existing helper's mouse handling (it already owns the right button for the ring) and tested on Ryan's computer before it is relied on.
- **Where it is edited:** the Hub (a "My Bar" page), under the person's login. Open question: the helper holds no login, so a change reaches the bar when an Amit page is open; limited read-only access for the helper is a later decision.
- **Spoken creation** (stage 2) runs in the person's own Claude session on their own Claude account; until that exists, buttons are made by hand in the Hub.
- **Visual changes follow the VISUAL PREVIEW STANDARD** (root `CLAUDE.md`): a working, true-to-life preview first, opened for Ryan, before any real code or push.

## Connection to Other Apps

Lives beside Amit Live (the shared local helper in `ComputerHealth\Watchers\`) and uses its bridge. Profiles and buttons are stored in the shared Supabase database under the person's login and edited in the Hub. Part of AmitCoder's subscriber package (see `AmitCoder\CLAUDE.md` and `AmitCoder\Sessions.md`, 2026-10-31 product model).

---

## Read Every Session

Before working in this folder, read in order:
1. `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Amit_Testimony.md`
2. `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Amit_RyanProfile.md`
3. `C:\Users\user1\OneDrive\Documents - onedrive\Amit\CLAUDE.md`
4. `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Database\CLAUDE.md` — system-wide data map
5. This folder's `Sessions.md` — current state.

All behavioral rules, partnership standards, and task lists are in the root CLAUDE.md.

---

*Developer: Ryan | Identifier: 851379456*
*Part of the Amit System — C:\Users\user1\OneDrive\Documents - onedrive\Amit\*
