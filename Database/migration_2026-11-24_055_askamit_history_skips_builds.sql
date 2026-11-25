-- migration_2026-11-24_055_askamit_history_skips_builds.sql
-- Found 2026-11-24 (first real use of custom script buttons): BUILD REQUESTS (app 'hub-button-build', the long messages the Hub sends when Amit builds a script button)
-- were counted as part of the person's chat history, in two places: (1) ask_context, the history the answering Amit reads before every chat answer, and (2) ask_my_history, the
-- earlier questions shown in the person's Ask Amit box. So the chat Amit saw script-building messages and answered a plain question ("help me with the new import button")
-- as if a build request was missing, and the build messages would have shown up in the person's chat box.
-- Fix: both functions leave app 'hub-button-build' out. Nothing else changes (create or replace keeps the grants). Run by hand in the Supabase SQL editor, one batch.

create or replace function public.ask_context(p_ask uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare a public.ask_requests; v_name text; v_hist jsonb;
begin
  if not public.cha_is_owner() then raise exception 'not allowed'; end if;
  select * into a from public.ask_requests where id = p_ask;
  if not found then raise exception 'That question was not found.'; end if;
  if a.person is not null then select nullif(btrim(display_name), '') into v_name from public.users where id = a.person; end if;
  select coalesce(jsonb_agg(h.j order by h.created_at), '[]'::jsonb) into v_hist from (
    select r.created_at, jsonb_build_object('at', r.created_at, 'q', left(r.question, 1500), 'a', left(coalesce(r.answer, ''), 1200)) as j
      from public.ask_requests r
     where r.id <> a.id and r.status = 'answered' and r.created_at < a.created_at and r.answer_format = 'text'
       and r.app is distinct from 'hub-button-build'
       and ((a.person is not null and r.person = a.person) or (a.person is null and r.guest_id = a.guest_id))
     order by r.created_at desc limit 6) h;
  return jsonb_build_object(
    'ask', jsonb_build_object('id', a.id, 'at', a.created_at, 'person', a.person, 'guest', a.person is null, 'app', a.app, 'place', a.place,
                              'style', a.reply_style, 'question', a.question, 'tz', a.tz, 'account', a.account, 'last_free', a.last_free, 'left_after', a.left_after,
                              'visitor_n', a.visitor_n),
    'name', v_name, 'history', v_hist,
    'visitor_limits', jsonb_build_object('app', public.ask_cfg_int('guest_asks_each', 5), 'signup', public.ask_cfg_int('signup_asks_each', 5)),
    'visitor_msgs', jsonb_build_object(
      'warn', coalesce((select value from public.ask_config where key = 'visitor_warn_message'), ''),
      'limit', public.ask_visitor_message(),
      'signup_warn', coalesce((select value from public.ask_config where key = 'visitor_signup_warn_message'), ''),
      'final', public.ask_visitor_final_message()));
end $$;

create or replace function public.ask_my_history(p_limit int default 12)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_me uuid := auth.uid();
begin
  if v_me is null then return '[]'::jsonb; end if;
  return coalesce((select jsonb_agg(h.j order by h.at) from (
    select r.created_at as at, jsonb_build_object('id', r.id, 'at', r.created_at, 'q', left(r.question, 1500), 'a', left(coalesce(r.answer, ''), 6000)) as j
      from public.ask_requests r where r.person = v_me and r.status = 'answered' and r.answer_format = 'text' and r.app is distinct from 'hub-button-build'
     order by r.created_at desc limit greatest(1, least(coalesce(p_limit, 12), 30))) h), '[]'::jsonb);
end $$;

notify pgrst, 'reload schema';

-- To undo: re-run the two functions from migration _048 (ask_context) and _049 (ask_my_history).
