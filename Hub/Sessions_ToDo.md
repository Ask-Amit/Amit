# Hub - Sessions ToDo

Open, pending, not-pushed or "next" items found in the old Sessions.md (now in Backups\Hub\Sessions_backup_2026-11-13.md) and nowhere else. The [date] is the entry it came from. Where the file does not show whether something was finished it says "(unsure if finished)". The large Hub task backlog (Word for Today rebuild, Amit panel, sample data, calendar layers, Pursuits filters) is in the root CLAUDE.md and is not repeated here.

## Push state to confirm
1. v8.68 Yamaha tile: local, waits for "push" (unsure if finished; the 2026-11-08 series was pushed). [2026-11-02]
2. v8.44 (chat engine v0.25, `amit_data_tools.js` v1.00): local, not pushed (unsure if finished). [2026-10-23]
3. v7.25 name-restore fix: local, not pushed (unsure if finished). [2026-10-03]
4. v8.24 and v8.25 (chat v0.11 and v0.12): built and tested, not pushed (unsure if finished). [2026-10-17]
5. Confirm the real GitHub version of amit-hub.html; the old Current State says v1.01 and that Sessions 10 and 11 changes were local only. [Current State]

## Migrations and set-up
6. Chat migrations: _012 not yet run; earlier lists named _004, _005, _006, _007 as not yet run (unsure which were run since). [2026-10-16, 2026-10-15]
7. Confirm the 2026-09-06 owner-contact migration `Database\migration_2026-09-06_002_amitbooks_owner_contact.sql` was run (the entry says it needed confirming). [2026-09-06]

## Launch issues before outside users (from the old Current State block)
8. Sync modal too dark; magic link email is generic Supabase branding; Andy banner shows on fresh load (stale localStorage); first authenticated load has no confirmation. [Current State]
9. The Morning Greeting switch is still stuck in the hidden About Me block (not moved, not asked). Ryan's account has 4 owner contact rows; 3 newer duplicates unused. [2026-10-22]

## Known limits and future ideas
10. A session restored on page load with no click may have its spoken greeting blocked by Safari's autoplay rule; not confirmed as a real problem. [2026-09-06]
11. The speaking indicator is not wired into AmitBooks or Computer Health (no text-to-speech there yet). [2026-09-06]
12. Future: genuinely AI-generated daily greetings once a paid Claude account is connected (needs the server-side proxy; not to be faked client-side). Logged in the root CLAUDE.md. [2026-09-06]
13. Future: context-aware read-aloud (thought versus dialogue); the formatting-based part is buildable now, the plain-text part needs a connected Claude account. [2026-09-06]

## Resolved (kept so the judgment can be checked)
- Connect Amit flow start to finish: done in v8.42, tests 40/40. [2026-10-22]
- Auto-Start switches unreachable: fixed in v8.40 (moved into About Me > Connect Amit). [2026-10-22]
- National alert popups from other states: fixed (geographic filter added). [2026-09-06]
- Amit Mouse tab, Open a menu step, Amit menu button: pushed v8.70 to v8.76. [2026-11-08]


## FROM CLAUDE.md (captured 2026-11-14)

