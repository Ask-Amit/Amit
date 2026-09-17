-- ══════════════════════════════════════════════
-- AmitBooks — Temporary Outstanding Balances, reworked per Ryan's direct
-- correction, 2026-09-17: the first version of this table (migration
-- _001, same day) was scoped to book_id — wrong. This table is scoped to
-- the logged-in user only, not connected to any book. Fields corrected
-- to: vendor name, account number (full, not last four), type, previous
-- balance, current balance, statement date.
--
-- Still explicitly temporary — see the table comment below. Drops and
-- recreates _001's table outright rather than altering it in place,
-- since no real data has been entered into it yet.
-- ══════════════════════════════════════════════
drop table if exists ab_temp_outstanding_balances;

create table ab_temp_outstanding_balances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  vendor_name text not null,
  account_number text,
  balance_type text,
  previous_balance numeric,
  current_balance numeric,
  statement_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table ab_temp_outstanding_balances enable row level security;

create policy "ab_temp_outstanding_balances_owner_manage" on ab_temp_outstanding_balances for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

comment on table ab_temp_outstanding_balances is 'Temporary shortcut table — Ryan requested 2026-09-17 as a quick monthly running-balance tracker, scoped to the logged-in user only (not book-scoped). Retire once real AP aging/outstanding-balance reporting is built in NEW.html.';
