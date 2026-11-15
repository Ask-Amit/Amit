# AmitBooks - Sessions_Start

## HOW TO READ
Read this file first; it is all a new session needs. Read Sessions_ToDo.md only when asked about to-dos. Read the Daily Sessions folder (one text file per session) or the original Claude session only when asked. the backup files in Backups\AmitBooks\Sessions_backup_2026-11-13.md are for research only.

## DIRECTORY
- Sessions_Start.md - this file.
- Sessions_ToDo.md - open items found in the old Sessions.md (now in Backups\AmitBooks\Sessions_backup_2026-11-13.md), with source dates.
- Daily Sessions\ - one text file per session (the history; never pushed; the old Sessions_Log.md was split into it on 2026-11-15).
- Backups\AmitBooks\Sessions_backup_2026-11-13.md - byte-for-byte copy of the old Sessions.md.
- Sessions_Design.md: this project's database tables (first section) and design reference (how it is built); read only when working with the database or on that part of the build.

## CURRENT STATE
AmitBooks is Amit's accounting / bookkeeping application. The old app AmitBooks.html (v2.24, live) stays untouched while its replacement NEW.html (the rebuild, started 2026-08-06 from Templates\template.html) reaches parity; then it is retired.
- NEW.html is v2.82 (pushed) as of the last Current State entry; it is a real working app: Login, Company, Books, Chart of Accounts with sub-accounts; company/book create, modify, delete (backup first, real cascade) and restore from backup; first-run onboarding; QuickBooks Import wizard steps 1 and 2 (company/book, Chart of Accounts CSV/.xlsx).
- Outstanding page (page 7, added 2026-09-17): temporary monthly outstanding-balance grid over table ab_temp_outstanding_balances, flagged for retirement once real bills reporting exists.
- AmitScan\AmitScan.html v1.11 (push status not reconfirmed).
- Backend: Supabase; the migrations named in the log were confirmed run by Ryan. Company SSN/EIN vault built.
- Blocked / not built: Import steps 3-6, enforcement of book_role_permissions, the shared people table, and an unconfirmed payroll_state_code fix.
- Standing rule: push automatically after every real build (Ryan cannot test what is local).
- Newest decision in the log (2026-08-10/12): wizard writes deferred until commit; QuickBooks walkthrough wording follows Ryan's real screens.

## FILES IN PLAY (under AmitBooks\ unless stated)
| File | What it is | Version |
|---|---|---|
| AmitBooks.html | live legacy app | v2.24 |
| NEW.html | the rebuild | v2.82 |
| AmitScan\AmitScan.html | scanning / capture | v1.11 |
| Amit_Unified_Identity_Architecture.md (Amit root) | "One Thread, Many Doors" vision | none |
| Database\migration_2026-09-17_001_amitbooks_temp_outstanding_balances.sql | outstanding-balances table | none |
| Database\migration_2026-08-03_002_amitbooks_role_permissions.sql | role permission matrix (run) | none |
| CLAUDE.md | project rules | not read for this record |

## OPEN TO-DOS
9 open items in Sessions_ToDo.md (import steps, role enforcement, people table, an unconfirmed SQL fix, wording re-verification, rebuild parity and retirement, AmitScan push status).

last clean-up: built 2026-11-13 from the old Sessions.md (now in Backups\AmitBooks\Sessions_backup_2026-11-13.md), newest log entry dated 2026-08-10/12 (Current State block carries 2026-09-17 material).

## ORIGINAL SESSIONS
Originals were not recorded before 2026-11-13. From the next clean-up on, each entry names its session (name, ID and path under C:\Users\user1\.claude\projects\c--Users-user1-OneDrive-Documents---onedrive-Amit\). Those files expire on Claude's own schedule, which is acceptable because the log is the permanent record.

## FROM CLAUDE.md (captured 2026-11-14)
SCOPE NOW: far wider than "bookkeeping": real double-entry accounting plus multi-book, inter-book resolution, rental properties, QuickBooks import, receipt OCR and Expense Claim Helper, bank/CC reconciliation, loans, reports (IRS Audit View, Corporate Tax Prep), inventory and BOM with defects/RMAs, full payroll and HR (federal and some state withholding, PTO, benefits, background-check tracking), CRM pipeline, and AmitScan (phone capture companion, own subfolder AmitBooks\AmitScan\).
- Version in CLAUDE.md: v1.76 as of 2026-07-31 (looks out of date: written months ago and the live file is NEW.html; check Sessions_Start above for the current version).
- AmitScan: panel #20 in AmitBooks with Connect Phone and Pending Scans tabs; "Send to Amit" uploads to scan_captures table and amitscan-captures bucket (migration 2026-08-01_001). Turning a scan_captures row into a real Bill/Contact/Mileage record is not built.
- hub_entries exception (2026-08-12, NEW.html): a Scope at or below reorder threshold writes/closes a pursuit stamped program='AmitBooks' via checkReorderPursuit().
- Global shared read-only tables: payroll_tax_years, payroll_tax_brackets, tax_jurisdictions, tax_jurisdiction_brackets. State coverage: 10 of 50 states (9 zero-income-tax states plus Idaho).
- Interactivity Standard coverage (2026-07-31): abSmart* engine wired into all ledger-style tables; Print Preview covers Trial Balance, P&L, Balance Sheet; Bills & Invoices has row double-click detail. Rental Properties and Review Queue deliberately left as-is.
- Importer idempotency audit (2026-08-14): Chart of Accounts and Bills/Invoices had no protection; Vendors, Clients/Jobs, Items had skip-only. Current state unknown (unsure if finished).
- About 25 tables are listed in CLAUDE.md as used by this project; the full list stays there.

