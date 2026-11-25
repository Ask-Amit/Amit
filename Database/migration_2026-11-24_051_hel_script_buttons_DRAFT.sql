-- migration_2026-11-24_051_hel_script_buttons_DRAFT.sql
-- DRAFT, NOT RUN (written 2026-11-24). Amit Helper: custom script buttons. Only ADDS; nothing existing is changed or removed.
-- Ryan/Robin run this by hand in the Supabase dashboard SQL editor. Table prefix hel_ (AmitHelper). Grants, row-level security
-- and comments are in this same file, per the DATABASE TABLE DATA-API GRANTS rule. It runs as one batch: if any statement fails, none of it is kept.
-- Source of the design: AmitHelper\Button_Creator_SPEC.md sections 10 to 10c, plus the 2026-11-24 brainstorm (AmitLive\Briefs\Replies\).
--
-- PRIVACY: the script file itself stays on the person's computer (AmitScripts\<button>\v<n>.ps1). The database holds only the
-- button's description of itself (wish, permissions, test example, version, approval) and a one-line summary per run.
-- Message text, recipients and file contents are NEVER stored here; they stay in a local log on the computer.
--
-- NOT in this migration on purpose: schedules (the design in spec 10b is still open), a "script" button kind (the Hub has no color for it yet;
-- a script button uses kind 'multi' for now), and any table for trusted reviewers or sharing (later).

-- 1. questions a button asks when it is pressed
create table if not exists public.hel_button_questions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  button_id         uuid not null references public.hel_buttons(id) on delete cascade,
  position          integer not null default 0,
  variable          text not null check (variable ~ '^[a-z][a-z0-9_]{0,39}$'),     -- the name the script uses; the person never sees it
  label             text not null check (char_length(label) between 1 and 120),   -- the question in plain words
  kind              text not null check (kind in ('text','choice','multi_choice','number','date','date_range','yes_no','file','folder')),
  choices           jsonb not null default '[]'::jsonb check (jsonb_typeof(choices) = 'array'),
  number_min        numeric,
  number_max        numeric,
  default_value     text check (default_value is null or char_length(default_value) <= 200),
  default_from      text not null default 'none' check (default_from in ('none','last_answer','clipboard','selected_file')),
  ask_mode          text not null default 'every_time' check (ask_mode in ('every_time','remember','once_a_day')),
  remember_days     integer check (remember_days is null or remember_days between 1 and 365),
  required          boolean not null default true,
  show_if_question  uuid references public.hel_button_questions(id) on delete set null,   -- only ask this when another question was answered a certain way
  show_if_value     text check (show_if_value is null or char_length(show_if_value) <= 120),
  example_text      text check (example_text is null or char_length(example_text) <= 120),
  not_connected     boolean not null default false,     -- true when the current script does not use this variable (shown to the person as "not connected yet")
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (button_id, variable)
);
create index if not exists hel_button_questions_button on public.hel_button_questions (button_id, position);

-- 2. one row per VERSION of a button's script (the script file stays on the computer)
create table if not exists public.hel_button_scripts (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  button_id          uuid not null references public.hel_buttons(id) on delete cascade,
  version            integer not null check (version >= 1),
  file_hash          text not null check (file_hash ~ '^[0-9a-f]{64}$'),           -- fingerprint of the script file
  language           text not null default 'powershell' check (language in ('powershell')),
  declared_variables jsonb not null default '[]'::jsonb check (jsonb_typeof(declared_variables) = 'array'),   -- what the script understands: name, plain label, allowed kinds
  permissions        jsonb not null default '{}'::jsonb check (jsonb_typeof(permissions) = 'object'),         -- reads, writes, sends, spends, internet, folders, domains, who it may send to, max actions, max seconds
  wish               text check (wish is null or char_length(wish) <= 4000),       -- the job in plain words, so the button can be rebuilt on another computer or by a friend's Claude
  test_example       jsonb,                                                          -- one concrete example: the answers given and the result that counts as right
  worst_case         text check (worst_case is null or char_length(worst_case) <= 300),   -- "what happens if this goes wrong", shown in the approval box
  change_reason      text check (change_reason is null or char_length(change_reason) <= 300),
  made_by            text not null default 'own_claude' check (made_by in ('own_claude','imported')),
  imported_from      text check (imported_from is null or char_length(imported_from) <= 80),
  imported_at        timestamptz,
  approved_hash      text check (approved_hash is null or approved_hash ~ '^[0-9a-f]{64}$'),   -- the fingerprint the person approved; a different file asks again
  approved_at        timestamptz,
  sending_unlocked   boolean not null default false,                                -- sending, posting or buying stays off until the person unlocks it after practice
  state              text not null default 'practice_only' check (state in ('practice_only','active','paused','needs_attention')),
  is_current         boolean not null default true,
  created_at         timestamptz not null default now(),
  unique (button_id, version)
);
create unique index if not exists hel_one_current_script on public.hel_button_scripts (button_id) where is_current;

