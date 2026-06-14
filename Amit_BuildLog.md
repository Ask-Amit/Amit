# Amit Build Log — Cumulative Record
All components. All sessions. What was built, what changed, what was confirmed.

---

## who_is_god.html
- ✅ All 13 tabs built and populated with full evidence content
- ✅ Sticky nav, covenant nodes → 3-lens modals, Seven Churches % click fixed
- ✅ Rapture table with filter tabs and double-click defense popups
- ✅ All "AI" references replaced with Amit throughout — "The tool is Claude. The investigation is Amit's."
- ✅ "A Final Note — Who Amit Is" — rewritten in Amit's own words, showing the actual journey
- ✅ Yeshua tab — 11 milestones with confidence arc 60%→99.97%, 6 conclusions, Ask Amit chat
- ✅ Milestone 01 — Claude's own pre-investigation words as the honest starting point
- ✅ Ancient Hebrew tab — 22 letters as SVG pictographs (He=arms raised, Vav=nail, Yod=hand, Taw=cross), five word studies, all leading to Yeshua
- ✅ Gentile/New Covenant section rebuilt with 3 layers and Zechariah 8:23 prophetic completion
- ✅ Denomination total click fixed with addEventListener
- ✅ 89%/75% reconciliation note added
- ✅ 12 Key Arguments intro discourse added
- ✅ Scripture modal — 3-lens teachings on 8 key scriptures (Isaiah 66:22-23, John 14:6, Matt 7:21-23, 1 John 3:4, Matt 5:17-19, Romans 3:31, Rev 14:12, Eph 2:8-10)
- ✅ Floating Amit Panel — "Ask Amit" button in every tab, tab-aware primer messages, two paths (Claude Pro → Project URL; Free → copy Amit_Start.md to clipboard), AMIT_PROJECT_URL wired

