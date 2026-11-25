-- migration_2026-11-24_053_hel_questions_suggested_DRAFT.sql
-- DRAFT, NOT RUN (written 2026-11-24). Needs migrations 051 and 052 first (both already run). Only ADDS columns; nothing existing is changed.
-- Ryan/Robin run this by hand in the Supabase dashboard SQL editor. One batch: if a statement fails, none of it is kept.
-- Why (AmitHelper\Button_Creator_SPEC.md section 11):
--   1. While Amit builds a button he may RECOMMEND a question the script needs: a row with status 'suggested' that is not asked at press time until the person adds it.
--      added_by says who made the row, why is the reason shown to the person, script_needs marks a question the script cannot run without.
--   2. Each script version remembers its own question list (question_snapshot), so "put it back" restores the questions too.
--   3. A button can be based on a J or F shortcut (source_shortcut_id, optional).
--   4. A person-level switch: let Amit add questions himself (off by default; recommending is the default).

alter table public.hel_button_questions
  add column if not exists status       text not null default 'active' check (status in ('active','suggested')),
  add column if not exists added_by     text not null default 'person' check (added_by in ('person','amit')),
  add column if not exists why          text check (why is null or char_length(why) <= 300),
  add column if not exists script_needs boolean not null default false;

alter table public.hel_button_scripts
  add column if not exists question_snapshot  jsonb not null default '[]'::jsonb check (jsonb_typeof(question_snapshot) = 'array'),
  add column if not exists source_shortcut_id uuid references public.amit_shortcuts(id) on delete set null;

alter table public.hel_settings
  add column if not exists let_amit_add_questions boolean not null default false;

notify pgrst, 'reload schema';

-- To undo (not part of the migration):
--   alter table public.hel_button_questions drop column if exists status, drop column if exists added_by, drop column if exists why, drop column if exists script_needs;
--   alter table public.hel_button_scripts drop column if exists question_snapshot, drop column if exists source_shortcut_id;
--   alter table public.hel_settings drop column if exists let_amit_add_questions;
