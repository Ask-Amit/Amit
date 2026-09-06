-- Amit Voice preferences — one row per signed-in user, holds their chosen
-- TTS voice/accent/speed so it follows them everywhere Amit speaks (Hub,
-- Amit Mobile, any future page), instead of each page defaulting on its own.
-- Not yet run — Ryan runs schema changes by hand, per Database\CLAUDE.md.

create table if not exists amit_voice_prefs (
  user_id uuid primary key references auth.users(id) on delete cascade,
  voice_name text,        -- SpeechSynthesisVoice.name — matched back against
                          -- the browser's own getVoices() list at speak time;
                          -- if that exact voice isn't present on a given
                          -- device/browser, the caller falls back to its own
                          -- default picker.
  accent text,            -- the accent/region group it was chosen under
                          -- (e.g. 'en-US', '__ALL__', '__OTHER__') — kept so
                          -- the picker can re-open scoped to the same group.
  rate numeric not null default 1.0,
  updated_at timestamptz not null default now()
);

alter table amit_voice_prefs enable row level security;

create policy "Users manage their own voice prefs"
  on amit_voice_prefs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
