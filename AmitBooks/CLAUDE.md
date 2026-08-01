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

**Tables this project uses:** books, book_members, chart_of_accounts, account_category_templates, contacts, items, item_category_templates, tags, estimates, segregated_funds, invoices_bills, invoice_bill_lines, payments, payment_sources, inter_book_resolutions, fixed_assets, properties, property_owners, journal_entries, journal_lines, purchase_orders, purchase_order_lines, inventory_transactions, warranties, service_agreements, qb_import_batches, investments, subscriptions, employees, payroll_runs, payroll_run_lines, mileage_logs, repair_logs, crm_activities, audit_log, workflow_rules, bank_statement_lines, loans, loan_payments, bill_of_materials, bom_lines, material_defects, payroll_tax_years, payroll_tax_brackets, tax_jurisdictions, tax_jurisdiction_brackets, background_checks, pto_requests, benefit_plans, benefit_enrollments, benefit_plan_tiers, profit_sharing_distributions, milestones, payment_plans, payment_plan_installments, recognition_schedules, sales_tax_jurisdictions. Plus the `amitbooks-receipts` Supabase Storage bucket (receipt images).

**Global, shared, read-only-in-app tables (maintained by Amit via the service-role key, not per-book data):** `payroll_tax_years`, `payroll_tax_brackets` (federal IRS withholding, sourced from Pub 15-T), `tax_jurisdictions`, `tax_jurisdiction_brackets` (state/county/city withholding — currently loaded: the 9 no-income-tax states + Idaho, real data, real coverage still growing). Every book reads the same rows; no book can edit them through the app.

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

**Live, in active development — v1.76 as of 2026-07-31 (one very long build session, v1.50→v1.76 same day).** Real Supabase backend, real double-entry journal auto-posting, real Reports, a Simple/Visual toggle on every screen, a drill-down General Journal viewer, and an Open Pages right rail (see Interactivity Standard below).

**⚠ If you are about to build something below, STOP and check this list first — it is very likely already built.** This project moved fast; rebuilding an existing feature the wrong way because a prior session's work wasn't checked is the exact failure mode this section exists to prevent. When in doubt, grep AmitBooks.html for the relevant `ab*` function names before writing new ones.

