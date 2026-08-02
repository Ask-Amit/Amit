-- ══════════════════════════════════════════════
-- AmitBooks — fix "infinite recursion detected in policy for relation
-- book_members"
--
-- Root cause: migration_2026-07-31_017's "book_members_team_read" policy
-- reads FROM book_members inside a policy that protects book_members —
-- Postgres has to re-run that same policy to evaluate the subquery,
-- forever. Adding a team member (or anything else touching book_members)
-- broke immediately.
--
-- Fix: _amitbooks_is_book_member() becomes SECURITY DEFINER, so its
-- internal query bypasses RLS entirely instead of triggering the same
-- policy again. The team-read policy is rewritten to call this function
-- instead of querying book_members directly. This is the standard,
-- correct pattern for a self-referential membership check - already used
-- safely by every OTHER table's policy in this schema, which never hit
-- this bug because they're checking membership on a DIFFERENT table than
-- the one being protected.
--
-- Idempotent - safe to re-run.
-- ══════════════════════════════════════════════

create or replace function _amitbooks_is_book_member(target_book_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from book_members
    where book_id = target_book_id and user_id = auth.uid()
  );
$$;

drop policy if exists "book_members_team_read" on book_members;
create policy "book_members_team_read" on book_members for select
  using (_amitbooks_is_book_member(book_id));
