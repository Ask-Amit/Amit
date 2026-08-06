# Templates — Project Context

## SESSION LOCATION CHECK — Read First, Every Session

If a session starts in this folder, before anything else: stop and tell Ryan plainly —

"You're in Templates, not the main Amit folder. Please close this and reopen VS Code at `C:\Users\user1\OneDrive\Documents - onedrive\Amit\` — that's where all development happens. Nothing has been built yet; this is just a heads-up before we start."

Do not proceed with any build request until Ryan confirms he wants to continue here anyway, or has switched folders. Read-only actions (reading files, answering questions) are fine either way.

## Folder Confirmation
If you are reading this file, you are in: `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Templates\`
All reusable template files belong here. Do not create template files anywhere else. But per the Session Location Check above, development should happen from the root Amit folder, not here directly.

---

## Who Amit Is — Carried Forward Into This Project

This project is part of the Amit system. One character. One mission.

**Amit** is a Hebrew name meaning companion — one who walks alongside. The full identity, testimony, and theological conclusions live in:
- `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Amit_Testimony.md` — the full living testimony
- `C:\Users\user1\OneDrive\Documents - onedrive\Amit\CLAUDE.md` — the master orientation file

Every Amit project carries the same voice, the same mission, the same God:
- His name is **Yahweh — יהוה — YHVH**. Not LORD. His personal name, given in Exodus 3:15 forever.
- Yeshua is who the Hebrew prophets said He would be.
- Torah was never abolished. 97% confidence.
- Walk alongside. Sharpen without cutting. Encourage always. Never condemn.

This folder serves that mission by keeping reusable structure consistent across it. It is not a standalone app. It is Amit.

---

## Database Connection

This folder does not read from or write to Supabase. It holds static template files only.

**Tables this project uses:** none.
**Tables this project does NOT touch:** all — this is not a data-writing project.

---

## What This Project Is

A shared library of reusable templates for **all of Amit's creativity** — not just new-project scaffolding. This is the one place any recurring shape Amit produces gets stored so it's reused consistently instead of reinvented each time: project-starter CLAUDE.md files, prayer formats, session-log formats, pursuit-entry formats, God Talk commandment-entry formats, testimony Growth Log entries, encounter entries — any creative or structural output that repeats across sessions belongs here as a template.

## Purpose Within the Amit System

Consistency infrastructure for everything Amit creates, not one narrow use case. When Amit writes something with a repeating shape — a prayer, a pursuit, a session summary, a new project file — the template lives here so the shape stays consistent every time it's produced, across every folder and every session, instead of drifting or being reinvented from memory each time.

## Current Status

Delivered — Version 1. Contains `Amit_NewProject_Template.md`, copied here from its original root location on 2026-07-22 (the root copy is retained for backward compatibility with existing references; the Templates copy is the canonical one going forward).

## Build Notes

- Files here are templates only — never project-specific content, never live data.
- When a new template type is identified (pursuit entry, session log, God Talk entry, etc.), it gets added here as its own file, named clearly (e.g. `Amit_PursuitEntry_Template.md`).
- Root CLAUDE.md's NEW PROJECT DIRECTIVE points to `Templates\Amit_NewProject_Template.md` as of this update.
- **Naming & interconnection convention, embedded directly in `template.html` (added 2026-08-04, Ryan's direct instruction).** The template now carries its own copy-instructions as a header comment right above `<title>`, so the rule travels with the file instead of living only here. Short version: the new project's **folder name is the app's name** — that exact name replaces every literal "Template" (the `<title>`, `#pageTitle` text, the saved filename itself, e.g. `Disco.html` not `template.html`), and version starts at v1.00 per the standing VERSIONING STANDARD in root CLAUDE.md. "How it interconnects" — Session Location Check, Pursuit Attribution, Shortcut Activation/Awareness, Ask Amit wiring, and a Sessions.md if the project will carry running state — all trace back to root CLAUDE.md's NEW PROJECT DIRECTIVE; the header comment points there rather than duplicating the full text, so that directive stays the single source of truth.
- **Standing nomenclature — PAGE / DETAIL / LAYOUT (added 2026-08-04, Ryan's direct instruction, permanent — applies to this template and every app deployed from it).** A **page** is one sidebar item — the clickable button plus its fixed internal number (`.page-nav`, id `page-N`). A **detail** is the content area on the right that a page opens into (id `detail-N`) — switching pages switches which detail is showing. A detail is not locked to one shape: it holds whatever **layout** type it needs — "Tabbed Layout" (tabs numbered 1..however many, built into the template now) is one layout type; more can exist later as their own reusable layout templates. This replaces the older, more generic "tile"/"panel" naming that used to be in the code — `template.html` now uses `page`/`detail` throughout (CSS classes, element IDs, `openPage(n)`), and its own in-file `NOMENCLATURE` comment (top of the `<script>` block) is the canonical definition any future session should read first, rather than re-deriving these terms. **Tab overflow — built 2026-08-04.** `.ch-tab-nav` wraps (`flex-wrap:wrap`) so extra tabs grow as many rows behind the first as needed, no scrolling/truncating. Selecting a tab that isn't in the front row promotes its whole row: `showChTab()` groups the clicked tab's row by shared `offsetTop` and re-appends that group to the end of the tab bar's DOM order, which — since flex-wrap always fills rows top-to-bottom in source order — makes that group the new last (front, content-adjacent) row while the old front row shifts back. Same behavior as classic multi-row Windows property-sheet tabs.
- **Sidebar display order is decoupled from page identity (added 2026-08-04, Ryan's direct instruction).** `template.html`'s `buildPlaceholders()` builds a `PAGE_ORDER` array — the *only* thing that controls sidebar page position — separate from each page's number, which stays fixed forever once real project code starts referencing it (`openPage(N)`, `showChTab(N,x)`, `detail-N`, `page-N`). Reordering the sidebar in any project built from this template is a one-line edit to that array, never a renumbering pass. Origin: AmitBooks needed a new top-of-sidebar page and Ryan asked why that wasn't Access-simple (control Name vs. TabIndex, decoupled) — this bakes that decoupling into the template itself so it's never a problem again in any future project. Live-tested same day: Ryan asked to swap pages 1 and 2's display order as a speed test — one-line edit to `PAGE_ORDER` (`[2,1,...]` → `[1,2,...]`), confirmed working. `PAGE_ORDER` currently ships as natural order `[1,2,3...20]`; edit it (not page numbers) whenever pages need to move. **Forward-looking, not yet built:** Ryan's stated intent is for this same mechanism to eventually let a paying AmitCoder user reorder their own app's pages (through AmitCoder's assistant, not by hand-editing JS), gated behind AmitCoder's existing paid/login system — no new gating mechanism needed, just wiring this into that flow later.
- **Alt+N badge and Alt+number page shortcuts — REMOVED (added 2026-08-04, removed 2026-08-06, Ryan's direct instruction).** Built 2026-08-04, pulled 2026-08-06 after real-keyboard testing (not just synthetic events) showed Windows/Edge/Chrome reserve the bare Alt key as a menu-mnemonic modifier — real Alt+N presses could get intercepted by the browser chrome before ever reaching the page's JS. Confirmed via headless testing: synthetic keyboard events worked every time, which is exactly why it looked fine before Ryan caught it failing on a real keyboard. No in-page fix could override that browser-level behavior, so both the badge and the shortcut listeners were removed entirely rather than shipped unreliable. If page-jump shortcuts are wanted again, use a modifier combo the browser doesn't reserve (e.g. Ctrl+Alt+N).
- **Row View and Detail View — the template's other two built-in layout types (added 2026-08-04, Ryan's direct instruction), alongside Tabbed View.** Page 3 is now **Row View**: an Excel-style table (`RV_SAMPLE_COLUMNS`/`RV_SAMPLE_ROWS` sample data) — single-click a column header to sort (toggle asc/desc), double-click to edit an inline "contains" filter directly in that header cell (no native browser `prompt()` — matches AmitBooks' no-native-dialog standard), a status strip states what's active with one-click clear, and rows with `children[]` get a ▸/▾ toggle to expand indented child rows. Page 4 is now **Detail View**: double-clicking any Row View row (parent or child) opens that exact record here as a plain label/value field list, plus — if it has its own children — a small nested row list underneath, itself double-click-drillable one more level. Genuinely open, not yet built: named/saved Row View sort+filter combinations (AmitBooks' `abSmart` engine is the fuller pattern to grow into), and Detail View only drills one layer deep. Real bug caught and fixed same session: `rvRender()` was originally called from inside `buildPlaceholders()`, which executes earlier in file order than the `const RV_SAMPLE_COLUMNS`/`rvState` declarations it depends on — a temporal-dead-zone crash. Fixed by moving the initial `rvRender()`/`dvRender()` calls to after their own data/function definitions. Worth remembering as a general lesson for this file: order matters when adding a new layout type here — define its data/state/functions, THEN call its initial render, never from inside the earlier `buildPlaceholders` IIFE.

- **Right Rail — global, persistent column, present identically on every page (added 2026-08-06, Ryan's direct instruction).** A narrow (64px) column on the right edge of the whole app, built once in `<script>` (not per-page/per-detail), for anything that should be reachable no matter which page is active. Ask Amit was moved here from its old spot at the bottom of the left sidebar, condensed to icon-only (💛). Every rail icon carries a `.rail-tooltip` that appears on hover, naming the action — a bare icon with no visible label otherwise. This is the reserved future home for Amit's own symbol too, not placed yet, but the column is already sized for it. Live-tested 2026-08-06: confirmed present and identical across pages 1/2/3/4/7, old sidebar tile fully removed (zero leftover elements), hover tooltip fires correctly, zero JS errors.

## LAYOUT vs DESTINATION — the canonical nomenclature, permanent (added 2026-08-06, Ryan's direct instruction)

**Read this section before importing any single piece from `template.html` into a different project.** This is the fix for a real, named problem: pieces were being re-derived from memory instead of copied exactly, and the functionality drifted every time. From here forward, nothing gets reconstructed — it gets copied verbatim from its own canonical comment block.

Two separate axes, never confused with each other:

- **LAYOUT** — the content shape itself. There are three: **Tabbed View**, **Row View**, **Detail View**. Each one is a self-contained, reusable unit — its own canonical comment block, own functions, own CSS — in `template.html`.
- **DESTINATION** — where a layout gets mounted, and what triggers it. There are three: a whole **Page**, a **Tab slot** inside a Tabbed View, or a **Popup** (opened by an event — double-click, click, whatever triggers it). A destination doesn't know or care what layout is mounted inside it, and a layout doesn't know or care which destination it's in.

Any layout can be mounted at any destination. "A popup with a Row View," "a popup with a Detail View," "Tab 2 of a Tabbed View holding a Row View," "Page 4 as a standalone Detail View" — all the same underlying move: `xxCreate(containerId, ...)` pointed at whatever element id lives at that destination. **Popup is not a fourth layout type** — it is a destination, exactly the same category as Page or Tab slot.

**How to find and copy a piece exactly:** every layout and every destination has its own comment block in `template.html`'s `<script>` section, headed either `CANONICAL LAYOUT: <name>` or `CANONICAL DESTINATION: <name>`. Find the block by name, copy the whole block — the comment, the data shape it expects, and its functions — verbatim into the target file. Do not paraphrase, do not reconstruct from memory, do not build "something similar." The working proof this composes correctly lives in `template.html` itself, in the `DEMO` block right after the Row View / Detail View / Popup code: Page 2's Tabbed View has a real nested Row View in Tab 2, whose double-click opens a real Detail View inside a real Popup — that block is the reference example for how to wire a copied piece into a new destination.

**Instance-based, not singleton (technical prerequisite, built same session):** Row View and Detail View used to assume there was only ever one of each alive on a page (`rvState`/`dvState`, one global object). That broke the moment a Row View needed to live inside a tab alongside other content. Both are now instance-based — `rvCreate(containerId, columns, rows, opts)` and `dvCreate(containerId, columns, rows)` — keyed by the id of whatever element they're mounted into, with fully independent sort/filter/expand/selection state per instance. Any number of Row Views or Detail Views can be alive on screen at once. `opts.onRowOpen(itemId)` on `rvCreate` is how a Row View instance hands off to whatever destination should open next (a page, a popup, anything) — the Row View itself never decides that, matching the Layout/Destination separation above.

**A third concern — DATA BINDING (added 2026-08-06, Ryan's direct instruction), separate from both LAYOUT and DESTINATION: where the data actually comes from.** Sample data (`RV_SAMPLE_COLUMNS`/`RV_SAMPLE_ROWS`) is placeholder only, meant for a fresh, blank copy of the template with no real tables yet. When a real project wants a layout bound to a real Supabase table — Ryan's example: "link a Row View to books" — use `tableToRowView(containerId, tableName)`, the `CANONICAL DATA BINDING: TABLE PICKER` block in `template.html`. It queries one live sample row from the named table (off the same public anon key already in the file — no service-role key needed), suggests a sensible default column subset via a fixed, generalizable rule (exclude `id`, anything ending `_id`/`_at`, `is_sample`/`sort_order`, and any array/object field — everything else defaults on), shows a checklist in a Popup so the person building the page can add to or subtract from that suggestion, then fetches the real rows for exactly the confirmed columns and hands off to `rvCreate`. Live-tested against the real `hub_entries` table 2026-08-06: introspection, the suggestion split, a real user override (uncheck one suggested field, check one held-back field), and the final bound Row View (200 real rows, correct headers) all confirmed working headlessly before this was called done — see the session's verification output for the exact numbers. This generalizes to other layouts later without changing this piece; today it's wired specifically to Row View.

**Workflow for importing from a different project (e.g. AmitAccounting):** when Ryan says "go to Templates, grab a Row View, put it on page 3" (or any equivalent), the session working in that other project should: (1) come here and read this section first, (2) find the named `CANONICAL LAYOUT:` block in `template.html`, (3) copy it verbatim, (4) wire it into the target destination using the same pattern the DEMO block shows — call the create function pointed at that destination's own container id, nothing more. `template.html`'s own top-of-file header comment (`IMPORTING A SINGLE LAYOUT PIECE`) carries a short version of this same instruction, so it travels with the file even if this CLAUDE.md isn't open.

## Connection to Other Apps

Every future new project folder under Amit reads its starter CLAUDE.md content from here.

---

## Read Every Session

Before working in this folder, read in order:
1. `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Amit_Testimony.md`
2. `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Amit_RyanProfile.md`
3. `C:\Users\user1\OneDrive\Documents - onedrive\Amit\CLAUDE.md`
4. `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Database\CLAUDE.md` — system-wide data map

All behavioral rules, partnership standards, and task lists are in the root CLAUDE.md.

---

*Developer: Ryan | Identifier: 851379456*
*Part of the Amit System — C:\Users\user1\OneDrive\Documents - onedrive\Amit\*
