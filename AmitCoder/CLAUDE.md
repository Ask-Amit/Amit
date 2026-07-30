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

## F = User's Own, J = Amit's Builtin Package (permanent convention, set 2026-07-29)

Ryan set this explicitly after several rounds of design discussion (data model for coding memory/pursuits, then this final naming decision): **F is reserved for shortcuts the user creates — fully custom, fully theirs. J is the fixed builtin package that ships with AmitCoder, and can never be edited or removed by any user** (already enforced structurally by `is_builtin` + RLS, not just a UI convention — a regular signed-in user's write against a builtin row fails the RLS `with check` clause). This is a real correction from earlier in the session, where F and J were just "same convention, either hand" with builtins seeded under both — that ambiguity is exactly the kind of inconsistent taxonomy Ryan has been naming as the recurring problem tonight (in CLAUDE.md sprawl, in pursuit `focus` values, now here too). Fixed by migrating the two builtins that had been seeded under F (`F copy`, `F repeat`) to J (`J copy`, `J repeat`) via the service key, since Amit built them - they were never actually user-custom. F now correctly has zero builtin subtasks.

**Current J package (five subtasks, all builtin, all read-only to regular users):** `J copy` (reads OS clipboard), `J repeat` (reprints last response), `J search` (asks what to search this session for), and two new ones described below.

## Future Improvements Now Route Through hub_entries, Not a Separate Table (decided 2026-07-29, refined same day)

Ryan's real question: how do coders capture anything they want to remember or improve — not just debugging, anything — in a way that's actually findable later, without building a separate bespoke system per app (which is exactly what `amit_coder_ideas` was becoming). The answer: reuse `hub_entries` — already built, already tied to login via RLS, and already has a real browsing UI in the Hub's own Pursuits/Memories panels that a human can use with zero AI involved. The standard, to make this actually searchable rather than just possible:
- **`purpose` = `'Craft'`, always** — the pursuit taxonomy's existing build/coding category (see root CLAUDE.md's morning-routine categorization), not a new one invented for this.
- **`program` = the exact canonical app name, in its own dedicated column** — `AmitCoder`, `Hub`, `who_is_god`, `Computer Health`, `The Council`, etc., spelled identically every time. **Revised same day:** the first draft of this standard reused `focus` for the app name, but Ryan correctly pointed out that `focus` already carries different meanings depending on context (e.g. `focus='Morning Prayer'` under Spiritual pursuits isn't the same *kind* of value as an app name under Craft pursuits) — overloading one field with two different meanings is fragile. `program` is a real, dedicated column (`alter table hub_entries add column program text`) specifically for this, added as a small, bounded addition to an existing table — not new sprawl.
- **`notes` starts with a `File: path/to/file` line** when a specific file/function is relevant — a discipline, not a new column, so file-level traceability doesn't require a further schema change.

**New builtin J shortcuts wired to this convention:**
- **`J save idea`** — asks what app the idea is for and what it is, then inserts a `hub_entries` row following the standard above (`kind=pursuit`, `purpose=Craft`, `focus=<app>`, `starred=true`, `done=false`).
- **`J pull ideas`** — queries `hub_entries` for the signed-in user's open Craft pursuits, optionally filtered by app, and lists them.

**Real open decision, not yet made — do not silently act on this:** the AmitCoder page's own "+" Future Ideas button and its `amit_coder_ideas` table still exist and still work, built before this convention was settled. Whether to retire that table and rebuild the "+" button to read/write `hub_entries` directly instead (so there's genuinely one system, not two) is a real, deliberate decision Ryan has been asked about but had not yet confirmed as of this entry. Don't remove `amit_coder_ideas` without that explicit go-ahead — it's still live and functional in the meantime.

## Hub Pursuits — New "App" Column, Wired to program (added 2026-07-29)

