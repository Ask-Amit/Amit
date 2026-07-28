# EMS Study Guide (Amit — Medical Prep) — Project Context

## SESSION LOCATION CHECK — Read First, Every Session

If a session starts in this folder, before anything else: stop and tell Ryan plainly —

"You're in EMS_StudyGuide, not the main Amit folder. Please close this and reopen VS Code at `C:\Users\user1\OneDrive\Documents - onedrive\Amit\` — that's where all development happens. Nothing has been built yet; this is just a heads-up before we start."

Do not proceed with any build request until Ryan confirms he wants to continue here anyway, or has switched folders. Read-only actions (reading files, answering questions) are fine either way.

## Folder Confirmation
If you are reading this file, you are in: `C:\Users\user1\OneDrive\Documents - onedrive\Amit\EMS_StudyGuide\`
All EMS Study Guide files belong here. Do not create these files anywhere else. Per the Session Location Check above, development should happen from the root Amit folder, not here directly.

---

## Important — This Is Not Ministry/Mission Content

Every other folder under the Amit root exists to serve the Amit mission — the companion who walks people toward Yahweh through who_is_god.html, the Hub, the Companion app, etc. **This folder is different, deliberately.** It is Ryan's own personal NREMT Paramedic nationals recertification study tool. It does not carry Amit's theological voice, does not connect to the Amit Supabase database, and does not need the "walk alongside toward God" framing applied to it. Build and discuss this tool as a straightforward, high-quality study application — not as an extension of Amit's ministry character. Precedent for personal, non-ministry content living in the same public GitHub repo: `Games/DogRacing/`.

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
- Page title: "Amit - Medical Prep". Favicon: a custom Star of Life (the official six-pointed EMS emblem) with the Rod of Asclepius at center, built as an inline SVG data URI — no external asset files.

## Purpose Within the Amit System

None directly — it is hosted in the same public repo as the rest of the Amit system purely as a matter of convenience (existing GitHub account, existing GitHub Pages setup, existing precedent with Games/DogRacing), not because it serves the mission.

## Current Status

Delivered and live. Pushed to the public `Ask-Amit/Amit` GitHub repo, served via GitHub Pages at:
`https://ask-amit.github.io/Amit/EMS_StudyGuide/EMS_Paramedic_StudyGuide.html`

## Version Badge

This page carries a visible version badge (`v5.80` as of 2026-07-27) in the header, next to the title, per the root CLAUDE.md VERSIONING STANDARD — the number is always the single repo-wide number, never a locally-invented counter. Whenever this HTML file is genuinely edited for any reason, check the badge against the current repo-wide number (see "Current version" line in root CLAUDE.md) before finishing that edit, and update it to match if it's behind. Do not bump it proactively just because the repo-wide number moved on — only when this file itself is actually being touched.

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
