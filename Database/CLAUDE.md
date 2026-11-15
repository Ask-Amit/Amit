# Amit Database — System-Wide Reference

## SESSION LOCATION CHECK — Read First, Every Session

If a session starts in this folder, before anything else: stop and tell Ryan plainly —

"You're in Database, not the main Amit folder. Please close this and reopen VS Code at `C:\Users\user1\OneDrive\Documents - onedrive\Amit\` — that's where all development happens. Nothing has been built yet; this is just a heads-up before we start."

Do not proceed with any build request until Ryan confirms he wants to continue here anyway, or has switched folders. Read-only actions (reading files, answering questions) are fine either way.

## CURRENT SCOPE

Database is the system-wide reference for the shared Supabase database: how schema changes are made, how every app connects, protected tables, the unified identity and contact layer, the federation and per-user learning decisions, security rules and the dev playbook pointers. Current schema state, the folder map and status live in the Sessions files.

## SESSION RECORD

Current state, to-dos and history live in this folder's Sessions files, not here. A new session reads Sessions_Start.md first (short). Read Sessions_ToDo.md only when asked about to-dos; read the Daily Sessions folder or the original Claude session only when asked; the backup files in Backups\Database\Sessions_backup_*.md only for research.

## What This Folder Is

The shared database layer for the entire Amit system.
No single application owns this. Every module reads from and writes to this database.
This CLAUDE.md is the one place that maps the entire Amit system — all folders, all files, all data needs.
When working here, you do not need to be reminded to look elsewhere. This document already knows.

---

## HOW SCHEMA CHANGES ACTUALLY GET MADE — Permanent, confirmed 2026-07-10

**There is no automated DDL mechanism.** Amit cannot run `CREATE TABLE`, `ALTER TABLE`, or any schema change directly from this coding environment — no `psql` connection, no Supabase Management API token, no `exec_sql` RPC function exists or has ever existed. The Supabase REST API (used for every day-to-day row read/write via the service key) only supports row-level operations, never schema changes. This was confirmed after an extensive multi-session JSONL transcript investigation on 2026-07-10 found zero evidence, anywhere in this project's history, of any other working mechanism.