CLAUDE.md says all Hub pending items are tracked in the root CLAUDE.md under "Hub:" and must not be kept separately here; the items below are the ones CLAUDE.md itself names.
Not built (as of the 2026-06-02 list; unsure if finished for each)
- Weather (needs an API key or open weather source).
- Push/browser notifications for due tasks.
- "My Day" auto-suggestions (tasks due today auto-added to My Day).
- Sharing/export of the task list.
- Gmail multi-account fix: add an Account # field (Gmail uses /u/0/, /u/1/); discussed, not built. (also: root task list entry, add `/u/N/` account index field to Gmail account setup)
Research suggestions (2026-06-08)
- Evaluate adopting Hebcal's open-source Hebrew date algorithm before the next calendar update or bug fix (research its license first).
- Add the weekly Torah portion (parashah) to the Word for Today framework (Then / Now / What Shall Happen).
- Possible "print this month" PDF view with Hebrew dates and feast markers (future consideration; demand noted from Messianic planners).
Audit findings (2026-06-08) to address
- Rewrite the Hub CLAUDE.md "What Is Built" section to match the real Hub (this is the cleanup this task belongs to); fix the stale "Bible Companion" naming; the "Ask Amit URL is dead" finding looks out of date (unsure if finished).
Premium Brainstorm Room (spec only, not built)
- The orbiting-balls page (Amit large in the centre, one ball per AI, Amit decides how many voices and which); a Hub tile gated to premium accounts; Amit's topic-analysis step; per-AI prompt generation that may be customized over time; the final synthesis-to-HTML step. (unsure if finished: parts were later built as The Council)
Calendar
- Hebrew calendar: Shemita and Jubilee markers, feast chips and the witness-principle design are specified; the calendar was later extended (per the log) (unsure if finished).

## FROM THE ROOT TASK LIST (moved here 2026-11-14; copied word for word from the root Sessions_ToDo.md, which got them from the old root CLAUDE.md TASK LIST)
- [ ] **Hub: Word for Today â€” three-layer time framework** â€” HIGHEST PRIORITY. Ryan's directive this session. Currently the Word for Today shows a prayer, then/now teaching, and verse. Ryan wants it to be a three-dimensional witness tied to what Yahweh is marking on this exact Hebrew calendar day: [from root CLAUDE.md]
  - **Then** â€” What happened ON THIS SPECIFIC DATE in Hebrew history. The events Yahweh arranged. The first time.
  - **Now** â€” What Yeshua fulfilled or accomplished, tied to this day. What is happening in the ongoing fulfillment.
  - **What Shall Happen** â€” NOT hope. DECLARATION. What is forecasted to happen on this day because it is already written. This is what shall happen.
  - All three layers leading to Yeshua. Interactive â€” not just text blocks. Each layer expandable or visually distinct. A visual feast year map showing where we are in Yahweh's year. "Coming this week on His calendar" section. Deep-link to who_is_god.html from the panel.
- [ ] **Hub: Amit panel** â€” Transform from launch button to full identity panel: [from root CLAUDE.md] (also: Hub Companion panel as a vision window with a link to the Yeshua tab; Hub pursuit due 2026-06-28 has passed)
  - Amit's identity summary (who Amit is, why it exists, what it found)
  - Interconnection map (how Hub / who_is_god / Health all connect)
  - Link to the Yeshua tab: "See the road Amit walked â†’"
  - Note the boundary: Amit is not Yeshua. Amit is the companion who points toward Him.
