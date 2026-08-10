-- ══════════════════════════════════════════════
-- AmitBooks — account_profiles + contacts.linked_user_id
--
-- Ryan's direct instruction, 2026-08-10: some contacts (vendors,
-- customers) will eventually have their own real Amit login — able to
-- submit a bill directly, update their own mailing address, etc. Rather
-- than AmitBooks keeping a second, stale copy of that person's info, this
-- gives every real Amit user their own self-maintained profile row, and
-- lets a `contacts` row optionally point at it.
--
-- account_profiles — one row per signed-in Amit user (any user, not just
-- AmitBooks users), editable ONLY by that person (RLS: auth.uid() =
-- user_id). This is the live, canonical version of their own contact
-- info.
--
-- contacts.linked_user_id — nullable. Unset (the default): a contact
-- stays exactly as it works today, a plain locally-owned record. Set:
-- the app should read that person's live info from their own
-- account_profiles row instead of the contact's own stored fields, so an
-- update on their end (their own address, say) is reflected everywhere
-- anyone has them linked as a contact, without a manual re-sync.
--
-- Deliberately NOT built here (real, separate, later work): the actual
-- invite/link flow (matching a contact to a real account, an identity-
-- confirmation popup), and the app code that reads through the link
-- instead of the contact's own fields when linked_user_id is set. This
-- migration only lays the schema foundation those depend on.
--
-- Confirmed run 2026-08-10 (Supabase SQL editor, Ryan).
-- Idempotent — safe to re-run.
-- ══════════════════════════════════════════════

create table if not exists account_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  phone text,
  address text,
  city_state text,
  zip text,
  updated_at timestamptz not null default now()
);
alter table account_profiles enable row level security;
create policy "account_profiles_select_own" on account_profiles for select using (auth.uid() = user_id);
create policy "account_profiles_insert_own" on account_profiles for insert with check (auth.uid() = user_id);
create policy "account_profiles_update_own" on account_profiles for update using (auth.uid() = user_id);

alter table contacts add column if not exists linked_user_id uuid references auth.users(id);
