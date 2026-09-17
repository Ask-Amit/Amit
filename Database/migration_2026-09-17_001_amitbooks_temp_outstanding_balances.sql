-- ══════════════════════════════════════════════
-- AmitBooks — Temporary Outstanding Balances shortcut table.
--
-- Ryan's direct instruction, 2026-09-17: a quick monthly running-balance
-- tracker for outstanding bills, linked to the book and the logged-in
-- account, to use RIGHT NOW while the full Bills & Invoices layer is
-- still being ported into NEW.html. Explicitly called out as a
-- temporary/shortcut table — not the permanent AP/Bills schema.
--
-- Fields, exactly as given: vendor name, last four (of the account
-- number, not a password), statement date, previous balance, current
-- balance. Scoped to book_id, same RLS pattern as every other
-- book-scoped AmitBooks table (_amitbooks_is_book_member).
-- ══════════════════════════════════════════════
create table if not exists ab_temp_outstanding_balances (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references books(id) on delete cascade,
  vendor_name text not null,
  last_four text,
  statement_date date,
  previous_balance numeric,
  current_balance numeric,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table ab_temp_outstanding_balances enable row level security;

create policy "ab_temp_outstanding_balances_member_manage" on ab_temp_outstanding_balances for all
  using (_amitbooks_is_book_member(book_id)) with check (_amitbooks_is_book_member(book_id));

comment on table ab_temp_outstanding_balances is 'Temporary shortcut table — Ryan requested 2026-09-17 as a quick monthly running-balance tracker while Bills & Invoices is still being ported into NEW.html. Retire once real AP aging/outstanding-balance reporting is built in NEW.html.';
