-- migration 057: Ask Amit on a person's own Claude (database stage)
alter table public.cha_asks add column if not exists runner text not null default 'amit' check (runner in ('amit','own'));
alter table public.ask_requests add column if not exists runner text not null default 'amit' check (runner in ('amit','own'));

-- one shared count of the free questions a signed-in person has used in the last 24 hours
create or replace function public.ask_free_used(p_user uuid)
returns int language sql stable security definer set search_path = public as $$
  select (select count(*) from public.cha_asks where asker = p_user and runner = 'amit' and created_at > now() - interval '1 day'
            and ((kind = 'press' and status <> 'failed') or (kind = 'listen' and status = 'answered')))::int
       + (select count(*) from public.ask_requests where person = p_user and runner = 'amit' and status <> 'failed' and created_at > now() - interval '1 day')::int;
$$;
revoke all on function public.ask_free_used(uuid) from public, anon, authenticated;

create or replace function public.ask_free_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_user uuid; v_owner uuid; v_limit int; v_listen boolean := false;
begin
  if new.runner <> 'amit' then return new; end if;
  if tg_table_name = 'cha_asks' then v_user := new.asker; v_listen := (to_jsonb(new) ->> 'kind') = 'listen';
  else v_user := (to_jsonb(new) ->> 'person')::uuid; end if;
  select value::uuid into v_owner from public.cha_config where key = 'amit_owner_id';
  if v_user is null or v_user = v_owner then return new; end if;
  v_limit := coalesce((select nullif(value, '')::int from public.cha_config where key = 'ask_per_day'), 5);
  perform pg_advisory_xact_lock(hashtext('ask_free:' || v_user::text));
  if public.ask_free_used(v_user) >= v_limit then
    if v_listen then return null; end if;   -- a listening reply is simply not made
    raise exception 'You have used your % free questions for today. Connect my Claude to keep asking.', v_limit;
  end if;
  return new;
end $$;
drop trigger if exists cha_asks_free_guard on public.cha_asks;
create trigger cha_asks_free_guard before insert on public.cha_asks for each row execute function public.ask_free_guard();
drop trigger if exists ask_requests_free_guard on public.ask_requests;
create trigger ask_requests_free_guard before insert on public.ask_requests for each row execute function public.ask_free_guard();
update public.ask_config set value = '1000' where key in ('person_per_day', 'person_per_hour');

