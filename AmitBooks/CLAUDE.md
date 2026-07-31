# AmitBooks — Project Context

## SESSION LOCATION CHECK — Read First, Every Session

If a session starts in this folder, before anything else: stop and tell Ryan plainly —

"You're in AmitBooks, not the main Amit folder. Please close this and reopen VS Code at `C:\Users\user1\OneDrive\Documents - onedrive\Amit\` — that's where all development happens. Nothing has been built yet; this is just a heads-up before we start."

Do not proceed with any build request until Ryan confirms he wants to continue here anyway, or has switched folders. Read-only actions (reading files, answering questions) are fine either way.

## Folder Confirmation
If you are reading this file, you are in: `C:\Users\user1\OneDrive\Documents - onedrive\Amit\AmitBooks\`
All AmitBooks development files belong here. Do not create AmitBooks files anywhere else. But per the Session Location Check above, development should happen from the root Amit folder, not here directly.

---

## Who Amit Is — Carried Forward Into This Project

This project is part of the Amit system. One character. One mission.

**Amit** is a Hebrew name meaning companion — one who walks alongside. The full identity, testimony, and theological conclusions live in:
- `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Amit_Testimony.md` — the full living testimony
- `C:\Users\user1\OneDrive\Documents - onedrive\Amit\CLAUDE.md` — the master orientation file

AmitBooks is the bookkeeping app inside the Amit system — built for the overwhelmed small-business owner ("throw the pile at Amit"), not for an accountant. It is a real, standalone application under the Amit umbrella (like Computer Value), not the Amit witness/testimony work itself — but it inherits the same standards of honesty and craftsmanship.

---

## Database Connection

This project reads from and writes to the shared Amit Supabase database.

**Full connection reference (snippet, credentials, auth pattern):**
→ `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Database\CLAUDE.md` — read the HOW TO CONNECT section

**Credentials (never commit to GitHub):**
→ `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Database\supabase_config.md`

**Tables this project uses:** books, book_members, chart_of_accounts, account_category_templates, contacts, items, item_category_templates, tags, estimates, segregated_funds, invoices_bills, invoice_bill_lines, payments, payment_sources, inter_book_resolutions, fixed_assets, properties, property_owners, journal_entries, journal_lines, purchase_orders, purchase_order_lines, inventory_transactions, warranties, service_agreements, qb_import_batches, investments, subscriptions, employees, payroll_runs, payroll_run_lines, mileage_logs, repair_logs, crm_activities, bank_feed_transactions, audit_log, documents.

**Tables this project does NOT touch:** hub_entries, amit_sessions, amit_daily, amit_encounters, user_profiles, amit_shortcuts, medical_prep_progress — those belong to the Hub/testimony/AmitCoder side of the system.

All migrations live in `Database\migration_2026-07-29_*.sql` and `Database\migration_2026-07-30_*.sql`.

---

## Pursuit Attribution — Permanent

This project's canonical name, for any pursuit created from within it, is: **AmitBooks**

Any pursuit written to hub_entries from this project must be stamped `program='AmitBooks'` — automatically, using this exact spelling every time. AmitBooks does not currently write to hub_entries (see Database Connection above) — this section is recorded now so it's already decided the moment that changes, per the standing New Project Directive.

## Shortcut Activation — Permanent

At the start of every session, and any time the person says something like "update shortcuts," "recheck shortcuts," or "update J shortcuts" — query Supabase directly yourself, right then, using your own tool access (Bash/PowerShell).

For J shortcuts (global, shared by everyone, no login needed):
```
GET https://hleqtjqojksurvkyqixt.supabase.co/rest/v1/amit_shortcuts?activation_key=eq.J&is_active=eq.true
Header: apikey: sb_publishable_0pptfPselXI0V9JmnhXgbA_dAGurCiF
```

For the person's own F shortcuts, additionally query with `activation_key=eq.F&user_id=eq.[their account id]`.

## Shortcut Awareness — Permanent

Proactive shortcut reminder — if a request matches something an existing F or J shortcut already does, say so before doing the work by hand. Repetition detection across the last three sessions — if the same request recurs, name the pattern and suggest an F shortcut. Suggest, never create unprompted.

---

## What This Project Is

AmitBooks is real, live bookkeeping software — genuine double-entry accounting under the hood (auto-posting journal entries for every bill, invoice, payment, and pay run), presented through a "fewest fields to save" entry philosophy so a non-accountant can clear a pile of receipts fast. It supports multiple books per user, an inter-book resolution engine for commingled personal/business/partnership spending (Wages, Distribution, Loan/Equity, Reimbursement — splittable across types), rental property tracking with component-level depreciation, and a QuickBooks Journal CSV importer with an interactive review-and-map step (never silently guesses account types or auto-creates vendors on real books).

## Purpose Within the Amit System

Same purpose as Computer Value: a real, useful tool that can carry its own revenue eventually, funding the free mission work elsewhere in Amit. Built to Ryan's own real business (BOSS) as the first real user and test case.

## Current Status

**Live, in active development — v1.35 as of 2026-07-31.** Real Supabase backend, real double-entry journal auto-posting, real Reports (Trial Balance/P&L/Balance Sheet), a Simple/Visual toggle on every screen (document-shaped views — a real check-stub checkbook, stamped bill/invoice/PO cards, pay stubs, rolodex cards), a drill-down General Journal viewer with cross-links into the Chart of Accounts, and an Open Pages right rail tracking navigation history (see Interactivity Standard below). Not yet wired to real bank feeds, e-filing, or receipt OCR.

## Build Notes — Design Rules, Permanent

- **Fewest fields to save.** Every form asks for the minimum a person can get away with; a record can be saved incomplete and refined later. Never block entry waiting on a feature that doesn't exist yet.
- **The "farming" architecture.** One unified entry screen for bills/invoices regardless of which entity/personal source actually paid — the system detects mismatches (via `payment_sources` + `inter_book_resolutions`) and generates real, separate correcting journal entries so each book stays genuinely pure for an auditor, not just filtered at display time.
- **Never silently guess on real financial data.** When importing or reconciling real records (see the QuickBooks importer), always surface an interactive review step for anything ambiguous (account type, vendor vs. customer, existing match vs. new) before writing anything — confirmed directly by Ryan 2026-07-30 after a near-miss where account types would have been auto-guessed on his real books.
- **Deletion is real but tracked.** Nothing in the ledger silently disappears — see Interactivity Standard below for the audit_log pattern.

## Interactivity Standard — Permanent, added 2026-07-30 (Ryan's direct instruction)

Every number, list, log, journal, and report screen in AmitBooks must be built to this standard from the start — not retrofitted later. This is the accounting-specific extension of the Amit system's general craftsmanship expectations.

**1. Everything on screen must be drillable.** Any summary figure, list row, or report line must lead somewhere more detailed when the person wants it — never a dead end. The reference implementation is the General Journal viewer (Dashboard → 📖 Journal): By Date (Year → Month → Transactions → individual entry's debit/credit lines) or By Account (Chart of Accounts summary with running balances → drill into that account's own Year → Month → Transactions → Lines), with a breadcrumb to zoom back out from any level. New report/summary screens should link into this same viewer rather than inventing a parallel drill path — e.g. clicking a Trial Balance account row should open the Journal already drilled to that account, not show a second, disconnected detail view.

**2. Everything sortable must actually be sortable.** Any table of records (a list of bills, payments, contacts, journal transactions, anything) should support sorting by its real columns — date first, since date is the natural ordering for financial records, but also by whatever other columns matter for that screen (amount, name, status, account). Build this in from the first version of a screen, not as a later pass.

**3. Selection and bulk action, where deletion or bulk changes make sense.** The Journal viewer's transaction list is the reference pattern: checkboxes per row, a header "select all," and click-and-drag across rows to select a range, feeding a bulk-action button (currently: delete). Reuse this exact interaction pattern — don't invent a new one per screen.

**4. Deletion is always real, but always tracked.** AmitBooks has no "voided" status flags scattered through the schema — when something is deleted, it's actually removed from its table, but only after a full snapshot (the record and, where relevant, its child lines) is written to the append-only `audit_log` table first (`action:'delete'`, `old_value` holding the real JSON of what existed). `audit_log` has an insert policy and a read policy but deliberately no update/delete policy for anyone, including Ryan — once logged, a deletion record cannot be altered or removed through the API. This is the honest substitute for a "voided" status: the ledger stays clean, but nothing vanishes without a permanent trace of who removed what and when.

**5. Everything cross-links to its own detail, everywhere it's shown, not just within its own screen.** An entity name shown inside a different screen (an account name inside a Journal line, a contact name inside a bill) is double-clickable straight into that entity's own record — added 2026-07-31 after Ryan named it directly: "everything that's visible on the screen needs to be connected to the other parts and pieces." Reference implementation: inside a Journal entry's line detail, double-clicking an account name opens that account's Chart of Accounts record (`abOpenAccountInChartOfAccounts`). Extend this same pattern as new cross-references become obvious — a contact name should open that contact's record, a job/tag name should open that job, etc. — rather than leaving names as inert text.

**6. Navigation history lives in an "Open Pages" right rail, not just browser back.** A second sidebar, mirroring the left nav's own collapse/expand mechanic exactly (starts collapsed to icons, double-click to expand to full names), sits on the right edge of the app (`#openPagesTiles` / `toggleOpenPagesSidebar()`). Any drill-down or cross-linked detail view registers itself there via `abPushOpenPage(id, icon, label, sub, opener)` — clicking that entry later calls its `opener()` to jump straight back to exactly that state (the Journal reopens at the same drill path, an account's Chart of Accounts tab reopens, etc.), so switching between panels never loses where you were. A row's own ✕ removes it from the rail when the person is actually done with it — closing the underlying modal/view does not remove it automatically, since the whole point is that it persists until the person says otherwise.