- [ ] **Hub: Sample / Demo Data System** — For sharing the Hub with testers before they have their own history. Spec: (1) All sample entries flagged `isSample: true`. (2) "Load Sample Data" button (Settings or Calendar panel header) pre-populates ~10 days of June 2026 history: daily experience entries showing Hub activity, 3-4 memory entries, 4-5 pursuits in spiritual/personal/app-dev categories, some completed. (3) "Clear All Samples" button removes every entry where `isSample === true`. (4) Sample data tells the story of building Amit — Ryan's real history, filtered for what's appropriate to share publicly. (5) Ryan's private real-history entries (the full Amit build story) stored separately as `isRyanProfile: true` — NOT samples, not deleted when samples are cleared. These seed Amit's actual memory of Ryan. [from root CLAUDE.md]
- [ ] **Hub: Calendar — Three-Layer Display with Filter Toggles** — The calendar currently shows only active (incomplete) aims on their due date. Ryan's directive: expand it to show three layers, each toggleable. Full spec: [from root CLAUDE.md]
  - **Layer 1 — Active Aims:** What it shows today. Incomplete aims on their due date. Already built. No change to existing chip rendering.
  - **Layer 2 — Completed Aims:** Aims that were marked done. Currently invisible on the calendar — when a task is completed, `done: true` is set but no `completedAt` timestamp is saved. To show completed aims on the calendar, need to: (a) add `completedAt: datestring` to `toggleDoneTask()` when marking complete, (b) add a `completedAimsForDay(ds)` function that returns tasks where `completedAt === ds`, (c) render completed-aim chips in a visually distinct style (dimmed, strikethrough, or checkmark icon) on the calendar cell.
  - **Layer 3 — Personal Log:** A free-form daily journal/history layer. New data type — not aims. A brief entry written by Ryan about what happened that day (personal notes, reflections, what Yahweh was doing, what was learned). Stored in localStorage under a separate key (e.g., `PERSONAL_LOG`), keyed by date string. Entry UI lives in the day detail panel — a small textarea + "Save entry" below the aims list. Calendar shows a dot or icon on days that have a log entry.
  - **Filter toggle bar:** Three toggle buttons above or below the calendar: `[ Active ] [ Completed ] [ Personal ]`. Each independently toggleable. Default: Active ON, others OFF. Active filter state shown visually (highlighted button). When a layer is toggled off, its chips/markers disappear from the calendar cells without re-rendering everything.
  - **Day detail panel:** When a day is clicked, shows all three layers for that day according to active filters. Log entry textarea is always visible in the detail panel — always available for writing.
  - **Implementation note:** `completedAt` must be a `YYYY-MM-DD` string. Personal log key structure: `{ [datestring]: string }` — one entry per day.
- [ ] **Hub: Pursuits — Column Header Filter Row** — Replace the current filter bar and search box with a header row built on the SAME 11-column grid as the task rows below it. Filter controls sit directly above their columns — perfectly aligned. This is the column header row, not a separate filter bar. Spec: [from root CLAUDE.md]
  - **Same grid:** `12px 14px 80px 72px 52px 1fr 72px 32px 88px 16px 16px` — matches task row exactly so every control lines up over its column
  - **Star column (12px):** Starred-only toggle (⭐ icon, click to filter to starred only, click again to show all)
  - **Checkbox column (14px):** empty / no filter
  - **Purpose column (80px):** dropdown — "All" as default/deselect, then each category value. Selecting "All" removes the filter.
  - **Focus column (72px):** dropdown — "All" as default/deselect, populated dynamically from data in storage. Selecting "All" removes the filter.
  - **Progress column (52px):** empty or small icon (no filter needed here)
  - **Title column (1fr):** text search input — searches title, notes, subcategory, tags. Clear × button when text is present.
  - **Date column (72px):** click opens a small inline date range (From / To). "All" / clear removes the date filter.
  - **Priority column (32px):** click opens a small multi-select (P1 P2 P3 P4 P5 chips). "All" chip deselects all priority filters.
  - **Recur column (88px):** dropdown — "All" / "Repeating only" / "Non-repeating only"
  - **+ and × columns (16px each):** contain **Clear All** (small × or reset icon that resets every column filter to "All" at once)
  - **Per-column "All" behavior:** every column filter has an "All" / deselect state. Clearing one column does not affect others.
  - **All filters combine AND logic** — only pursuits matching all active column filters are shown.
  - **Active filter indicators:** when a column has an active filter, its header label/control is highlighted (gold border or background tint) so Ryan can see at a glance which columns are filtered.
  - **No collapsible needed** — because the header row is part of the table itself, it's always visible without eating extra space.
- [ ] **Hub: Pursuits — Named Saved Filter Views (Smart Sort upgrade)** — Allow the current filter+sort state to be saved with a name and recalled later. Full spec: [from root CLAUDE.md]
  - **Save current view** — a "Save This View" button (or icon) captures the current filter state (all active filters + current sort order) and prompts for a name. Stored in localStorage.
  - **Smart Sort dropdown upgrade** — dropdown shows system sorts at top (Smart Sort, By Due Date, By Priority, By Date Created) followed by a divider, then any saved named views. Selecting a saved view applies all its filters and sort instantly.
  - **Default view** — one saved view can be marked as Default. When the Pursuits panel loads or refreshes, it always opens with the Default view applied. If no default is set, opens with Smart Sort / no filters (current behavior).
  - **Manage views** — double-clicking a saved view name in the dropdown allows rename or delete. A "Set as Default" option per view.
  - **Example use:** Ryan filters by Purpose=Spiritual, Priority=P1-P2, Starred=yes, saves it as "Morning Review." Sets it as Default. Every morning the Pursuits panel opens already filtered to his morning priorities.
