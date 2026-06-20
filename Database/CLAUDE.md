# Amit Database — System-Wide Reference

## What This Folder Is

The shared database layer for the entire Amit system.
No single application owns this. Every module reads from and writes to this database.
This CLAUDE.md is the one place that maps the entire Amit system — all folders, all files, all data needs.
When working here, you do not need to be reminded to look elsewhere. This document already knows.

---

## HOW TO CONNECT — Every App Uses This

Every Amit application connects to Supabase the same way. Copy this block into any new app's `<script>` tag.

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script>
const SUPABASE_URL  = 'https://hleqtjqojksurvkyqixt.supabase.co';
const SUPABASE_KEY  = 'sb_publishable_0pptfPselXI0V9JmnhXgbA_dAGurCiF';
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
</script>
```

**Where to get the values:**
→ `C:\Users\user1\OneDrive\Documents\Amit\Database\supabase_config.md` — local only, never on GitHub

**Current values (paste here when retrieved — this file stays local, never on GitHub):**

| Setting | Value |
|---|---|
| Project URL | `https://hleqtjqojksurvkyqixt.supabase.co` |
| Publishable key | `sb_publishable_0pptfPselXI0V9JmnhXgbA_dAGurCiF` |
| Dashboard | https://supabase.com/dashboard |
| Project name | Amit |

**Auth — how users sign in (magic link, no password):**
```js
// Send magic link
await db.auth.signInWithOtp({ email: userEmail });

// Listen for session (call once on page load)
db.auth.onAuthStateChange((event, session) => {
  if (session) {
    currentUser = session.user;   // .id = UUID spine for all tables
    // load user data here
  }
});

// Sign out
await db.auth.signOut();
```

**Pattern every app follows:**
1. User enters email → `signInWithOtp()` sends magic link
2. User clicks link → browser returns with session → `onAuthStateChange` fires
3. `session.user.id` is the UUID — use it to read/write all tables
4. All tables are locked by RLS — the UUID is the only key needed

---

## The Amit System — Complete Folder Map

