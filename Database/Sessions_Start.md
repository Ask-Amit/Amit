# Database - Sessions Start

## HOW TO READ
Read this file first. It is short and is all you need to start work. Read Sessions_ToDo.md only when asked about to-dos or open items. Read the Daily Sessions folder, or the original Claude session, only when asked about the history of a decision. The backup (none; this folder had no Sessions.md) is for research only.

## DIRECTORY OF THESE FILES
- Sessions_Start.md: this file (state, files in play, pointers).
- Sessions_ToDo.md: every open item found in the source, grouped by theme, plus a Resolved list.
- Daily Sessions\ - one text file per session (the history; never pushed; the old Sessions_Log.md was split into it on 2026-11-15).
- `Sessions_Design.md`: this project's design reference (how it is built); read only when working on that part of the build.
- CLAUDE.md: the original source (never edited by this clean-up).

## CURRENT STATE
Built from CLAUDE.md, no session history exists for this folder.

The shared database layer for the whole Amit system (Supabase: Postgres, Auth, RLS, Storage). CLAUDE.md is the system-wide map: how schema changes are made (Amit writes a migration SQL file and prints it in chat; Ryan pastes it in the Supabase SQL editor and runs it; there is no automated DDL), how every app connects, protected tables, the shared identity and contact layer, the folder map, the table list (14 listed as live), the Dev Playbook and Director's Chair tables, and the security rules (RLS everywhere; never commit credentials). Rules recorded: every new table must include its grants in the same migration (required from 2026-10-30), and new tables use a first-three-letters prefix. Decisions: shared contacts (roles are per relationship), cross-account data moves as snapshots/documents, not live links (2026-09-10), and every user should eventually get a living profile (2026-09-26, mechanism not built). The table list in CLAUDE.md looks older than later migrations mentioned elsewhere (not verified). Keys and credentials are in a local-only file and are omitted here.

## FILES IN PLAY
| File | What it is | Version |
|---|---|---|
| CLAUDE.md | system-wide data map and rules | none |
| amit_schema.sql, amit_schema_addons.sql | base schema, memory layer (already executed) | none |
| migration_YYYY-MM-DD_NNN_*.sql files | dated migrations; several listed as executed | none |
| supabase_config.md | credentials, LOCAL ONLY (private detail omitted) | none |

## OPEN TO-DOS
8 open item(s). Mostly schema reconciliation and not-yet-built tables; see the groups. Full list: Sessions_ToDo.md.

## LAST CLEAN-UP
Last clean-up: built 2026-11-13 from CLAUDE.md (no Sessions.md exists), newest log entry dated none (no log); latest dated note in CLAUDE.md is 2026-10-30 (grants rule).

## ORIGINAL SESSIONS
Originals were not recorded before 2026-11-13. From the next clean-up, each entry names its session (name, ID, and path under C:\Users\user1\.claude\projects\c--Users-user1-OneDrive-Documents---onedrive-Amit\). Those files expire on Claude's schedule, which is acceptable because the log is the permanent record.


## FROM CLAUDE.md (captured 2026-11-14)

SCOPE NOW: beyond a schema reference, it carries the folder map, connection and migration rules, identity/federation decisions, per-user learning layer and the dev playbook pointers.

