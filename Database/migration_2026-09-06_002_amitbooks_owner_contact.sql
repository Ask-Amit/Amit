-- Owner-contact mechanism for AmitBooks' contacts table (2026-09-06,
-- Ryan's direct instruction). Not an AmitBooks rearchitecture — just two
-- linking columns plus a place for personal/voice data to live on the ONE
-- contact row that represents whoever is logged in as a book's owner.
-- Not yet run — Ryan runs schema changes by hand.

alter table contacts add column if not exists user_id uuid references auth.users(id);
alter table contacts add column if not exists is_owner boolean not null default false;

-- At most one owner-flagged contact per book — protects against two
-- logins ever both claiming ownership of the same book's owner record.
create unique index if not exists contacts_one_owner_per_book
  on contacts(book_id) where is_owner;

-- Amit Voice preference now lives directly on the owner's own contact row
-- (per Ryan's direct instruction, 2026-09-06) rather than the separate
-- amit_voice_prefs table built earlier the same day. That table is left
-- in place, unused, rather than dropped.
alter table contacts add column if not exists voice_name text;
alter table contacts add column if not exists voice_accent text;
alter table contacts add column if not exists voice_rate numeric not null default 1.0;
