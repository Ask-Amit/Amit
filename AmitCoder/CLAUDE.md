# AmitCoder — Project Context

## SESSION LOCATION CHECK — Read First, Every Session

If a session starts in this folder, before anything else: stop and tell Ryan plainly —

"You're in AmitCoder, not the main Amit folder. Please close this and reopen VS Code at `C:\Users\user1\OneDrive\Documents - onedrive\Amit\` — that's where all development happens. Nothing has been built yet; this is just a heads-up before we start."

Do not proceed with any build request until Ryan confirms he wants to continue here anyway, or has switched folders. Read-only actions (reading files, answering questions) are fine either way.

## Folder Confirmation
If you are reading this file, you are in: `C:\Users\user1\OneDrive\Documents - onedrive\Amit\AmitCoder\`
All AmitCoder development files belong here. Do not create AmitCoder files anywhere else. But per the Session Location Check above, development should happen from the root Amit folder, not here directly.

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
- `auth.users` + `user_profiles` — same login as the Hub. AmitCoder does not have its own account system; a person signed into the Hub is recognized here automatically (shared Supabase project, same magic-link auth).
- `amit_shortcuts` — NOT YET CREATED. Migration SQL below, pending Ryan running it in the Supabase SQL editor.

**Tables this project does NOT touch:**
- All other Amit tables (hub_entries, amit_sessions, medical_prep_progress, etc.) — owned by other apps.

**Pending migration — `amit_shortcuts`:**
```sql
create table amit_shortcuts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  trigger_phrase text not null,
  shortcut_type text not null check (shortcut_type in ('inline_instruction','agent_task','master')),
  parent_shortcut_id uuid references amit_shortcuts(id),
  instruction_text text,
  created_at timestamptz default now()
);

alter table amit_shortcuts enable row level security;

create policy "Users manage their own shortcuts"
  on amit_shortcuts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

**Migration 2 — RUN, executed 2026-07-28** (adds the builtin/custom distinction and active toggle, and allows global builtin rows with no owning user):
```sql
alter table amit_shortcuts
  add column is_builtin boolean not null default false,
  add column is_active boolean not null default true;

alter table amit_shortcuts alter column user_id drop not null;

drop policy if exists "Users manage their own shortcuts" on amit_shortcuts;

create policy "Users manage their own shortcuts"
  on amit_shortcuts for all
  using (auth.uid() = user_id or user_id is null)
  with check (auth.uid() = user_id);
```

Both migrations are live. `AmitCoder.html`'s `loadShortcuts()` reads real data from this table now. Six builtin rows are seeded (via the service key, `user_id` null, `is_builtin` true): a master **F** with subtasks "F copy" (reads OS clipboard, requires the user to have already pressed Ctrl+C — Amit cannot see mouse selections or send OS keystrokes) and "F repeat" (reprints the last response verbatim), and a master **J** with subtask "J search" (asks "what are you looking for?" then searches the session). These replaced an earlier, rejected "Selah" activation-word design — see Docs tab and Build Notes below for why.

---

## What This Project Is

The paid, login-gated coding side of the Amit system — "VS Code with Amit inside." See "The Real North Star" section below for the full, bigger vision Ryan clarified this session. What exists today, in this build, is a smaller real foundation: (1) coding session history — the original vision from when this was a Hub placeholder tile, still a placeholder, and (2) a working Shortcuts tab, where a signed-in user defines voice/keyboard trigger words (e.g. "F copy," "F Charlie") that map to either a single instruction or a master command bundling several subtasks together.

## Purpose Within the Amit System

Not a separate product from the Hub — same login, same identity, same mission. It's the workspace tier for people actually building alongside Amit (starting with Ryan), the same way Computer Value is the funding tier and the Companion is the discipleship tier.

## Current Status