-- may this person's own Claude answer in this chat? Not if they, or anyone in the chat, is under 18.
create or replace function public.cha_own_allowed(p_conv uuid, p_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.cha_age_class(p_user) <> 'minor'
     and not exists (select 1 from public.cha_participants p where p.conversation_id = p_conv and p.status = 'accepted' and public.cha_age_class(p.user_id) = 'minor');
$$;
revoke all on function public.cha_own_allowed(uuid, uuid) from public, anon, authenticated;

-- Ask Amit, now with p_own: true = the asker's own Claude will answer
drop function if exists public.cha_ask(uuid, text, jsonb, jsonb, text, text);
create or replace function public.cha_ask(p_conv uuid, p_app text default 'hub', p_place jsonb default '{}'::jsonb, p_selection jsonb default null, p_note text default null, p_tz text default null, p_own boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid(); v_id uuid; v_num bigint; v_sel jsonb := null; v_mid uuid; v_text text; v_last uuid;
  v_note text := nullif(btrim(coalesce(p_note, '')), ''); v_ahead int; v_at timestamptz; v_was boolean; v_own boolean := coalesce(p_own, false);
begin
  if v_me is null then raise exception 'not signed in'; end if;
  if not public.cha_is_member(p_conv) then raise exception 'You are not in that chat.'; end if;
  if v_own and not public.cha_own_allowed(p_conv, v_me) then raise exception 'OWN_NOT_ALLOWED: In chats with someone under 18, your own Claude cannot answer.'; end if;
  if pg_column_size(coalesce(p_place, '{}'::jsonb)) > 2000 then raise exception 'That place is too long.'; end if;
  perform public.cha_summon_amit(p_conv);
  select coalesce(amit_listening, false) into v_was from public.cha_conversations where id = p_conv;
  if not v_was and not v_own then
    update public.cha_conversations set amit_listening = true, amit_listening_by = v_me, amit_listening_at = now(), amit_looked_at = now() where id = p_conv;
    insert into public.cha_messages (conversation_id, sender_id, message_type, body) values (p_conv, v_me, 'system', 'turned on Amit listening');
    v_was := false;
  end if;
  if p_selection is not null and coalesce(p_selection ->> 'message_id', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    v_mid := (p_selection ->> 'message_id')::uuid;
    select left(coalesce(body, ''), 600) into v_text from public.cha_messages where id = v_mid and conversation_id = p_conv and deleted_at is null;
    if found then
      v_sel := jsonb_build_object('message_id', v_mid, 'start', case when coalesce(p_selection ->> 'start', '') ~ '^[0-9]{1,6}$' then (p_selection ->> 'start')::int else 0 end, 'text', v_text);
    end if;
  end if;
  select id into v_last from public.cha_messages
   where conversation_id = p_conv and deleted_at is null and message_type <> 'system' and coalesce(payload ->> 'marker', '') = ''
   order by created_at desc limit 1;
  insert into public.cha_asks (conversation_id, asker, tz, app, place, selection, note, last_message_id, runner)
  values (p_conv, v_me, left(p_tz, 64), left(coalesce(nullif(btrim(p_app), ''), 'hub'), 40), coalesce(p_place, '{}'::jsonb), v_sel, left(v_note, 500), v_last, case when v_own then 'own' else 'amit' end)
  returning id, created_at into v_id, v_at;
  select number into v_num from public.cha_conversations where id = p_conv;
  select count(*)::int into v_ahead from public.cha_asks where status in ('new', 'working') and runner = 'amit' and id <> v_id and created_at <= v_at;
  return jsonb_build_object('id', v_id, 'number', v_num, 'ahead', case when v_own then 0 else v_ahead end, 'online', case when v_own then true else public.cha_amit_online() end, 'listening', not v_own, 'own', v_own);
end $$;
revoke all on function public.cha_ask(uuid, text, jsonb, jsonb, text, text, boolean) from public, anon;
grant execute on function public.cha_ask(uuid, text, jsonb, jsonb, text, text, boolean) to authenticated, service_role;

-- the owner's answering program now leaves own-Claude questions alone
create or replace function public.cha_ask_claim(p_machine text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_row jsonb;
begin
  if not public.cha_is_owner() then raise exception 'not allowed'; end if;
  update public.cha_asks set status = 'new', claimed_by = null, claimed_at = null where status = 'working' and kind = 'press' and claimed_at < now() - interval '10 minutes';
  update public.cha_asks set status = 'failed', answered_at = now(), error = 'timed out' where status = 'working' and kind = 'listen' and claimed_at < now() - interval '10 minutes';
  update public.cha_asks set status = 'working', claimed_by = left(coalesce(nullif(btrim(p_machine), ''), 'unnamed'), 80), claimed_at = now()
   where id = (select id from public.cha_asks where status = 'new' and kind = 'press' and runner = 'amit' order by created_at limit 1 for update skip locked)
  returning to_jsonb(public.cha_asks.*) into v_row;
  return v_row;
end $$;

-- the asker's own computer: only ever the asker's own questions
create or replace function public.cha_own_waiting()
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', a.id, 'conversation_id', a.conversation_id, 'at', a.created_at) order by a.created_at), '[]'::jsonb)
    from public.cha_asks a where a.asker = auth.uid() and a.runner = 'own' and a.status = 'new' and a.created_at > now() - interval '7 days';
$$;

create or replace function public.cha_own_claim(p_ask uuid, p_machine text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare a public.cha_asks; c public.cha_conversations; v_amit uuid := public.cha_amit_id(); v_members jsonb; v_name text;
begin
  update public.cha_asks set status = 'working', claimed_by = left(coalesce(nullif(btrim(p_machine), ''), 'own'), 80), claimed_at = now()
   where id = p_ask and asker = auth.uid() and runner = 'own' and status = 'new' returning * into a;
  if a.id is null then return null; end if;
  if not public.cha_is_member(a.conversation_id) or not public.cha_own_allowed(a.conversation_id, a.asker) then
    update public.cha_asks set status = 'failed', answered_at = now(), error = 'not allowed in this chat' where id = a.id; return null;
  end if;
  select * into c from public.cha_conversations where id = a.conversation_id;
  select coalesce(nullif(btrim(display_name), ''), 'Someone') into v_name from public.users where id = a.asker;
  select coalesce(jsonb_agg(jsonb_build_object('id', p.user_id, 'name', coalesce(nullif(btrim(u.display_name), ''), 'Someone'), 'is_amit', p.user_id = v_amit, 'is_asker', p.user_id = a.asker) order by p.joined_at), '[]'::jsonb)
    into v_members from public.cha_participants p left join public.users u on u.id = p.user_id where p.conversation_id = c.id and p.status = 'accepted';
  return jsonb_build_object('ask', jsonb_build_object('id', a.id, 'by', v_name, 'tz', a.tz, 'app', a.app, 'place', a.place, 'selection', a.selection, 'note', a.note),
    'chat', jsonb_build_object('id', c.id, 'number', c.number, 'title', c.title, 'purpose', c.purpose), 'members', v_members);
end $$;

create or replace function public.cha_own_answer(p_ask uuid, p_body text)
returns uuid language plpgsql security definer set search_path = public as $$
declare a public.cha_asks; v_amit uuid := public.cha_amit_id(); v_name text; v_body text := btrim(coalesce(p_body, '')); v_id uuid; v_reply uuid := null;
begin
  select * into a from public.cha_asks where id = p_ask and asker = auth.uid() and runner = 'own' and status = 'working' for update;
  if a.id is null then raise exception 'That question is not waiting for your Claude.'; end if;
  if v_amit is null then raise exception 'Amit is not set up yet.'; end if;
  if not public.cha_is_member(a.conversation_id) or not public.cha_own_allowed(a.conversation_id, a.asker) then raise exception 'Your own Claude cannot answer in this chat.'; end if;
  if length(v_body) = 0 or length(v_body) > 20000 then raise exception 'That reply is empty or too long.'; end if;
  select coalesce(nullif(btrim(display_name), ''), 'someone') into v_name from public.users where id = a.asker;
  if a.selection is not null and exists (select 1 from public.cha_messages where id = (a.selection ->> 'message_id')::uuid and conversation_id = a.conversation_id) then
    v_reply := (a.selection ->> 'message_id')::uuid;
  end if;
  insert into public.cha_messages (conversation_id, sender_id, body, reply_to, payload)
  values (a.conversation_id, v_amit, v_body, v_reply, jsonb_build_object('via', a.asker, 'via_name', v_name, 'ask', a.id, 'own_claude', true))
  returning id into v_id;
  update public.cha_asks set status = 'answered', answered_at = now(), answer_message_id = v_id, error = null where id = a.id;
  return v_id;
end $$;

create or replace function public.cha_own_fail(p_ask uuid, p_error text default null)
returns void language sql security definer set search_path = public as $$
  update public.cha_asks set status = 'failed', answered_at = now(), error = left(coalesce(p_error, ''), 500)
   where id = p_ask and asker = auth.uid() and runner = 'own' and status in ('new', 'working');
$$;

revoke all on function public.cha_own_waiting(), public.cha_own_claim(uuid, text), public.cha_own_answer(uuid, text), public.cha_own_fail(uuid, text) from public, anon;
grant execute on function public.cha_own_waiting(), public.cha_own_claim(uuid, text), public.cha_own_answer(uuid, text), public.cha_own_fail(uuid, text) to authenticated, service_role;
