-- ══════════════════════════════════════════════
-- AmitBooks — full Contact detail, split two ways per Ryan's direct
-- instruction, 2026-08-14.
--
-- General reach/identity fields go straight on `contacts` — any contact
-- type (Vendor, Employee, Customer, Subcontractor) could plausibly need
-- a second phone number or a website, so these belong on the one shared
-- table everyone already lives in.
--
-- Everything specific to a BILLING relationship (shipping address,
-- how they pay, sales tax status, customer classification, a starting
-- balance) moves to its own side table instead — Ryan's own words:
-- "I'd hate to have ninety five or ninety six fields for every contact...
-- for customers and clients, I think that is important... because
-- that's what we're billing to." contact_billing_details is one row per
-- contact, created only when actually needed (a Vendor or Employee never
-- gets one), instead of ~10 more mostly-null columns sitting on every
-- single contact regardless of type.
--
-- Every field here is real and independently addressable — never a
-- freeform notes blob standing in for structured data — so each one can
-- be sorted, filtered, and picked individually for a future invoice/
-- document template chooser, per Ryan's direct instruction.
--
-- opening_balance deliberately NOT duplicated here — it already lives on
-- `contacts` directly (migration_2026-08-14_001), and a starting balance
-- is just as real for a Vendor (what we owed them before this system
-- existed) as a Customer, so it stays general rather than moving into
-- the customer-only table below.
--
-- Price Level intentionally excluded, per Ryan's direct instruction —
-- not needed for now, revisit later if it becomes relevant.
-- ══════════════════════════════════════════════
alter table contacts add column if not exists job_title text;
alter table contacts add column if not exists work_phone text;
alter table contacts add column if not exists mobile_phone text;
alter table contacts add column if not exists fax text;
alter table contacts add column if not exists secondary_email text;
alter table contacts add column if not exists website text;
alter table contacts add column if not exists notes text;

create table if not exists contact_billing_details (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references books(id) on delete cascade,
  contact_id uuid not null unique references contacts(id) on delete cascade,
  shipping_street_address text,
  shipping_city_state text,
  shipping_zip text,
  preferred_payment_method text,
  sales_tax_status text,
  tax_exempt_number text,
  customer_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table contact_billing_details enable row level security;
create policy "contact_billing_details_via_membership" on contact_billing_details for all
  using (_amitbooks_is_book_member(book_id)) with check (_amitbooks_is_book_member(book_id));
