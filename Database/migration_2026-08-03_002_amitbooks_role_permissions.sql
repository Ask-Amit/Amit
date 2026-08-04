-- ══════════════════════════════════════════════
-- AmitBooks — real role-based permission matrix
--
-- Confirmed gap: every existing RLS policy checks only "is this person a
-- book_members row at all" (_amitbooks_is_book_member) - the role column
-- has never been read by anything. Staff, Bookkeeper, Manager, Accountant
-- (read-only), and Owner all currently have identical full access. This
-- table is the starting data model for real per-role restriction, one
-- category at a time, as pages get walked through and gated (Ryan's own
-- framing - this is a starting point, not the finished enforcement).
--
-- Categories are deliberately a small starting set, not exhaustive -
-- Ryan's own words: "we'll have to adjust this... but at least we have a
-- starting point." Add more permission_key rows later as new areas of
-- the app get real gates.
--
-- Levels: 'none' (no access), 'view' (read only), 'full' (view + edit).
--
-- Only owner/manager can set or even VIEW this table - enforced by RLS,
-- not just hidden in the UI, since Ryan asked for that explicitly.
--
-- Idempotent - safe to re-run.
-- ══════════════════════════════════════════════

create table if not exists book_role_permissions (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references books(id) on delete cascade,
  role text not null check (role in ('owner','manager','bookkeeper','staff','accountant_readonly')),
  permission_key text not null,      -- 'banking','payroll','bills','contacts','reports','setup'
  level text not null check (level in ('none','view','full')),
  updated_at timestamptz not null default now(),
  unique(book_id, role, permission_key)
);
alter table book_role_permissions enable row level security;

-- Read: only owner/manager on this book - not every member, per Ryan's
-- explicit instruction that only owner/admin should even VIEW this.
create or replace function _amitbooks_is_book_admin(target_book_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from book_members
    where book_id = target_book_id and user_id = auth.uid() and role in ('owner','manager')
  );
$$;

drop policy if exists "book_role_permissions_admin_only" on book_role_permissions;
create policy "book_role_permissions_admin_only" on book_role_permissions for all
  using (_amitbooks_is_book_admin(book_id))
  with check (_amitbooks_is_book_admin(book_id));