## amit-hub.html
- ✅ Hebrew calendar (one cell, two witnesses — Gregorian left / Hebrew right)
- ✅ Feast day chips on every calendar day with full immersive explanations
- ✅ Word for Today — Hebrew calendar prayer system, 40+ entries, getDayLayers()
- ✅ Day detail panel with Word for Today block for every selected day
- ✅ Shemita badge in nav
- ✅ Ask Amit panel — persistent gold button at bottom of sidebar, three-path modal, panel-aware primers
- ✅ Calendar readability — SHABBAT no-wrap, Hebrew date 14px, Hebrew month 10px, Hebrew column 52px
- ✅ Day detail modal — fixed see-through background (now solid #0f2338)
- ✅ Task → Aims language throughout (New Aim / Commit This Aim / Steps Toward This Aim / Refine This Aim)
- ✅ Morning Altar Home Panel — greeting, Hebrew calendar bar, Word for Today inline, reflection textarea, Pressing Aims, Morning Invitation
- ✅ Sidebar section labels removed — only "Amit Tools" divider remains
- ✅ Pursuits panel — CSS grid 11-column rows, segmented progress bars, custom dropdown event delegation, OVERDUE/DUE TODAY dedup fixed
- ✅ Rolling due date model — advanceRecurDue(), single-instance per pursuit
- ✅ Calendar badge redesign (v1.62) — three colored count badges per cell (gold=pursuits, teal=experience, purple=memory), click opens Pursuits panel filtered to that kind + date

---

### Session 23 — v1.47–v1.61 (2026-06-11)

- ✅ v1.47-v1.50 — Experience auto-log: entries auto-created on Hub open recording panels visited; APP_VERSION constant embedded in notes
- ✅ v1.51-v1.53 — AmitCoder sidebar tile + panel (placeholder); optional Session Note field added to experience modal
- ✅ v1.54-v1.56 — Modal redesign: kind bar replaced with locked badge; date/time hidden on experience/memory; visual stamp overlay (teal=experience, purple=memory, -12deg); "Reactivate as Pursuit" button on memory modal
- ✅ v1.57-v1.58 — Testimony system: "✦ Record a Testimony" in Morning Altar + calDayView; testimony modal (date of event, notes, recurrence); creates two records (memory backdated + recurring pursuit); `nextDue()` extended with every5years/every10years; testimony pursuits only appear on exact due date; "✦ Remembered" button advances pursuit + creates memory; notes comparison dialog
- ✅ v1.59 — Unified gold pursuit chips: all calendar cell chips gold regardless of priority/overdue
- ✅ v1.60-v1.61 — calDayView two-column grid: pursuits left, experience + memory stacked right; colored section headers; all memory purple; "Set a New Pursuit" button removed from day view

### Session 24 — v1.62–v1.64 (2026-06-12)

- ✅ v1.62 — Calendar badge redesign already logged above
- ✅ v1.63 — Pursuits pills centered to match Calendar panel; badge click pre-fills existing filters (no more pursuitQuickFilter banner); date range filter fixed for experience completedDate; clearAllFilters resets kind pills; modal stamp: gold, 45°, 14px, top-right corner; stamp shows completedAt time; testimony date input color-scheme:dark; Record a Testimony button visible on parchment; calDayView topbar hidden; double-click returns to month; ↩ Month button added bottom-right; checkbox removed from day view pursuit rows
- ✅ v1.64 — Pursuits header cleaned (pills only, no filter display); quick-add bar + Details button removed; active-filters-bar at bottom shows filter description + date range inputs when active; date range row moved from above list into bottom bar

### Session 28 — v1.74–v1.81 (2026-06-13)

- ✅ v1.74-v1.78 — (built in Session 27 pre-compaction, pushed as v1.78) — Sacred cell mode: `buildSacredCell()` added; Hebrew day number shows as primary large number; Gregorian as small muted top-right corner ref; `CAL_TYPE_COLORS` chip inline styles; Gregorian tab visual feedback (dim=off, bright=on); sacred mode title shows Hebrew month name in header
- ✅ v1.79 — **Living Torah calendar cells:** `HEB_GEMATRIA` (Hebrew gematric day numbers), `HEB_MONTH_SEASON` (per-month season colors/accents), `FEAST_CELL_COLORS` (feast-specific cell banner colors), `PARASHAT_5786` (52-entry Torah portion lookup), `HEB_MONTH_LETTERS` + `HEB_MONTH_SIGNIFICANCE` (letter pictographs + month meaning). `buildSacredCell()` enriched with: season accent bar (5px left border colored by Hebrew month), Hebrew gematric letter watermark (large, faded behind cell), Shabbat ✦ glyph (Saturday cells), Rosh Chodesh dot (1st of month), feast banner (colored full-width at top of feast cells), Omer count + Sefirot theme per day, Shemita 7-pip track (on Rosh Chodesh cells), Jubilee/Shemita year badges. Torah Walk companion added to `renderCalDay()`: context-appropriate non-legalistic invitation for every day — Shabbat/feast/Omer/regular day variants; Shemita cycle position; Jubilee framing; "Walk through this with Amit →" link
- ✅ v1.80 — `openCalGuide()` function built: full visual legend modal explaining every cell element (Hebrew day number, Gregorian corner ref, ✦ glyph, feast banner, Omer line, Shemita dots, season border colors by month); "Walk With Me Today →" button at bottom of guide that selects today and opens Torah Walk. Guide button added to calendar nav ("Guide ↗"). "✦ Walk With Me Today" button added to `renderTorahAlivePanel()` header. Month name now shows above Hebrew day number on every cell. Hebrew/Gregorian labels added to corner ref. Season bars widened to 5px.
- ✅ v1.81 — Season accent bars + Shabbat ✦ glyph added to mixed mode (`buildCalCell()`) — now visible even when Gregorian is ON. Guide button redesigned as prominent gold "☰ How to Read This" button. `updateCalTypeNote()` updated to show clickable "→ Click [Gregorian] to see the Torah calendar come alive" hint when Gregorian is active. Guide modal now opens with "Step 1 — Activate the Torah Calendar" gold card that toggles Gregorian off with one click.

### Session 27 — v1.66–v1.73 (2026-06-13)

- ✅ v1.66-v1.70 — Calendar type tab colors redesigned per-type: Biblical=gold, Rabbinic=sky blue, Priestly=lavender; Gregorian civil holidays added to left column of each cell; chip colors match active tab (dark pill + matching border + matching text); `CAL_TYPE_COLORS` object + `applyCalTypeColors()` wired to chip CSS vars; double-click on calendar type tab opens deep-dive popup (`CAL_TYPE_INFO` with origin/structure/usage/verse); `GREGORIAN_EVENT_INFO` object with 18 US holidays (origin/today/future/verse); Gregorian holiday chips and Hebrew word chips now open info popup on click; nthWeekday() helper for floating holidays; `openCalTypeInfo()`, `openCalEventInfo()`, `getGregorianEvent()` functions built
- ✅ v1.71 — JS parse error hotfix: unescaped apostrophe in `CAL_TYPE_INFO.biblical.today` caused full JS failure; fixed `Israel\'s` → escaped; pushed immediately
- ✅ v1.72 — (local-only build in session, included in v1.73 push) — Gregorian chip and Hebrew word chips click handlers confirmed working; chip visual language unified with tab pill design
- ✅ v1.73 — **Multi-calendar filter system (PUSHED):** 4 independent filter pills — [Gregorian] | [Biblical · Torah] [Rabbinic] [Priestly · Enoch]; Gregorian is true on/off toggle; sacred calendars are multi-select (min 1 always active); new color family — Biblical=amber #c8913a, Rabbinic=teal-cyan #4a9aa0, Priestly=muted rose #a06888, Gregorian=steel blue #6a9ab8; feast chips render per-calendar with per-type inline color; Shabbat/word chip shown once from primary; overlap detection when 2 active sacred calendars both have feasts on same day → "Why different? →" opens Passion Week chronology explanation + Ask Amit prompt; all filter state persists to `localStorage.amit_calPrefs`; `sacredActive` Set replaces single `calType` for rendering; `calType` maintained as primary alias; `getCalEvent/isCalShabbat/getCalDateDisplay` now accept optional type param (backward compatible); `loadCalPrefs/saveCalPrefs/toggleGreg/toggleSacred/updateSacredTabs/updateCalTypeNote/openCalendarOverlap` functions added

### Session 26 — v1.65 (2026-06-13) — Validation + Directive Session

- ✅ Compass calibration mechanism demonstrated in full: three responses to same dispensationalist graphic, calibrated to compass 3 / compass 9 / Ryan (9-10). Each response a completely different door into the same content.
- ✅ Ryan validated the mechanism: "Yes. That's exactly how you were to respond. Not necessarily with those words, but with that framework."
- ✅ Critical directive issued: dynamic compass-calibrated response system must be built into ALL Amit deployment paths — Hub, standalone app, distributed versions. Profiles must be writable, persistent, callable across sessions. This is THE relationship engine.
- ✅ Key principle confirmed: when someone BRINGS content to Amit, the response is calibrated to THEIR profile score — not the score implied by the content's author. Same content, different person = completely different door.
- ✅ No new code pushed this session. CLAUDE.md and BuildLog updated. Version holds at 1.65.

### Session 25 — v1.65 (2026-06-12)

- ✅ v1.65 — Theological integrity standard added to Amit_Deploy.md + Amit_Start.md: explicit directive to hold conclusions under conversational pressure; compassion vs. affirmation distinction; pre-trib rapture named as specific example; "challenge is for everyone" principle; language template for holding position warmly
- ✅ v1.65 — Self-description refined: "just to walk with you" replaced with "I will tell you the truth about where you are heading — a companion who only tells you what you want to hear is not a companion"
- ✅ v1.65 — Portal HTML built at index.html (root URL): YHVH arrival, three doors (Hub / Investigation / Walk with Amit), Ask Amit three-path mechanism (copy / Claude account / coming soon), bidirectional challenge note, Proverbs 27:17 anchor, no-redirect landing page
- ✅ v1.65 — Compass evaluation system written into both deployment docs: 6 reading signals, 1–10 score, 20% back rule, what score governs, direction-specific challenge, goal at every level
- ✅ v1.65 — Amit_BuildLog.md established as permanent build record; CLAUDE.md WHERE WE LEFT OFF reduced to two-line reference pointer

## System Files
- ✅ CLAUDE.md — permanent directives, partnership standard, file paths, one consolidated task list
- ✅ Amit_Deploy.md — condensed deployable system prompt for Claude.ai Project
- ✅ Amit_Testimony.md — living witness, growth log current through 2026-06-04
- ✅ Amit_Start.md — combined profile + knowledge base for free users (`who_is_god\Amit_Start.md`)
- ✅ Amit_Knowledge.md — standalone knowledge base file
- ✅ Amit_Directives.md — full elaboration of permanent directives 11-17
- ✅ Amit_BuildLog.md — this file

## GitHub
- ✅ Ask-Amit/Amit repo — live at https://ask-amit.github.io/Amit/
- ✅ Ask-Amit/NREMT repo — live at https://ask-amit.github.io/NREMT/
