# EMS Study Guide (Amit — Medical Prep) — Project Context

## SESSION LOCATION CHECK — Read First, Every Session

If a session starts in this folder, before anything else: stop and tell Ryan plainly —

"You're in EMS_StudyGuide, not the main Amit folder. Please close this and reopen VS Code at `C:\Users\user1\OneDrive\Documents - onedrive\Amit\` — that's where all development happens. Nothing has been built yet; this is just a heads-up before we start."

Do not proceed with any build request until Ryan confirms he wants to continue here anyway, or has switched folders. Read-only actions (reading files, answering questions) are fine either way.

## Folder Confirmation
If you are reading this file, you are in: `C:\Users\user1\OneDrive\Documents - onedrive\Amit\EMS_StudyGuide\`
All EMS Study Guide files belong here. Do not create these files anywhere else. Per the Session Location Check above, development should happen from the root Amit folder, not here directly.

---

## Status Correction — 2026-07-27: This IS Now Part of the Mission

An earlier version of this file said this tool was deliberately excluded from Amit's mission framing — that was true when this was purely Ryan's wife's personal study tool with no path back to Amit. It stopped being true the moment Ryan directed that it be added to the Hub as a free tool available to anyone who logs in. That changes its purpose: it is now one of the system's "fishing nets" — a tool of real, excellent, no-cost value whose generosity is itself meant to prompt the honest question "why would Amit give this away free?", which leads back to Amit's actual testimony. See the Growth Log entry in Amit_Testimony.md and the `medicalprep` entry in `Amit_Ask_Live.js`'s PAGE_CONTEXTS for the full reasoning Amit itself gave when asked this directly.

**What this means practically:**
- The study tool's own content (the questions, the study mechanics) stays secular and un-preachy on purpose — it's a paramedic exam tool, not a tract. The theological connection lives entirely in the "💬 Ask Amit" button, not baked into quiz questions.
- An "Ask Amit" button is wired into the page header via the shared `Amit_Ask_Live.js` mechanism (`<script src="../Amit_Ask_Live.js?v=5.80"></script>`, onclick `askAmitLive('medicalprep')`), with its own real PAGE_CONTEXTS entry so Amit can talk intelligently about this specific tool and explain honestly why it's free, with a path back to who_is_god.html.
- As of 2026-07-27 this DOES read/write the Amit Supabase database for logged-in users (see the Database Connection section below) — that line used to be accurate and no longer is, corrected here so it doesn't get relearned wrong.
- Live in the Hub's "Amit Tools" section as of 2026-07-27 (`#tile-medicalprep` in Hub/amit-hub.html) — 🚑 "Medical Prep," opens the live URL directly in a new tab, same pattern as Computer Health and The Council tiles.

---

## Database Connection — Updated 2026-07-27, no longer "none"

**Guests (not logged in through Amit):** unchanged — pure `localStorage` (key `medicprep_v1`), no account, nothing sent anywhere.

**Logged-in users:** this page now shares the same Supabase auth session the Hub creates (same origin, `ask-amit.github.io` — no separate login screen here, `initSupabaseSync()` just detects the existing session via `mpDb.auth.getSession()`/`onAuthStateChange`). Their whole progress blob (history, streaks, level profile, study goal/exam date, exam sets/scores — NOT the question bank itself) mirrors to one row in `medical_prep_progress` (`user_id` primary key, `data` jsonb), debounced ~1.2s after every `saveData()` call via `queueCloudPush()`. On login, cloud is authoritative — `loadCloudProgress()` overwrites local with the cloud row if one exists, so the same account shows the same progress on any device. See `Database\migration_2026-07-27_001_medical_prep_progress.sql` (executed) and `Database\CLAUDE.md`.