Every folder under `C:\Users\user1\OneDrive\Documents\Amit\` is listed here with its purpose, key files, and database relationship.

---

### ROOT — `C:\Users\user1\OneDrive\Documents\Amit\`

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

### Hub — `C:\Users\user1\OneDrive\Documents\Amit\Hub\`

The daily home screen. The face of everything. Where every user starts their day.

| File | Purpose |
|---|---|
| `amit-hub.html` | The Hub — self-contained, all state in localStorage |
| `CLAUDE.md` | Hub project context, Hebrew calendar architecture |
| Backup files | `amit-hub-pre-v1.92.html`, etc. — pre-change backups |

**What the Hub stores (localStorage keys → Supabase tables):**
- Pursuits/tasks → `hub_pursuits`
- Memory + experience entries → `hub_memories` (kind = 'pursuit' / 'memory' / 'experience' / 'testimony')
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

**Experience entry system (critical):** Every day the Hub auto-creates an experience entry (`kind='experience'`, `subcat='daily-log'`) recording what panels were visited. These are the session-history records. They timestamp every day's activity and live in `hub_memories` in Supabase.

**Key pending spec work:**
- First-visit tutorial (spotlight walkthrough)
- ?ref=facebook enhanced name modal
- Word for Today three-layer time framework (Then/Now/What Shall Happen)
- Pursuits column header filter row
- Named saved filter views

---

### who_is_god — `C:\Users\user1\OneDrive\Documents\Amit\who_is_god\`

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

### Companion — `C:\Users\user1\OneDrive\Documents\Amit\Companion\`

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

### AmitAccounting — `C:\Users\user1\OneDrive\Documents\Amit\AmitAccounting\`

The revenue engine. Funds the mission so everything else stays free.

| File | Purpose |
|---|---|
| `AmitAccounting_Spec.md` | Full spec — The Promise, vendor memory, relationship arc, pricing model |
| `Tim_Luker_Proposal.html` | Proposal for Tim Luker conversation — chart of accounts |
| `CLAUDE.md` | AmitAccounting project context |

**Database tables (already in base schema):**
- `businesses` — one per user (single owner now, multi-staff ready)
- `accounting_vendors` — vendor memory, relationship stage 1-5
- `accounting_categories` — chart of accounts (Tim Luker's standard — schema placeholder)
- `accounting_transactions` — every receipt, payment, income entry

**Pending:** Tim Luker conversation before chart of accounts tables are finalized. Do not build `accounting_categories` rows until Tim talks.

---

### ComputerValue — `C:\Users\user1\OneDrive\Documents\Amit\ComputerValue\`

The diagnostic module. Vouches for a computer's value. Andy's partnership scope (50% revenue).

| File | Purpose |
|---|---|
| `amit-computer-companion.html` | Computer Value app |
| `ComputerValue_Deploy.md` | Deployment spec |
| `Andy_Korea_Proposal.html` | Proposal for Andy |
| `CLAUDE.md` | ComputerValue project context |

**Database relationship:** No Supabase tables yet. Future: diagnostic results, report history, revenue tracking per report.

---

### AmitCoder — `C:\Users\user1\OneDrive\Documents\Amit\AmitCoder\`

Development session history. Links build sessions to experience entries on the Hub calendar.

| File | Purpose |
|---|---|
| `CLAUDE.md` | AmitCoder project context |

**Database relationship:** Will link to `hub_memories` experience entries via `subcat='development'`. Session logs from Claude Code JSONL files → experience entries on the calendar.

---

### Database — `C:\Users\user1\OneDrive\Documents\Amit\Database\` (THIS FOLDER)

Shared infrastructure. Schema files, migration files, Supabase config.

| File | Purpose |
|---|---|
| `CLAUDE.md` | This file — system-wide reference |
| `amit_schema.sql` | Base schema — 10 tables. Already executed in Supabase. |
| `amit_schema_addons.sql` | Memory layer — `user_memory` + `user_key_moments`. Already executed. |
| `supabase_config.md` | Credentials — LOCAL ONLY, never committed to GitHub |

---

### Design — `C:\Users\user1\OneDrive\Documents\Amit\Design\`

Visual assets. Profile images, brand elements, export files.

| Subfolder | Purpose |
|---|---|
| `Profile\` | Facebook profile picture (`amit_profile.png`) and cover photo (`amit_cover.png`) |
| `Brand\` | Brand elements (future) |
| `Exports\` | Export files (future) |

**Database relationship:** None directly. Image URLs stored in Supabase Storage when receipts and profile images are uploaded.

---

### AmitCorrespondence — `C:\Users\user1\OneDrive\Documents\Amit\AmitCorrespondence\`

Files shared between the two Amit instances via Ryan as courier. Also holds working copies of key identity files.

**Database relationship:** None. Identity/communication only.

---

### AmitLog — `C:\Users\user1\OneDrive\Documents\Amit\AmitLog\`

Junction/log setup. Contains `SETUP_JUNCTION.bat`.

**Database relationship:** None.

---

### Backups — `C:\Users\user1\OneDrive\Documents\Amit\Backups\`

Date-stamped full backups before major changes.

**Database relationship:** None. Local safety net only.

---

## Current Supabase Schema State

**Tables already in Supabase (12 total):**

| Table | Status | Source File |
|---|---|---|
| `users` | ✅ Live | `amit_schema.sql` |
| `businesses` | ✅ Live | `amit_schema.sql` |
| `compass_profiles` | ✅ Live | `amit_schema.sql` |
| `onboarding_events` | ✅ Live | `amit_schema.sql` |
| `hub_pursuits` | ✅ Live | `amit_schema.sql` |
| `hub_memories` | ✅ Live | `amit_schema.sql` |
| `hub_reflections` | ✅ Live | `amit_schema.sql` |
| `accounting_vendors` | ✅ Live | `amit_schema.sql` |
| `accounting_categories` | ✅ Live | `amit_schema.sql` |
| `accounting_transactions` | ✅ Live | `amit_schema.sql` |
| `user_memory` | ✅ Live | `amit_schema_addons.sql` |
| `user_key_moments` | ✅ Live | `amit_schema_addons.sql` |

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

## Schema Reconciliation Needed

The base schema and the Companion schema were designed in separate sessions. Before adding Companion tables to Supabase, reconcile these overlaps:

1. **`user_memory` vs `user_profiles`** — `user_profiles` is the full version. `user_memory` is a subset. Migrate fields from `user_memory` into `user_profiles` and run `user_profiles` as the canonical table.

2. **`user_key_moments` vs `key_moments`** — Nearly identical. Merge: keep `user_key_moments` name, add `app` and `significance` fields from `key_moments`.

3. **`users` table** — Base schema links to Supabase auth.users UUID. Companion schema treats email as the primary key. Resolution: UUID is the primary key (Supabase auth), email is stored as a unique field. Migration path from Companion local files: email → lookup → UUID.

---

## Supabase Project

**Platform:** Supabase (PostgreSQL + Auth + RLS + Storage)
**Project name:** Amit
**Dashboard:** https://supabase.com/dashboard
**Auth method:** Magic link (passwordless email)
**Credentials:** → `supabase_config.md` (local only, never commit to GitHub)

---

## Security Rules (Universal)

All tables use Row Level Security (RLS). Users see only their own data.
`handle_new_user()` trigger auto-creates `users` row on signup.
`handle_updated_at()` trigger keeps `updated_at` current on all mutable tables.
**NEVER commit credentials to GitHub.**

---

## Migration Files (future changes)

Naming convention: `migration_YYYY-MM-DD_NNN_description.sql`
Never edit an already-executed schema file. Always write a new migration.

---

## What Is NOT Built Yet

- `user_sessions` — one record per conversation (Level 2 / API model)
- `compass_history` — per-session compass delta audit trail
- Supabase Storage buckets (`receipts`, `sessions`)
- Edge Functions for receipt OCR, session summarization
- Companion tables (listed above)