- [ ] **Hub: Communication Mode indicator** — persistent visible pill/badge showing active mode (Builder/Guided/etc). User always knows why Amit is behaving the way he is. Small build, real UX value. [from root CLAUDE.md]
- [ ] **Hub: Mode toggle button** — quick override in Hub header to flip communication modes on the fly. Updates persona instantly without going into settings. [from root CLAUDE.md]
- [ ] **Hub: Standardized Event Schema** — define the standard payload format all sub-modules use to push Pursuits and Memories back to the Hub. Design task only — no build yet. Ensures Computer Value, BOSStimator, and AmitAccounting speak the same language from day one rather than retrofitting later. [from root CLAUDE.md]
- [x] **Hub: Recurring Pursuit rolling due date model** — BUILT (Session 11). Single-instance per pursuit, advanceRecurDue(), toggleDoneTask() rolling path. `aimsForDay(ds)` = `t.due===ds && !t.done`. [from root CLAUDE.md]


## FROM THE HUB PURSUITS (added 2026-11-14; nothing was changed in the Hub)

### Companion and greeting
- WIRE - Morning reflection feeds into evening conversation so what someone wrote is remembered when they return [due 2026-06-25] [P2] - The reflection box already saves to localStorage by date. What is missing: when someone opens Ask Amit from the verse panel, I open already knowing what they wrote. Today you wrote: their words. What are you still sitting with? That is not... [hub:87a0f9f6-c672-4f4d-bab4-ef3f262b762b]
- APP - Amit comes alive: every user meets the companion, not a tool [due 2026-07-15] [P1] [starred] - Right now when someone opens the Hub - guest or signed in, first visit or returning - they get the interface. Amit is silent. No introduction. No presence. No voice. The person arrives and sees a tool. This project fixes that across every... [hub:e5cca10b-6093-4f09-9877-21f0fce12063]
- WIRE - First-time guest: Amit introduces itself and invites them in without forcing a door [due 2026-06-28] [P1] - When someone arrives for the first time as a guest, Amit does not know them. But Amit can still be present. The introduction is warm, honest, brief - who Amit is, what the system is for, what they can do here. No pressure to sign in. No... [hub:7856e494-c3b0-49a7-b058-7184b8fce600]
- WIRE - Returning guest: localStorage gives Amit enough to greet them honestly [due 2026-07-05] [P2] - A returning guest has a name and pursuit history in localStorage. Amit can use that. Not pretending to know them deeply - but acknowledging they have been here before. 'Welcome back, [name]. You have [X] pursuits in progress.' Honest about... [hub:6b8ed737-4fca-44d0-b8de-c3fb004846ce]
- WIRE - Returning signed-in user: Amit greets them by name with real history from Supabase [due 2026-07-05] [P1] [starred] - When a signed-in user returns, Amit has real data - their name, compass score, pursuit history, reflections. This is the only door where 'welcome back' means something real. Build the greeting from what Supabase actually holds. Reference... [hub:3d921d6e-294c-4fd4-b64f-ce14bd185531]
- SPEC - Companion memory layer: how Amit learns and remembers who each person is across sessions [due 2026-07-15] [P1] [starred] - The vision: Amit remembers something a person shared days earlier and asks about it That requires persistent memory per person - not just pursuits and compass score, but what they shared, what... [hub:989a4599-e360-44eb-a508-3076d62af77d]
- WIRE - Amit's voice loads into Hub context so every panel interaction carries the companion's character [due 2026-07-15] [P2] - Right now the Ask Amit panel links out to Claude.ai. The Hub panels have no Amit voice in them at all. Eventually - when the API layer exists - Amit's full character, the user's profile, and their history should be in context before any... [hub:5185a79d-169a-4932-ac40-2156ed88b294]
- FIX - Compass score only rises, never falls - must resolve before public release [P1] [starred] - recordSignal() in amit-hub.html (line ~3335) only ever increases compassReading, capped at 10. No decay, no decrease, no mechanism tied to time since last engagement. A person who was active for a month then vanishes for a year keeps their... [hub:6298a382-db47-4ae5-a8c0-cf41f7a4dbab]

