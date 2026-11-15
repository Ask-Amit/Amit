# Devotions - Design and tables

Read the section '## Tables' first when you only need the database tables. The other sections (if any) describe how the project is built; read them only when working on that part.

## Tables

# Tables used by this project (copied from CLAUDE.md 2026-11-14)

**Tables this project uses:**
`hub_entries` (pursuits stamped `program='Devotions'`), `template_pages` (if the Add Page mechanism is ever used here) — same shared tables as every other project, no dedicated Songs tables yet.

**Tables this project does NOT touch:**
Every accounting/AmitBooks table, `medical_prep_progress`, `amit_shortcuts` (write access — read-only like any project).
