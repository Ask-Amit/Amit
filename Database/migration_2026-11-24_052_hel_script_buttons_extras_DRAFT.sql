-- migration_2026-11-24_052_hel_script_buttons_extras_DRAFT.sql
-- DRAFT, NOT RUN (written 2026-11-24). Needs migration 051 (hel_script_buttons) first. Only ADDS three small columns; nothing existing is changed.
-- Ryan/Robin run this by hand in the Supabase dashboard SQL editor. Runs as one batch: if a statement fails, none of it is kept.
-- Why: found while checking that every part of the press-time pop-up has somewhere to live (see AmitHelper\Previews\AmitHelper_buttonpopup_preview.html).
--   1. how many seconds the "Sending in 5... Cancel" countdown lasts
--   2. how many minutes the "Undo" stays offered after a run
--   3. where a question's choices come from: typed in by hand ('fixed'), supplied by the script when it runs ('script', e.g. folders or spreadsheet tabs),
--      or the person's connected accounts ('connections', for the later sign-in store; no behavior yet, the value is allowed now so the check never has to change)

alter table public.hel_settings
  add column if not exists send_countdown_seconds integer not null default 5  check (send_countdown_seconds between 0 and 30),
  add column if not exists undo_window_minutes    integer not null default 10 check (undo_window_minutes between 0 and 60);

alter table public.hel_button_questions
  add column if not exists choices_source text not null default 'fixed' check (choices_source in ('fixed','script','connections'));

notify pgrst, 'reload schema';

-- To undo (not part of the migration):
--   alter table public.hel_settings drop column if exists send_countdown_seconds, drop column if exists undo_window_minutes;
--   alter table public.hel_button_questions drop column if exists choices_source;