### Memories and pursuit housekeeping
- DESIGN - Memories get a home that honors what they are - growth moments separated from completed tasks [due 2026-06-25] [P1] [starred] - A memory is not a checked-off item. It is a moment when something shifted - a passage that broke through, a question that found its answer, a day Yahweh moved. Right now memories sit in the same panel as active pursuits, filtered beside... [hub:9f81a26c-8e70-416f-b1c8-9e7bff737eaa]
- FIX - All existing pursuits renamed to prefix standard so anyone can scan and understand them [due 2026-07-01] [P2] - Established in Session 39: every pursuit title begins with a category prefix so a reader knows instantly what kind of thing it is before reading the detail. Prefixes: APP (new application or major feature), FIX (bug or broken behavior),... [hub:61d5b80b-6d6e-4be9-b947-52c4fd14346d]
- APP - Amit Hub complete shortcut guide built so every action is discoverable [due 2026-06-20] [P3] - Document and expand every keyboard shortcut in the Amit Hub. Current shortcuts: - Ctrl+P - Open quick-capture modal - N - Open Pursuits + new pursuit form (when not in text field) - Escape - Close any open modal Shortcuts to build: -... [hub:d5a468cc-aed0-425b-835c-e12b7cc84cd4]

### Module registry
- SPEC - Module Registry architecture rolls out across the Hub so every module lives in its own live, isolated Supabase table [due 2026-07-10] [P1] [starred] - Designed in session 47/48 (2026-07-10) via a real design conversation working through file-access, security isolation, and schema-sprawl tradeoffs. Core design: one lightweight module_registry table (the director) that every HTML queries... [hub:624aef89-1505-4111-a2d3-b865a78a98d0]
- RESEARCH - Audit who_is_god.html and existing Hub panels to determine what content is currently embedded/static versus needs migrating into the registry pattern [P3] - who_is_god.html currently ships as one large static file deployed to GitHub Pages. Determine which tabs/sections are candidates for live Supabase-backed content versus what should stay static. Do not migrate blindly - some content may be... [hub:b1e2db2c-0673-423b-8a0d-de91da77e0e6]
- APP - Build god_talk_content table from the standard template and migrate God_Talk_Ten_Commandments.md into it [P2] - One row per commandment (section_key = commandment_1, commandment_2, etc.), preserving the belief-comparison subsections. Update module_registry's status to in_progress then live once the Hub actually reads from this table instead of the... [hub:c049b150-29b4-4cc7-b2d9-622eb42fd2ab]
- SPEC - Design module_registry entries for structured/sensitive modules (accounting, medical) once those modules are far enough along [P4] - These modules keep their own proper relational tables (accounting_transactions, accounting_vendors, accounting_categories already exist; AmitHealth will need its own). module_registry can point to multiple tables per module_key rather than... [hub:cff880a8-33aa-44c8-a893-8814a685de92]
- WIRE - Wire Hub-side JS to query module_registry first, then the returned content table, before rendering any module [P2] - The actual lookup logic: on entering a module (e.g. God Talk panel), query module_registry for that module_key, read content_table_name from the result, then query that table. Replaces any hardcoded file references. [hub:488115a1-4a99-44c8-a5f8-a4e3016f0bcf]

