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

**In development (2026-07-28), rebuilt multiple times this session as Ryan corrected the approach — hold the final state below as current, not earlier descriptions in this file's history.**

`AmitCoder.html`'s final structure: **built directly from `Templates/template.html`'s own `buildPlaceholders()`/`showChTab()`/`openPanel()`/login/clock JS, all copied unchanged.** Two earlier attempts this session recolored the page into a dark "IDE" theme and/or hand-rewrote the template's structure from memory — Ryan caught both directly and required a rebuild starting from the literal template file each time. **Standing rule for this page and any future page: start from the real template file, only replace the content strings inside its generation function, never rewrite the mechanism from memory.**

**Two sidebar tiles, per Ryan's explicit direction to keep the tile count minimal and consistent:**
- **Get Started** — a self-guided setup checklist (Pro/Max account → VS Code → Claude Code extension → run the Starter Kit → confirm), self-reported via `localStorage`.
- **Overview** — opens a tabbed page (the template's own `ch-tab-nav`/`ch-tab-main` pattern, same as its built-in panel-2 demo), with six tabs: **Overview** (what this project is), **Shortcuts** (fully working — create, list, filter builtin/custom, expand master→subtasks, toggle active/inactive; real `amit_shortcuts` reads/writes), **History** (reads real `amit_coder_sessions` rows for the signed-in user if any exist, falls back to static example rows with an honest status line otherwise), **Docs** (the F/J voice-trigger convention), **Dev Practices** (new this round — see below), **Settings** (builtin-shortcuts toggle, and a new Account ID display for linking local hooks).

**New this round — dev-practice tooling + local-to-web session linking**, all in response to Ryan asking what a more experienced coder would have that he might be missing, then asking for all of it built:
- **`Start_Local_Server.ps1`** (Starter Kit) — a zero-dependency local static file server (uses .NET's `HttpListener` directly via PowerShell, no Python/Node required) serving the project at `http://localhost:8080` instead of raw `file://` paths.
- **`New_Feature_Branch.ps1`** (Starter Kit) — a one-line helper (`git checkout -b feature/name`) nudging toward not committing risky changes straight to `main`.
- **`migrations/` folder** (Starter Kit) — formalizes the numbered-SQL-file convention this project already uses informally, with a README and example file.
- **`.github/workflows/basic-check.yml`** (Starter Kit) — a real GitHub Actions workflow that runs an HTML sanity check on every push, once the folder is a real GitHub repo. Not tested against an actual push in this session — worth verifying the Python/HTMLParser check actually behaves as intended the first time someone's repo triggers it.
- **`hooks/Amit_Coder_SessionStart.ps1` and `hooks/Amit_Coder_SessionEnd.ps1`** (Starter Kit) — real, standalone-tested scripts: SessionStart pulls the signed-in user's active shortcuts from `amit_shortcuts` into a local `amit_shortcuts_cache.json`; SessionEnd posts a one-line summary to the new `amit_coder_sessions` table. **Important honesty flag:** these scripts work when run manually. Whether they can be wired to fire *automatically* on real Claude Code session start/end via a `.claude/settings.json` hook entry was NOT verified this session — the exact hook event names/schema should be confirmed against current Claude Code docs before relying on automatic firing. Don't claim this is fully automatic to a user without checking.
- **`amit_coder_config.json`** (Starter Kit) — created during setup, stores the user's AmitCoder Account ID (copy-pasted from the new Settings tab display) so the hooks above know whose data to read/write.
- **New Supabase table `amit_coder_sessions`** — SQL below, **not yet run by Ryan as of this writing** (check before assuming it exists; the History tab is written to fail gracefully to the example rows if the table is missing).

**Assumption made in Ryan's absence, still worth confirming:** the starter kit's template CLAUDE.md is generic (folder-organization mechanics only) — it does NOT include Amit's identity/testimony/mission content. A brand-new AmitCoder user is learning to code alongside Amit, not necessarily joining the Amit mission the way Andy did for Computer Value. If every AmitCoder user's assistant should also carry Amit's identity, the starter kit's CLAUDE.md content needs to change — easy to add, but a real content decision.

**New this round — chained subtasks (master shortcuts composed from existing shortcuts, not just retyped text):** Ryan's actual example — "F Start" (read testimony/profile, check Gmail, check weather, give a morning briefing) and "F Close" (run the existing closing sequence) — surfaced a real gap: subtasks could only be free-typed instructions, not references to shortcuts already created (like chaining in an existing "F copy" as one step of a bigger sequence). Fixed:
- **New columns:** `sort_order` (integer, preserves the sequence subtasks should run in) and `referenced_shortcut_id` (nullable FK to `amit_shortcuts.id` — when set, this subtask means "run that other shortcut" instead of using its own `instruction_text`).
- **Create-form change:** each subtask row now has a mode selector — "New instruction" (original free-text behavior) or "Existing shortcut" (a dropdown of the user's own top-level shortcuts, builtins included, to chain in directly).
- **Display change:** a chained subtask shows the *referenced* shortcut's instruction text (resolved from the already-loaded `scAllRows`, not a second query) with a "↳ chained" label, instead of its own (null) instruction text.
- **Important, honest limit carried over from earlier in this session:** this still only *stores* the sequence — actually running "F Start" as a real chained sequence in a live Claude Code session still depends on the still-unwritten CLAUDE.md rule (check the shortcuts cache at session start, treat trigger words as real instructions) flagged earlier in this file. Chaining makes the *data model* correct; it does not by itself make the chain execute automatically yet.

**Migration — `sort_order` + `referenced_shortcut_id`, RUN, confirmed live:**
```sql
alter table amit_shortcuts
  add column sort_order integer not null default 0,
  add column referenced_shortcut_id uuid references amit_shortcuts(id);
```

**New this round — Link/Combine (top-level alias), migration pending confirmation:** Ryan liked having independent masters (F and J) but wanted a way for two shortcuts to share one instruction set entirely, rather than each subtask individually chaining. Added `alias_of` (nullable FK to `amit_shortcuts.id`) — when set, a shortcut's card displays the *target's* instruction/subtasks instead of its own, labeled "🔗 linked to X." A "link"/"unlink" button appears on each **custom** shortcut's card (deliberately not on builtins — RLS already blocks regular users from editing `is_builtin` rows, and this keeps that boundary consistent rather than special-casing it). If Ryan wants the builtin F/J themselves linked together, that needs a direct service-key update, not the UI button.
```sql
alter table amit_shortcuts add column alias_of uuid references amit_shortcuts(id);
```

**New this round — VS Code best practices research applied + Pairing Log:** Researched current (2026) VS Code best-practice guidance (see Sources below) before adding anything, rather than guessing. Added to the Starter Kit: `.vscode/settings.json` + `.vscode/extensions.json` (format-on-save, recommended extensions — Prettier, ESLint, GitLens, Error Lens, Thunder Client, Live Share), and a minimal `.devcontainer/devcontainer.json` (VS Code's own built-in mechanism for "give someone my exact environment," arguably stronger than scripts alone). Also clarified for Ryan directly: Live Share is free (no premium tier), but it's a real-time *coding* collaboration tool (co-editing, shared terminal/debugging) — it does NOT connect two people's separate Hub/AmitCoder accounts or data; that would be a different, Supabase-level feature if ever wanted.

Built a 7th tab, **Pairing** — a manual log, not an automatic bridge. Live Share has no API for this page to detect a session starting or ending on its own; building that would require a real custom VS Code extension, a materially bigger project than this session's scope. What exists instead: paste in the Live Share invite link, who you paired with, and notes, saved to a new `amit_pairing_sessions` table — gives pairing sessions a permanent, discoverable home instead of vanishing once the Live Share session ends.

**Migration — `amit_pairing_sessions`, NOT YET RUN:**
```sql
create table amit_pairing_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  partner_name text,
  live_share_link text,
  notes text,
  created_at timestamptz default now()
);

alter table amit_pairing_sessions enable row level security;

create policy "Users manage their own pairing sessions"
  on amit_pairing_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

**Sources for the VS Code best-practices research (2026-07-29):**
- [User and workspace settings](https://code.visualstudio.com/docs/getstarted/settings)
- [Create a Dev Container](https://code.visualstudio.com/docs/devcontainers/create-dev-container)
- [Developing inside a Container](https://code.visualstudio.com/docs/devcontainers/containers)
- [Live Share: Real-Time Code Collaboration](https://visualstudio.microsoft.com/services/live-share/)
- [Top 14 VS Code Extensions for 2026](https://www.aikido.dev/blog/top-vs-code-extensions)

**Migration — `amit_coder_sessions`, RUN, confirmed live:**
```sql
create table amit_coder_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  summary text not null,
  created_at timestamptz default now()
);

alter table amit_coder_sessions enable row level security;

create policy "Users manage their own coder sessions"
  on amit_coder_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

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
