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
