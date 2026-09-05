-- migration_2026-09-05_001_amit_mobile_captures.sql
-- Amit Mobile — capture/history table, per AmitMobile\CLAUDE.md's
-- "Capture Logging & History" section. Every voice conversation (and any
-- attached photo) is logged here, tagged to the signed-in user, and is
-- re-routable after the fact (destination is a plain updatable text field,
-- not a locked enum) per that same section's point 4.

create table amit_mobile_captures (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  topic text,
  summary text,
  transcript text,
  photo_url text,
  destination text
);

alter table amit_mobile_captures enable row level security;

create policy "users manage their own captures" on amit_mobile_captures
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- keep updated_at current on every UPDATE (used when a capture is
-- re-routed later, e.g. destination changed from null/'general' to
-- 'amitbooks' per the CLAUDE.md re-routing spec)
create or replace function amit_mobile_captures_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger amit_mobile_captures_updated_at
  before update on amit_mobile_captures
  for each row execute function amit_mobile_captures_set_updated_at();
