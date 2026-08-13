-- ══════════════════════════════════════════════
-- AmitBooks — Contacts: extensible role labels + real contact-database
-- fields, replacing the fixed six-checkbox role model.
--
-- Ryan's direct instruction, 2026-08-12/13: the fixed is_customer/
-- is_vendor/is_employee/is_contractor_1099/is_donor/is_tenant booleans
-- can never cover every industry (a Subcontractor — a real, different
-- concept from 1099, which is a tax-filing status not a working
-- relationship — has no flag at all right now, and the next industry
-- will hit the same wall). Same fix already proven for Terminology in
-- this same session: a real, per-book extensible list instead of a fixed
-- set baked into the schema.
--
-- contact_labels — the book's own extensible list of role labels
-- (Customer, Vendor, Employee, 1099, Donor, Tenant, Subcontractor,
-- whatever a given book actually needs), managed from the Terminology
-- tab. A contact can carry up to four of them at once — Ryan's own
-- words, "call them Contact Label One, Label Two, Label Three... up to
-- four" — four nullable FK slots rather than a full many-to-many join
-- table, matching that exact spec rather than a more abstract tagging
-- system he didn't ask for.
--
-- The old six boolean columns are left in place, untouched — nothing
-- here drops or migrates them. They stay queryable for anything that
-- still reads them (Scopes' Preferred Vendor dropdown filters is_vendor,
-- for instance) until a deliberate follow-up migrates existing contacts'
-- booleans into real labels and those columns are retired on purpose.
--
-- Real contact-database fields — Ryan's direct instruction: "it needs to
-- be a contact database... address, phone numbers, like a normal contact
-- database would." contacts already has phone/email and a single
-- `address` text column; this splits address the same way clients
-- already does (street_address/city_state/zip, ZIP-autofill-ready) and
-- adds contact_name (who to reach, same field clients already has) — the
-- old `address` column stays in place, untouched, for anything still
-- reading it.
-- ══════════════════════════════════════════════
create table if not exists contact_labels (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references books(id) on delete cascade,
  label text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique(book_id,label)
);
alter table contact_labels enable row level security;
create policy "contact_labels_via_membership" on contact_labels for all
  using (_amitbooks_is_book_member(book_id)) with check (_amitbooks_is_book_member(book_id));

alter table contacts add column if not exists label1_id uuid references contact_labels(id) on delete set null;
alter table contacts add column if not exists label2_id uuid references contact_labels(id) on delete set null;
alter table contacts add column if not exists label3_id uuid references contact_labels(id) on delete set null;
alter table contacts add column if not exists label4_id uuid references contact_labels(id) on delete set null;

alter table contacts add column if not exists contact_name text;
alter table contacts add column if not exists street_address text;
alter table contacts add column if not exists city_state text;
alter table contacts add column if not exists zip text;

-- Seed the six existing role concepts plus Subcontractor into every book
-- that already has at least one contact, so the label picker isn't empty
-- on first use — a book with contacts already has real roles in use
-- today (via the boolean columns), this just gives them a starting label
-- list that matches what's already true, without silently converting the
-- booleans themselves.
insert into contact_labels (book_id, label, sort_order)
select distinct book_id, label, ord from (
  select book_id, 'Customer' as label, 1 as ord from contacts
  union all select book_id, 'Vendor', 2 from contacts
  union all select book_id, 'Employee', 3 from contacts
  union all select book_id, '1099', 4 from contacts
  union all select book_id, 'Subcontractor', 5 from contacts
  union all select book_id, 'Donor', 6 from contacts
  union all select book_id, 'Tenant', 7 from contacts
) seed
on conflict (book_id,label) do nothing;
