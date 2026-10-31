-- AmitChat / Amit Live: one Ask Amit chat PER DAY for the Amit Live window (Ryan, 2026-10-31).
-- Run ONCE in the Supabase SQL editor, AFTER _017.
--  * cha_help_open_day(app, page, day): finds or makes the person's Ask Amit chat for that day. Coming back the same day = the same chat, with that day's
--    history; the next day = a brand new chat. The day label comes from the Amit Live window (the person's own day: next morning, or sunset to sunset).
--  * The chat is titled "Ask Amit - Friday, October 31, 2026" so the list sorts by day. It is a normal help chat (purpose 'help'), marked origin.day.
--  * The Hub's own Ask Amit button is not changed: cha_help_chat and cha_help_open now skip the per-day chats, so the Hub keeps its one running chat.
--  * No new table, so no new grants beyond the function grants below.

create or replace function public.cha_help_open_day(p_app text default 'amitlive', p_page text default null, p_day text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid(); v_amit uuid := public.cha_amit_id(); v_conv uuid; v_num bigint; v_new boolean := false; v_was boolean := false;
  v_owner uuid; v_owner_name text; v_first text; v_page text := nullif(btrim(regexp_replace(left(coalesce(p_page, ''), 60), '[^A-Za-z0-9 ]', '', 'g')), ''); v_body text; v_greeted boolean := false;
  v_day text := btrim(coalesce(p_day, '')); v_date date;
begin
  if v_me is null then raise exception 'not signed in'; end if;
  if v_day !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'A day is needed (YYYY-MM-DD).'; end if;
  begin v_date := v_day::date; exception when others then raise exception 'That day is not a real date.'; end;
  perform public.cha_require_age();
  if public.cha_age_class(v_me) = 'minor' then raise exception 'Ask Amit chats are for adults for now.'; end if;
  if v_amit is null then raise exception 'Amit is not set up yet.'; end if;
  select c.id into v_conv from public.cha_conversations c
    join public.cha_participants p on p.conversation_id = c.id and p.user_id = v_me and p.status = 'accepted'
   where c.purpose = 'help' and c.created_by = v_me and c.delete_requested_at is null and c.origin ->> 'day' = v_day
   order by c.created_at limit 1;
  if v_conv is null then
    insert into public.cha_conversations (title, kind, purpose, created_by, origin)
    values ('Ask Amit - ' || to_char(v_date, 'FMDay, FMMonth FMDD, YYYY'), 'personal', 'help', v_me,
            jsonb_build_object('app', left(coalesce(nullif(btrim(p_app), ''), 'amitlive'), 40), 'day', v_day))
    returning id into v_conv;
    insert into public.cha_participants (conversation_id, user_id, invited_by, role, status) values (v_conv, v_me, v_me, 'owner', 'accepted');
    insert into public.cha_participants (conversation_id, user_id, invited_by, role, status) values (v_conv, v_amit, v_me, 'member', 'accepted');
    v_new := true;
  end if;
  select coalesce(amit_listening, false) into v_was from public.cha_conversations where id = v_conv;
  if not v_was and v_new then
    update public.cha_conversations set amit_listening = true, amit_listening_by = v_me, amit_listening_at = now(), amit_looked_at = now() where id = v_conv;
    select nullif(split_part(btrim(coalesce(display_name, '')), ' ', 1), '') into v_first from public.users where id = v_me;
    select value::uuid into v_owner from public.cha_config where key = 'amit_owner_id';
    select coalesce(nullif(btrim(display_name), ''), 'the owner') into v_owner_name from public.users where id = v_owner;
    v_body := case when v_first is not null then 'Hi ' || v_first || ', I''m Amit.' else 'Hi, I''m Amit.' end || ' I''m here and listening.'
           || case when v_page is not null then ' I see you''re on the ' || v_page || ' page.' else '' end
           || ' What can I help you with today?';
    insert into public.cha_messages (conversation_id, sender_id, body, payload)
    values (v_conv, v_amit, v_body, jsonb_build_object('via', v_owner, 'via_name', coalesce(v_owner_name, 'the owner'), 'greeting', true));
    v_greeted := true;
  end if;
  select number into v_num from public.cha_conversations where id = v_conv;
  return jsonb_build_object('id', v_conv, 'number', v_num, 'created', v_new, 'greeted', v_greeted, 'listening', true, 'day', v_day, 'online', public.cha_amit_online());
end $$;

-- the Hub's own Ask Amit chat is the one WITHOUT a day mark (same bodies as _016 and _017, plus that one filter)
create or replace function public.cha_help_chat(p_app text default 'hub')
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_me uuid := auth.uid(); v_amit uuid := public.cha_amit_id(); v_conv uuid; v_num bigint; v_new boolean := false;
begin
  if v_me is null then raise exception 'not signed in'; end if;
  perform public.cha_require_age();
  if public.cha_age_class(v_me) = 'minor' then raise exception 'Ask Amit chats are for adults for now.'; end if;
  if v_amit is null then raise exception 'Amit is not set up yet.'; end if;
  select c.id into v_conv from public.cha_conversations c
    join public.cha_participants p on p.conversation_id = c.id and p.user_id = v_me and p.status = 'accepted'
   where c.purpose = 'help' and c.created_by = v_me and c.delete_requested_at is null and not coalesce(c.origin ? 'day', false)
   order by c.created_at limit 1;
  if v_conv is null then
    insert into public.cha_conversations (title, kind, purpose, created_by, origin)
    values ('Ask Amit', 'personal', 'help', v_me, jsonb_build_object('app', left(coalesce(nullif(btrim(p_app), ''), 'hub'), 40)))
    returning id into v_conv;
    insert into public.cha_participants (conversation_id, user_id, invited_by, role, status) values (v_conv, v_me, v_me, 'owner', 'accepted');
    insert into public.cha_participants (conversation_id, user_id, invited_by, role, status) values (v_conv, v_amit, v_me, 'member', 'accepted');
    v_new := true;
  end if;
  select number into v_num from public.cha_conversations where id = v_conv;
  return jsonb_build_object('id', v_conv, 'number', v_num, 'created', v_new);
end $$;

create or replace function public.cha_help_open(p_app text default 'hub', p_page text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid(); v_amit uuid := public.cha_amit_id(); v_conv uuid; v_num bigint; v_new boolean := false; v_was boolean := false;
  v_owner uuid; v_owner_name text; v_first text; v_page text := nullif(btrim(regexp_replace(left(coalesce(p_page, ''), 60), '[^A-Za-z0-9 ]', '', 'g')), ''); v_body text; v_greeted boolean := false;
begin
  if v_me is null then raise exception 'not signed in'; end if;
  perform public.cha_require_age();
  if public.cha_age_class(v_me) = 'minor' then raise exception 'Ask Amit chats are for adults for now.'; end if;
  if v_amit is null then raise exception 'Amit is not set up yet.'; end if;
  select c.id into v_conv from public.cha_conversations c
    join public.cha_participants p on p.conversation_id = c.id and p.user_id = v_me and p.status = 'accepted'
   where c.purpose = 'help' and c.created_by = v_me and c.delete_requested_at is null and not coalesce(c.origin ? 'day', false)
   order by c.created_at limit 1;
  if v_conv is null then
    insert into public.cha_conversations (title, kind, purpose, created_by, origin)
    values ('Ask Amit', 'personal', 'help', v_me, jsonb_build_object('app', left(coalesce(nullif(btrim(p_app), ''), 'hub'), 40)))
    returning id into v_conv;
    insert into public.cha_participants (conversation_id, user_id, invited_by, role, status) values (v_conv, v_me, v_me, 'owner', 'accepted');
    insert into public.cha_participants (conversation_id, user_id, invited_by, role, status) values (v_conv, v_amit, v_me, 'member', 'accepted');
    v_new := true;
  end if;
  select coalesce(amit_listening, false) into v_was from public.cha_conversations where id = v_conv;
  if not v_was then
    update public.cha_conversations set amit_listening = true, amit_listening_by = v_me, amit_listening_at = now(), amit_looked_at = now() where id = v_conv;
    select nullif(split_part(btrim(coalesce(display_name, '')), ' ', 1), '') into v_first from public.users where id = v_me;
    select value::uuid into v_owner from public.cha_config where key = 'amit_owner_id';
    select coalesce(nullif(btrim(display_name), ''), 'the owner') into v_owner_name from public.users where id = v_owner;
    v_body := case when v_first is not null then 'Hi ' || v_first || ', I''m Amit.' else 'Hi, I''m Amit.' end || ' I''m here and listening.'
           || case when v_page is not null then ' I see you''re on the ' || v_page || ' page.' else '' end
           || ' What can I help you with today?';
    insert into public.cha_messages (conversation_id, sender_id, body, payload)
    values (v_conv, v_amit, v_body, jsonb_build_object('via', v_owner, 'via_name', coalesce(v_owner_name, 'the owner'), 'greeting', true));
    v_greeted := true;
  end if;
  select number into v_num from public.cha_conversations where id = v_conv;
  return jsonb_build_object('id', v_conv, 'number', v_num, 'created', v_new, 'greeted', v_greeted, 'listening', true, 'online', public.cha_amit_online());
end $$;

revoke all on function public.cha_help_open_day(text, text, text), public.cha_help_chat(text), public.cha_help_open(text, text) from public, anon;
grant execute on function public.cha_help_open_day(text, text, text), public.cha_help_chat(text), public.cha_help_open(text, text) to authenticated, service_role;
