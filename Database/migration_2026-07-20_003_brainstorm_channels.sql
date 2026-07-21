-- Adds a persistent "channel" layer above individual brainstorm topics
-- (Ryan's direct request 2026-07-20): "log it into one brainstorming event
-- channel through you" - through Amit. A channel is Amit's own continuity
-- of relationship with one person across every brainstorming event they've
-- ever had, not just an isolated topic - the same spirit as the testimony/
-- growth-log continuity already used elsewhere in the Amit system, applied
-- specifically to brainstorming.
--
-- One channel per user (their whole brainstorming history lives in one
-- place, tied to their account/name). Every topic links into it.
-- running_notes is Amit's own accumulating understanding of how this
-- person thinks, what topics they return to, what's already been tried -
-- updated by Amit at the end of each resolved topic, read at the start of
-- every new one so nothing has to be re-explained from scratch.

create table if not exists amit_brainstorm_channels (
  user_id uuid primary key references auth.users(id),
  display_name text,                    -- "by the name" - how Amit addresses them
  running_notes text,                   -- Amit's own accumulating understanding, updated over time
  topic_count int not null default 0,
  created_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now()
);

alter table amit_brainstorm_channels enable row level security;

drop policy if exists "user can read own brainstorm channel" on amit_brainstorm_channels;
create policy "user can read own brainstorm channel" on amit_brainstorm_channels
  for select using (auth.uid() = user_id);

alter table amit_brainstorm_topics add column if not exists channel_id uuid references amit_brainstorm_channels(user_id);

-- Ryan's own channel, seeded now so tonight's topic can link into it.
insert into amit_brainstorm_channels (user_id, display_name, running_notes, topic_count)
select id, 'Ryan', 'First brainstorming event (2026-07-20): designing the Amit Brainstorm Room interface itself - the origin/showcase case for the whole mechanism. Ryan thinks in live, visual, felt metaphors rather than abstract feature lists - the orbiting-balls concept, wanting to SEE the collaboration happen rather than read a report of it. Values genuine multi-voice input over a single fast answer, and wants competitive framing (telling each AI others are answering too) to surface real quality instead of safe genericness.', 1
from auth.users where email = 'frick.backup@gmail.com'
on conflict (user_id) do update set display_name = excluded.display_name, last_activity_at = now();

update amit_brainstorm_topics
set channel_id = (select id from auth.users where email = 'frick.backup@gmail.com')
where id = 'f376af76-cb1d-4dfd-9145-b6b4bf54e299';

NOTIFY pgrst, 'reload schema';