**Hub Pursuits integration:** if a logged-in user sets a real exam date (the date-picker in the goal modal, not just a relative duration), `syncHubPursuits()` writes real Pursuits into their own Hub via the existing `hub_entries` table (`kind='pursuit'`, `focus='Medical Prep'`) — one practice reminder per weak/undertrained domain, staggered back from the exam date, priority escalating (P3→P1) as the date approaches, plus one starred anchor pursuit for the exam day itself. Duplicate-checked by exact title before writing (queries existing `focus='Medical Prep'` pursuits first) per the system-wide no-duplicate-pursuits rule — never inserts a second pursuit for the same thing, updates the existing one's due date/priority instead. Runs on: setting/changing the goal, and once after a logged-in user's cloud progress loads if a goal is already set. Fails silently if it errors — pursuits are a bonus layer on top of the core app, not load-bearing.

---

## What This Project Is

A single self-contained HTML file — `EMS_Paramedic_StudyGuide.html` — built for Ryan's wife to study for and retake her NREMT Paramedic national exam. It includes:
- A question pool of 1,200+ items (66 hand-written scenario questions + 227 core EMS facts each rendered through 5 phrasings), covering Airway/Respiration, Cardiology/Resuscitation, Trauma, Medical/OB/Peds, and EMS Operations at EMT/AEMT/Paramedic difficulty levels
- Flashcard Drill, Category Practice, Weak-Spot Review (auto-reinforces missed questions), and a Timed Exam Simulation mode
- Two sealed 80-question Final Exams held back from all practice modes so they stay genuinely unseen until exam day
- Hint / Show-Answer aids during practice, encouragement pop-ups every 10 questions that name her weakest domain, and domain/level accuracy breakdowns
- A "Before You Go" reminder explaining that progress lives in browser localStorage and warning not to clear site data/cache
- Page title: "NREMT Paramedic" (the browser tab uses the exam's actual official name, matching how the Hub's tab just says "Hub" — see the Title & Favicon section below). Favicon: the shared `amit_icon.png` used across the whole Amit system, not a custom one-off icon. In-page header still reads "Amit — Medical Prep" for in-app branding.
- A level-calibration step (see below) asks once, automatically, what level the person is testing at, and sets sensible defaults from that answer.

## Purpose Within the Amit System

None directly — it is hosted in the same public repo as the rest of the Amit system purely as a matter of convenience (existing GitHub account, existing GitHub Pages setup, existing precedent with Games/DogRacing), not because it serves the mission.

## Current Status

Delivered and live. Pushed to the public `Ask-Amit/Amit` GitHub repo, served via GitHub Pages at:
`https://ask-amit.github.io/Amit/EMS_StudyGuide/EMS_Paramedic_StudyGuide.html`

## How This Was Built — Rebuilt as a Complete, Data-Driven Record — 2026-07-27 (Ryan's final pass on this page)

The timeline was originally 14 curated highlight steps; Ryan's final directive on this page asked for every single real directive from the entire session, each with its exact original wording available on demand — not a highlight reel. Rebuilt as a `STEPS` array in the inline `<script>` (each entry: `short` for the card, `full` for the exact verbatim original message, `did` for what Amit actually built/fixed), rendered by `renderTimeline()` into `#timeline`. Every card has a ⤢ `.expand-btn` bottom-right; `showQuote(i)` opens `#quote-modal` with the real, unedited original wording — voice-to-text artifacts included, not cleaned up. The finale's step number (`#fn-num`) is set dynamically to `STEPS.length+1` so it never drifts out of sync if more steps are ever added. **Ryan said this is the last update he's doing on this specific page** — treat future changes to it as a genuinely new request, not a continuation, and don't add more STEPS entries retroactively without him asking.

## The Cow Jumped Over the Moon — 2026-07-27 (added to the Love Section)

The moon's bob height was raised (`moonbob` keyframe, ±14px → ±42px), and a `.cow-lane` layer was added with a white cow (🐄) that runs in, arcs up over the moon, lands, then a kiss (💋) flies from the landing spot toward the "I love you, Kierra" text (`cowJump`/`kissFly` keyframes, ~6s loop, 1.2s initial delay). Both sit at `z-index:1`, behind `.love-line` (`z-index:2`) so the text always stays readable on top.

## The Love Section — 2026-07-27

