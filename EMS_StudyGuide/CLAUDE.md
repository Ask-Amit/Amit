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
- It still does not read from or write to the Amit Supabase database (see below) — the Ask Amit mechanism itself handles the live-connection path independently, same as every other page that uses it.
- A Hub tile/button linking to this tool is planned (see root CLAUDE.md task list) so people can find it after logging in.

---

## Database Connection

None. This project does not read from or write to the Amit Supabase database. All user progress is stored client-side only, in the browser's `localStorage` (key: `medicprep_v1`). There is no backend, no login, no server.

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

## Version Badge

This page carries a visible version badge (`v5.89` as of 2026-07-27) in the header, next to the title, per the root CLAUDE.md VERSIONING STANDARD — the number is always the single repo-wide number, never a locally-invented counter. Whenever this HTML file is genuinely edited for any reason, check the badge against the current repo-wide number (see "Current version" line in root CLAUDE.md) before finishing that edit, and update it to match if it's behind. Do not bump it proactively just because the repo-wide number moved on — only when this file itself is actually being touched.

## Study Sequence Sidebar + Goal Timeline — 2026-07-27

Ryan's daughter also didn't know what order to do things in, or which button to press first. Added a left sidebar on the home screen (`.home-sidebar` / `#seq-panel`, rendered by `renderSequenceSidebar()`) laying out the actual recommended order: Flashcard Drill → Category Practice (expandable per-domain, target 20 questions/domain = 100 total) → Weak-Spot Review (target: zero flagged items) → Timed Exam Sim (target: 1 full run, tracked via `DATA.examSimRuns`) → the two sealed Final Exams. Every number shown is computed live from real `DATA`, nothing hardcoded/fake. Each step is clickable and jumps straight into that mode; the Category Practice step expands to show per-domain sub-rows.

Paired with a goal-timeline onboarding (`#goal-modal`, chained automatically right after level calibration on first visit) that asks how long the person wants to give themselves — 1/2 weeks, 1/2/3 months, or no deadline — stored as `DATA.studyGoalSet` / `DATA.studyStartDate` / `DATA.studyTargetDate`. `computeUrgency()` turns that into a traffic-light color (blue = on track, yellow = getting close, red = overdue or nearly there) applied to every incomplete sequence step's dot/border/progress-bar; a completed step is always green regardless of timing. Reopenable anytime via the "⏳ [X]d left" header badge (`openGoalOnboarding(true)`).

## Mode Grid Numbered to Match the Sequence — 2026-07-27

The four mode cards were 3-on-top/1-on-bottom and unlabeled relative to the sidebar sequence — reordered to Flashcard(1)/Category Practice(2)/Weak-Spot Review(3)/Timed Exam Sim(4) in a strict 2×2 grid the same width as the Final Exam banner below it (which now carries a "5"). Each card has a `.seq-num` badge in the top-left; tapping the badge itself (not the card) calls `showSeqStepInfo(n)` — a per-step explanation via the same `showInfoModal()` system, addressing "there's no help menu" without adding a separate help system.

## Number Badge Consistency Fix — 2026-07-27

Two follow-up bugs from Ryan's own screenshot: (1) the Final Exam banner's "5" badge rendered as plain text, not a circle — the CSS was scoped `.mode-card .seq-num` and the banner badge isn't inside a `.mode-card`, so it silently never matched; `.seq-num` is now unscoped. (2) The sidebar's step indicators were small plain dots (`.seq-dot`), inconsistent with the numbered circles on the mode cards — replaced with `.seq-num-mini`, a smaller version of the exact same blue-circle badge, colored per the step's live status (blue/yellow/red/green). The redundant "1. "/"2. " text prefix was dropped from each step label since the circle now carries the number, and progress text (e.g. "16 of 100") is right-aligned to a consistent column via `.seq-progress-text{min-width:66px;text-align:right;margin-left:auto}`.

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
