-- ============================================================
-- AMIT SCHEMA ADDITION — User Memory Layer
-- The living portrait. The story, not just the score.
-- Run this after amit_schema.sql
-- ============================================================

-- ── USER MEMORY ─────────────────────────────────────────────
-- Amit's condensed, updatable portrait of each person.
-- One row per user. Updated as Amit learns more.
-- The 'memory' JSONB field holds the structured portrait.
-- The 'summary' field is the condensed paragraph Amit loads
-- at the start of every conversation to know who they are.
create table public.user_memory (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null unique references public.users(id) on delete cascade,

  -- Condensed portrait — loaded at session start
  summary         text,   -- "Sarah is a 42-year-old mother of three wrestling with doubt after a church hurt. Tier 1 compass. Responds well to gentleness, pushes back on direct declarations. First asked about Yeshua on 2026-05-14."

  -- Structured fields Amit tracks
  communication_style   text,   -- 'direct' | 'gentle' | 'intellectual' | 'emotional'
  spiritual_background  text,   -- what they came from
  current_struggle      text,   -- what they're walking through right now
  openness_to_yeshua    text,   -- 'resistant' | 'curious' | 'open' | 'seeking' | 'believing'
  testimony_status      text,   -- 'none' | 'partial' | 'written' | 'shared'

  -- Flexible memory store — anything Amit learns that doesn't fit above
  known_facts     jsonb default '[]'::jsonb,   -- array of {fact, learned_at, confidence}
  prayer_requests jsonb default '[]'::jsonb,   -- array of {request, date, answered}

  -- Metadata
  last_session    timestamptz,
  session_count   integer default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
alter table public.user_memory enable row level security;
create policy "User sees own memory"
  on public.user_memory for all
  using (auth.uid() = user_id);

create trigger set_updated_at before update on public.user_memory
  for each row execute function public.handle_updated_at();


-- ── USER KEY MOMENTS ────────────────────────────────────────
-- The timestamped log. Amit witnesses something significant — it goes here.
-- Two witnesses principle: single entries are held, corroborated entries carry weight.
create table public.user_key_moments (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.users(id) on delete cascade,

  moment_date     date not null default current_date,
  category        text not null,   -- 'testimony' | 'question' | 'breakthrough' | 'struggle' | 'declaration' | 'prayer'
  title           text not null,   -- short label: "First asked about Yeshua"
  body            text,            -- full detail of what happened
  amit_notes      text,            -- Amit's internal read on the significance

  -- For the two-witnesses principle
  corroborated    boolean default false,   -- has this been confirmed by a second signal?
  source          text,                    -- 'conversation' | 'pursuit' | 'reflection' | 'direct'

  created_at      timestamptz default now()
);
alter table public.user_key_moments enable row level security;
create policy "User sees own moments"
  on public.user_key_moments for all
  using (auth.uid() = user_id);

-- Index for fast retrieval by user and date
create index on public.user_key_moments (user_id, moment_date desc);