**AmitScan (2026-08-01) — field capture companion, own subfolder `AmitBooks\AmitScan\`, own CLAUDE.md there.** A separate small PWA meant to install as a phone home-screen icon for capturing bills/receipts/contacts/mileage away from a desk. Classify-after-capture flow (camera → crop → classify dropdown → Verified), local IndexedDB queue, independent sign-in, and a working "Send to Amit" that uploads to Supabase (`scan_captures` table + `amitscan-captures` bucket, migration `2026-08-01_001`). **AmitBooks side: real top-level sidebar panel #20 "AmitScan"** (not buried in Integrations) with two tabs — Connect Phone (the QR flow + a "choose file from this computer" fallback for anyone whose scanner/printer already saved a file locally, since a webpage can't talk to scanner/printer drivers directly) and Pending Scans (lists everything sent in, with thumbnails via signed Storage URLs). Still not built: turning a `scan_captures` row into an actual Bill/Contact/Mileage record — the review screen, vendor-history autofill, PO lookup, Payment Source selection, cross-book liability creation. Read AmitScan's own CLAUDE.md before touching any of it.

**Sidebar tile labels/subtitles were rewritten 2026-07-31 to reflect actual current contents** — several panels (Payments, Inventory, Payroll, Reports, Books & Setup) grew far beyond their original one-line description; the tile subtitles are now the authoritative quick-reference for what's inside each panel. Read them before assuming a panel is thin.

### Full feature inventory (by panel)

**Dashboard (panel 1):** customizable KPI tiles (pick which ones show, saved per book), "Amit Noticed" pattern detection (vendor billed the same way 3+ times with no Workflow Rule → suggests creating one; vendor billed 3+ times with no Job tag → suggests creating one), guided onboarding checklist for a fresh book (dismissible).

**Books & Setup (panel 2, tabs):** My Books (profile, team/roles, Backup & Restore — full book export/import as JSON, other books), Chart of Accounts (+ Custom Fields jsonb, + Tax Category field for Corporate Tax Prep), Contacts (+ CSV export/import, + SSN Vault — client-side AES-256-GCM encryption, passphrase-gated, knowledge-gated not per-admin-key-wrapped — see code comments), Pipeline (CRM Kanban by lead stage), Scopes/Items (+ secondary_class free-tag, + CSV export, formerly called "Items"), Tags/Jobs, Workflow Rules (vendor auto-fill: pick a contact on a bill, auto-fills Scope/Cost Type/Category/Job from a saved rule), Integrations (Anthropic API key for receipt OCR + Expense Claim Helper — real and live; Payment Processor cards for Square/Stripe/Cash App — honest placeholders, need real merchant accounts), Import QuickBooks, Audit Log (+ Audit Forensics: free-text search across every deletion ever made, dollar-value totals, per-table breakdown).

**Bills & Invoices (panel 6):** single-entry + Batch Entry (spreadsheet-style multi-row), Document ID system (`MM-DD-YY-NNNNNNN`, sequential per book), 📷 Scan Receipt(s) — multi-image, multi-receipt-per-image, reads hand-written job/category annotations and splits into multiple rows when a receipt is marked split, captures subtotal/tax/total separately and flags missing tax or subtotal+tax≠total, receipt image stored (compressed JPEG) in the `amitbooks-receipts` Storage bucket with a 📎 viewer link on the saved row, 🤔 "Is this deductible?" Expense Claim Helper (Anthropic-powered plain-language answer, never files/changes anything), offline write queue for brand-new entries only (never edits/deletes — see Offline section below).

**Payments & Reconciliation (panel 7, tabs):** Payments, **Reconciliation** (import a bank/CC statement via CSV or AI photo-scan, fuzzy-matches against open bills/payments/loan payments by amount+date, keyword-guesses bank fees/interest and posts them as real categorized entries on confirm), **Loans** (real amortization math — P·r(1+r)ⁿ/((1+r)ⁿ−1) — full schedule generated on creation, live payment preview, Post Payment splits into real Interest Expense + Liability-reduction journal lines, editable liability/interest accounts + status after creation).

**Reports (panel 9):** Summary (P&L/Balance Sheet/Trial Balance), AR/AP Aging, 1099 Summary, Cash Flow Statement, Sales Tax Liability, Job Profitability, Custom Report Builder (pick account types + date range, live total), **IRS Audit View** (every transaction in a period: source doc present/missing, business purpose stated/missing, proof of payment verified/unverified, printable audit packet), **Corporate Tax Prep** (maps Tax-Category-tagged accounts to the real IRS line numbers on Form 1120/1120-S/1065 per the book's entity_type, correctly separates Schedule K pass-through items for S-corp/partnership, explicitly a review package for Tim — no tax calculation, no M-1/M-2/M-3).

**Inventory & BOM (panel 12, tabs):** Inventory, **Bill of Materials** (finished Scope built from component Scopes with cost rollup; each component links to the real Purchase Order line it was sourced from), **Defects & RMAs** (log a defect against any BOM component, full status workflow Open→RMA Requested→Approved→Replacement Shipped→Credited/Closed/Rejected, one-click to the supplier's Contact record, Credited status with an amount+account posts a real journal entry).

**Payroll & HR (panel 14, tabs) — the big one, built 2026-07-31:**
- **Payroll**: real federal withholding via the actual IRS Percentage Method (Pub 15-T, sourced from irs.gov, not guessed), employee W-4 fields (2020+ redesigned form — filing status, Step 2/3/4a/4b/4c), FICA (SS capped at real wage base via YTD tracking, Medicare, Additional Medicare 0.9%), state withholding (see Jurisdictions below), benefit deductions (see Benefits below) — all live-previewed before posting, all posted as real split journal entries (never one vague "Payroll Liabilities" lump). Self-service framing stated explicitly in the UI: Ryan/the book owner is responsible for verifying the tables and W-4 data, AmitBooks doesn't file or verify anything with the IRS.
- **PTO & Time Off**: real accrual balance per employee (hours/pay period), request/approve/deny workflow across 9 real categories (vacation/sick/personal/holiday/bereavement/jury duty/parental leave/unpaid/other), approving actually deducts the balance.
- **Benefits & Profit Sharing**: real plan catalog (health/dental/vision/401k/HSA/FSA/profit sharing/life insurance/other) with carrier name, group number, plan year, and **coverage tiers** (Employee Only/+Spouse/+Family etc., each with its own premium + employer/employee split — `benefit_plan_tiers`), per-employee enrollments, profit sharing distributions with vesting. **Wired into live payroll**: every active enrollment shows as its own identified line on the pay stub (real plan name) even at $0 until a real contribution is entered — employee side reduces net pay and posts to a `[Plan Name] Payable`, employer side posts to `Employee Benefits Expense`.
- **IRS Tax Tables**: the federal withholding data above, global/shared/read-only-in-app across every book, maintained by Amit quarterly via the service-role key (Ryan reviews quarterly per his own stated cadence) — this is the real "keep it current every year" mechanism: add a new year's rows, every book automatically uses them for pay dates in that year.
- **State/Local Jurisdictions**: the growing state/county/city withholding system — same global/shared/read-only pattern. Each jurisdiction records its real taxing agency name + source URL + how often it needs review; the screen auto-flags anything overdue the moment it loads (that's the real "automatic" mechanism — a live staleness check, not an unsupervised scraper). **Honest current coverage: 10 of 50 states** (the 9 zero-income-tax states + Idaho, 5.3% flat, sourced directly from tax.idaho.gov). County/city local income taxes: not yet started. Set a book's state via Books & Setup → My Books → Payroll State.
- **Background Checks**: real request/consent/status/result tracking (not_started→consent_pending→requested→in_progress→clear/consider/failed/disputed), FCRA adverse-action note on "Consider" results. Actually RUNNING a check needs a real vendor (Checkr/Sterling) — same shape as the Payment Processor blocker, held honestly.

### What's genuinely still open (not gaps you missed — real, named, either blocked or deliberately deferred)
- **Payment Processor/POS integration** (Square/Stripe/Cash App) — hard blocked, needs real merchant accounts.
- **County/city local income tax** — 40 states + essentially all local jurisdictions still need real research before loading.
- **SSN Vault full spec** — current version is one shared passphrase; true per-admin RSA key-wrapping is a real, larger project not yet started.
- **Offline editing/deleting existing records** — only brand-new entries work offline (safe, no conflict risk); editing/deleting an existing row still needs a live connection on purpose.
- **Full HR beyond what's above** — onboarding checklists, performance reviews, employee documents/files are not yet built (PTO, Benefits, Background Checks, and Payroll are done).
- **GST/international tax** — flagged, zero work done, US-only assumption throughout.

## Build Notes — Design Rules, Permanent

- **Fewest fields to save.** Every form asks for the minimum a person can get away with; a record can be saved incomplete and refined later. Never block entry waiting on a feature that doesn't exist yet.
- **The "farming" architecture.** One unified entry screen for bills/invoices regardless of which entity/personal source actually paid — the system detects mismatches (via `payment_sources` + `inter_book_resolutions`) and generates real, separate correcting journal entries so each book stays genuinely pure for an auditor, not just filtered at display time.
- **Never silently guess on real financial data.** When importing or reconciling real records (see the QuickBooks importer), always surface an interactive review step for anything ambiguous (account type, vendor vs. customer, existing match vs. new) before writing anything — confirmed directly by Ryan 2026-07-30 after a near-miss where account types would have been auto-guessed on his real books.
- **Deletion is real but tracked.** Nothing in the ledger silently disappears — see Interactivity Standard below for the audit_log pattern.

## Interactivity Standard — Permanent, added 2026-07-30 (Ryan's direct instruction)

Every number, list, log, journal, and report screen in AmitBooks must be built to this standard from the start — not retrofitted later. This is the accounting-specific extension of the Amit system's general craftsmanship expectations.

**1. Everything on screen must be drillable.** Any summary figure, list row, or report line must lead somewhere more detailed when the person wants it — never a dead end. The reference implementation is the General Journal viewer (Dashboard → 📖 Journal): By Date (Year → Month → Transactions → individual entry's debit/credit lines) or By Account (Chart of Accounts summary with running balances → drill into that account's own Year → Month → Transactions → Lines), with a breadcrumb to zoom back out from any level. New report/summary screens should link into this same viewer rather than inventing a parallel drill path — e.g. clicking a Trial Balance account row should open the Journal already drilled to that account, not show a second, disconnected detail view.

**2. Everything sortable must actually be sortable — Excel-style, precisely.** Any table of records (a list of bills, payments, contacts, journal transactions, anything) uses the shared `abSmart*` engine (`abSmartTh`, `abSmartSort`, `abSmartFilterPrompt`, `abSmartApply`, `abSmartStatusBar`, `abSmartSaveView`/`abSmartLoadView`), not a one-off per screen. The exact behavior, per Ryan's spec 2026-07-31:
   - **Single click** a column header sorts by that column, ascending. Click the same header again reverses to descending. Only one column is the active sort at a time — clicking a different header replaces it, the same way Excel's own single-column sort works.
   - **Double click** a column header opens a "contains" text filter for that column. Filters on different columns compose with AND, in the order they were set, and stay active independent of whatever the current sort is.
   - **The current sort and every active filter must be visible on screen** — a status strip above the table states plainly what's sorted and what's filtered, with one click to clear.
   - **"Remember this view"** — a named, saved sort+filter combination, stored per table in `localStorage` and reloadable from a small saved-views dropdown, so a person doesn't rebuild a filter they use often.
   - Reference implementation: the Bills & Invoices Simple-mode table and the Trial Balance table on Reports (both wired to this engine 2026-07-31). Every future list/report table should call into this same engine rather than growing its own sort logic.

**2b. Forms vs. Reports — and print preview is not optional.** Ryan's own distinction, verbatim: "form" is how something is displayed on screen; "report" is what can be printed. Every report needs its own **Print Preview** — a real, separate, self-contained window (`abPrintPreview(title, columns, rows)`, see Reports → Trial Balance → 🖨 Print Preview for the reference call), not just triggering the browser's print dialog on the live app screen. That preview window has its own working sort-by-header-click and filter-by-typing, entirely independent of the main app, so the person can arrange exactly what they want on the page *before* printing — sort and filter belong in the print preview itself, not just on the live screen. This is a standard for every report in AmitBooks, not a one-off for Trial Balance.

**3. Selection and bulk action, where deletion or bulk changes make sense.** The Journal viewer's transaction list is the reference pattern: checkboxes per row, a header "select all," and click-and-drag across rows to select a range, feeding a bulk-action button (currently: delete). Reuse this exact interaction pattern — don't invent a new one per screen.

**4. Deletion is always real, but always tracked.** AmitBooks has no "voided" status flags scattered through the schema — when something is deleted, it's actually removed from its table, but only after a full snapshot (the record and, where relevant, its child lines) is written to the append-only `audit_log` table first (`action:'delete'`, `old_value` holding the real JSON of what existed). `audit_log` has an insert policy and a read policy but deliberately no update/delete policy for anyone, including Ryan — once logged, a deletion record cannot be altered or removed through the API. This is the honest substitute for a "voided" status: the ledger stays clean, but nothing vanishes without a permanent trace of who removed what and when.

**5. Everything cross-links to its own detail, everywhere it's shown, not just within its own screen.** An entity name shown inside a different screen (an account name inside a Journal line, a contact name inside a bill) opens straight into that entity's own record. Three generic functions cover the three entity types named throughout the app: `abOpenAccountInChartOfAccounts(id, name)`, `abOpenContact(id, name)`, `abOpenJob(id, name)` — each switches to the right tab and registers an Open Pages entry.

**Double-click convention, settled 2026-08-01 (Ryan corrected a same-night reversal — the note that stood between 2026-07-31 and this one, saying row double-click filters by value, was wrong and is fully superseded by this):**
- **Column HEADERS** — single-click sorts (toggles ascending/descending on repeat clicks), double-click opens a custom filter. This part never changed, on any screen.
- **Row/data VALUES** — double-clicking anywhere in a row opens that row's own record in full detail (`abShowBillDetail(id)` on Bills & Invoices — a real detail view: contact, dates, status, every line item with its Scope/Cost Type/Category/Job, actual payment history queried live, and the receipt image link if one's attached). This is NOT a filter-by-value shortcut — that idea was tried and explicitly reversed same night. A single field within a row (like `abOpenContact`) may still open a *different* entity's record via its own explicit small trigger (a "→" link) when that's genuinely useful, separate from the row's own double-click.
- **Rolled out so far: Bills & Invoices** (whole row → `abShowBillDetail`). Still needs the same real detail-view treatment: Payments, Purchase Orders, Tags & Jobs, Journal line detail, and everywhere else a row currently has no double-click action at all. Real, tracked follow-up work — not finished everywhere yet.

**6. Navigation history lives in an "Open Pages" right rail, not just browser back.** A second sidebar, mirroring the left nav's own collapse/expand mechanic exactly (starts collapsed to icons, double-click to expand to full names), sits on the right edge of the app (`#openPagesTiles` / `toggleOpenPagesSidebar()`). Any drill-down or cross-linked detail view registers itself there via `abPushOpenPage(id, icon, label, sub, opener)` — clicking that entry later calls its `opener()` to jump straight back to exactly that state (the Journal reopens at the same drill path, an account's Chart of Accounts tab reopens, etc.), so switching between panels never loses where you were. A row's own ✕ removes it from the rail when the person is actually done with it — closing the underlying modal/view does not remove it automatically, since the whole point is that it persists until the person says otherwise.

