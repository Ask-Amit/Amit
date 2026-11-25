-- migration_2026-11-25_056_hel_claude_emails_DRAFT.sql
-- AmitHelper (2026-11-25, root CLAUDE.md "PREMIUM FEATURES", rule 4): extra CLAUDE EMAILS a person has proven are theirs, so the premium check can match them.
-- A link can be created ONLY by hel_claude_email_finish, and only by a session that has JUST confirmed a code sent to that very address. Nobody can insert or update rows directly.
-- One email can be linked to only one Hub login. Running this twice does no harm. Nothing existing is changed.

create table if not exists public.hel_claude_emails (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  email       text not null unique check (email = lower(btrim(email)) and char_length(email) between 3 and 254),
  verified_at timestamptz not null default now()
);

create table if not exists public.hel_claude_email_requests (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  email      text not null check (email = lower(btrim(email)) and char_length(email) between 3 and 254),
  created_at timestamptz not null default now(),
  used_at    timestamptz
);

alter table public.hel_claude_emails enable row level security;
alter table public.hel_claude_email_requests enable row level security;

drop policy if exists hel_claude_emails_read on public.hel_claude_emails;
create policy hel_claude_emails_read on public.hel_claude_emails for select using (user_id = auth.uid());
drop policy if exists hel_claude_emails_remove on public.hel_claude_emails;
create policy hel_claude_emails_remove on public.hel_claude_emails for delete using (user_id = auth.uid());
-- no policy at all on the requests table: only the two functions below touch it

revoke all on public.hel_claude_emails from anon, authenticated;
revoke all on public.hel_claude_email_requests from anon, authenticated;
grant select, delete on public.hel_claude_emails to authenticated;
grant select, insert, update, delete on public.hel_claude_emails to service_role;
grant select, insert, update, delete on public.hel_claude_email_requests to service_role;

-- step 1, run by the person's own Hub login: "I want to add this address"
create or replace function public.hel_claude_email_start(p_email text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_me uuid := auth.uid(); v_mail text := lower(btrim(coalesce(p_email, ''))); v_id uuid;
begin
  if v_me is null then raise exception 'Sign in first.'; end if;
  if v_mail !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' or char_length(v_mail) > 254 then raise exception 'That does not look like an email address.'; end if;
  if exists (select 1 from hel_claude_emails where email = v_mail and user_id <> v_me) then raise exception 'That email is already linked to another Amit login.'; end if;
  if (select count(*) from hel_claude_email_requests where user_id = v_me and created_at > now() - interval '1 hour') >= 5 then raise exception 'Too many tries. Wait an hour, then try again.'; end if;
  if (select count(*) from hel_claude_emails where user_id = v_me) >= 5 then raise exception 'You already have five Claude emails. Remove one first.'; end if;
  delete from hel_claude_email_requests where created_at < now() - interval '1 day';
  insert into hel_claude_email_requests (user_id, email) values (v_me, v_mail) returning id into v_id;
  return v_id;
end $$;

-- step 2, run by the short-lived session that the emailed code creates: proves the inbox was just read
create or replace function public.hel_claude_email_finish(p_request uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare r hel_claude_email_requests; v_mail text := lower(btrim(coalesce(auth.jwt() ->> 'email', '')));
begin
  if auth.uid() is null or v_mail = '' then raise exception 'The code was not confirmed.'; end if;
  -- this very session must have been opened by an emailed code within the last 15 minutes (a password sign-in does not count)
  if not exists (select 1 from jsonb_array_elements(coalesce(auth.jwt() -> 'amr', '[]'::jsonb)) a
                 where a ->> 'method' in ('otp', 'magiclink') and (a ->> 'timestamp')::bigint > extract(epoch from now())::bigint - 900) then
    raise exception 'The code was not confirmed just now. Ask for a new code.';
  end if;
  select * into r from hel_claude_email_requests where id = p_request and used_at is null and created_at > now() - interval '15 minutes' for update;
  if not found then raise exception 'That request has run out. Ask for a new code.'; end if;
  if r.email <> v_mail then raise exception 'The code was for a different email.'; end if;
  if exists (select 1 from hel_claude_emails where email = v_mail and user_id <> r.user_id) then raise exception 'That email is already linked to another Amit login.'; end if;
  insert into hel_claude_emails (user_id, email) values (r.user_id, v_mail) on conflict (email) do update set verified_at = now();
  update hel_claude_email_requests set used_at = now() where id = r.id;
  return true;
end $$;

revoke all on function public.hel_claude_email_start(text) from public, anon;
revoke all on function public.hel_claude_email_finish(uuid) from public, anon;
grant execute on function public.hel_claude_email_start(text) to authenticated;
grant execute on function public.hel_claude_email_finish(uuid) to authenticated;

comment on table public.hel_claude_emails is 'AmitHelper: extra Claude account emails a person proved are theirs (premium check). Rows are created only by hel_claude_email_finish. Added 2026-11-25.';
