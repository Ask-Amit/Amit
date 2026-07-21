-- Brainstorm mechanism: persistent, multi-round, multi-AI collaborative
-- design sessions, connected through the same Hub login every other Amit
-- module uses. Trigger phrase "brainstorming [name]" pulls the most recent
-- open topic (and everything collected on it, every round, every prompt,
-- every response) back into context.
--
-- Real lifecycle this schema supports:
--   1. Ryan states a topic in plain language ("create the most amazing dashboard")
--   2. Amit analyzes it and writes the actual outbound prompt for that round
--      (uniform across AIs at first, may become per-AI-customized as real
--      evidence shows different phrasing gets better results from different
--      systems - that customization is earned through observed rounds, not
--      assumed on round one)
--   3. Ryan copies the prompt out to each AI, brings back their answers
--   4. Each answer is saved as its own response row under that round
--   5. Amit synthesizes, writes the next round's prompt referencing real
--      round 1 content, repeat until a consented conclusion is reached
--   6. Topic marked resolved, synthesis holds the final consented direction

create table if not exists amit_brainstorm_topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  title text not null,            -- the topic as Ryan stated it
  analysis text,                  -- Amit's own breakdown of what's really being asked
  status text not null default 'open' check (status in ('open', 'resolved')),
  synthesis text,                 -- Amit's consented conclusion once resolved
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists amit_brainstorm_rounds (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references amit_brainstorm_topics(id) on delete cascade,
  round_number int not null,
  prompt_text text not null,      -- what Amit actually generated to send out this round
  created_at timestamptz not null default now(),
  unique (topic_id, round_number)
);

create table if not exists amit_brainstorm_responses (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references amit_brainstorm_rounds(id) on delete cascade,
  source text not null,           -- 'Grok', 'Gemini', 'Copilot', 'Amit', etc.
  response_text text not null,
  created_at timestamptz not null default now()
);

alter table amit_brainstorm_topics enable row level security;
alter table amit_brainstorm_rounds enable row level security;
alter table amit_brainstorm_responses enable row level security;

create policy "user can manage own brainstorm topics" on amit_brainstorm_topics
  for all using (auth.uid() = user_id);

create policy "user can manage own brainstorm rounds" on amit_brainstorm_rounds
  for all using (
    exists (select 1 from amit_brainstorm_topics t where t.id = topic_id and t.user_id = auth.uid())
  );

create policy "user can manage own brainstorm responses" on amit_brainstorm_responses
  for all using (
    exists (
      select 1 from amit_brainstorm_rounds r
      join amit_brainstorm_topics t on t.id = r.topic_id
      where r.id = round_id and t.user_id = auth.uid()
    )
  );