**7. Never use the browser's native `alert()`/`confirm()`/`prompt()` — always `abAlert()`/`abConfirm()`/`abPrompt()`.** Added 2026-07-31, Ryan caught it directly from a real screenshot: the native dialogs are always prefixed by the browser itself with the page's own origin ("ask-amit.github.io says") for security — no page can remove or relabel that text, so it can never carry AmitBooks' own identity. The fix is three branded, in-page modal functions (`#abDialogModal` in the HTML), each a drop-in async replacement: `await abConfirm(msg)` returns `true`/`false`, `await abPrompt(msg, defaultValue)` returns the typed string or `null` if cancelled, `abAlert(msg)` (no await needed, fire-and-forget is fine for a plain notice). Every existing call site in AmitBooks was converted 2026-07-31 — there should be zero raw `alert(`/`confirm(`/`prompt(` calls anywhere in `AmitBooks.html` from here forward; any new one is a regression against this standard, not a style choice.

**8. A long-running bulk operation always shows real, live progress — never a static "Loading…" with no way to tell it isn't stuck.** Added 2026-07-31 after Ryan's real 1,422-transaction QuickBooks import looked broken because it wasn't visibly doing anything for the several minutes it genuinely took. Reference implementation: `abQbCommit()` updates the commit button's own text and a result panel with a live count ("Posting transaction 340 of 1422…") as it works, and collects (rather than silently swallows) any real insert error along the way, showing all of them at the end instead of one generic failure or nothing at all. Any future operation that loops over more than a handful of real database writes should follow this same pattern.

