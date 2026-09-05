-- migration_2026-09-05_003_amit_hub_heartbeat.sql
-- Amit Mobile — Hub-open heartbeat gate
-- Ryan runs this by hand via the Supabase dashboard SQL editor.
-- See AmitMobile\CLAUDE.md's "Hub-open heartbeat gate" section for the
-- full design this table supports.

create table if not exists amit_hub_heartbeat (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_beat timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table amit_hub_heartbeat enable row level security;

-- Users manage only their own heartbeat row.
create policy "amit_hub_heartbeat_select_own"
  on amit_hub_heartbeat for select
  using (auth.uid() = user_id);

create policy "amit_hub_heartbeat_upsert_own"
  on amit_hub_heartbeat for insert
  with check (auth.uid() = user_id);

create policy "amit_hub_heartbeat_update_own"
  on amit_hub_heartbeat for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- No delete policy — rows just go stale (checked by last_beat age), never
-- need to be removed. Fine to leave delete ungranted for now.
