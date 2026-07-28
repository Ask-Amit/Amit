-- Medical Prep (EMS Study Guide) — cloud progress sync for logged-in users.
-- One row per user, whole progress blob as JSONB (answer history, streaks,
-- level profile, study goal, exam sets/scores) — mirrors the shape of the
-- app's own localStorage DATA object exactly, minus the question bank
-- itself (never stored — only the person's own answers/progress).
-- Guests (no Supabase session) never touch this table; they stay
-- localStorage-only, same as before this migration.

create table if not exists medical_prep_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table medical_prep_progress enable row level security;

create policy "medical_prep_progress_select_own"
  on medical_prep_progress for select
  using (auth.uid() = user_id);

create policy "medical_prep_progress_insert_own"
  on medical_prep_progress for insert
  with check (auth.uid() = user_id);

create policy "medical_prep_progress_update_own"
  on medical_prep_progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