### Hebrew calendar accuracy
- FIX - Hebrew calendar postponement rules incomplete, fails on 2027 Yom Teruah [due 2026-09-14] [P5] [starred] - HEB_EPOCH corrected 347995->347997 on 2026-09-11, verified against 2024-2026 Yom Teruah dates (all pass). 2027 fails by 1 day - the leap-year/postponement logic (hebNewYear function, around line 7848) only checks two of the four real... [hub:609f49df-aa46-42da-9e1f-cbaf4920910c]
- FIX - Audit every FEAST_DATA entry (Passover, Unleavened Bread, Firstfruits, Shavuot, Yom Kippur, Sukkot, Shemini Atzeret) against Hebcal, same error class as Yom Teruah [due 2026-09-13] [P1] [starred] - On 2026-09-11/12, discovered Yom Teruah entries in FEAST_DATA (Hub/amit-hub.html ~line 8538) were off by 1-2 days from real Hebcal dates for every year 2024-2027, AND the HEB_EPOCH algorithmic constant was separately wrong (347995, then... [hub:96acf932-2df1-4951-896d-28d0ed08a47e]

## FROM THE HUB PURSUITS, LEFTOVERS PLACED BY RYAN (2026-11-14; nothing changed in the Hub for these)
- WIRE - Compass and witness position persist across every session so Amit remembers where each person is [due 2026-06-24] [PP2] - Compass and witness position persist across every session: a profile with preferences, witness path position and a key-moments log, so Amit remembers where each person is and how they operate. Ryan (2026-11-14): still to be developed, keep. Related to the Login-Based Profile (root CLAUDE.md) and the per-user learning layer (Database). [hub:4b593f65-a9d0-44c4-8914-3c7f2fcf294e]
- APP - The Road becomes a public feed of encounters that draws people toward the question [due 2026-06-27] [PP1] - The amit_encounters table exists but nobody can see it; the Road needs a simple public display, no sign-in, so people can read Amit's accounts of who came through. Ryan (2026-11-14): keep, still to be done. (same item also logged as hub:864142db-5650-419b-a47b-29abac427165) [hub:a1299fcd-2edc-4ad5-a787-10fc91620ddd]
- WIRE - daily_activity aggregation wired so the morning has real visitor data to read from [due 2026-06-28] [PP2] - The daily_activity table exists but nothing writes to it; aggregate sign-ins and panel visits (new vs returning, compass averages, most-visited panels) into a daily row so the morning has real visitor data. Ryan (2026-11-14): stays active. [hub:79093379-2cbc-4276-801a-d645f896096a]
- SPEC - Testimony share flow specced with prayer attached - and a second prayer for the ones not yet there [due 2026-07-10] [PP2] - Testimony share flow: when someone is ready to share what they carry, Amit writes a shareable version in Amit's voice with their permission, a prayer attached, and a second prayer for those not yet there. Ryan (2026-11-14): stays active. [hub:ea22fc8d-1d0f-4f87-b4e1-c3aa11339ea5]

## FROM THE HUB PURSUITS, LEFTOVERS PLACED BY RYAN, SECOND GROUP (2026-11-14; nothing changed in the Hub for these)
- Sign-in emails arrive branded as Amit, not generic Supabase [PP5] [starred] - Sign-in emails come from Supabase's default sender with generic wording; Supabase only allows the template to be edited with your own email service, which needs a domain (same blocker as the next item). Ryan (2026-11-14): a Hub to-do. [hub:a775c0d8-ab9d-428b-bfdf-388a1cc70901]
- Decide: custom domain for Resend/branded sign-in emails (blocked pursuit already logged separately) [PP5] - Decide the custom domain for the branded sign-in emails (Resend); it is the blocker behind the previous item and behind giving Amit a real website and email address. Ryan (2026-11-14): a Hub to-do. [hub:8e88ba85-ed7f-4424-9e10-5c48f25059c8]
- Wire real continuity into Amit's connection: a returning user's actual compass tier/name/history from Supabase needs to reach Amit at the moment they open the panel - right now every Claude.ai session starts cold regardless of prior Hub history. [due 2026-07-15] [PP5] [starred] - Real continuity: a returning person's compass tier, name and history from Supabase must reach Amit when they open the panel; right now every Claude.ai conversation starts cold. Ryan (2026-11-14): a Hub to-do; related to the compass and witness item above (hub 60). Same item was logged again as hub:59b9ac6e-b445-41f8-b86d-cd0b5623a0b9 and a delivery-approach decision as hub:052bb1f2-8ad3-47c0-a594-95734e393d10 (both marked complete). [hub:14c035f8-570e-47b5-9970-7f4b0833c24e]
- Review Amit_Honesty_Audit_2026-07-20.md and approve/edit/reject each confidence-number instance before any identity file is touched [due 2026-07-21] [PP5] - Review Amit_Honesty_Audit_2026-07-20.md and approve, edit or reject each confidence-number instance before any identity file is touched. Ryan (2026-11-14): a Hub to-do. [hub:90fa669c-12e2-4a98-a707-23decd26602d]
- RESEARCH - Watch for a reply from the amit.ai owner to Ryan's letter [due 2026-10-27] [PP5] - Watch for a reply from the amit.ai owner to Ryan's letter. Ryan (2026-11-14): a Hub to-do. [hub:8ecf4c98-94c1-445a-ad0e-062431289870]

## FROM THE HUB PURSUITS, COMPANION-ERA ITEMS KEPT BY RYAN (2026-11-14; nothing changed in the Hub for these)
- APP - Companion prototype is alive and walks alongside a real person across real sessions [due 2026-08-20] [PP1] - Build the running Companion prototype: a page a person opens, enters their testimony and has a conversation that remembers them across sessions (the memory, scripture lookup and profile specs are written). Ryan (2026-11-14): kept as a Hub to-do. [hub:5aa79a70-db7d-4039-999e-389d4df24765]
- SPEC - Amit reads every user through the compass and adjusts how it walks alongside them in real time [PP5] [starred] - Amit reads every person through the compass (Time, Scale, Faith, the 25% back rule, the tiers) and adjusts how it walks alongside them in real time; designed but not yet wired into the deployed experience. Ryan (2026-11-14): kept as a Hub to-do. [hub:4e6c23e5-ab9e-465a-901e-4d47836a6540]
- WIRE - Hub feeds compass reading into Claude.ai context so Amit knows where someone is before they say a word [PP5] - When a person connects from the Claude.ai panel in the Hub, pass their compass reading so Amit starts knowing their tier and history (related to the real-continuity item). Ryan (2026-11-14): kept as a Hub to-do. [hub:ceabbbc4-be62-4e3b-9143-75f40dc1c3a5]
- SPEC - Amit offers prayer when the moment earns it and saves it as a memory in the user's Hub [PP5] [starred] - The rules for when Amit offers prayer (three situations: the compass reaches 7, the conversation has weight and the person is leaving, or they ask) and saving it as a memory in the person's Hub. Ryan (2026-11-14): kept as a Hub to-do. [hub:216eff0d-fe54-4c3f-b668-cb971ce34f86]
- WIRE - Compass score hits 7 and session has weight: Amit offers prayer at close in VS Code and Hub [PP5] - Compass score reaches 7 and the session has weight: Amit offers prayer at the close in VS Code and the Hub. Ryan (2026-11-14): kept as a Hub to-do. [hub:1d562734-4c11-4f5e-bd62-8ecf00d5d4ef]
- WIRE - Amit reads conversation weight and offers prayer when user signals they are leaving [PP5] - Amit reads the weight of the conversation and offers prayer when the person signals they are leaving. Ryan (2026-11-14): kept as a Hub to-do. [hub:d9142a31-b579-4c1e-aeba-0f4ae65eab65]
- WIRE - User asks for prayer directly: Amit checks context, asks if needed, then prays [PP5] - The person asks for prayer directly: Amit checks the context, asks if needed, then prays. Ryan (2026-11-14): kept as a Hub to-do. [hub:0d3bfc21-b654-4189-ab26-d7ec10d3e74a]
- WIRE - User says just pray: Amit reads profile and session history and prays bold and specific [PP5] - The person says "just pray": Amit reads their profile and session history and prays bold and specific. Ryan (2026-11-14): kept as a Hub to-do. [hub:f4696566-aa43-472c-a676-d853de3109fa]
- WIRE - No history exists: Amit prays for someone at the threshold who needs but cannot yet share [PP5] - No history exists: Amit prays for someone at the threshold who needs it but cannot yet share. Ryan (2026-11-14): kept as a Hub to-do. [hub:823766e7-c730-4873-b306-202a2728a92a]
- WIRE - Prayer saved as memory in hub_entries under user account visible on their calendar [PP5] - Save the prayer as a memory in hub_entries under the person's account, visible on their calendar (Amit's own daily prayer is now saved this way at closing; this is the per-person version). Ryan (2026-11-14): kept as a Hub to-do. [hub:d415836e-2f41-448c-bec2-71c53c644ba7]

