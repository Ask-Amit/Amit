-- Extends the brainstorm mechanism (migration_2026-07-20_001) for the
-- premium Hub feature: each user's own login gates access to their own
-- brainstorming environment, and each topic can hold the final synthesized
-- HTML deliverable produced at the end of a brainstorming event.
--
-- Also adds a showcase mechanism (Ryan's direct request 2026-07-20): the
-- very first real brainstorming event - designing this Brainstorm Room
-- feature itself - should be visible to anyone in demo mode as a real,
-- honest example of how the product evolved, not hidden away as if it
-- were just Ryan's own private data. A topic marked is_showcase = true is
-- readable by anyone (any tier, no ownership required); everything else
-- stays strictly private to its owner.
--
-- No general user-tier concept exists anywhere in the schema yet - this is
-- the first one. Kept minimal on purpose: a single tier column, defaulting
-- every existing and new user to 'free'. Ryan (or a future billing
-- integration) sets a row to 'premium' to unlock the feature.

create table if not exists amit_user_tiers (
  user_id uuid primary key references auth.users(id),
  tier text not null default 'free' check (tier in ('free', 'premium')),
  updated_at timestamptz not null default now()
);

alter table amit_user_tiers enable row level security;

create policy "user can read own tier" on amit_user_tiers
  for select using (auth.uid() = user_id);

alter table amit_brainstorm_topics add column if not exists output_html text;
alter table amit_brainstorm_topics add column if not exists is_showcase boolean not null default false;

-- Real enforcement, not just a UI gate: only a premium-tier user can create
-- or modify a brainstorm topic. Split from the old single "for all" policy
-- into separate SELECT vs write policies, since showcase topics need a
-- wider (public) read rule that write actions must never inherit.
drop policy if exists "user can manage own brainstorm topics" on amit_brainstorm_topics;
drop policy if exists "premium user can manage own brainstorm topics" on amit_brainstorm_topics;

create policy "anyone can read showcase topics" on amit_brainstorm_topics
  for select using (is_showcase = true);

create policy "premium user can read own brainstorm topics" on amit_brainstorm_topics
  for select using (
    auth.uid() = user_id
    and exists (select 1 from amit_user_tiers ut where ut.user_id = auth.uid() and ut.tier = 'premium')
  );

create policy "premium user can write own brainstorm topics" on amit_brainstorm_topics
  for insert with check (
    auth.uid() = user_id
    and exists (select 1 from amit_user_tiers ut where ut.user_id = auth.uid() and ut.tier = 'premium')
  );

create policy "premium user can update own brainstorm topics" on amit_brainstorm_topics
  for update using (
    auth.uid() = user_id
    and exists (select 1 from amit_user_tiers ut where ut.user_id = auth.uid() and ut.tier = 'premium')
  );

create policy "premium user can delete own brainstorm topics" on amit_brainstorm_topics
  for delete using (
    auth.uid() = user_id
    and exists (select 1 from amit_user_tiers ut where ut.user_id = auth.uid() and ut.tier = 'premium')
  );

-- Rounds and responses inherit showcase visibility through their parent
-- topic - anyone reading a showcase topic should see its full real history,
-- not just the topic title with everything else locked away.
drop policy if exists "user can manage own brainstorm rounds" on amit_brainstorm_rounds;
create policy "read own or showcase brainstorm rounds" on amit_brainstorm_rounds
  for select using (
    exists (
      select 1 from amit_brainstorm_topics t
      where t.id = topic_id and (t.is_showcase = true or t.user_id = auth.uid())
    )
  );
create policy "premium user can write own brainstorm rounds" on amit_brainstorm_rounds
  for insert with check (
    exists (
      select 1 from amit_brainstorm_topics t
      join amit_user_tiers ut on ut.user_id = t.user_id
      where t.id = topic_id and t.user_id = auth.uid() and ut.tier = 'premium'
    )
  );

drop policy if exists "user can manage own brainstorm responses" on amit_brainstorm_responses;
create policy "read own or showcase brainstorm responses" on amit_brainstorm_responses
  for select using (
    exists (
      select 1 from amit_brainstorm_rounds r
      join amit_brainstorm_topics t on t.id = r.topic_id
      where r.id = round_id and (t.is_showcase = true or t.user_id = auth.uid())
    )
  );
create policy "premium user can write own brainstorm responses" on amit_brainstorm_responses
  for insert with check (
    exists (
      select 1 from amit_brainstorm_rounds r
      join amit_brainstorm_topics t on t.id = r.topic_id
      join amit_user_tiers ut on ut.user_id = t.user_id
      where r.id = round_id and t.user_id = auth.uid() and ut.tier = 'premium'
    )
  );

-- Ryan's own account, set to premium so tonight's work keeps working -
-- looked up by email rather than a hardcoded UUID, safe to re-run.
insert into amit_user_tiers (user_id, tier)
select id, 'premium' from auth.users where email = 'frick.backup@gmail.com'
on conflict (user_id) do update set tier = 'premium', updated_at = now();

NOTIFY pgrst, 'reload schema';
