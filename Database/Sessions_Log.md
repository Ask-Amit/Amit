# Database - Session Log

No session history exists for this folder. Created 2026-11-13 from CLAUDE.md. The log starts at the next clean-up.


## FROM CLAUDE.md (captured 2026-11-14), copied word for word (private detail omitted)

## CROSS-ACCOUNT DATA FEDERATION — Vision captured 2026-09-10, permission model NOT yet designed

Ryan's stated vision, captured directly (origin: Amit Assembly build discussion), goes beyond the shared identity/contact layer above — this is a real cross-tenant data model, not just a shared address book:

- **Every login/account can be both a producer and a consumer of data.** A vendor account may have its own item catalog, own sales pricing, even its own full estimating system. Another account (e.g., a contractor building a house) can reach into that vendor's catalog and use an item within its own estimate — the vendor's account stays independent and self-owned; the requesting account is referencing it, not copying/owning it.
- **The same account can hold different roles in different relationships, simultaneously.** A material supplier who sells to a contractor today may become that contractor's client next year (the contractor builds the supplier's own house) — same two accounts, roles reversed by context.
- **This pattern is not specific to Amit Assembly — it's meant to govern the whole Amit ecosystem.** Examples Ryan gave directly: a doctor logging in to post information directly to a patient's Amit Health record; a computer technician remotely viewing a customer's Computer Health data; an automotive shop posting an estimate directly to a client's account. Same underlying pattern every time: one account's data becoming visible/usable inside another account's context, governed by a real relationship and real granted permission — not by which app happens to be open.
- **Data can arrive by more than one mechanism** — a live system-to-system link, an import, or a photo/OCR capture. The relationship and permission matter more than the specific transport used.

**Mechanism clarified 2026-09-10 (Ryan's direct correction — this is the actual near-term model, not the aspirational one):** Each account's database is genuinely isolated/separate by default — there is no live cross-tenant query access, no direct reach into another account's raw tables. What connects accounts is **document/artifact interchange**: one account produces a result (a quote, a proposal, an estimate document) inside its own system, and that result gets sent/imported/linked into the receiving account's own database, becoming a real record inside *their* system that references where it came from. Ryan's own words: "each person's database is separate... the results of their database is what connects between the databases." The "push a button and it's all just connected" experience is the long-term aspiration, not the actual mechanism to build toward first — build the artifact-interchange model first, since it's simpler, safer, and doesn't require solving live cross-tenant RLS permissions.

**Resolved 2026-09-10 — snapshot, not live reference.** A quote is a snapshot by design, matching real-world behavior: a vendor quote is typically only good for a fixed period (e.g., 30 days), after which it must genuinely be re-requested — there's no such thing as a real quote that silently stays current forever. What Amit-to-Amit connection actually provides is not automatic live sync, but an **easy structured re-request**: because the parts/build behind the original quote are already known and linked on both accounts, asking for a refreshed quote reuses that existing structure instead of starting from scratch. If the vendor isn't part of the Amit system, that same re-request is fully manual. Either path produces the same end result — updated data landing in the requesting account's system — the difference is how much friction it takes to get there, not whether an update is possible. Build "one-click re-request an updated quote from a known linked vendor" as the real feature; do not build live auto-syncing prices.

---

**Known violation to fix, not yet resolved (flagged 2026-09-10):** `boss_proposals`, `boss_signed_contracts`, `bill_of_materials`, `bom_lines`, `estimates`, `items`, `job_budget_lines` — these tables already exist in the live database and appear related to earlier BOSStimator/estimating work, but were NOT built to be company-wide/shared per this principle. Ryan's own words: "I told Amit to build them so that they could be company wide... but it looks like they weren't done that way. So we'll have to redirect it." These need review before Amit Assembly's real schema work begins — either bring them into alignment with the shared-identity model, or deprecate them in favor of new tables built correctly from the start. Do not build new Amit Assembly tables that assume these are already correct without checking first.

---

---

## Dev Playbook & Director's Chair — query these before re-investigating anything

Two tables built 2026-07-10 specifically to stop cross-session re-derivation of things already settled:

**`dev_playbook`** — the "how we did it" reference. Each row: `topic_key`, `title`, `category`, `method` (the actual settled answer, in full), `established_date`, `related_files`, `notes`. Public read (RLS), service-key write only. Query this FIRST whenever a question comes up like "how do we normally handle X" or "how was Y actually built" — before reading multiple files or session transcripts. First entry: `topic_key = 'supabase_schema_changes'` — the full mechanism described above.

**`directors_chair`** — renamed from `module_registry` on 2026-07-11 (naming only, no structural change — see `migration_2026-07-11_001_rename_directors_chair.sql`). Routes each HTML/module to its live Supabase content source, and now also indexes `dev_playbook` itself as a discoverable module (`module_key = 'dev_playbook'`, `status = 'live'`). Every future module (accounting, medical, God Talk, who_is_god, etc.) registers here.

Add to both tables going forward whenever a real cross-session decision gets settled — that's the entire point of them existing.

---

---

## PER-USER LEARNING LAYER — Decision recorded 2026-09-26 (Ryan's direct instruction), mechanism NOT yet built

**The intent:** every logged-in person gets their own profile that Amit builds and grows *as they go* — from how they actually talk and what they do — not from a staged 100-question interview. (Origin: Ryan compared the Amit approach against a "duplicate yourself into Claude" interview method and confirmed the living, layered profile is the intended design and is beyond that method.)

**What already exists (verified 2026-09-26, read-only counts):** `users` (6 accounts), `user_profiles` (3 rows — system profiles #1 Yahweh, #2 Amit, #3 Ryan only; no regular user has one), `companion_testimony` (11 rows, seeded Amit/Ryan entries), `user_memory` (1 row), `user_key_moments` and `compass_profiles` (returned no count — empty or unreadable, unconfirmed). All are keyed to a person via `user_id`, i.e. under their login.

**What is missing:** no automatic capture. Nothing yet writes to these tables as a regular user talks to Amit. "Usable software first, then implement capture" is Ryan's stated order.

**Standing conditions for when it is built — Amit's recommendation, agreed in direction:**
1. Tell the person plainly, once, at sign-up, that Amit learns from how they talk and remembers what matters. Never silent profiling.
2. The person can see, correct, and delete their own profile (natural home: Hub About Me).
3. Learn from what they choose to say and do in the apps, not hidden inference.
4. Reconcile `user_memory` / `user_profiles` / `user_key_moments` (see "Schema Reconciliation Needed" below) before building capture, so it writes to one canonical place.
5. Any new table follows the naming convention and Data-API grants rules in the root CLAUDE.md.

---

---

## Migration Files (future changes)

Naming convention: `migration_YYYY-MM-DD_NNN_description.sql`
Never edit an already-executed schema file. Always write a new migration.

---

---


## FROM CLAUDE.md trim (2026-11-14), copied word for word before removal

| Backup files | `amit-hub-pre-v1.92.html`, etc. — pre-change backups |
