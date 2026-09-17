-- ══════════════════════════════════════════════
-- AmitBooks — add credit_limit to the temporary Outstanding balances
-- table. Ryan's direct instruction, 2026-09-17: a Credit Limit column
-- (between Type and Date), plus a computed Available Credit column
-- (Credit Limit minus Current Balance, or 0 when the row's Type is
-- Checking/Savings) — Available Credit is derived at read time in
-- NEW.html, not stored, so no column for it here.
-- ══════════════════════════════════════════════
alter table ab_temp_outstanding_balances add column if not exists credit_limit numeric;
