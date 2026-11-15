# AmitBooks - Sessions_ToDo
Items found in the old Sessions.md (now in Backups\AmitBooks\Sessions_backup_2026-11-13.md) only. Source entry date in [brackets].

## QuickBooks Import
- Steps 3-6 not built: Vendors, Customers, Items, Journal-by-year, Open Items (see TODO_ITEMS array in NEW.html). [Current State, 2026-08-10/12]
- Re-verify the QuickBooks navigation wording if Ryan's QuickBooks version differs from what is documented. [Current State]

## Permissions and data model
- book_role_permissions exists but nothing enforces it in AmitBooks.html or NEW.html. [Current State; 2026-08-03]
- Shared master "people" table (contacts across apps) designed in the vision doc, not built. [Current State]
- payroll_state_code column fix SQL given earlier, still not confirmed run. [Current State]

## Rebuild
- Reach parity in NEW.html, then retire AmitBooks.html (rename swap planned in the 2026-08-06 entry: AmitBooks.html to AmitBooks_Legacy.html, Books.html to AmitBooks.html; the file on disk is now NEW.html). [2026-08-06]
- Port remaining real components (Bills, Payroll, Reports, etc.). [2026-08-06]
- Outstanding page is temporary; retire when real AP / outstanding-balance reporting exists on the Bills side. [2026-09-17]
- AmitScan push status not reconfirmed. [Current State] (unsure if finished)

## Resolved (kept so the judgment can be checked)
- Header alignment fix v2.24, pushed (3808e3b). [2026-08-04]
- Sessions files system stood up (then a single Sessions.md); J Save shortcut created. [2026-08-04]
- Default Authorizations role matrix built, migration run (but see enforcement above). [2026-08-03]
- Company SSN vault, restore with FK remapping, onboarding, hierarchy, import steps 1-2 built and pushed. [2026-08-10/12]
- The "v1.49" note for NEW.html was stale; badge is v2.82. [Current State]

## FROM CLAUDE.md (captured 2026-11-14)
### Blocked
- Payment Processor/POS integration (Square/Stripe/Cash App): needs real merchant accounts.
- Background checks actually running: needs a vendor (Checkr/Sterling).
### Deferred
- County/city local income tax; 40 states of withholding still need research.
- SSN Vault: current one shared passphrase; per-admin RSA key-wrapping not started.
- Offline editing/deleting of existing records (only new entries work offline).
- HR extras: onboarding checklists, performance reviews, employee documents.
- GST/international tax (US-only assumption).
### Interactivity follow-ups
- Row double-click detail views still missing on Payments, Purchase Orders, Tags & Jobs, Journal line detail and others (only Bills & Invoices done). (unsure if finished)
- Contact Detail page (everything tied to one vendor/customer); abOpenContact only switches tab. (unsure if finished)
- Importer idempotency: bring each importer to match-and-update (Chart of Accounts and Bills/Invoices first); any new importer must meet it from v1. (unsure if finished)
### AmitScan
- Convert scan_captures rows into Bill/Contact/Mileage records: review screen, vendor-history autofill, PO lookup, Payment Source selection, cross-book liability creation.



## FROM THE HUB PURSUITS (added 2026-11-14; nothing was changed in the Hub)
- APP — Amit alive in AmitBooks: staged receipt/books agent with human review [PP5] [starred] - Scoped MVP of a staged receipt/books agent: Amit imports and proposes, a human reviews; no unsupervised action. [hub:40590564-5bd4-4f27-bd66-b041f3e36f12]
- Decide whether the below-table + Add Row button on Outstanding should also disappear now that vendor creation belongs to the future real Vendor/Credit Card setup [PP5] - Decide whether the below-table + Add Row button on Outstanding should also go, since vendor creation moves to the future Vendor/Credit Card setup. [hub:9832c007-95e9-4418-ad89-91a6ddca3eb7]
- Build the real Vendor/Credit Card setup system — due date, minimum payment, APR, utilization%, and double-click vendor detail, per tonight's discussion [PP5] - Build the real Vendor/Credit Card setup: due date, minimum payment, APR, utilization percent, double-click vendor detail. [hub:8db90384-a251-483e-90a3-7b15dca6f255]