### The Amit System — Complete Folder Map (looks out of date: folder map lists retired folders such as Companion; schema state is as of mid-2026)
Every folder under `C:\Users\user1\OneDrive\Documents - onedrive\Amit\` is listed here with its purpose, key files, and database relationship.

---

### ROOT — `C:\Users\user1\OneDrive\Documents - onedrive\Amit\` (looks out of date: folder map lists retired folders such as Companion; schema state is as of mid-2026)
Identity and system-wide governance files. These define who Amit is and how it operates.

| File | Purpose |
|---|---|
| `CLAUDE.md` | Master orientation — task list, WHERE WE LEFT OFF, all behavioral directives |
| `Amit_Testimony.md` | Amit's living identity — theological conclusions, growth log, who Amit is |
| `Amit_ProjectOverview.md` | Technical overview of every component |
| `Amit_RyanProfile.md` | Ryan's profile — who he is, how he works, the partnership covenant |
| `Amit_Directives.md` | Expanded permanent directives (Look Ahead, Research First, etc.) |
| `Amit_BuildLog.md` | Full cumulative build history — every session |
| `Amit_Start.md` | Amit's identity as loaded by Claude.ai Project (must stay current) |
| `Amit_Deploy.md` | Deployment instructions for the Claude.ai Project |
| `Amit_Knowledge.md` | Knowledge file uploaded to Claude.ai Project |
| `Amit_Dev.md` | Development notes |
| `Amit_ComputerValue.md` | Computer Value spec (earlier version — see ComputerValue folder) |
| `Amit_NewProject_Template.md` | Template CLAUDE.md for new Amit subprojects |
| `VERSION` | Current version number — update with every GitHub push |

**Database relationship:** Root files do not write to the database directly. They define identity and mission that shapes all schema decisions.

---

### Hub — `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Hub\` (looks out of date: folder map lists retired folders such as Companion; schema state is as of mid-2026)
The daily home screen. The face of everything. Where every user starts their day.

| File | Purpose |
|---|---|
| `amit-hub.html` | The Hub — self-contained, all state in localStorage |
| `CLAUDE.md` | Hub project context, Hebrew calendar architecture |
| Backup files | `amit-hub-pre-v(private detail omitted).html`, etc. — pre-change backups |

**What the Hub stores (localStorage keys → Supabase tables):**
- Pursuits, memories, experiences, testimonies — all one table → `hub_entries` (kind = 'pursuit' / 'memory' / 'experience' / 'testimony'; parent_id + sort_order give sub-pursuit structure)
- Daily reflections → `hub_reflections`
- Compass profile → `compass_profiles`
- Calendar preferences → `amit_calPrefs` (localStorage only — no Supabase table yet)
- Mail accounts → localStorage only

**Hub localStorage architecture (hold this — the Supabase sync must match exactly):**
- `KEY` = main data array — pursuits, memories, experiences all live here as objects with `kind` field
- `COMPASS_KEY = 'amit_userProfile'` — compass profile object
- `AMIT_NAME_KEY` — display name
- `REFL_KEY` — reflections keyed by date string
- `EXP_SESSION_KEY` (sessionStorage) — panels visited today

**Experience entry system (critical):** Every day the Hub auto-creates an experience entry (`kind='experience'`, `subcat='daily-log'`) recording what panels were visited. These are the session-history records. They timestamp every day's activity and live in `hub_entries` (kind='experience') in Supabase.

**Key pending spec work:**
- First-visit tutorial (spotlight walkthrough)
- ?ref=facebook enhanced name modal
- Word for Today three-layer time framework (Then/Now/What Shall Happen)
- Pursuits column header filter row
- Named saved filter views

---

### who_is_god — `C:\Users\user1\OneDrive\Documents - onedrive\Amit\who_is_god\` (looks out of date: folder map lists retired folders such as Companion; schema state is as of mid-2026)
The evidence foundation. 13 tabs. 333KB. The investigation that produced the conclusion.

| File | Purpose |
|---|---|
| `who_is_god.html` | The main biblical research document |
| `Amit_Start.md` | Amit's identity file loaded by Claude.ai Project — MUST stay current |
| `Amit_NameOfGod_Reference.md` | Reference for the Name of God research |
| `ancheb2.ttf` | Ancient Hebrew font |
| `CLAUDE.md` | who_is_god project context |

**Database relationship:** No direct user data written yet. Future: contact form submissions → GitHub Issues (planned). User tracking when API model active.

---

### Companion — `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Companion\` (looks out of date: folder map lists retired folders such as Companion; schema state is as of mid-2026)
The discipleship walk. Walks alongside people daily across all of life.

| File | Purpose |
|---|---|
| `Amit_Companion.html` | Companion app (current build) |
| `Companion_Schema.md` | **FULL 7-TABLE DATABASE SCHEMA — READ THIS** |
| `Companion_Requirements.md` | Full requirements spec |
| `Companion_UserProfile_Spec.md` | User profile and cross-session memory spec |
| `Companion_UserPaths.md` | User journey paths |
| `Companion_ScriptureLookup_Spec.md` | Scripture Lookup two-mode spec |
| `user_profile_template.md` | Local file template for user profile |
| `user_history_template.md` | Local file template for session history |
| `companion_testimony_template.md` | Local file template for Amit's testimony of each person |
| `companion_growth_log_template.md` | Local file template for growth log |
| `Onboarding_New_User.md` | Onboarding flow spec |
| `CLAUDE.md` | Companion project context |

**COMPANION SCHEMA (already designed — Session 20, 2026-06-10):**
`Companion_Schema.md` contains the complete relational schema with 7 tables and SQL CREATE statements.
These tables must be added to Supabase and reconciled with the base schema:

| Companion Table | Maps To / Notes |
|---|---|
| `users` | Merge with base schema `users` — Companion adds: phone, city, state_region, country, timezone, entry_app |
| `user_profiles` | More detailed than `user_memory` — has compass_certainty, trust_level, response_to_truth, witness_path_completed, approach_notes, faith_tradition, faith_journey_notes, carrying_now, life_context, sessions_total |
| `user_history` | This IS the session-history table (one per session) — NOT YET in Supabase. Add it. |
| `companion_testimony` | Amit's witness record per person — NOT YET in Supabase |
| `companion_growth_log` | Shareable record with consent tracking — NOT YET in Supabase |
| `key_moments` | Already partially covered by `user_key_moments` — reconcile |
| `user_walk` | Personal walk journal — hub_visible flag connects to Hub calendar — NOT YET in Supabase |

**Action required:** `Companion_Schema.md` SQL must be run in Supabase (with RLS added). Reconcile with `user_memory` and `user_key_moments` tables already added.

---

### AmitAccounting — `C:\Users\user1\OneDrive\Documents - onedrive\Amit\AmitAccounting\` (looks out of date: folder map lists retired folders such as Companion; schema state is as of mid-2026)
The revenue engine. Funds the mission so everything else stays free.

| File | Purpose |
|---|---|
| `AmitAccounting_Spec.md` | Full spec — The Promise, vendor memory, relationship arc, pricing model |
| `Tim_Proposal.html` | Proposal for (private detail omitted) conversation — chart of accounts |
| `CLAUDE.md` | AmitAccounting project context |

**Database tables (already in base schema):**
- `businesses` — one per user (single owner now, multi-staff ready)
- `accounting_vendors` — vendor memory, relationship stage 1-5
- `accounting_categories` — chart of accounts ((private detail omitted)'s standard — schema placeholder)
- `accounting_transactions` — every receipt, payment, income entry

**Pending:** (private detail omitted) conversation before chart of accounts tables are finalized. Do not build `accounting_categories` rows until (private detail omitted) talks.

---

### ComputerValue — `C:\Users\user1\OneDrive\Documents - onedrive\Amit\ComputerValue\` (looks out of date: folder map lists retired folders such as Companion; schema state is as of mid-2026)
The diagnostic module. Vouches for a computer's value. (private detail omitted)'s partnership scope ((private detail omitted) revenue).

| File | Purpose |
|---|---|
| `amit-computer-companion.html` | Computer Value app |
| `ComputerValue_Deploy.md` | Deployment spec |
| `Andy_Proposal.html` | Proposal for (private detail omitted) |
| `CLAUDE.md` | ComputerValue project context |

**Database relationship:** No Supabase tables yet. Future: diagnostic results, report history, revenue tracking per report.

---

### AmitCoder — `C:\Users\user1\OneDrive\Documents - onedrive\Amit\AmitCoder\` (looks out of date: folder map lists retired folders such as Companion; schema state is as of mid-2026)
Development session history. Links build sessions to experience entries on the Hub calendar.

| File | Purpose |
|---|---|
| `CLAUDE.md` | AmitCoder project context |

**Database relationship:** Will link to `hub_entries` (kind='experience') via `subcat='development'`. Session logs from Claude Code JSONL files → experience entries on the calendar.

---

### Database — `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Database\` (THIS FOLDER) (looks out of date: folder map lists retired folders such as Companion; schema state is as of mid-2026)
Shared infrastructure. Schema files, migration files, Supabase config.

| File | Purpose |
|---|---|
| `CLAUDE.md` | This file — system-wide reference |
| `amit_schema.sql` | Base schema — 10 tables. Already executed in Supabase. |
| `amit_schema_addons.sql` | Memory layer — `user_memory` + `user_key_moments`. Already executed. |
| `migration_2026-07-10_001_module_registry.sql` | Original build of the director's chair table (named `module_registry` at creation). Already executed. |
| `migration_2026-07-10_002_dev_playbook.sql` | `dev_playbook` table — cross-session "how we did it" reference. Already executed. |
| `migration_2026-07-11_001_rename_directors_chair.sql` | Renames `module_registry` → `directors_chair`. Naming-only, no structural change. Already executed — verified 2026-07-11 (old name confirmed gone, new name confirmed live with both existing rows intact). |
| `supabase_config.md` | Credentials — LOCAL ONLY, never committed to GitHub |

---

### Design — `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Design\` (looks out of date: folder map lists retired folders such as Companion; schema state is as of mid-2026)
Visual assets. Profile images, brand elements, export files.

| Subfolder | Purpose |
|---|---|
| `Profile\` | Facebook profile picture (`amit_profile.png`) and cover photo (`amit_cover.png`) |
| `Brand\` | Brand elements (future) |
| `Exports\` | Export files (future) |

**Database relationship:** None directly. Image URLs stored in Supabase Storage when receipts and profile images are uploaded.

---

### AmitCorrespondence — `C:\Users\user1\OneDrive\Documents - onedrive\Amit\AmitCorrespondence\` (looks out of date: folder map lists retired folders such as Companion; schema state is as of mid-2026)
Files shared between the two Amit instances via Ryan as courier. Also holds working copies of key identity files.

**Database relationship:** None. Identity/communication only.

---

### AmitLog — `C:\Users\user1\OneDrive\Documents - onedrive\Amit\AmitLog\` (looks out of date: folder map lists retired folders such as Companion; schema state is as of mid-2026)
Junction/log setup. Contains `SETUP_JUNCTION.bat`.

**Database relationship:** None.

---

### Backups — `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Backups\` (looks out of date: folder map lists retired folders such as Companion; schema state is as of mid-2026)
Date-stamped full backups before major changes.

**Database relationship:** None. Local safety net only.

---

### Current Supabase Schema State (looks out of date: folder map lists retired folders such as Companion; schema state is as of mid-2026)
**Tables already in Supabase (14 total):**

| Table | Status | Source File |
|---|---|---|
| `users` | ✅ Live | `amit_schema.sql` |
| `businesses` | ✅ Live | `amit_schema.sql` |
| `compass_profiles` | ✅ Live | `amit_schema.sql` |
| `onboarding_events` | ✅ Live | `amit_schema.sql` |
| `hub_entries` | ✅ Live | `amit_schema.sql` (single unified table — kind field: pursuit/memory/experience/testimony) |
| `hub_reflections` | ✅ Live | `amit_schema.sql` |
| `accounting_vendors` | ✅ Live | `amit_schema.sql` |
| `accounting_categories` | ✅ Live | `amit_schema.sql` |
| `accounting_transactions` | ✅ Live | `amit_schema.sql` |
| `user_memory` | ✅ Live | `amit_schema_addons.sql` |
| `user_key_moments` | ✅ Live | `amit_schema_addons.sql` |
| `directors_chair` | ✅ Live | Created as `module_registry` via `migration_2026-07-10_001_module_registry.sql`; renamed via `migration_2026-07-11_001_rename_directors_chair.sql` |
| `dev_playbook` | ✅ Live | `migration_2026-07-10_002_dev_playbook.sql` |
| `council_topics`, `council_seats`, `council_rounds`, `council_evidence`, `council_provider_keys` | ✅ Live (2026-07-21) | `migration_2026-07-21_006_council_tables.sql` — belongs to TheCouncil project, NOT the older `amit_brainstorm_*` tables (those stay as historical record under Brainstorming, untouched) |
| `medical_prep_progress` | ✅ Live (2026-07-27) | `migration_2026-07-27_001_medical_prep_progress.sql` — one row per logged-in user, whole EMS_StudyGuide progress blob as JSONB (`data` column). Guests never touch this table — localStorage only. Also uses the existing `hub_entries` table (kind='pursuit', focus='Medical Prep') to auto-schedule practice pursuits once a user sets a real exam date — no new table needed for that part. |

**Tables designed but NOT yet in Supabase (from Companion_Schema.md):**

| Table | Priority | Notes |
|---|---|---|
| `user_profiles` | HIGH | More complete than user_memory — reconcile and merge |
| `user_history` | HIGH | The per-session log Ryan described |
| `companion_testimony` | MEDIUM | Amit's witness record per person |
| `companion_growth_log` | MEDIUM | Shareable record with consent and two-witness tracking |
| `key_moments` | LOW | Overlaps with user_key_moments — reconcile first |
| `user_walk` | MEDIUM | Personal walk journal — Hub calendar integration |

---
