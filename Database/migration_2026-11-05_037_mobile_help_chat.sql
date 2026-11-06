-- AmitChat / Amit Live: a NEW numbered "Mobile #N" Ask Amit chat for each photo sent from the phone through Show Amit (Ryan, 2026-11-05).
-- Run ONCE in the Supabase SQL editor, AFTER _033.
--  * cha_help_open_mobile(app, label): ALWAYS makes a new Ask Amit chat for the person, titled "Mobile #N - <label>" (N = how many Mobile chats they have had, plus one;
--    label = the date and time the Amit Live window sends, e.g. "Nov 5, 3:40 PM"). Amit is a member and switched on; his greeting is posted as the first message.
--  * It is a normal help chat (purpose 'help': every message sent in it is a question to Amit), marked origin.source = 'mobile' and origin.mobile_no = N.
--    origin.day is set to 'mobile-N' on purpose: the Hub's own Ask Amit chat (cha_help_chat / cha_help_open) and the per-day chat (cha_help_open_day) already skip or never match a chat
--    with that mark, so NO existing function is changed and the Hub's running chat is untouched.
--  * No new table, so no new grants beyond the function grants below.

create or replace function public.cha_help_open_mobile(p_app text default 'amitlive', p_label text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid(); v_amit uuid := public.cha_amit_id(); v_conv uuid; v_num bigint; v_mobile bigint;
  v_owner uuid; v_owner_name text; v_first text; v_body text;
  v_label text := nullif(btrim(regexp_replace(left(coalesce(p_label, ''), 40), '[^A-Za-z0-9 :,.-]', '', 'g')), '');
begin
  if v_me is null then raise exception 'not signed in'; end if;
  perform public.cha_require_age();
  if public.cha_age_class(v_me) = 'minor' then raise exception 'Ask Amit chats are for adults for now.'; end if;
  if v_amit is null then raise exception 'Amit is not set up yet.'; end if;
  select count(*) + 1 into v_mobile from public.cha_conversations c where c.created_by = v_me and c.origin ->> 'source' = 'mobile';
  insert into public.cha_conversations (title, kind, purpose, created_by, origin)
  values ('Mobile #' || v_mobile || ' - ' || coalesce(v_label, to_char(now(), 'FMMon FMDD')), 'personal', 'help', v_me,
          jsonb_build_object('app', left(coalesce(nullif(btrim(p_app), ''), 'amitlive'), 40), 'day', 'mobile-' || v_mobile, 'source', 'mobile', 'mobile_no', v_mobile))
  returning id into v_conv;
  insert into public.cha_participants (conversation_id, user_id, invited_by, role, status) values (v_conv, v_me, v_me, 'owner', 'accepted');
  insert into public.cha_participants (conversation_id, user_id, invited_by, role, status) values (v_conv, v_amit, v_me, 'member', 'accepted');
  update public.cha_conversations set amit_listening = true, amit_listening_by = v_me, amit_listening_at = now(), amit_looked_at = now() where id = v_conv;
  select nullif(split_part(btrim(coalesce(display_name, '')), ' ', 1), '') into v_first from public.users where id = v_me;
  select value::uuid into v_owner from public.cha_config where key = 'amit_owner_id';
  select coalesce(nullif(btrim(display_name), ''), 'the owner') into v_owner_name from public.users where id = v_owner;
  v_body := case when v_first is not null then 'Hi ' || v_first || ', I''m Amit.' else 'Hi, I''m Amit.' end
         || ' I have the photo from your phone. I''m here and ready to help you work through it. What would you like to know?';
  insert into public.cha_messages (conversation_id, sender_id, body, payload)
  values (v_conv, v_amit, v_body, jsonb_build_object('via', v_owner, 'via_name', coalesce(v_owner_name, 'the owner'), 'greeting', true));
  select number into v_num from public.cha_conversations where id = v_conv;
  return jsonb_build_object('id', v_conv, 'number', v_num, 'mobile_no', v_mobile, 'created', true, 'greeted', true, 'listening', true, 'online', public.cha_amit_online());
end $$;

revoke all on function public.cha_help_open_mobile(text, text) from public, anon;
grant execute on function public.cha_help_open_mobile(text, text) to authenticated, service_role;
