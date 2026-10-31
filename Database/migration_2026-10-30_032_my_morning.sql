-- Amit Live: MY MORNING (Ryan, 2026-10-30). One row per person: how they want their first visit of the day to go.
-- The Hub's Communications > My Morning tab edits it; the Amit Live window (ComputerHealth\AmitLive.html) reads it. Own row only.
-- Run ONCE in the Supabase SQL editor. It adds ONE new table (prefix Mor_ = first three letters of "Morning"); nothing existing is changed or deleted.
--   day_turn       when a new day begins for this person: auto = sunset if they have turned the Gregorian calendar off in the Hub, otherwise the next morning
--                  (4 a.m.); sunset = sunset to sunset (needs their ZIP in About Me, else about 6 p.m. is used); morning = the next morning (4 a.m.)
--   pace           gentle = a slow, warm start (greeting first, everything else is offered); short = greeting and the chat button only
--   music_choice   devotions = Ryan's own Devotions songs | link = their own playlist (a web link they paste) | none
--   music_wish     free words: what they would like to hear. Kept private with their row; nobody else reads it unless a later feature says so openly.
--   show_word      offer Today's Word | show_agenda  offer "my agenda" (their own pursuits due today) when they ask for it
--   last_visit_day the day (in THEIR day_turn sense) the morning visit was last shown, so it shows once a day
-- Shabbat: for a person whose day turns at sunset, the visit on Shabbat is a rest greeting with no agenda offer (done in the page, no column needed).

create table if not exists public.mor_settings (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  enabled        boolean not null default true,
  day_turn       text not null default 'auto'    check (day_turn in ('auto', 'sunset', 'morning')),
  pace           text not null default 'gentle'  check (pace in ('gentle', 'short')),
  music_choice   text not null default 'devotions' check (music_choice in ('devotions', 'link', 'none')),
  playlist_url   text not null default ''        check (length(playlist_url) <= 500 and (playlist_url = '' or playlist_url ~* '^https://')),
  music_wish     text not null default ''        check (length(music_wish) <= 400),
  show_word      boolean not null default true,
  show_agenda    boolean not null default true,
  last_visit_day date,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- tidy what is typed and keep the time current
create or replace function public.mor_settings_tidy()
returns trigger language plpgsql set search_path = public as $$
begin
  new.playlist_url := btrim(coalesce(new.playlist_url, ''));
  new.music_wish   := btrim(regexp_replace(coalesce(new.music_wish, ''), '\s+', ' ', 'g'));
  new.updated_at   := now();
  return new;
end $$;
drop trigger if exists mor_settings_tidy_trg on public.mor_settings;
create trigger mor_settings_tidy_trg before insert or update on public.mor_settings
  for each row execute function public.mor_settings_tidy();

-- only the person's own row, ever
alter table public.mor_settings enable row level security;
drop policy if exists mor_settings_own on public.mor_settings;
create policy mor_settings_own on public.mor_settings for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Data API grants (required for any table created on or after 2026-10-30; harmless before). No public (anon) access at all.
revoke all on public.mor_settings from anon;
grant select, insert, update, delete on public.mor_settings to authenticated;
grant select, insert, update, delete on public.mor_settings to service_role;

comment on table public.mor_settings is 'Amit Live: a person''s My Morning settings (2026-10-30). Edited in Hub > Communications > My Morning, read by the Amit Live window.';
