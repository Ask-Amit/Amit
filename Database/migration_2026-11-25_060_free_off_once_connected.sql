-- migration 060: once a login's own Claude has worked, its free answers are off for good
create table if not exists public.ask_own_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  since timestamptz not null default now()
);
alter table public.ask_own_accounts enable row level security;
drop policy if exists ask_own_accounts_read on public.ask_own_accounts;
create policy ask_own_accounts_read on public.ask_own_accounts for select using (user_id = auth.uid());
revoke all on public.ask_own_accounts from anon, authenticated;
grant select on public.ask_own_accounts to authenticated;
grant select, insert, update, delete on public.ask_own_accounts to service_role;

-- a login can only switch this ON for itself; only the owner (dashboard or server key) can remove it
create or replace function public.ask_own_mark()
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return false; end if;
  insert into public.ask_own_accounts (user_id) values (auth.uid()) on conflict (user_id) do nothing;
  return true;
end $$;
revoke all on function public.ask_own_mark() from public, anon;
grant execute on function public.ask_own_mark() to authenticated, service_role;

-- chat and the Ask Amit program: no free (owner-Claude) question for a connected login
create or replace function public.ask_connected_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_user uuid;
begin
  if new.runner <> 'amit' then return new; end if;
  if tg_table_name = 'cha_asks' then v_user := (to_jsonb(new) ->> 'asker')::uuid; else v_user := (to_jsonb(new) ->> 'person')::uuid; end if;
  if v_user is null or not exists (select 1 from public.ask_own_accounts where user_id = v_user) then return new; end if;
  if tg_table_name = 'cha_asks' then
    if (to_jsonb(new) ->> 'kind') = 'listen' then return null; end if;
    if not public.cha_own_allowed((to_jsonb(new) ->> 'conversation_id')::uuid, v_user) then return new; end if;   -- a chat with someone under 18
  end if;
  raise exception 'Your own Claude is connected, so free answers are off. Open Amit on your computer with your Claude signed in.';
end $$;
drop trigger if exists cha_asks_b_connected_guard on public.cha_asks;
create trigger cha_asks_b_connected_guard before insert on public.cha_asks for each row execute function public.ask_connected_guard();
drop trigger if exists ask_requests_b_connected_guard on public.ask_requests;
create trigger ask_requests_b_connected_guard before insert on public.ask_requests for each row execute function public.ask_connected_guard();

-- phone and Pad questions: a connected login always goes to its own Claude
create or replace function public.ask_capture_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_owner uuid; v_limit int;
begin
  if public.cha_age_class(new.user_id) <> 'minor' and exists (select 1 from public.ask_own_accounts where user_id = new.user_id) then
    new.runner := 'own'; return new;
  end if;
  new.runner := 'amit';
  select value::uuid into v_owner from public.cha_config where key = 'amit_owner_id';
  if new.user_id = v_owner then return new; end if;
  v_limit := coalesce((select nullif(value, '')::int from public.cha_config where key = 'ask_per_day'), 5);
  perform pg_advisory_xact_lock(hashtext('ask_free:' || new.user_id::text));
  if public.ask_free_used(new.user_id) >= v_limit then
    raise exception 'You have used your % free questions for today. Connect my Claude to keep asking.', v_limit;
  end if;
  return new;
end $$;

-- logins whose own Claude has already answered, or whose computer already confirmed it, are switched on now
insert into public.ask_own_accounts (user_id)
  select distinct asker from public.cha_asks where runner = 'own' and status = 'answered'
  union select id from auth.users where raw_user_meta_data ->> 'own_claude' = 'true'
on conflict (user_id) do nothing;