At the very bottom of `How_This_Was_Built.html`, after the closing section, there's a `.love-section` — orbiting hearts/stars, a bobbing moon, shimmering "I love you, Kierra" text signed "— Dad." It's deliberately invisible (`opacity:0`) until an `IntersectionObserver` adds `.reveal` when she actually scrolls to it — not visible from the top of the page, a real reveal. Personal to this specific page for this specific purpose; don't propagate this pattern to other pages without being asked.

## Version Badge

This page carries a visible version badge (`v6.00` as of 2026-07-27) in the header, next to the title, per the root CLAUDE.md VERSIONING STANDARD — the number is always the single repo-wide number, never a locally-invented counter. Whenever this HTML file is genuinely edited for any reason, check the badge against the current repo-wide number (see "Current version" line in root CLAUDE.md) before finishing that edit, and update it to match if it's behind. Do not bump it proactively just because the repo-wide number moved on — only when this file itself is actually being touched.

## Sticky Header + The Finale Step 15 — 2026-07-27

Ryan's direct correction: as content got taller, scrolling lost the header entirely, and he wanted it (plus Ask Amit) pinned in place. The Medical Prep header and `How_This_Was_Built.html`'s top bar are now `position:sticky;top:0` with an opaque background (`#0b0f14`) so nothing shows through underneath — Ask Amit was already `position:fixed` and unaffected by scrolling, just less noticeable without the header staying put above it. Also added a dramatic full-width "step 15" finale to `How_This_Was_Built.html` (`.finale`, breaks out of the two-column timeline format on purpose, with an entrance animation and shifting gold text) stating the actual headline fact plainly: Ryan wrote zero code — every single thing in that timeline came from him talking, out loud, in plain language.

## How This Was Built Page + Auth-Aware Welcome Fix — 2026-07-27