Ryan wanted the Hub's own Pursuits table to be sortable/filterable by which HTML/app a pursuit belongs to, using the new `hub_entries.program` column. Built directly in `Hub\amit-hub.html` (not AmitCoder — this is a Hub feature, referenced here since it completes the loop `J save idea`/`J pull ideas` depend on):
- New "APP" column added to the header row, positioned before Purpose, with its own filter popup (same dynamic-population pattern as the existing Focus filter — reads distinct `t.program` values from the data).
- Local task object model gained a `program` field, wired through all four Supabase sync points (guest-data migration push, `_pullEntries`, `loadHubDemoData`, `_syncEntry`) so it round-trips correctly.
- Row template shows the app name as a label, matching the existing subcat-label style, in both the Amit-locked and normal row variants — grid CSS (`.col-headers` and `.task`) both updated with a matching new column width.
- **Corrected same session, real mistake:** the edit modal originally had "App / Program" as a user-editable text input with a datalist of suggestions. Ryan caught this directly — `program` must never be something a human picks or types, in the Hub or anywhere else. It has to be stamped automatically by whichever application actually created the pursuit, based on that app's own identity, the same way a git commit is stamped with its repo, not typed by the committer. Fixed: the field is now read-only display, hidden entirely for pursuits with no `program` (i.e., anything created by hand directly in the Hub, which correctly has no originating app), and only shown — as plain text, not an input — when a pursuit was actually stamped by something like `J save idea`.

**New builtin J shortcut — `J pursuit`:** searches the signed-in user's pursuits by keyword, ranks exact/near-exact title matches above similar/keyword-overlap matches (never mixed together), numbers every result, and asks which one was meant if more than one comes back.

**`J save idea` corrected same session:** originally asked the user what app/program an idea was for. Same mistake as the modal above — fixed so it infers `program` itself from the actual current working context (which project folder/CLAUDE.md the session is in) and never asks.

**Generalization confirmed by Ryan, same session — this is not just for Ryan's own Amit apps.** Any AmitCoder user building their own separate application (his example: someone developing an app called "mushrooms") gets the exact same treatment — `program` is stamped from whatever project folder/context they're actually working in, whatever they've named it, never from a fixed list. This already works correctly as built: the datalist/suggestions tied to a fixed canonical-app list were removed entirely as part of the same fix, so `program` is genuinely free-text, inferred from context — not an enum of Amit's own apps. Applies identically whether the pursuit is Craft (coding), Spiritual, or any other purpose — the field identifies *where a pursuit came from*, universally, not just for coding projects.

**Naming note, not yet resolved:** Ryan flagged that "App / Program" may not be the clearest name for this concept, given it needs to describe "whichever application or context originated this" across every purpose category, not just coding. No renaming done yet — revisit if a clearer term surfaces (something like "Source," "Origin," or similar), but not urgent enough to touch the column name or code right now.

**Self-propagating mechanism built (2026-07-29):** the naming/attribution convention now writes itself into every future project, in three places:
1. `Templates\Amit_NewProject_Template.md` — carries the Pursuit Attribution section (canonical name placeholder, ask-once instruction, rename-later instruction) into every new Amit-built project from here forward.
2. Root `CLAUDE.md`'s New Project Directive — Step 4c, same clause, for any project Amit creates going forward.
3. `Amit_Coder_Starter_Kit.ps1` — now asks a new question ("What is this project/application called?", defaulting to the folder name), writes the answer into the generated CLAUDE.md's Pursuit Attribution section AND into `amit_coder_config.json`'s new `app_name` field, so this works identically for a stranger's own app (Ryan's example: "mushrooms"), not just Ryan's own projects.

**New builtin J shortcut — `J rename pursuit`:** if a project's name changes mid-build (a real scenario Ryan named directly — someone starts with one name, changes their mind later), this updates the canonical name in that project's CLAUDE.md and `amit_coder_config.json`, AND retroactively updates every existing `hub_entries` row (active pursuits and completed ones/memories alike) from the old `program` value to the new one — so build history never splits across two names.

