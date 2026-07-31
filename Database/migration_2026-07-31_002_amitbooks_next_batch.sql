-- ══════════════════════════════════════════════
-- AmitBooks — everything needed to keep building through the next
-- several Roadmap items without another round-trip: Sales Tax
-- Jurisdictions (claimed "already core" on the roadmap but never
-- actually created — real gap, fixed here), Milestones/progress
-- payments (#40, ties to #16), Revenue Recognition (#38), Payment
-- Plans/installments (#14), CRM pipeline fields (#32), and the two
-- small columns Cash Flow Statement and Sales Tax Liability need to
-- exist as real reports. All idempotent — safe to re-run.
-- ══════════════════════════════════════════════

-- ── SALES TAX JURISDICTIONS — was referenced as already-built (roadmap
-- item 2/10) but the table never actually existed. City/state rate,
-- per book. ──
create table if not exists sales_tax_jurisdictions (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references books(id) on delete cascade,
  name text not null,                          -- e.g. "Kootenai County, ID"
  rate numeric(6,4) not null default 0,        -- e.g. 0.0600 = 6%
  nexus_triggered boolean not null default false,
  nexus_triggered_date date,
  created_at timestamptz not null default now()
);
alter table sales_tax_jurisdictions enable row level security;
drop policy if exists "sales_tax_jurisdictions_via_membership" on sales_tax_jurisdictions;
create policy "sales_tax_jurisdictions_via_membership" on sales_tax_jurisdictions for all
  using (_amitbooks_is_book_member(book_id)) with check (_amitbooks_is_book_member(book_id));

alter table invoices_bills add column if not exists tax_jurisdiction_id uuid references sales_tax_jurisdictions(id);

-- ── MILESTONES / PROGRESS PAYMENTS — a job's contract value billed in
-- defined chunks rather than one lump sum. Ties to tags (the job). ──
create table if not exists milestones (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references books(id) on delete cascade,
  tag_id uuid references tags(id),
  name text not null,
  amount numeric(14,2) not null default 0,
  status text not null default 'pending' check (status in ('pending','billed','paid')),
  invoice_bill_id uuid references invoices_bills(id),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
alter table milestones enable row level security;
drop policy if exists "milestones_via_membership" on milestones;
create policy "milestones_via_membership" on milestones for all
  using (_amitbooks_is_book_member(book_id)) with check (_amitbooks_is_book_member(book_id));

-- ── REVENUE RECOGNITION — when revenue is recognized on the books vs.
-- when cash/invoice actually happens. schedule = the plan; entries =
-- each period's actual recognized slice, optionally tied to the real
-- journal entry that posted it. ──
create table if not exists recognition_schedules (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references books(id) on delete cascade,
  invoice_bill_id uuid references invoices_bills(id),
  total_amount numeric(14,2) not null,
  recognized_amount numeric(14,2) not null default 0,
  start_date date,
  end_date date,
  method text default 'straight_line' check (method in ('straight_line','milestone','manual')),
  created_at timestamptz not null default now()
);
alter table recognition_schedules enable row level security;
drop policy if exists "recognition_schedules_via_membership" on recognition_schedules;
create policy "recognition_schedules_via_membership" on recognition_schedules for all
  using (_amitbooks_is_book_member(book_id)) with check (_amitbooks_is_book_member(book_id));

create table if not exists recognition_entries (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references recognition_schedules(id) on delete cascade,
  period_date date not null,
  amount numeric(14,2) not null,
  journal_entry_id uuid references journal_entries(id),
  created_at timestamptz not null default now()
);
alter table recognition_entries enable row level security;
drop policy if exists "recognition_entries_via_membership" on recognition_entries;
create policy "recognition_entries_via_membership" on recognition_entries for all
  using (schedule_id in (select id from recognition_schedules where _amitbooks_is_book_member(book_id)))
  with check (schedule_id in (select id from recognition_schedules where _amitbooks_is_book_member(book_id)));

-- ── PAYMENT PLANS — customer financing on receivables (item 14). plan =
-- the agreement; installments = each scheduled payment. ──
create table if not exists payment_plans (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references books(id) on delete cascade,
  invoice_bill_id uuid references invoices_bills(id),
  contact_id uuid references contacts(id),
  total_amount numeric(14,2) not null,
  installment_count integer not null default 1,
  installment_amount numeric(14,2),
  frequency text default 'monthly' check (frequency in ('weekly','biweekly','monthly')),
  start_date date,
  status text default 'active' check (status in ('active','completed','defaulted','cancelled')),
  created_at timestamptz not null default now()
);
alter table payment_plans enable row level security;
drop policy if exists "payment_plans_via_membership" on payment_plans;
create policy "payment_plans_via_membership" on payment_plans for all
  using (_amitbooks_is_book_member(book_id)) with check (_amitbooks_is_book_member(book_id));

create table if not exists payment_plan_installments (
  id uuid primary key default gen_random_uuid(),
  payment_plan_id uuid not null references payment_plans(id) on delete cascade,
  due_date date not null,
  amount numeric(14,2) not null,
  paid_amount numeric(14,2) not null default 0,
  status text default 'upcoming' check (status in ('upcoming','paid','late','missed')),
  payment_id uuid references payments(id)
);
alter table payment_plan_installments enable row level security;
drop policy if exists "payment_plan_installments_via_membership" on payment_plan_installments;
create policy "payment_plan_installments_via_membership" on payment_plan_installments for all
  using (payment_plan_id in (select id from payment_plans where _amitbooks_is_book_member(book_id)))
  with check (payment_plan_id in (select id from payment_plans where _amitbooks_is_book_member(book_id)));

-- ── CRM PIPELINE — lead/stage tracking on top of the existing contacts
-- table (item 32), rather than a parallel "leads" table. ──
alter table contacts add column if not exists lead_stage text check (lead_stage in ('lead','contacted','quoted','won','lost'));
alter table contacts add column if not exists lead_value numeric(14,2);
alter table contacts add column if not exists lead_source text;

-- ── CASH FLOW STATEMENT — needs each account classified as operating,
-- investing, or financing to group journal activity correctly. ──
alter table chart_of_accounts add column if not exists cash_flow_category text check (cash_flow_category in ('operating','investing','financing'));

-- ── QUOTES → INVOICE — tracks whether an accepted quote has already
-- been converted, so it can't be converted twice by accident. ──
alter table estimates add column if not exists converted_at timestamptz;
