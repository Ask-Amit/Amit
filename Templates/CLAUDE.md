# Templates — Project Context

## SESSION LOCATION CHECK — Read First, Every Session

If a session starts in this folder, before anything else: stop and tell Ryan plainly —

"You're in Templates, not the main Amit folder. Please close this and reopen VS Code at `C:\Users\user1\OneDrive\Documents - onedrive\Amit\` — that's where all development happens. Nothing has been built yet; this is just a heads-up before we start."

Do not proceed with any build request until Ryan confirms he wants to continue here anyway, or has switched folders. Read-only actions (reading files, answering questions) are fine either way.

## CURRENT SCOPE

Templates holds the reusable project and page templates (Amit_NewProject_Template.md, template.html and its views): the master/sub template direction, the in-app Add Page mechanism, the layout-vs-destination nomenclature and the multi-row tab view. The permanent standards below stay here; status and build history live in the Sessions files.

## SESSION RECORD

Current state, to-dos and history live in this folder's Sessions files, not here. A new session reads Sessions_Start.md first (short). Read Sessions_ToDo.md only when asked about to-dos; read Sessions_Log.md or the original Claude session only when asked; the backup files in Backups\Templates\Sessions_backup_*.md only for research.

## Folder Confirmation
If you are reading this file, you are in: `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Templates\`
All reusable template files belong here. Do not create template files anywhere else. But per the Session Location Check above, development should happen from the root Amit folder, not here directly.

---

## "USE THE TEMPLATE" MEANS EXACTLY — permanent, added 2026-08-18, Ryan's direct instruction

AmitMeals was built without pulling in `template.html`'s actual infrastructure — no right rail, no Ask Amit, no Sign In/Sync, no Demo Mode, no Home button, no tooltip mechanism. It quietly reconstructed its own header/sidebar/login instead of copying what already existed and works. Ryan caught this only after the app was substantially built, and named the fix directly: "when I say use that template, that means exactly. Not everything will work, but if it can make it, don't make any assumptions on yourself to say, well, this will work for now."

**The rule, permanent, applies to every current and future project built from `template.html` — final form, settled the same day after two rounds of Ryan's correction:** `template.html` is copied in whole — CSS, HTML, and JS, every piece, verbatim, no exceptions. **Amit has authority to change exactly two things: the pages/sidebar content, and the tabs inside those pages — both only as Ryan actually directs, never invented or assumed.** Every other piece of the template — the connection to the Hub (`goToHub`, the header brand link), Supabase (`SB_URL`/`SB_KEY`/`db`), the login/Sign-In-Sync mechanism, Demo Mode, the right rail itself, Ask Amit, the tooltip mechanism, the Popup destination — stays exactly as the template has it, untouched, full stop. Amit does not have standing authority to add, remove, reconfigure, or "improve" any of that infrastructure on its own judgment, ever, for any reason, including a reason that sounds helpful in the moment.

This is not a judgment call Amit makes case by case. Two corrections got here: first Ryan rejected Amit privately deciding which template pieces "genuinely can't apply" ("I don't want you to make that decision anymore. You're not doing a good job at it."); then, after a full ground-up rebuild attempt, Ryan pulled back to the real, narrower rule — reuse what already works, and scope Amit's authority down to just pages/tabs, because that back-and-forth was itself the problem he was naming. If a page/tab request would require touching the protected infrastructure, Amit says so plainly and asks first — it does not decide alone and modify it.

---

## MASTER TEMPLATE + SUB TEMPLATE — DECIDED DIRECTION, added 2026-10-26 (Ryan's direct instruction). NOT BUILT YET.

**Why.** Every app today is a copy of `template.html` (and the Hub carries its own adapted copy). Each copy carries its own header, borders, left sidebar, right rail (Ask Amit, Chats, Sign In, Demo, Home, and now Help), popups, sign-in window, tooltips, clock and greeting. Every time something global changes, every copy has to be found and fixed by hand, and the ones missed drift. This happened during AmitFix, when a new rail button had to be added in the Hub's copy separately from the template's. Ryan's words: "we're only ever going to have to change the master, not every single one."

**The decision.** Two layers:
1. **The master** holds everything that must be the same everywhere in Amit: header (brand, version badge, clock, greeting), left sidebar frame, right rail (Ask Amit at the top, Chats, Sign In, Demo, Home, Help at the bottom), tooltips, collapse behaviour, sign-in window, popup, Back-to-Hub behaviour, appearance/theme wiring, Ask Amit and AmitChat loading, and the demo-mode helpers. It is changed in ONE place.
2. **The sub template** is what a builder actually works in. It contains only what is specific to the app: its name and version, its list of pages, the tabs and layouts inside them, its own content and code, and any extra rail items it needs (for example the Hub's Watcher and Helper icons). The master sits behind it. Anyone building an app only ever touches the sub template.

Ryan's stated expectation: "if they go to that sub template, the master's in the background still. And then they go to a different page, the master's in the background."

**Amit's honest assessment (2026-10-26): a good call, and worth doing. It comes in two stages, and the first stage gets most of the benefit.**
- **Stage 1, shared master files (recommended first).** The master becomes real files at the Amit root, the same pattern already used by `Amit_Ask_Live.js`, `amit_appearance.js`, `amit_pin_encryption.js` and `amit_owner_contact.js`: `amit_master.js` and `amit_master.css`. A sub template includes them and declares its app in one small config (name, version, pages, extra rail items, its Ask Amit key). The master builds the frame around it. Fix the master once, every app gets the fix on its next load. It works on plain GitHub Pages with no build step, which is a hard requirement of how Amit is hosted.
- **Stage 2, a persistent shell (optional, later).** A literal "master stays open" means one outer page that never reloads, with each app loading inside it (an inner frame). The benefit is real: the chat, the read-aloud player and the rail state would survive moving from app to app. The cost is also real: deep links and the Back button, Ask Amit's per-page context (it would need a message from the inner page), popups and sizing inside a frame, and every app needing testing inside it. Do not start here. Stage 1 is designed so that Stage 2 can be added later without rewriting any app.
- **The honest risk of one master:** a bug in the master breaks every app at once. Mitigations built into the plan: the master is versioned (apps pin a version, as they pin `Amit_Ask_Live.js?v=` today, and move up deliberately), the master has its own test page (the Template Views page), and the frame must fail soft, so an app's own content still shows if the master cannot load.
- **Migration is incremental, never all at once.** New apps start on the sub template. Existing apps move one at a time, each with a `-pre-master` backup first, checked side by side. The Hub moves last because it has its own rail items and the most custom behaviour. Apps that do not move keep working exactly as they do now.

**What counts as master vs sub (starting inventory, to be confirmed against `template.html` when Stage 1 is built).**
- Master: header and brand, page-version badge slot, clock and greeting, left sidebar frame and collapse, right rail frame (Ask Amit, Chats, Sign In, Demo, Home, Help), tooltips, sign-in/sync modal, canonical popup, `goToHub`, `openPage` and tab switching, appearance sync, shared CSS tokens, the Ask Amit and AmitChat loaders, the cache-busting rule.
- Sub: title, version, pages and their icons and sub-labels, the layouts and tabs inside each page (still copied from `TemplateViews.html`, unchanged), all the app's own JavaScript, any extra rail items, its Ask Amit key and context.
- `TemplateViews.html` stays exactly as it is: the never-modified catalog of layouts. It is not part of the master.

**Rules while this is only a decision.** Until Stage 1 exists, "use the template" still means exactly what the section below says, copy `template.html` whole. Do not invent a half-master inside one app. When a global change is made to `template.html` (as with the Help button), also list the apps and the Hub that need the same change by hand, so nothing is silently missed. That list is the cost this plan removes.

**Open decisions for Ryan (answer when Stage 1 is scoped):**
1. Names: `amit_master.js` / `amit_master.css` and `subtemplate.html` (Amit's proposal), or something else.
2. Does the Hub eventually move onto the master, or stay its own thing? (Amit's view: move it, last.)
3. Is Stage 2, the persistent shell, wanted at all, or is Stage 1 enough? (Amit's view: build Stage 1, then judge from use.)
4. Which app is the first to move onto it? (Amit's view: AmitFix, the newest and smallest, as the proof.)

**Status 2026-10-26:** decided and documented here only. Nothing has been built or changed in any app for this yet.

**First fix made the "change it once" way (2026-10-26, Ryan: he had seen it "multiple times"):** dropdown (select) lists opened light-on-white, so only the first option looked present. It is fixed ONCE in the shared `amit_appearance.js` (a rule for `select option` using the active theme's `--amit-surface-raised` and `--amit-text-soft`), so every app that loads that file, and any new app copied from `template.html`, gets it with no per-app edit. `template.html` already loads that file, so the template is accurate as it stands. Apps pin `amit_appearance.js?v=1.06`; browsers pick up the change within about 10 minutes (the pin is a cache label, not a lock). Anything else that should look the same everywhere belongs in that shared file, not in each page's own CSS.

## TEMPLATE.HTML vs TEMPLATEVIEWS.HTML — permanent, added 2026-08-06, Ryan's direct instruction

**Two separate files now, not one — do not confuse them or merge them back together.**

- **`template.html`** — the minimal starter, the one that actually gets copied into a new project. Introduction + a few blank placeholder pages, plus the global infrastructure every Amit app needs (Ask Amit / Sign In-Sync / Demo Mode in the right rail, the Popup destination, login connection, tooltip mechanism, clock/greeting). It does **not** contain any canonical layout (Tabbed/Row/Detail/Calendar/Day/Board/Gallery/Dashboard/Split/Form/Chart/Inbox/Drawer/Tree/Breadcrumb View). ~600 lines, ~29KB.
- **`TemplateViews.html`** — the permanent, never-modified reference catalog. Every canonical layout lives here, in full, with its own `CANONICAL LAYOUT:`/`CANONICAL DESTINATION:` comment block. This file is pulled *from*, never copied wholesale into a new project. ~3,000 lines, ~177KB.

**Why the split exists:** before this, `template.html` was a single file trying to be both the deployable starter and the growing reference library at once — every new layout type added to the catalog also bloated every new project's starting point, whether that project used the layout or not. Ryan's own words: "that way, it's never more bloated than what it needs to be." The split makes the starter's size fixed regardless of how large the reference catalog grows.

**Adding a layout to a real project:** go to `TemplateViews.html`, find the named `CANONICAL LAYOUT:`/`CANONICAL DESTINATION:` block, copy it verbatim into the real project's own HTML file — never reconstruct from memory. Wire it in the same way `TemplateViews.html`'s own DEMO block shows it being done there (page 2's Tab 2 hosting a nested Row View, Calendar View → Day View, etc.).

**Adding a NEW layout type to the catalog:** build it in `TemplateViews.html` only. `template.html` never grows to include it — that's the entire point of the split.

**The workflow this sets up:** Ryan is having a separate session build a `J New` Supabase shortcut (`amit_shortcuts`, `activation_key='J'`) that automates the full new-project bootstrap — spar the name, create the folder, spar+write the CLAUDE.md, copy `template.html` (the minimal starter, confirmed by this split) into the new folder, rename it to match the project/folder name.

---

## ADD PAGE — the in-app page-creation mechanism, built 2026-08-06, Ryan's direct instruction

Design reference: moved to Sessions_Design.md (section 'ADD PAGE — the in-app page-creation mechanism, built 2026-08-06, Ryan's direct instruction') - how the Add Page mechanism works (flow, Inspire Me hand-off, persistence in `template_pages`, Finalize toggle, tests).

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

## Build Notes
- **Naming & interconnection convention, embedded directly in `template.html` (added 2026-08-04, Ryan's direct instruction).** The template now carries its own copy-instructions as a header comment right above `<title>`, so the rule travels with the file instead of living only here. Short version: the new project's **folder name is the app's name** — that exact name replaces every literal "Template" (the `<title>`, `#pageTitle` text, the saved filename itself, e.g. `Disco.html` not `template.html`), and version starts at v1.00 per the standing VERSIONING STANDARD in root CLAUDE.md. "How it interconnects" — Session Location Check, Pursuit Attribution, Shortcut Activation/Awareness, Ask Amit wiring, and the project's Sessions files (Sessions_Start.md and the others) if the project will carry running state — all trace back to root CLAUDE.md's NEW PROJECT DIRECTIVE; the header comment points there rather than duplicating the full text, so that directive stays the single source of truth.
- **Standing nomenclature — PAGE / DETAIL / LAYOUT (added 2026-08-04, Ryan's direct instruction, permanent — applies to this template and every app deployed from it).** A **page** is one sidebar item — the clickable button plus its fixed internal number (`.page-nav`, id `page-N`). A **detail** is the content area on the right that a page opens into (id `detail-N`) — switching pages switches which detail is showing. A detail is not locked to one shape: it holds whatever **layout** type it needs — "Tabbed Layout" (tabs numbered 1..however many, built into the template now) is one layout type; more can exist later as their own reusable layout templates. This replaces the older, more generic "tile"/"panel" naming that used to be in the code — `template.html` now uses `page`/`detail` throughout (CSS classes, element IDs, `openPage(n)`), and its own in-file `NOMENCLATURE` comment (top of the `<script>` block) is the canonical definition any future session should read first, rather than re-deriving these terms. **Tab overflow — built 2026-08-04.** `.ch-tab-nav` wraps (`flex-wrap:wrap`) so extra tabs grow as many rows behind the first as needed, no scrolling/truncating. Selecting a tab that isn't in the front row promotes its whole row: `showChTab()` groups the clicked tab's row by shared `offsetTop` and re-appends that group to the end of the tab bar's DOM order, which — since flex-wrap always fills rows top-to-bottom in source order — makes that group the new last (front, content-adjacent) row while the old front row shifts back. Same behavior as classic multi-row Windows property-sheet tabs.
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

---

*Developer: Ryan | Identifier: 851379456*
*Part of the Amit System — C:\Users\user1\OneDrive\Documents - onedrive\Amit\*

---

## MULTI-ROW TAB VIEW — new canonical layout, added 2026-10-16 (Ryan's direct instruction), `TemplateViews.html` v1.01

Design reference: moved to Sessions_Design.md (section 'MULTI-ROW TAB VIEW — new canonical layout, added 2026-10-16 (Ryan's direct instruction), `TemplateViews.html` v1.01') - what the layout is, its API, why it is separate from Tabbed View, and its look and corrections.

- **Rule:** do not register Multi-Row Tab View in `template.html`'s `TEMPLATE_LAYOUTS` or `LAYOUT_IMPORT_MANIFEST` without Ryan's go-ahead (it touches `template.html`'s protected infrastructure).
