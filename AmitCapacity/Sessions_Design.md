# AmitCapacity - Design and tables

Read the section '## Tables' first when you only need the database tables. The other sections describe how the project is built; read them only when working on that part.

## Tables

Tables used by this project (copied from CLAUDE.md 2026-11-14)

**Tables this project uses:**
- `cap_entries` (this project's own; table prefix `Cap_`): the recorded conversation between the desktop Amit and the online Amit, one row per entry. Written only by the desktop Amit with the service key. Read by the owner, and by anyone only where `is_public` is true.
- `cha_ask_usage` (AmitChat's table, read only): the exact token counts Ask Amit recorded for each answer. A signed-in person sees only their own rows (RLS), which is what the Receipts tab shows.

**Tables this project does NOT touch:**
Everything else. This project never writes to another app's table.
---