-- 3. one summary row per press (NO message text, recipients or file contents: those stay in the local log)
create table if not exists public.hel_button_runs (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  button_id      uuid not null references public.hel_buttons(id) on delete cascade,
  script_version integer,
  mode           text not null check (mode in ('practice','real')),
  outcome        text not null check (outcome in ('done','stopped','failed','limit_reached','cancelled')),
  started_at     timestamptz not null default now(),
  finished_at    timestamptz,
  counts         jsonb not null default '{}'::jsonb check (jsonb_typeof(counts) = 'object'),   -- for example {"read":5,"sent":0,"changed":0}
  summary        text check (summary is null or char_length(summary) <= 500)
);
create index if not exists hel_button_runs_button on public.hel_button_runs (button_id, started_at desc);

-- 4. a deleted button waits 30 days before it is really gone (the Hub and bar must hide rows with deleted_at set)
alter table public.hel_buttons add column if not exists deleted_at timestamptz;

-- 5. a person's own safety rules for ALL their buttons (hel_settings already exists: one row per person)
alter table public.hel_settings
  add column if not exists no_send_from          time,
  add column if not exists no_send_to            time,
  add column if not exists blocked_recipients    text[] not null default '{}',
  add column if not exists away_pause_days       integer check (away_pause_days is null or away_pause_days between 1 and 365),
  add column if not exists hold_new_recipients   boolean not null default true,
  add column if not exists spoken_readback       boolean not null default true,
  add column if not exists script_time_limit_sec integer not null default 60 check (script_time_limit_sec between 10 and 600),
  add column if not exists import_waiting_days   integer not null default 3 check (import_waiting_days between 0 and 30);

-- 6. row-level security: own rows only
alter table public.hel_button_questions enable row level security;
alter table public.hel_button_scripts   enable row level security;
alter table public.hel_button_runs      enable row level security;

drop policy if exists "own button questions" on public.hel_button_questions;
create policy "own button questions" on public.hel_button_questions for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and exists (select 1 from public.hel_buttons b where b.id = button_id and b.user_id = auth.uid()));

drop policy if exists "own button scripts" on public.hel_button_scripts;
create policy "own button scripts" on public.hel_button_scripts for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and exists (select 1 from public.hel_buttons b where b.id = button_id and b.user_id = auth.uid()));

drop policy if exists "own button runs" on public.hel_button_runs;
create policy "own button runs" on public.hel_button_runs for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and exists (select 1 from public.hel_buttons b where b.id = button_id and b.user_id = auth.uid()));

-- 7. grants (same migration, per the rule): signed-in people use their own rows; nothing for anon
grant select, insert, update, delete on public.hel_button_questions to authenticated;
grant select, insert, update, delete on public.hel_button_scripts   to authenticated;
grant select, insert, update, delete on public.hel_button_runs      to authenticated;
grant select, insert, update, delete on public.hel_button_questions to service_role;
grant select, insert, update, delete on public.hel_button_scripts   to service_role;
grant select, insert, update, delete on public.hel_button_runs      to service_role;

-- 8. allow the new "run_script" step. This reads the live check function and adds the name to its list, so it keeps whatever step types the
-- live function already allows. If the live function does not list 'wait', this stops with a message and NOTHING in this file is kept.
do $$
declare d text;
begin
  select pg_get_functiondef('public.hel_steps_ok(jsonb)'::regprocedure) into d;
  if d like '%''run_script''%' then return; end if;
  d := replace(d, '''wait''', '''wait'',''run_script''');
  if d not like '%''run_script''%' then
    raise exception 'hel_steps_ok does not list the wait step, so run_script was not added. Nothing was changed.';
  end if;
  execute d;
end $$;

comment on table public.hel_button_questions is 'AmitHelper: the questions a button asks when pressed; answers go to the script as data only. Added 2026-11-24.';
comment on table public.hel_button_scripts   is 'AmitHelper: one row per version of a custom script button (wish, permissions, test example, approval). The script file stays on the computer. Added 2026-11-24.';
comment on table public.hel_button_runs      is 'AmitHelper: one summary row per press of a script button. Never holds message text, recipients or file contents. Added 2026-11-24.';

notify pgrst, 'reload schema';

-- To undo (not part of the migration; the run_script name can stay in the step list, it does no harm):
--   drop table if exists public.hel_button_runs, public.hel_button_scripts, public.hel_button_questions;
--   alter table public.hel_buttons drop column if exists deleted_at;
--   alter table public.hel_settings drop column if exists no_send_from, drop column if exists no_send_to, drop column if exists blocked_recipients,
--     drop column if exists away_pause_days, drop column if exists hold_new_recipients, drop column if exists spoken_readback,
--     drop column if exists script_time_limit_sec, drop column if exists import_waiting_days;
