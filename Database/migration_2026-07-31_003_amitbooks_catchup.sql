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

-- ── from 009: item templates — REVISED per Ryan's direct correction
-- 2026-07-31: an item's real-world name (Lumber, Plumbing, Concrete)
-- should never be prefixed with its cost category ("Materials - Lumber",
-- "Subcontractor - Plumbing"). That's a second, separate dimension —
-- Cost Type — and belongs in its own field/toggle, not baked into the
-- name. So an item is just "Lumber," and Cost Type = Material is set
-- alongside it, the same way item_type (Labor/Tracked Material/One-off)
-- already is. ──
create table if not exists item_category_templates (
  id uuid primary key default gen_random_uuid(),
  industry text not null,
  name text not null,
  item_type text not null default 'service' check (item_type in ('service','inventory_good','non_inventory_good')),
  cost_type text check (cost_type in ('labor','material','subcontractor','equipment','permit_fee','other')),
  default_expense_account_number text,
  default_income_account_number text,
  created_at timestamptz not null default now()
);
alter table item_category_templates enable row level security;
drop policy if exists "item_category_templates_read_all" on item_category_templates;
create policy "item_category_templates_read_all" on item_category_templates for select using (true);

-- Same field, same toggle, on the real per-book items table — this is
-- only the DEFAULT/suggested Cost Type for that item, pre-filling the
-- entry form. It is not fixed forever: the same item (e.g. "HVAC") can
-- be Subcontractor cost on one bill and Labor on another — Ryan's own
-- example, 2026-07-31 — so the real, overridable value lives on the
-- actual bill/invoice line, not just the item catalog entry.
alter table items add column if not exists cost_type text check (cost_type in ('labor','material','subcontractor','equipment','permit_fee','other'));
alter table invoice_bill_lines add column if not exists cost_type text check (cost_type in ('labor','material','subcontractor','equipment','permit_fee','other'));

-- One row per real-world category group (Framing, Concrete, Electrical...)
-- — never split by cost type. The same "Framing" item covers your own
-- crew's labor, framing lumber bought directly, or a framing sub, all
-- billed under that one item — Cost Type is picked per line at entry
-- time, not baked into which item you chose. Only the categories that
-- are unambiguous in real life (Equipment Rental is always Equipment,
-- a Permit Fee is always a Permit/Fee) get a default; everything a real
-- job actually mixes labor/material/sub on is left null on purpose.
delete from item_category_templates where industry='construction';
insert into item_category_templates (industry, name, item_type, cost_type, default_expense_account_number, default_income_account_number) values
('construction','Framing',          'service',            null,            '5200','4000'),
('construction','Concrete',         'service',            null,            '5100','4000'),
('construction','Electrical',       'service',            null,            '5300','4000'),
('construction','Plumbing',         'service',            null,            '5300','4000'),
('construction','HVAC',             'service',            null,            '5300','4000'),
('construction','Roofing',          'service',            null,            '5300','4000'),
('construction','Drywall',          'service',            null,            '5200','4000'),
('construction','Painting',         'service',            null,            '5200','4000'),
('construction','Equipment Rental', 'service',            'equipment',     '5400',null),
('construction','Permit Fee',       'non_inventory_good', 'permit_fee',    '5500',null),
('construction','Change Order',     'service',            null,            '5200','4100');
