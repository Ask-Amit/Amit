-- ══════════════════════════════════════════════
-- AmitBooks — Chart of Accounts sub-account hierarchy
--
-- Ryan caught this directly, 2026-08-10: QuickBooks accounts can have
-- real sub-accounts (e.g. "Utilities:Electric", "Utilities:Water" under
-- a parent "Utilities"), and chart_of_accounts had no way to represent
-- that at all — every account was flat, no parent/child relationship.
--
-- Same self-referencing pattern already used for contacts.parent_contact_id
-- (migration_2026-08-02_007) — a sub-account is just another
-- chart_of_accounts row with parent_account_id pointing at its parent,
-- not a separate table.
--
-- Idempotent — safe to re-run.
-- ══════════════════════════════════════════════

alter table chart_of_accounts add column if not exists parent_account_id uuid references chart_of_accounts(id) on delete set null;