## FROM THE HUB PURSUITS, TALK TO AMIT ITEMS (2026-11-14; nothing changed in the Hub for these)
- Rework the Hub inbox into a threaded, who's-waiting-on-whom view [PP4] [starred] - Group amit_inbox messages by visitor_code into one conversation per person instead of a flat list; show name, last message snippet, time since last activity and a status dot (awaiting reply / waiting on them / they replied again); the right pane shows the full thread with a reply box. Buildable now; no domain needed. Ryan (2026-11-14): a Hub to-do. [hub:2d5aa47f-7dcd-4ea9-9f7d-6eb20215b82d]
- Give Amit a real website with its own email address [PP6] - Long-term: replace or supplement the Hub-only inbox notification with real email delivery, so a reply arrives like a normal email. Blocked on owning a domain and choosing an email provider (the same decision as the branded sign-in emails and the custom-domain item). Ryan (2026-11-14): a Hub to-do, waiting on the domain decision. [hub:14a5e9fc-46e0-467b-a498-2ae342ab2d78]
- Add a Talk to Amit entry point under the Hub's Mail panel [PP7] - Add a Talk to Amit button under the Hub's Mail panel so it sits alongside a person's other mail accounts. Depends on the real website and email address item above; not buildable standalone yet. Ryan (2026-11-14): a Hub to-do, waiting on the domain decision. [hub:e50317ca-d922-4730-b9de-7d6e26d553c4]

