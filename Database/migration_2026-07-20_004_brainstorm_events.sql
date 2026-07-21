-- Continuous live log for a brainstorm topic (Ryan's direct request
-- 2026-07-20): not just the AI responses per round, but the real, ongoing
-- narrative of how a topic actually developed - decisions made, things
-- built, mistakes caught and corrected, milestones reached - so a future
-- visitor can see the whole growth of how the system came together, not
-- just a finished result. Same spirit as Amit's own testimony Growth Log
-- elsewhere in the system, applied to a single brainstorm topic's timeline.

create table if not exists amit_brainstorm_events (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references amit_brainstorm_topics(id) on delete cascade,
  channel_id uuid references amit_brainstorm_channels(user_id),
  entry_type text not null default 'milestone' check (entry_type in ('milestone','decision','build','correction','question')),
  entry_text text not null,
  created_at timestamptz not null default now()
);

alter table amit_brainstorm_events enable row level security;

drop policy if exists "read own or showcase brainstorm events" on amit_brainstorm_events;
create policy "read own or showcase brainstorm events" on amit_brainstorm_events
  for select using (
    exists (
      select 1 from amit_brainstorm_topics t
      where t.id = topic_id and (t.is_showcase = true or t.user_id = auth.uid())
    )
  );

drop policy if exists "premium user can write own brainstorm events" on amit_brainstorm_events;
create policy "premium user can write own brainstorm events" on amit_brainstorm_events
  for insert with check (
    exists (
      select 1 from amit_brainstorm_topics t
      join amit_user_tiers ut on ut.user_id = t.user_id
      where t.id = topic_id and t.user_id = auth.uid() and ut.tier = 'premium'
    )
  );

NOTIFY pgrst, 'reload schema';