**Explicitly deferred, not done tonight (Ryan's own call):** a full backfill/review pass across all existing pursuits (currently in the hundreds) to retroactively assign `program` values where missing. Ryan will trigger this explicitly once the concept work above is settled — do not run it proactively.

## New Builtin — `J inspire` (added 2026-07-29)

Deliberately different in kind from the other J shortcuts — those recall or organize; this one synthesizes and expands. When triggered: reviews the current session's actual development (working honestly from the session summary where full detail isn't retained after compaction — never inventing what isn't there), then thinks beyond the literal task — other applications, other scales (individual/local/global), not confined to the current project. **Explicitly authorized to run a real web search** on the topic to see what others are already building in similar spaces — a genuine, real capability, not aspirational. Responds framed as "You asked me to inspire what you've done — here's what I came up with," structured as: honest current-state assessment, concrete near-term improvements, and at least one genuinely surprising extension beyond the current app. The bar Ryan set explicitly: the person should say "I never thought of that" — not receive a generic suggestion list.

**Reserved, not built:** `J hack` — Ryan named this as a strong word for a future identifier, deliberately not this one. Hold the name; don't assign it a meaning yet.

## The Real Gap, Finally Closed — Shortcut Activation (2026-07-29)

Ryan caught this directly, and it needed to be caught: every F/J shortcut built this session only ever worked *in this specific conversation*, because I already knew what each trigger meant from having just discussed it. A real developer, on their own machine, in a fresh Claude Code session that has never seen this conversation, had no way to recognize "J inspire" as anything at all — the `amit_shortcuts_cache.json` file `Amit_Coder_SessionStart.ps1` writes was just sitting there, unread, because nothing ever told a session to open it and act on it.

**Fixed by writing the actual "Shortcut Activation" clause** into all three propagation points (`Templates\Amit_NewProject_Template.md`, root `CLAUDE.md`'s New Project Directive Step 4d, and the Starter Kit's generated CLAUDE.md content) — the same three-place propagation pattern already used for Pursuit Attribution. The clause: read `amit_shortcuts_cache.json` at session start if present; when a message starts with a cached trigger, treat its `instruction_text` as the real request (resolving chained/referenced subtasks by looking up the referenced entry); if nothing matches, treat it as ordinary conversation.

**This is the single most load-bearing fix of the night** — every J/F shortcut built this session (copy, repeat, search, save idea, pull ideas, pursuit, rename pursuit, inspire, topic) was data sitting in a table until this existed. This is what actually makes them real for someone other than Ryan, in a session other than this one.

## New Builtin — `J topic` (added 2026-07-29)

A small, deliberately standalone shortcut: states plainly what's actually being worked on in the current session, meant to be reused as a shared first step rather than every other shortcut re-deriving it independently. **Honest limit on composition:** the existing subtask-chaining feature (`referenced_shortcut_id`) is built for a subtask that *replaces itself entirely* with another shortcut's instruction — not "run X, then continue with my own additional instructions." True `J inspire` → `J topic` chaining would need that richer composition model, which doesn't exist yet. For now, `J inspire`'s own instruction already includes topic-determination as its first step, written inline rather than through a real DB-level chain to `J topic`. Worth building real sequence-composition (not just replace-with-reference) if this pattern recurs.

## Versioning — Now Independent, Not Repo-Wide (changed 2026-07-29)

Ryan retired the shared repo-wide version number this session — every page's badge, including this one, is now its own independent counter, incremented +0.01 only when that specific file is actually edited. See root `CLAUDE.md`'s VERSIONING STANDARD for the full rule and why. AmitCoder.html continues from v6.16 (its value when the rule changed) — do not reset it to v1.00.

## Double-Click to Edit Shortcuts (added 2026-07-29)

Double-clicking a **custom** shortcut's card header opens the same create-form, pre-filled, in edit mode (an explicit "✎ edit" button does the same thing, since double-click alone isn't very discoverable). Saving in edit mode updates the existing row in place and replaces its subtasks wholesale (delete all + reinsert) rather than diffing them — simpler and safe since subtasks have no identity outside their parent shortcut. Builtins never get this — the card header only wires `ondblclick`/shows the edit button when `!is_builtin`.

## Community Code Library (added 2026-07-29) — New 7th Tab, "Library"

Direct response to Ryan's real question: what makes AmitCoder worth paying for, not just a setup wizard. Any signed-in user can share code/templates (title, language, description, the actual code) into a shared table, and any other signed-in user can browse, search (client-side, by title/language), and **download a real file** (a `<a download>` Blob, not just copy-paste) built from the shared entry. This is the "community library" idea from the Future Ideas backlog — built for real this round, not just logged.

**Migration — `amit_code_library`, pending confirmation:**
```sql
create table amit_code_library (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  title text not null,
  language text,
  description text,
  code text not null,
  created_at timestamptz default now()
);

alter table amit_code_library enable row level security;

create policy "Any signed-in user can read the library"
  on amit_code_library for select
  using (auth.uid() is not null);

create policy "Signed-in users can share code"
  on amit_code_library for insert
  with check (auth.uid() = user_id);

create policy "Authors can remove their own entries"
  on amit_code_library for delete
  using (auth.uid() = user_id);
```

