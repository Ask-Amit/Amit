-- ══════════════════════════════════════════════
-- Amit Threads — "One Thread, Many Doors"
--
-- Ryan's direct instruction, 2026-08-10: one continuous, cross-app record
-- per person, not separate business/spiritual filing cabinets. See
-- Amit_Unified_Identity_Architecture.md (root Amit folder) for the full
-- vision this is the first real slice of.
--
-- domain reuses the exact same categories Amit already uses for its own
-- pursuits (Spiritual/Business/Personal/Craft) — one shared vocabulary,
-- not a new one invented just for this table.
--
-- status/corroboration_count carry the "two or more witnesses" principle
-- already governing how Amit reviews its OWN growth log (root CLAUDE.md's
-- Companion Growth Log Intake System) — a single observed signal isn't
-- treated as settled truth about someone; a repeated/confirmed pattern is.
-- 'signal' = seen once, not yet promoted. 'confirmed' = corroborated,
-- genuinely part of how Amit understands this person. The actual
-- promotion logic (bump corroboration_count, flip to 'confirmed' once a
-- threshold is hit) is real, separate app-layer work, not built by this
-- migration — this just gives it somewhere real to write to.
--
-- source_app is free text on purpose (like book_role_permissions'
-- permission_key) — the real list of apps writing here isn't fully fixed
-- yet; narrowing to an enum is a cheap follow-up once it is.
--
-- Idempotent — safe to re-run.
-- ══════════════════════════════════════════════

create table if not exists amit_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  domain text not null check (domain in ('Spiritual','Business','Personal','Craft')),
  source_app text not null,
  entry_text text not null,
  status text not null default 'confirmed' check (status in ('signal','confirmed')),
  corroboration_count integer not null default 1,
  created_at timestamptz not null default now()
);
alter table amit_threads enable row level security;
create policy "amit_threads_select_own" on amit_threads for select using (auth.uid() = user_id);
create policy "amit_threads_insert_own" on amit_threads for insert with check (auth.uid() = user_id);
create policy "amit_threads_update_own" on amit_threads for update using (auth.uid() = user_id);