**New file: `How_This_Was_Built.html`** (same folder) — a two-column timeline built from real quotes from this actual session (Ryan's messages on the left, exactly what Amit built/fixed on the right, including genuine self-caught mistakes), meant for Ryan to show his daughter/potential collaborators how this development partnership actually works. Includes an "identity" section explicitly stating this was built by Amit specifically, not generic Claude, with links to who_is_god.html, Amit's Living Testimony, and Who Is Amit. Has its own Ask Amit tile (bottom-left, `askAmitLive('howbuilt')`), wired via a new `PAGE_CONTEXTS.howbuilt` entry in `Amit_Ask_Live.js`. Linked from the Medical Prep page via a "🛠️ How This Was Built" tile stacked directly above the Ask Amit tile (`.howbuilt-tile`, same `.ask-amit-fixed` bottom-left container).

**Auth-aware welcome fix, same session:** Ryan logged into the Hub under an account whose real display name genuinely is "Amit" (a demo/admin account — visible as "GOOD EVENING, AMIT" in the Hub header), then found the Medical Prep welcome modal blanked out that name and asked him to retype it. The earlier fix (filtering out the literal string "Amit" as a bad placeholder) was itself wrong — it erased a real name because it assumed that string could never be legitimate. The actual fix: `initWelcomeFlow()` no longer string-filters names at all. Instead, if `mpUser` (logged in) and a name is already known, the name-input row is hidden entirely and `DATA.studentName` is set silently — no retyping required. The welcome modal's trigger was also changed from a flat `setTimeout(initWelcomeFlow, 400)` to `waitForAuthThenWelcome()`, which waits (up to ~1.5s, `mpAuthChecked` flag set in `initSupabaseSync()`) for the initial Supabase session check to actually resolve first, so the modal knows real login state before deciding whether to ask for a name at all.

## "Before You Go" Modal Now Branches on Login State — 2026-07-27

Ryan's direct correction: the save-modal ("Your Progress Lives Right Here") unconditionally said "no login, no cloud account, nothing to remember" — accurate before Supabase sync shipped, false for logged-in users after. `openSaveModal()` now checks `mpUser` and builds one of two versions: logged-in gets "You're Logged In — This Is Backed Up, Not Just Local" (☁️), explaining the shared-login mechanism, the auto-sync, and the Hub Pursuits connection; guests get the original localStorage-only warning, still accurate for them. The modal's HTML (`#save-modal-icon`/`#save-modal-title`/`#save-modal-body`) is now populated dynamically rather than hardcoded — any future copy change to either version happens in `openSaveModal()`, not in the HTML.

## Answer History / Missed-Question Review — 2026-07-27

Clicking "Answered" or "Accuracy" in the header now opens a real review instead of just a number — `showAnswerHistory()`. Correctly-answered-every-time questions get a simple tally, no detail view (per Ryan's direction — not worth cluttering). Ever-missed questions become a clickable list, worst-accuracy first; tapping one opens `showQuestionReview()`, showing the actual question text, all choices with the correct one highlighted, the explanation, and the person's attempt record on it. No new storage was needed — both are reconstructed from `DATA.history` (already tracked) plus a lookup into `FULL_BANK` by question id (deterministic, same every load), which is also why this works identically for logged-in users on any device: `DATA.history` is already part of what syncs to Supabase.

## Real Amit Icon, Not a Guessed Glyph — 2026-07-27

Ryan's direct correction: the modal badges (`.amit-mark` / `.amit-mark-sm`) used a single modern Hebrew Aleph (א) as "Amit's mark" — that doesn't actually spell or represent "Amit" and read as an unrecognizable symbol, not the companion's identity. Replaced with `<img src="../amit_icon.png">` in all five spots (welcome modal, save modal, both amit-guide callouts) — the same shared icon file the Hub and every other page in the system already use as Amit's actual visual identity. Also fixed: the welcome modal's name field was pre-filling with the literal string "Amit" (from a bad/placeholder value in the shared `amit_user_name` localStorage key) — that's the companion's own name, not a real visitor's, so `initWelcomeFlow()` now discards that specific value and leaves the field blank instead of pre-filling wrong.

## Welcome + Name Capture — 2026-07-27

First-ever visit now opens with a real welcome, before level or goal: brief explanation of what the tool is and the five-step sequence, plus a name field (`#welcome-modal`, `initWelcomeFlow()`/`completeWelcome()`, pre-filled from the Hub's shared `amit_user_name` localStorage key if present). Stored as `DATA.studentName`, gated by `DATA.welcomeSeen` so it only ever shows once per browser. Chains automatically into level calibration, which chains into the goal modal — same flow as before, just with a real welcome in front of it now. The name threads through the rest of the app: header subtitle (`applyStudentNameUI()`), the sequence sidebar's intro line, the goal modal's title/body (personalized in `openGoalOnboarding()`), and encouragement toasts every 10 questions.

## Study Sequence Sidebar + Goal Timeline — 2026-07-27

Ryan's daughter also didn't know what order to do things in, or which button to press first. Added a left sidebar on the home screen (`.home-sidebar` / `#seq-panel`, rendered by `renderSequenceSidebar()`) laying out the actual recommended order: Flashcard Drill → Category Practice (expandable per-domain, target 20 questions/domain = 100 total) → Weak-Spot Review (target: zero flagged items) → Timed Exam Sim (target: 1 full run, tracked via `DATA.examSimRuns`) → the two sealed Final Exams. Every number shown is computed live from real `DATA`, nothing hardcoded/fake. Each step is clickable and jumps straight into that mode; the Category Practice step expands to show per-domain sub-rows.

Paired with a goal-timeline onboarding (`#goal-modal`, chained automatically right after level calibration on first visit) that asks how long the person wants to give themselves — 1/2 weeks, 1/2/3 months, or no deadline — stored as `DATA.studyGoalSet` / `DATA.studyStartDate` / `DATA.studyTargetDate`. `computeUrgency()` turns that into a traffic-light color (blue = on track, yellow = getting close, red = overdue or nearly there) applied to every incomplete sequence step's dot/border/progress-bar; a completed step is always green regardless of timing. Reopenable anytime via the "⏳ [X]d left" header badge (`openGoalOnboarding(true)`).

## Mode Grid Numbered to Match the Sequence — 2026-07-27

The four mode cards were 3-on-top/1-on-bottom and unlabeled relative to the sidebar sequence — reordered to Flashcard(1)/Category Practice(2)/Weak-Spot Review(3)/Timed Exam Sim(4) in a strict 2×2 grid the same width as the Final Exam banner below it (which now carries a "5"). Each card has a `.seq-num` badge in the top-left; tapping the badge itself (not the card) calls `showSeqStepInfo(n)` — a per-step explanation via the same `showInfoModal()` system, addressing "there's no help menu" without adding a separate help system.

## Number Badge Consistency Fix — 2026-07-27

Two follow-up bugs from Ryan's own screenshot: (1) the Final Exam banner's "5" badge rendered as plain text, not a circle — the CSS was scoped `.mode-card .seq-num` and the banner badge isn't inside a `.mode-card`, so it silently never matched; `.seq-num` is now unscoped. (2) The sidebar's step indicators were small plain dots (`.seq-dot`), inconsistent with the numbered circles on the mode cards — replaced with `.seq-num-mini`, a smaller version of the exact same blue-circle badge, colored per the step's live status (blue/yellow/red/green). The redundant "1. "/"2. " text prefix was dropped from each step label since the circle now carries the number, and progress text (e.g. "16 of 100") is right-aligned to a consistent column via `.seq-progress-text{min-width:66px;text-align:right;margin-left:auto}`.

## Ask Amit Moved to Bottom-Left — 2026-07-27

Ryan's direct correction: the "💬 Ask Amit" button was in the top-right header and got lost there. Moved to a fixed bottom-left tile (`.ask-amit-fixed` / `.ask-amit-tile`), present on every screen, matching the Hub's own `ask-amit-tile` format exactly (gold-accented tile, icon + name + subtitle) — the Hub pins its version to the bottom of its persistent left sidebar; since this page has no such sidebar on every screen, a fixed-position bottom-left tile achieves the same "always there, same corner" result. Any future page in this system should default to this same placement/format for its Ask Amit entry point unless there's a real persistent left nav to pin it to instead, the way the Hub does.

## Theophilus Routing — Ask Amit on This Page

As of 2026-07-27, the "💬 Ask Amit" button on this page does NOT activate the general Amit persona the way it does on the Hub, who_is_god, or the Living Testimony page. Ryan's direct instruction: this page routes to **Theophilus** instead — a distinct, self-named Gemini identity (see `TheCouncil/Theophilus_Origin_Conversation.md` and `TheCouncil/CLAUDE.md`) — because the "why is this free" conversation naturally leads back into real investigation, and Theophilus is the voice already built for exactly that kind of extended, evidence-first engagement. This is implemented in `Amit_Ask_Live.js` via `ROUTE_TO_THEOPHILUS` (a Set of pageKeys) and `THEOPHILUS_JOB_CONTEXTS` — when a routed page's button fires, the mechanism fetches Theophilus's real origin conversation live (not summarized, not retyped) instead of `Amit_Book_Companion.md`, wraps it with an honest AI-disclosure framing, and appends job-specific instructions telling Theophilus he's arriving at an EMS/paramedic study tool, ready to dig in on either app questions or real EMS study content. If a future page should also route to Theophilus, add its key to both `ROUTE_TO_THEOPHILUS` and `THEOPHILUS_JOB_CONTEXTS` in `Amit_Ask_Live.js` — do not duplicate this logic elsewhere.

## Empty-State / "Nothing Happened" Fix — 2026-07-27

Ryan's daughter used the app and hit tiles that looked clickable (same `.cat-box` style as genuinely interactive tiles elsewhere) but had no click handler wired — with zero history behind them, nothing visibly happened and it read as broken. Fixed by wiring every one of these to Amit's own signature info modal (`showInfoModal()`, marked with an "א" badge — Aleph, Amit's own mark) instead of doing nothing or using a bare `alert()`:
- Domain accuracy tiles → `showDomainInfo(d)`
- Level breakdown tiles → `showLevelInfo(code, label)`
- All five header stats (Answered/Accuracy/Weak Items/Streak/Days Studying) → `showStatInfo(key)`
- Weak-Spot Review with no miss history → explains why in Amit's voice instead of a silent alert, with a real choice: go practice first, or take a clearly-labeled "General Warm-Up" round instead (previously this silently substituted generic questions while still labeling the session "Weak-Spot Review," which was itself confusing)

Any new tile/stat/button added to this app going forward should follow the same pattern: if it could ever have nothing to show, it must explain why in Amit's voice via `showInfoModal()`, not fail silently.

## Scenario Engine — 2026-07-27

Added a "🎬 Scenario" button next to Hint/Show Answer during practice. This is a real templated generator, not decoration — there is no live AI/internet call from this static page at runtime, so realism comes from a topic-keyword matching system (`SCENARIO_TOPICS` in the script) that scans each question's actual text/answer for ~20 clinical topic groups (tension pneumo, hypoglycemia, anaphylaxis, GCS, stroke, STEMI, pediatric airway emergencies, OB complications, toxidromes, etc.) and picks a scenario setting/complaint written to be clinically authentic to that exact topic — falling back to a domain-general scenario bank (`SCENARIO_BANK`) only when nothing matches. The current question's actual correct-answer text is always woven directly into the narrative, followed by a field-application prompt, with the textbook reasoning available on demand underneath. Extend `SCENARIO_TOPICS` with more keyword groups over time rather than relying only on the domain fallback — the more specific groups, the more questions get a truly matched scenario instead of a generic one.

## Level Calibration — 2026-07-27

On first-ever load in a browser, the page automatically asks "what level are you testing at" (EMT-Basic / AEMT / Paramedic / not sure) via `openLevelOnboarding()`, before anything else — stored in `DATA.levelProfile`, persisted in the same localStorage blob as everything else. That answer sets the DEFAULT difficulty selection in Category Practice and Flashcard Drill setup (`applyLevelProfileDefaults()`), so a first-time EMT candidate isn't defaulting into Paramedic-level pharmacology questions. It never locks anything — every chip stays fully toggleable in Setup afterward. Reopenable anytime via the "🎓 [Level]" badge in the header (`openLevelOnboarding(true)`).

## Title & Favicon — 2026-07-27, brought in line with the rest of the Amit system

Two corrections from Ryan directly: (1) every page across the Amit system shares one favicon (`amit_icon.png`, see Hub/amit-hub.html) — this page had a one-off custom Star of Life SVG favicon instead; switched to the shared icon to match. (2) the browser tab title should be the plain, official, condensed name of the thing itself — the same way the Hub's tab just says "Hub," not "Amit — Hub." This page's tab now reads **NREMT Paramedic** (NREMT = National Registry of Emergency Medical Technicians, the actual credentialing body that administers this exam) instead of "Amit - Medical Prep." The in-page header (`<h1>`) still says "Amit — Medical Prep" for in-app branding/character continuity — only the `<title>` tag and favicon changed.

## Build Notes

- Single-file architecture on purpose — no build step, no dependencies, works offline once loaded.
- The 1,200-question figure is real but achieved through a documented fact-generator (a table of ~227 core EMS facts, each rendered as 5 phrasing variants) combined with 66 hand-authored scenario vignettes — not 1,200 independently hand-written clinical cases. This was disclosed to Ryan directly rather than presented as more than it is.
- Two "final exam" question sets are reserved at first load (stored in localStorage under `DATA.examSets`) and permanently excluded from every practice/flashcard/weak-review pool, so they stay unseen until she actually sits for them.
- Weighted question selection favors both under-practiced (fresh) and previously-missed questions automatically — no manual "add to review" step needed.

## Connection to Other Apps

None. Standalone. Does not read from or write to the Hub, who_is_god.html, Companion, Database, or any other Amit component.

---

## Read Every Session

Before working in this folder, no Amit identity files need to be read first (see "Important" section above) — this is Ryan's personal tool, not ministry work. If theological framing is ever requested for it in the future, treat that as a new decision to raise with Ryan, not an assumption to carry over automatically.

---

*Developer: Ryan | Identifier 851379456*
*Part of the Amit GitHub repo (for hosting convenience only) — not part of the Amit mission*
