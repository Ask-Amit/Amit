-- ══════════════════════════════════════════════
-- AmitBooks — Contacts: unlimited labels + a real Billing Address
-- separate from the existing (Mailing) address.
--
-- Ryan's direct instruction, 2026-08-13: the four-label-slot cap
-- ("label1_id".."label4_id", migration_2026-08-13_001) should grow
-- without a ceiling — "if you can make it unlimited... great." This
-- replaces the four fixed FK columns with a real many-to-many join
-- table, contact_label_links, so a contact can carry any number of
-- labels. The four old columns are left in place, untouched, exactly
-- like the six old boolean role columns before them — nothing here
-- drops anything; the app code simply stops reading label1_id..4 and
-- reads/writes contact_label_links instead.
--
-- Also per this session: "billing and mailing... two different
-- elements." The existing street_address/city_state/zip on contacts
-- (migration_2026-08-13_001) becomes the Mailing Address; this adds a
-- parallel Billing Address (billing_street_address/billing_city_state/
-- billing_zip), independently settable, with the app offering a "same
-- as mailing" convenience checkbox rather than a database constraint.
-- ══════════════════════════════════════════════
create table if not exists contact_label_links (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references books(id) on delete cascade,
  contact_id uuid not null references contacts(id) on delete cascade,
  label_id uuid not null references contact_labels(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(contact_id,label_id)
);
alter table contact_label_links enable row level security;
create policy "contact_label_links_via_membership" on contact_label_links for all
  using (_amitbooks_is_book_member(book_id)) with check (_amitbooks_is_book_member(book_id));

-- Backfill: carry every existing label1_id..label4_id assignment over
-- into the new join table, so nobody's current labels disappear the
-- moment the app switches to reading contact_label_links.
insert into contact_label_links (book_id, contact_id, label_id)
select book_id, id, label1_id from contacts where label1_id is not null
union
select book_id, id, label2_id from contacts where label2_id is not null
union
select book_id, id, label3_id from contacts where label3_id is not null
union
select book_id, id, label4_id from contacts where label4_id is not null
on conflict (contact_id,label_id) do nothing;

alter table contacts add column if not exists billing_street_address text;
alter table contacts add column if not exists billing_city_state text;
alter table contacts add column if not exists billing_zip text;