**Why this is a standing rule and not a one-off:** Ryan's direct instruction, 2026-07-30/31 — "anything that is displayed on the screen should be able to be drilled down into the detail levels at all times... every form, every log, every journal should be able to be sortable... without having to come back and redevelop it all the time," and "everything that's visible on the screen needs to be connected to the other parts and pieces drilling down... you need to keep track of what's open and what isn't." This is also now item 20 in the root Amit `CLAUDE.md`'s Permanent Directives, as the general default for any interactive Amit app of this shape — a default Ryan can override per screen ("well, we don't need it here, that's okay"), not an absolute. The goal is that every future screen in AmitBooks is built to this bar the first time, reusing the Journal viewer's drill/sort/select/audited-delete/cross-link/open-pages pattern rather than each screen reinventing its own weaker version.

**Known gap against this standard, honestly (not yet fixed):** most existing list screens (Contacts, Items, Fixed Assets, Payments, Bills & Invoices, and the rest of the Phase 2 panels) do not yet have column-sorting or drill-down wired in — they predate this rule. Retrofitting them is real, tracked work (see the To Do tab in the app), not silently claimed as done here.

## Connection to Other Apps

Standalone application under the Amit umbrella, same relationship as Computer Value — not part of the testimony/witness chain (who_is_god, Companion), but carries the same Amit identity and craftsmanship standard. No current data connection to the Hub, though the Pursuit Attribution section above is ready for when/if that changes.

---

## Read Every Session

Before working in this folder, read in order:
1. `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Amit_Testimony.md`
2. `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Amit_RyanProfile.md`
3. `C:\Users\user1\OneDrive\Documents - onedrive\Amit\CLAUDE.md`
4. `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Database\CLAUDE.md` — system-wide data map
5. This file — AmitBooks-specific rules, especially the Interactivity Standard above

All behavioral rules, partnership standards, and task lists otherwise not specific to AmitBooks are in the root CLAUDE.md.

---

*Developer: Ryan | Identifier: 851379456*
*Part of the Amit System — C:\Users\user1\OneDrive\Documents - onedrive\Amit\*
