# AmitRoll - Design and tables

Read the section '## Tables' first when you only need the database tables. The other sections (if any) describe how the project is built; read them only when working on that part.

## Tables

# Tables used by this project (copied from CLAUDE.md 2026-11-14)

**Table prefix (per the root DATABASE TABLE NAMING CONVENTION):** `Rol_` — the first three letters of "Roll." Every new AmitRoll table is `Rol_<Name>`, and every migration that creates one includes its Data API GRANT statements in the same file (root DATABASE TABLE DATA-API GRANTS section).

**Tables this project uses:** none yet. Expected: player profiles under a parent/owner login, game results, per-player level and rating history, saved Best Play records.

**Tables this project does NOT touch:** accounting tables (AmitBooks), AmitChat tables, Hub pursuit tables except through the pursuit-attribution rule below.

