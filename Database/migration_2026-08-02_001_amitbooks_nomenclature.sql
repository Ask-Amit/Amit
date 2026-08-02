-- ══════════════════════════════════════════════
-- AmitBooks — Customizable Field Nomenclature
--
-- Every classification field in AmitBooks (Job, Scope, Cost Code, etc.)
-- has a display label and, for picklist-style fields, a set of child
-- values, both of which vary by industry and are user-editable per book.
-- "Scope" reads as "Bucket" for one user and "Cost Code" is a formatted
-- number for a construction book but free text for someone tracking a
-- personal budget. Two layers:
--
--   Layer 1 (global, system-maintained): master_fields is the fixed
--   catalog of every field that could ever apply, across all industries.
--   industry_presets names a starter template (Construction, Restaurant,
--   Nonprofit, ...). preset_field_defaults says which fields a preset
--   turns on, what label it gives them, and (for picklist fields) what
--   default child values it seeds.
--
--   Layer 2 (per book, user-owned): book_field_settings is one row per
--   field per book — active on/off, and the display_label, seeded from
--   the book's chosen preset at setup and freely editable after.
--   book_field_values is the same idea for picklist children.
--
-- Every report, form, and header in AmitBooks should resolve its labels
-- through book_field_settings rather than hardcoding a string, so a
-- renamed field shows up correctly everywhere at once.
--
-- Idempotent — safe to re-run.
-- ══════════════════════════════════════════════

-- ── LAYER 1: GLOBAL TEMPLATES ──

