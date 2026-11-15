# Templates - To-Do and Open Items

Built 2026-11-13 from CLAUDE.md. Only items found in the source; none invented. Dates in [brackets] are the source entry dates where one exists.

## Master and sub template (decided, not built)
- Build Stage 1: shared master files (amit_master.js and amit_master.css proposed) plus a sub template; decisions needed from Ryan: names, whether the Hub moves onto it, whether Stage 2 (persistent shell) is wanted, which app moves first (AmitFix proposed). [2026-10-26]
- When a global change is made to template.html, list the apps and the Hub that need the same change by hand (standing, until the master exists). [2026-10-26]

## Mechanisms not finished
- Run the Supabase migration for the template_pages table (a pending-migration note; later text says signed-in pages use it) (unsure if finished). [2026-08-06] (also CLAUDE.md: table required, migration pending Ryan's run)
- Named/saved Row View sort+filter combinations; Detail View drills only one layer. [2026-08-04]
- Day View: Daily Walk button and Add Reflection link are inert placeholders. [2026-08-06]
- Let a paying AmitCoder user reorder their own app pages through the assistant (forward-looking, unbuilt). [2026-08-04]

## Multi-Row Tab View
- Not tested with a real signed-in About Me theme change. [2026-10-16]
- Devotions fetches TemplateViews.html relative to its own folder (404), so importing other layouts through its Add Page fails; noticed, not changed. [2026-10-16]

## Library growth
- Add new templates when identified: pursuit entry, session log, God Talk entry. (no date)

## Resolved (kept so the judgment can be checked)
- Multi-Row Tab View registration in template.html: noted as "not done" then done the same day. [2026-10-16]
- Tab reordering bug, sidebar sizing, page icon alignment, Demo mode, Calendar/Day View fixes: recorded as fixed and live-tested. [2026-08-04 to 2026-08-06]
- Alt+N page shortcuts: removed on purpose. [2026-08-06]


## FROM CLAUDE.md (captured 2026-11-14)

### Open items mentioned inside status/history sections (unsure if finished)
- **Sidebar display order is decoupled from page identity (added 2026-08-04, Ryan's direct instruction).** `template.html`'s `buildPlaceholders()` builds a `PAGE_ORDER` array — the *only* thing that controls sidebar page position — separate from each page's number, which stays fixed forever once rea ...
- **Row View and Detail View — the template's other two built-in layout types (added 2026-08-04, Ryan's direct instruction), alongside Tabbed View.** Page 3 is now **Row View**: an Excel-style table (`RV_SAMPLE_COLUMNS`/`RV_SAMPLE_ROWS` sample data) — single-click a column header to sort (toggle asc ...
- **Sign In/Out + Sync moved from the header into the right rail, below Ask Amit (added 2026-08-06, Ryan's direct instruction).** Removed entirely from the header's top-right corner (relocated, not duplicated) and rebuilt as a second `.page-nav` rail item, right after Ask Amit. Icon toggles 🔒 (sign ...


## FROM THE HUB PURSUITS (added 2026-11-14; nothing was changed in the Hub)
- DESIGN — Fix the same popup-blocker/goToHub bug in Templates	emplate.html and TemplateViews.html so future projects don't inherit it [PP5] - Fix the popup-blocker/goToHub bug in template.html and TemplateViews.html so new projects do not inherit it. [hub:7f01c57d-3a5c-4d9c-a44e-c7ada21aeacb]
