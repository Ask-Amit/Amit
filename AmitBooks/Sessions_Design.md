# AmitBooks - Design and tables

Read the section '## Tables' first when you only need the database tables. The other sections describe how the project is built; read them only when working on that part.

## Tables

Tables used by this project (copied from CLAUDE.md 2026-11-14)

**Tables this project uses:** books, book_members, chart_of_accounts, account_category_templates, contacts, items, item_category_templates, tags, estimates, segregated_funds, invoices_bills, invoice_bill_lines, payments, payment_sources, inter_book_resolutions, fixed_assets, properties, property_owners, journal_entries, journal_lines, purchase_orders, purchase_order_lines, inventory_transactions, warranties, service_agreements, qb_import_batches, investments, subscriptions, employees, payroll_runs, payroll_run_lines, mileage_logs, repair_logs, crm_activities, audit_log, workflow_rules, bank_statement_lines, loans, loan_payments, bill_of_materials, bom_lines, material_defects, payroll_tax_years, payroll_tax_brackets, tax_jurisdictions, tax_jurisdiction_brackets, background_checks, pto_requests, benefit_plans, benefit_enrollments, benefit_plan_tiers, profit_sharing_distributions, milestones, payment_plans, payment_plan_installments, recognition_schedules, sales_tax_jurisdictions. Plus the `amitbooks-receipts` Supabase Storage bucket (receipt images).

**Global, shared, read-only-in-app tables (maintained by Amit via the service-role key, not per-book data):** `payroll_tax_years`, `payroll_tax_brackets` (federal IRS withholding, sourced from Pub 15-T), `tax_jurisdictions`, `tax_jurisdiction_brackets` (state/county/city withholding — currently loaded: the 9 no-income-tax states + Idaho, real data, real coverage still growing). Every book reads the same rows; no book can edit them through the app.

**Tables this project does NOT touch:** amit_sessions, amit_daily, amit_encounters, user_profiles, amit_shortcuts, medical_prep_progress — those belong to the Hub/testimony/AmitCoder side of the system.

**hub_entries — exception, added 2026-08-12 (NEW.html only, not the old AmitBooks.html):** the first and so far only write AmitBooks makes into the Hub's own data. A Scope with both `quantity_on_hand` and `reorder_quantity` set writes/updates a real pursuit (`kind:'pursuit'`, `program:'AmitBooks'`) whenever it's saved at or below its reorder threshold, and closes that pursuit automatically once restocked — see `checkReorderPursuit()` in `AmitBooks/NEW.html`. Duplicate-checked by title before inserting, per the root CLAUDE.md's standing Duplicate Pursuit Check directive.

All migrations live in `Database\migration_2026-07-29_*.sql` and `Database\migration_2026-07-30_*.sql`.
---