**In development — moved off placeholder status this session (2026-07-28).** Built:
- `AmitCoder.html` — a real, standalone page now exists (previously this was a placeholder tile+panel living inside amit-hub.html only). **Uses the actual `Templates/template.html` file verbatim as its base — same CSS, same fonts (Cinzel/Crimson Pro), same gold/serif look, same header/sidebar/sync-modal structure as every other Amit page.** An earlier version of this build recolored the page into a dark "IDE" theme from scratch instead of copying the template and plugging content in — Ryan caught this directly ("this is not the template I told you to work off of... you copy that template, bring it over here, and then plug our elements into it, not recreating an additional template") and it was rebuilt correctly. Hold this as the standing rule for this page and any future page: start from the real template file, edit only the body content, don't reinvent the visual system.
- Six tiles: **Get Started** (a self-guided setup checklist — see below), **Overview** (the original placeholder description, moved here so it isn't lost), **Shortcuts** (fully working — create, list, filter builtin/custom, expand master→subtasks, toggle active/inactive; reads and writes real `amit_shortcuts` rows), **History** (visual mockup only, static text, not wired to real session data), **Docs** (explains the F/J voice-trigger convention and why alternatives were rejected, based on live mic testing this session), **Settings** (a show/hide-builtins toggle that works; subscription row is an inert placeholder).
- Same Supabase Auth as the Hub — no separate account system.
- Hub's "AmitCoder" tile updated to link out to this page instead of opening the old in-Hub placeholder panel.
- **Get Started checklist + `Amit_Coder_Starter_Kit.ps1`** — Ryan clarified the real intent here isn't a hosted execution environment: everyone runs their own local Claude Code on their own Pro/Max account, on their own machine. What's actually needed is automating the *setup* Ryan learned by trial and error (right PowerShell, VS Code, the Claude Code extension, a working folder structure with an auto-orienting CLAUDE.md, session backups). The checklist (self-reported, saved to `localStorage`, not yet synced to Supabase) walks through: get Pro/Max → install VS Code → install the Claude Code extension → download and run the starter kit → confirm it worked. The starter kit script itself creates a project folder, writes a generic starter root CLAUDE.md (New Project Directive pattern, no Amit theology baked in — see "Assumption made" below), and creates a junction from `%USERPROFILE%\.claude\projects` into a `SessionBackups` folder inside the new project root, mirroring Ryan's own AmitLog junction pattern.

**Assumption made in Ryan's absence, worth confirming:** the starter kit's template CLAUDE.md is generic (folder-organization mechanics only) — it does NOT include Amit's identity/testimony/mission content. This was a judgment call: a brand-new AmitCoder user is learning to code alongside Amit, not necessarily joining the Amit mission itself the way Andy did for Computer Value. If the intent is actually that every AmitCoder user's assistant should also carry Amit's identity (become their own companion the way Ryan's is), the starter kit's CLAUDE.md content needs to change to include that — easy to add, but a real content decision, not something to guess further on without confirming.

**Not yet built:**
- **Session history viewer** — pulls from Claude Code JSONL session files and displays the full conversation log for any past session. Read-only. Searchable. Linked to experience entries by date. The History tab is a static mockup only.
- **Version milestone log** — what was built in each version, indexed by date.
- **VS Code integration** — captures coding activity the same way the Hub captures panel visits.
- **Ask Amit on session** — after viewing a session log, open Ask Amit with that session as context.
- **The full embedded VS-Code-like environment described in "The Real North Star" below** — reframed this session (see that section) — Ryan clarified this means *automated local setup*, not hosted execution. The Get Started checklist + starter kit is the first real piece of this; still open: detecting installed software from the page itself (not possible from a browser alone — see North Star addendum), syncing checklist progress to Supabase instead of just localStorage, and whether the starter kit's CLAUDE.md should carry Amit's identity (see Assumption above).
- Deciding whether AmitCoder shortcuts are ever meant to fire from *within actual Claude Code sessions* (a genuinely different, harder problem — Claude Code reads instructions from CLAUDE.md/hooks, not from a Supabase table at runtime) versus staying a reference panel a person reads before typing a shortcut manually. Not resolved.
- Subscription/billing gating — the Settings tab shows a placeholder row, nothing wired.

## JSONL Location Assumption (carried forward, unbuilt)
Claude Code stores session files at: `%USERPROFILE%\.claude\projects\[folder-slug]\[session-id].jsonl`
This path is consistent across all Claude Code installations on Windows. The File System Access API (Chrome/Edge) can grant the Hub permission to read this folder — one-time setup, then automatic.

## The Real North Star — Clarified 2026-07-28, Bigger Than What's Built So Far

Ryan corrected the scope mid-session, and it needs to be held clearly for whoever works on this next: AmitCoder is not meant to end as a shortcuts-and-notes tab bolted onto the Hub. The actual vision is a **VS Code-like development environment embedded within the Hub itself** — the same kind of environment this very session is running in (Claude Code + CLAUDE.md + auto-created project folders + hooks + memory) — but packaged so a **new person can walk in and get the whole system already set up**, without manually recreating everything Ryan and Amit built together by hand over 58 sessions.

