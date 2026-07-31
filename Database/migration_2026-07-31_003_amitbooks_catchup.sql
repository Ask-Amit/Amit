-- ══════════════════════════════════════════════
-- AmitBooks — catching up two migrations that were apparently never
-- actually run (found live 2026-07-31 while building Quotes: tags had
-- no contact_id/address column, and the estimates + item_category_templates
-- tables didn't exist at all). Combines the original 008, 009, 010
-- migrations into one idempotent script.
-- ══════════════════════════════════════════════

-- ── from 008: client → project → estimate linking ──
alter table tags add column if not exists contact_id uuid references contacts(id);

create table if not exists estimates (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references books(id) on delete cascade,
  tag_id uuid references tags(id),
  contact_id uuid references contacts(id),
  estimate_number text,
  amount numeric(14,2),
  status text not null default 'draft' check (status in ('draft','sent','accepted','declined')),
  converted_at timestamptz,
  created_at timestamptz not null default now()
);
alter table estimates enable row level security;
drop policy if exists "estimates_via_membership" on estimates;
create policy "estimates_via_membership" on estimates for all
  using (_amitbooks_is_book_member(book_id)) with check (_amitbooks_is_book_member(book_id));

-- ── from 010: job address ──
alter table tags add column if not exists address text;

-- ── from 009: item templates ──
create table if not exists item_category_templates (
  id uuid primary key default gen_random_uuid(),
  industry text not null,
  name text not null,
  item_type text not null default 'service' check (item_type in ('service','inventory_good','non_inventory_good')),
  default_expense_account_number text,
  default_income_account_number text,
  created_at timestamptz not null default now()
);
alter table item_category_templates enable row level security;
drop policy if exists "item_category_templates_read_all" on item_category_templates;
create policy "item_category_templates_read_all" on item_category_templates for select using (true);

delete from item_category_templates where industry='construction';
insert into item_category_templates (industry, name, item_type, default_expense_account_number, default_income_account_number) values
('construction','Labor - Rough Framing',      'service',            '5200','4000'),
('construction','Labor - Finish Carpentry',   'service',            '5200','4000'),
('construction','Materials - Lumber',         'inventory_good',     '5100','4000'),
('construction','Materials - Concrete',       'inventory_good',     '5100','4000'),
('construction','Subcontractor - Electrical', 'service',            '5300','4000'),
('construction','Subcontractor - Plumbing',   'service',            '5300','4000'),
('construction','Equipment Rental - General', 'service',            '5400',null),
('construction','Permit Fee',                 'non_inventory_good', '5500',null),
('construction','Change Order Labor',         'service',            '5200','4100');