create table if not exists master_fields (
  field_key text primary key,                -- 'job', 'scope', 'cost_code', 'item1'...
  is_picklist boolean not null default false, -- true = fixed list of child values (e.g. Classification); false = free text that grows over time
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

insert into master_fields (field_key, is_picklist, sort_order) values
  ('job', false, 10),
  ('project', false, 20),
  ('scope', false, 30),
  ('cost_code', false, 40),
  ('classification', true, 50),
  ('po', false, 60),
  ('department', false, 70),
  ('location', false, 80),
  ('phase', false, 90),
  ('billable', true, 100),
  ('vendor_category', false, 110),
  ('revenue_category', false, 120),
  ('entity', false, 130),
  ('funding_source', false, 140),
  ('fiscal_period', false, 150),
  ('asset_unit', false, 160),
  ('tax_classification', true, 170),
  ('tax_form_box', true, 180),
  ('item1', false, 900),
  ('item2', false, 910),
  ('item3', false, 920),
  ('item4', false, 930),
  ('item5', false, 940)
on conflict (field_key) do nothing;

create table if not exists industry_presets (
  id uuid primary key default gen_random_uuid(),
  preset_key text not null unique,           -- 'construction', 'restaurant', 'personal', 'nonprofit', 'agriculture', 'logistics', 'law_agency', 'custom'
  display_name text not null,
  created_at timestamptz not null default now()
);

insert into industry_presets (preset_key, display_name) values
  ('construction', 'Construction'),
  ('restaurant', 'Restaurant'),
  ('personal', 'Personal Budget'),
  ('nonprofit', 'Nonprofit'),
  ('agriculture', 'Agriculture'),
  ('logistics', 'Logistics / Trucking'),
  ('law_agency', 'Law Firm / Agency'),
  ('freelance', 'Freelancer / Consultant'),
  ('custom', 'Custom')
on conflict (preset_key) do nothing;

create table if not exists preset_field_defaults (
  id uuid primary key default gen_random_uuid(),
  preset_id uuid not null references industry_presets(id) on delete cascade,
  field_key text not null references master_fields(field_key) on delete cascade,
  active boolean not null default true,      -- does this preset turn the field on by default
  display_label text not null,
  unique (preset_id, field_key)
);

create table if not exists preset_field_value_defaults (
  id uuid primary key default gen_random_uuid(),
  preset_id uuid not null references industry_presets(id) on delete cascade,
  field_key text not null references master_fields(field_key) on delete cascade,
  value_key text not null,                   -- 'labor', 'material', 'subcontractor'...
  display_label text not null,
  sort_order int not null default 0,
  unique (preset_id, field_key, value_key)
);

-- Construction preset — the working default until other presets are fleshed out
insert into preset_field_defaults (preset_id, field_key, active, display_label)
select p.id, f.field_key, f.active, f.display_label
from industry_presets p
cross join (values
  ('job', true, 'Job'),
  ('project', true, 'Project'),
  ('scope', true, 'Scope'),
  ('cost_code', true, 'Cost Code'),
  ('classification', true, 'Classification'),
  ('po', true, 'PO'),
  ('department', false, 'Department'),
  ('location', false, 'Location'),
  ('phase', true, 'Phase'),
  ('billable', true, 'Billing Status'),
  ('vendor_category', false, 'Vendor Category'),
  ('revenue_category', false, 'Revenue Category'),
  ('entity', false, 'Entity'),
  ('funding_source', false, 'Funding Source'),
  ('fiscal_period', false, 'Fiscal Period'),
  ('asset_unit', true, 'Equipment'),
  ('tax_classification', true, 'Tax Classification'),
  ('tax_form_box', true, '1099 Box')
) as f(field_key, active, display_label)
where p.preset_key = 'construction'
on conflict (preset_id, field_key) do nothing;

insert into preset_field_value_defaults (preset_id, field_key, value_key, display_label, sort_order)
select p.id, 'classification', v.value_key, v.display_label, v.sort_order
from industry_presets p
cross join (values
  ('labor', 'Labor', 10),
  ('material', 'Material', 20),
  ('subcontractor', 'Subcontractor', 30),
  ('equipment', 'Equipment', 40),
  ('other', 'Other Costs', 50)
) as v(value_key, display_label, sort_order)
where p.preset_key = 'construction'
on conflict (preset_id, field_key, value_key) do nothing;

insert into preset_field_value_defaults (preset_id, field_key, value_key, display_label, sort_order)
select p.id, 'billable', v.value_key, v.display_label, v.sort_order
from industry_presets p
cross join (values
  ('billable', 'Billable', 10),
  ('non_billable', 'Non-Billable', 20),
  ('pass_through', 'Pass-Through', 30),
  ('internal', 'Internal Overhead', 40)
) as v(value_key, display_label, sort_order)
where p.preset_key in ('construction')
on conflict (preset_id, field_key, value_key) do nothing;

alter table master_fields enable row level security;
create policy "master_fields_read_all" on master_fields for select using (true);

alter table industry_presets enable row level security;
create policy "industry_presets_read_all" on industry_presets for select using (true);

alter table preset_field_defaults enable row level security;
create policy "preset_field_defaults_read_all" on preset_field_defaults for select using (true);

alter table preset_field_value_defaults enable row level security;
create policy "preset_field_value_defaults_read_all" on preset_field_value_defaults for select using (true);

-- ── LAYER 2: PER-BOOK INSTANCE (user's own data) ──

alter table books add column if not exists industry_preset_id uuid references industry_presets(id);

create table if not exists book_field_settings (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references books(id) on delete cascade,
  field_key text not null references master_fields(field_key) on delete cascade,
  active boolean not null default true,
  display_label text not null,
  created_at timestamptz not null default now(),
  unique (book_id, field_key)
);
alter table book_field_settings enable row level security;
create policy "book_field_settings_via_book_owner" on book_field_settings for all
  using (book_id in (select id from books where user_id = auth.uid()))
  with check (book_id in (select id from books where user_id = auth.uid()));

create table if not exists book_field_values (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references books(id) on delete cascade,
  field_key text not null references master_fields(field_key) on delete cascade,
  value_key text not null,
  active boolean not null default true,
  display_label text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (book_id, field_key, value_key)
);
alter table book_field_values enable row level security;
create policy "book_field_values_via_book_owner" on book_field_values for all
  using (book_id in (select id from books where user_id = auth.uid()))
  with check (book_id in (select id from books where user_id = auth.uid()));