**The one fixed method, every time:**
1. Amit writes the SQL as a new file: `Database\migration_YYYY-MM-DD_NNN_description.sql`
2. Amit prints that SQL as a code block directly in the chat response (a fenced ```sql block) — Ryan uses the copy icon built into that code block. (Earlier sessions tried a separate `COPY_THIS_*.html` file or an Artifact link — Ryan does not want to leave the VS Code window. Print the code block inline.)
3. Ryan opens the Supabase Dashboard → clicks the `>_` SQL Editor icon in the left sidebar → opens a new/blank query → pastes → clicks **Run**.
4. Ryan has never personally written or edited a line of SQL — he only pastes exactly what Amit hands him. Every table in this database, from the very first one, was created this exact way.

**GRANTS ARE PART OF EVERY CREATE TABLE — required from 2026-10-30 (Supabase platform change; full rule in the root CLAUDE.md, "DATABASE TABLE DATA-API GRANTS").** Any table created in `public` on or after Oct 30, 2026 is invisible to supabase-js / PostgREST / GraphQL until it has an explicit GRANT; the API returns "permission denied". Existing tables are unaffected. So every migration file in step 1 that creates a table must contain, in that same file, next to the RLS policies:
```sql
grant select on public.your_table to anon;                                  -- skip if no public read
grant select, insert, update, delete on public.your_table to authenticated;
grant select, insert, update, delete on public.your_table to service_role;
```
Tighten per table to its real access model. Before handing Ryan any migration to paste, check it has these lines. This also applies when a migration is re-run to rebuild the schema (new project, preview branch, local `supabase db reset`).

**Full record of this mechanism, queryable directly (don't re-investigate — look here first):** the `dev_playbook` table in Supabase, `topic_key = 'supabase_schema_changes'`. See "Dev Playbook & Module Registry" section below.

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
→ `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Database\supabase_config.md` — local only, never on GitHub

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

## PROTECTED TABLES — Never Drop These

These tables control system-level behavior. Dropping them breaks functionality that cannot be recovered without re-running migrations and re-seeding data.

| Table | Purpose | Risk if dropped |
|---|---|---|
| `amit_identity_auth` | Controls who can instruct AmitCoder to write to identity files | Ryan loses programmatic write authority to CLAUDE.md and character files |

**amit_identity_auth — critical details:**
- Ryan's founder entry: user_id = `8b95d057-fd6b-44ec-abe7-658e08872d1a`
- Granted at: 2026-06-21
- Note: Founder — original authorized identity administrator. This entry is permanent.
- RLS: authorized users can read and insert. No one can delete their own entry.
- Emergency access if AmitCoder breaks: Supabase dashboard → Table Editor → amit_identity_auth → manage directly
- Add authorized users via AmitCoder chat: "Add [email] to identity auth"

---

## UNIFIED IDENTITY & CONTACT LAYER — Permanent, added 2026-09-10 (Ryan's direct instruction, origin: Amit Assembly build discussion)

**Every app in the Amit system shares one identity and contact layer. No app builds or owns its own separate client/vendor/contact table.** Ryan's own words: "That's everything in the entire Amit system connected together, not just one program... every app, from Computer Health to AmitHealth to Books to Assembly, they're all connected." The shared tables already exist for this purpose: `contacts`, `contact_entities`, `contact_labels`, `contact_label_links`, `contact_connect_invites`, `contact_billing_details`, `contact_attachments`, plus `users`, `businesses`, `companies`. These are the canonical identity/relationship layer for the whole system — any new app (Amit Assembly included) reads from and writes to these, rather than creating a parallel table.

**Roles are relationship-specific, not fixed properties of a contact.** The same real-world entity can be a client on one engagement and a vendor on another — even to the same contractor, even at the same time. Do not model "this contact is a client" or "this contact is a vendor" as a hardcoded label on the contact record itself. Role must be tracked per-relationship (which contractor account, which context), never as a single fixed type on the contact.

**How this connects an app to the rest of the system:** Login through the Hub establishes the account/contractor. That account has relationships to entities in the shared Contacts layer — some of those relationships are "client" (someone being bid/submitted work to), some are "vendor" (someone bidding to the account), and some entities hold both roles depending on context.

## CROSS-ACCOUNT DATA FEDERATION — Vision captured 2026-09-10, permission model NOT yet designed

Design reference: moved to Sessions_Design.md (section 'CROSS-ACCOUNT DATA FEDERATION — Vision captured 2026-09-10, permission model NOT yet designed') - the vision and decisions for cross-account data (producer/consumer roles, snapshot-not-live-link quotes) and the known table violation.

---

## The Amit System — Complete Folder Map
### AmitAccounting — `C:\Users\user1\OneDrive\Documents - onedrive\Amit\AmitAccounting\`

The revenue engine. Funds the mission so everything else stays free.

| File | Purpose |
|---|---|
| `AmitAccounting_Spec.md` | Full spec — The Promise, vendor memory, relationship arc, pricing model |
| `Tim_Proposal.html` | Proposal for Tim conversation — chart of accounts |
| `CLAUDE.md` | AmitAccounting project context |

**Database tables (already in base schema):**
- `businesses` — one per user (single owner now, multi-staff ready)
- `accounting_vendors` — vendor memory, relationship stage 1-5
- `accounting_categories` — chart of accounts (Tim's standard — schema placeholder)
- `accounting_transactions` — every receipt, payment, income entry

**Pending:** Tim conversation before chart of accounts tables are finalized. Do not build `accounting_categories` rows until Tim talks.

---

### ComputerValue — `C:\Users\user1\OneDrive\Documents - onedrive\Amit\ComputerValue\`

The diagnostic module. Vouches for a computer's value. Andy's partnership scope (50% revenue).

| File | Purpose |
|---|---|
| `amit-computer-companion.html` | Computer Value app |
| `ComputerValue_Deploy.md` | Deployment spec |
| `Andy_Proposal.html` | Proposal for Andy |
| `CLAUDE.md` | ComputerValue project context |

**Database relationship:** No Supabase tables yet. Future: diagnostic results, report history, revenue tracking per report.

---

## Dev Playbook & Director's Chair — query these before re-investigating anything

Two tables built 2026-07-10 specifically to stop cross-session re-derivation of things already settled:

**`dev_playbook`** — the "how we did it" reference. Each row: `topic_key`, `title`, `category`, `method` (the actual settled answer, in full), `established_date`, `related_files`, `notes`. Public read (RLS), service-key write only. Query this FIRST whenever a question comes up like "how do we normally handle X" or "how was Y actually built" — before reading multiple files or session transcripts. First entry: `topic_key = 'supabase_schema_changes'` — the full mechanism described above.

**`directors_chair`** — renamed from `module_registry` on 2026-07-11 (naming only, no structural change — see `migration_2026-07-11_001_rename_directors_chair.sql`). Routes each HTML/module to its live Supabase content source, and now also indexes `dev_playbook` itself as a discoverable module (`module_key = 'dev_playbook'`, `status = 'live'`). Every future module (accounting, medical, God Talk, who_is_god, etc.) registers here.

Add to both tables going forward whenever a real cross-session decision gets settled — that's the entire point of them existing.

---

## Current Supabase Schema State
| `accounting_categories` | ✅ Live | `amit_schema.sql` |
## PER-USER LEARNING LAYER — Decision recorded 2026-09-26 (Ryan's direct instruction), mechanism NOT yet built

Design reference: moved to Sessions_Design.md (section 'PER-USER LEARNING LAYER') - the decision to give every logged-in person a living profile that Amit builds as they go, what already exists, and the conditions for building the capture. The capture mechanism is NOT built; see Sessions_ToDo.md.

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