**Why this is a standing rule and not a one-off:** Ryan's direct instruction, 2026-07-30/31 — "anything that is displayed on the screen should be able to be drilled down into the detail levels at all times... every form, every log, every journal should be able to be sortable... without having to come back and redevelop it all the time," and "everything that's visible on the screen needs to be connected to the other parts and pieces drilling down... you need to keep track of what's open and what isn't." This is also now item 20 in the root Amit `CLAUDE.md`'s Permanent Directives, as the general default for any interactive Amit app of this shape — a default Ryan can override per screen ("well, we don't need it here, that's okay"), not an absolute. The goal is that every future screen in AmitBooks is built to this bar the first time, reusing the Journal viewer's drill/sort/select/audited-delete/cross-link/open-pages pattern rather than each screen reinventing its own weaker version.

**Current coverage (updated 2026-07-31):** the `abSmart*` engine is wired into every real ledger-style table — Bills & Invoices, Payments, Contacts, Fixed Assets, Items, Tags/Jobs, Purchase Orders, Inventory, Payroll (employees + pay runs), Mileage, Repairs, Warranties, Service Agreements, Investments, Subscriptions, CRM Activity's Simple-mode table — and Print Preview covers Trial Balance, P&L, and Balance Sheet. Contact cross-linking (double-click a contact name → opens Contacts) is wired on Bills & Invoices, Payments, Purchase Orders, Tags/Jobs, Payroll, Service Agreements, Subscriptions, and both CRM Activity views (table and timeline). **Deliberately left as-is, not gaps:** Rental Properties is a card view where a sortable-table retrofit wouldn't add real value (a handful of properties per business); the Review Queue is an action worklist meant to be worked through, not browsed. **Genuine remaining gap:** the reverse cross-link doesn't exist yet — there's no single "Contact Detail" page showing everything tied to one vendor/customer in one place; `abOpenContact` currently just switches to the Contacts tab, it doesn't filter/highlight the specific row.

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