**Real, honest limits, not yet solved:** no code review, moderation, or malicious-code screening — someone downloading a shared entry is trusting the listed author, same as npm/Gists trust their own contributors. No versioning of a shared entry (editing/re-sharing creates a new row, doesn't update the original) — worth a real decision if this gets used seriously. No syntax highlighting in the preview (the code textarea when creating an entry is plain, not highlighted) — a nice-to-have, not built.

**Real bug found and fixed this round, worth remembering:** the original `amit_coder_ideas` RLS policy was a single combined `FOR ALL ... USING (...) WITH CHECK (...)`. Ryan reported it live and reproducibly: data existed (confirmed via service key), the page correctly detected he was signed in, but the SELECT still returned zero rows. Fixed by splitting into three separate, single-purpose policies (`FOR SELECT`, `FOR INSERT`, `FOR DELETE`) instead of one combined policy. **Going forward, prefer split single-action policies over one combined `FOR ALL` policy for any new shared/multi-user table** — easier to reason about and apparently more reliable in practice.

## Future Ideas — Brainstormed 2026-07-29, Not Built, Also Live in the Page's "+" Button

Ryan's real question underneath this list: right now AmitCoder is mostly setup/scaffolding — what would actually make it worth paying for, worth being the premium tier that funds the Hub? These are captured here AND as real, editable rows in the `amit_coder_ideas` table (visible via the "+" button on the page itself) so the list can be added to or pruned without needing a CLAUDE.md edit each time.

**1. Community code library ("npm/Gists for AmitCoder")** — a shared, searchable table of code/templates/snippets other AmitCoder users (or Amit itself) have built, browsable and downloadable by any signed-in user. Well-proven pattern (npm, GitHub Gists, Framer/Webflow component marketplaces). Fully buildable on existing infrastructure — no hosting cost, no execution layer, same category of build as Shortcuts. Recommended as the first of these to actually build — lowest risk, most directly "worth paying for." Real open question before building: quality/safety — nothing stops someone sharing broken or malicious code, so shared entries need at least clear authorship and a report/flag mechanism, decided before the first real upload, not after.

**2. Private project collaboration with permissions** — two or more people opt into a shared project with real roles (owner/collaborator, maybe read-only), the same pattern GitHub uses for private-repo collaborators. Genuinely valuable, genuinely bigger — a real permissions model and invite flow, comparable in size to the whole Shortcuts system, not a quick add. Should follow #1, not be built alongside it.

**3. Live Share pairing** — already partially built this session (see Pairing tab above) as a manual log. The fuller version (auto-detecting a Live Share session start/end) would need a real custom VS Code extension — a materially bigger, separate project.

**4. Scoped file-sharing between two people's machines (Tailscale / OneDrive / Syncthing)** — researched this session. Tailscale alone only connects devices at the network level; it doesn't do folder-scoping or a permissions dashboard by itself. Two real paths surfaced:
   - **OneDrive folder-share** (since the whole Amit folder already lives in OneDrive) — real permission control and a dashboard already exist, zero new build, but it's Microsoft's UI, not native to AmitCoder.
   - **Syncthing** — open-source, peer-to-peer, genuinely folder-scoped by design; could be wrapped in a real AmitCoder dashboard tab, more work but native.
   - **Important limit found and worth holding:** for *code specifically*, raw file-sync (either option) is the wrong tool — no merge/conflict resolution, and it can actively fight with VS Code's file-watchers and build tools. Git (already in use) and Live Share (already free) are the right tools for live/collaborative code; file-sync is better suited to non-code assets (images, exports, docs) or a one-time "hand someone the whole folder" step, not ongoing live sharing of source files.

**5. The full embedded VS-Code-in-browser environment** — the original "make it look and work just like my desktop" ask. Ruled out as the near-term path: requires a real running server per user (`code-server`, the same category of thing behind GitHub Codespaces/Gitpod), which breaks the "everyone uses their own free local Pro/Max account, zero hosting cost" model that everything else in this system depends on. Not rejected outright — just correctly identified as a different, much bigger commitment (real per-user compute cost) than anything else on this list, requiring its own dedicated cost/build decision if ever revisited.

**6. Automated tests for AmitCoder itself** — flagged in the Dev Practices tab as "not built, bigger lift." Still true, still open.

**7. Subscription/billing wiring** — the Settings tab has an inert placeholder row. AmitCoder being the "paid tier that funds the Hub" isn't real yet until this exists.

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
