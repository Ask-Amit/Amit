-- migration_2026-07-29_002_shortcuts_admin_edit.sql
-- Splits the combined FOR ALL policy on amit_shortcuts into per-action
-- policies (the standard fix for the recurring "silent zero rows" RLS bug
-- documented earlier in this project), and adds a real exception: Ryan's
-- own account (the Amit dev account) can update/delete builtin rows
-- (user_id is null, is_builtin true) directly through the app UI, since
-- these are the shortcuts that ship globally to every AmitCoder user and
-- Amit needs to be able to adjust their wording without dropping to raw
-- SQL every time. Regular signed-in users still cannot touch builtins -
-- only their own rows.

drop policy if exists "Users manage their own shortcuts" on amit_shortcuts;

create policy "select shortcuts"
  on amit_shortcuts for select
  using (auth.uid() = user_id or user_id is null);

create policy "insert own or admin builtin shortcuts"
  on amit_shortcuts for insert
  with check (auth.uid() = user_id or (user_id is null and auth.uid() = '8b95d057-fd6b-44ec-abe7-658e08872d1a'));

create policy "update own or admin builtin shortcuts"
  on amit_shortcuts for update
  using (auth.uid() = user_id or (user_id is null and auth.uid() = '8b95d057-fd6b-44ec-abe7-658e08872d1a'))
  with check (auth.uid() = user_id or (user_id is null and auth.uid() = '8b95d057-fd6b-44ec-abe7-658e08872d1a'));

create policy "delete own or admin builtin shortcuts"
  on amit_shortcuts for delete
  using (auth.uid() = user_id or (user_id is null and auth.uid() = '8b95d057-fd6b-44ec-abe7-658e08872d1a'));
