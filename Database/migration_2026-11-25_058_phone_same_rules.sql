-- migration 058: phone camera, phone voice and the Wi-Fi Pad follow the same rules
alter table public.amit_mobile_captures add column if not exists runner text not null default 'amit' check (runner in ('amit','own'));

-- the shared count of free questions now includes phone and Pad questions
create or replace function public.ask_free_used(p_user uuid)
returns int language sql stable security definer set search_path = public as $$
  select (select count(*) from public.cha_asks where asker = p_user and runner = 'amit' and created_at > now() - interval '1 day'
            and ((kind = 'press' and status <> 'failed') or (kind = 'listen' and status = 'answered')))::int
       + (select count(*) from public.ask_requests where person = p_user and runner = 'amit' and status <> 'failed' and created_at > now() - interval '1 day')::int
       + (select count(*) from public.amit_mobile_captures where user_id = p_user and runner = 'amit' and created_at > now() - interval '1 day')::int;
$$;
revoke all on function public.ask_free_used(uuid) from public, anon, authenticated;

-- a phone or Pad question: a person whose own Claude is connected is answered by it; anyone else has the free 5 a day
create or replace function public.ask_capture_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_owner uuid; v_limit int;
begin
  if public.cha_age_class(new.user_id) <> 'minor'
     and coalesce((select raw_user_meta_data ->> 'own_claude' from auth.users where id = new.user_id), '') = 'true' then
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
drop trigger if exists amit_mobile_captures_guard on public.amit_mobile_captures;
create trigger amit_mobile_captures_guard before insert on public.amit_mobile_captures for each row execute function public.ask_capture_guard();

-- the person's own computer also hears about waiting phone questions
create or replace function public.cha_own_waiting()
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(x.j order by x.at), '[]'::jsonb) from (
    select a.created_at as at, jsonb_build_object('id', a.id, 'kind', 'chat', 'conversation_id', a.conversation_id, 'at', a.created_at) as j
      from public.cha_asks a where a.asker = auth.uid() and a.runner = 'own' and a.status = 'new' and a.created_at > now() - interval '7 days'
    union all
    select m.created_at, jsonb_build_object('id', 'capture-' || m.id, 'kind', 'capture', 'at', m.created_at)
      from public.amit_mobile_captures m where m.user_id = auth.uid() and m.runner = 'own' and m.reply is null and m.created_at > now() - interval '7 days'
  ) x;
$$;