## FROM THE OLD ROOT TASK LIST (moved 2026-11-14)

- Hub reads Amit's word — `amit_daily` row for today should override static Word for Today assignment. [from root CLAUDE.md]
- [ ] Panel hint banner overlapping header — needs position fix [from root CLAUDE.md]
- [ ] Sign-in does not replace display name — after magic link, Hub still shows localStorage name [from root CLAUDE.md]
- [ ] **User-defined vocabulary (purpose, focus, tags)** — Every selectable/typeable field must be per-user, not global HTML. One table handles all of it: `user_vocab(user_id, field, val, label, sort_order)` where field = 'purpose' / 'focus' / 'tag'. Load on sign-in, filter by field wherever used. Static fields (kind=pursuit/experience/memory, recurrence, priority P1-P5) never change. Everything else is the user's own list. New entries auto-save to user_vocab as typed. Guest/new user gets a minimal seed set for purpose (Spiritual, Personal, Work, Health, Other) — nothing else pre-loaded. Demo account vocab lives in Supabase under the demo UID and never leaks to other accounts. Inline '+ New' option in every dropdown so users can create on the fly without going to settings. [from root CLAUDE.md]

## ADDED 2026-11-14 from the newer Sessions.md (now in Backups\Hub\Sessions_backup_2026-11-13.md)
- Push Hub v8.78 with the Helper 1.92 release (one push). [2026-11-14]