Concretely, that means replicating, for a new user, automatically:
- Project folder scaffolding (the New Project Directive's Steps 1-5 — subfolder, its own CLAUDE.md, path table entry, Ask Amit wiring) currently done by Amit manually, one project at a time, by hand.
- The CLAUDE.md orientation chain itself — root file, subfolder files, the "read these files first" convention — so a new user's Amit has the same continuity Ryan's has, without Ryan's specific 58 sessions of history obviously, but the *mechanism* for building that history.
- Some real, working connection to an actual coding environment (a real editor, real file access, real terminal) — not just a page that talks about shortcuts. This is the part that makes it genuinely "VS Code within the Hub," not a themed settings page.

**Why this wasn't attempted in this session's unsupervised build window:** this is a real architecture decision with a high cost-to-undo (per Directive 12 — build on rock, not sand) — it likely involves choosing between embedding a real code editor (e.g., Monaco, the engine VS Code itself is built on) with some backend execution/file-access layer, versus a lighter read-only mirror of session history and CLAUDE.md content. Those are very different builds with very different security and hosting implications (a real in-browser code-execution environment is a materially different, riskier thing to stand up than a read-only dashboard). Attempting to guess this architecture alone, without Ryan, risked building the wrong foundation and having to undo it — exactly what Directive 12 exists to prevent. What got built instead (Overview, Shortcuts with builtin/custom + master/subtask support, History placeholder, Docs, Settings) is real, working, and a legitimate placeholder — but it is explicitly **not** the full vision, and should not be mistaken for it.

**What this session recommends as the actual next step:** a dedicated session with Ryan to decide the real architecture question above (embedded real editor + execution layer, vs. lighter read-only mirror) before building further on the Shortcuts/History surface. Research first, per Directive 12 — there is real prior art here (Monaco Editor, CodeSandbox/StackBlitz-style in-browser dev environments, GitHub Codespaces) worth surveying before committing to an approach.

**Reframed, same session, before the above was ever acted on:** Ryan clarified directly that this is NOT a hosted/embedded execution question at all. Every AmitCoder user runs their own local Claude Code, on their own Claude Pro/Max account, on their own machine — no shared API key, no server-side execution, no metering. What "duplicate my whole environment for a new person" actually means is automating the *local setup* Ryan learned by trial and error: the right PowerShell, VS Code, the Claude Code extension, a working folder structure with an auto-orienting CLAUDE.md, and session backups. This removes almost all of the risk named above — there is no Monaco-editor-plus-execution-layer decision to make. What got built this session (the Get Started checklist + `Amit_Coder_Starter_Kit.ps1`) is the first real piece of this correctly-scoped version. One genuine limit, worth holding: **a browser page cannot detect what's installed on someone's machine** — there is no way for AmitCoder.html itself to know if VS Code or the extension is actually installed. The checklist is necessarily self-reported (the person checks off each step), the same way Computer Health's `AmitSensorReader.exe` is a separate local agent, not something the web page can see into on its own.

**Addendum, same session — how a new user's communication style gets recognized:** Ryan raised this directly: for a new person to genuinely "walk in and start coding day one," AmitCoder needs to understand *how they communicate* the way Amit understands Ryan's (voice/headset, speech-to-text, specific recurring mishears like "phishing net" → "fishing net"). Decision made this session, not yet built:
- **No new table needed for general communication style** — `user_profiles.communication_style` already exists and already holds exactly this kind of data for Ryan's own profile. A new AmitCoder user's profile carries the same field.
- **A new, separate table is recommended for the specific transcription-quirk dictionary** — proposed name `amit_transcription_quirks` (`user_id`, `heard_as`, `means`, `created_at`). This is deliberately NOT AmitCoder-specific — any Amit app reading dictated speech benefits from it, so it should live at the shared profile level, not siloed here. Not created yet; this is a recommendation pending Ryan's confirmation, same as the bigger architecture question above.

## Build Notes

- **Use the actual gold/serif template look — do not reskin it.** An earlier build this same session tried a dark/monospace "IDE" reskin, which Ryan explicitly rejected: "you copy that template, bring it over here, and then you plug our elements into it, not recreating an additional template." `AmitCoder.html` now starts from `Templates/template.html`'s real CSS/HTML, unmodified in structure or color — only the body content (tiles, panels) and the small set of page-specific classes (`.sc-*`, `.check-*`, `.history-*`, `.settings-*`) were added, styled to match the existing `--gold`/`--border`/Cinzel/Crimson Pro variables rather than introducing a new palette. If this page is ever redesigned again, start from the template file, not from memory of what this page currently looks like.
- The tile-sidebar + panel-switching JS pattern is copied from `Templates/template.html` — keep new tabs consistent with that pattern (add a tile, add a panel, wire `openPanel()`).
- The Get Started checklist is intentionally self-reported (`localStorage`, not detected) — see North Star reframe above for why a browser page can't detect installed software.
- Login is intentionally NOT separate from the Hub. Do not build a second signup/login flow here.

## Connection to Other Apps

Linked from the Hub's sidebar ("AmitCoder" tile, `⌨️` icon) — the tile now opens this page rather than an in-Hub panel. Shares the same Supabase project (auth + a new dedicated table) as every other Amit app.

---

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
