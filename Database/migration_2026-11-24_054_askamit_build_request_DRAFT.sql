-- migration_2026-11-24_054_askamit_build_request_DRAFT.sql
-- DRAFT, NOT RUN (written 2026-11-24). Needs the AskAmit migrations _045 to _049 (already run). Adds ONE new function; nothing existing is changed.
-- Ryan/Robin run this by hand in the Supabase dashboard SQL editor. One batch.
-- Why: the Hub's "Ask Amit to create" on a custom script button sends a BUILD REQUEST (the button's setup, its questions, the current script and the person's words). ask_submit cuts a question at 4,000
-- characters, which is too short for a script. This function files the same kind of row in ask_requests (so the same engine answers it, in "build" mode, engine v1.08) with a longer limit.
-- DEVELOPMENT MODE (spec section 11.3): only the owner may use it for now (Ryan, and Robin who acts as Ryan). When a person's own Claude account can answer, this check is the one place to relax.
-- The reply comes back through the existing ask_status(p_id), which already lets the person who asked (and the owner) collect it. The engine's reply limit stays 20,000 characters.

create or replace function public.ask_submit_build(p_place jsonb default '{}'::jsonb, p_question text default '', p_tz text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_me uuid := auth.uid(); v_q text := btrim(coalesce(p_question, '')); v_id uuid;
begin
  if v_me is null then raise exception 'Please sign in first.'; end if;
  if not public.cha_is_owner() then raise exception 'Building buttons with Ask Amit is limited to the owner while it is in development.'; end if;
  if length(v_q) = 0 then raise exception 'The build request is empty.'; end if;
  if length(v_q) > 40000 then raise exception 'The build request is too long.'; end if;
  if pg_column_size(coalesce(p_place, '{}'::jsonb)) > 2000 then raise exception 'That place is too long.'; end if;
  insert into public.ask_requests (person, app, place, reply_style, question, tz)
  values (v_me, 'hub-button-build', coalesce(p_place, '{}'::jsonb), 'chat', v_q, left(p_tz, 64))
  returning id into v_id;
  return jsonb_build_object('id', v_id, 'online', public.ask_online());
end $$;

revoke all on function public.ask_submit_build(jsonb, text, text) from public, anon;
grant execute on function public.ask_submit_build(jsonb, text, text) to authenticated;

comment on function public.ask_submit_build(jsonb, text, text) is 'AskAmit: the Hub files a custom script button BUILD REQUEST (long question, owner only while in development). Answered by the engine in build mode. Added 2026-11-24.';

notify pgrst, 'reload schema';

-- To undo (not part of the migration):
--   drop function if exists public.ask_submit_build(jsonb, text, text);
