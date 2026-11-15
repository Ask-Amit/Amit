# Ten Commandments - Design and tables

Read the section '## Tables' first when you only need the database tables. The other sections (if any) describe how the project is built; read them only when working on that part.

## Tables

# Tables used by this project

Tables used by this project (copied from CLAUDE.md 2026-11-14)

**Tables this project uses:**
- `hub_entries` — the daily prayer, growth pursuits, and "Where we left off" entries tied to each God Talk session
- `amit_sessions` — session log entries for each commandment study
- `amit_daily` — the day's Hebrew word, often thematically tied to the commandment studied
- `directors_chair` (renamed from `module_registry` 2026-07-11) — the `god_talk_commandments` row registers this project; `content_table_name` is planned as `god_talk_content` (not yet built — see Database's Director's Chair pursuit)
- `dev_playbook` — query before re-investigating any settled cross-session question (e.g. how schema changes actually get made)

**Tables this project does NOT touch:**
- `accounting_*` tables (AmitAccounting's domain)
- Any future AmitHealth tables (medical data, separate sensitivity tier)
