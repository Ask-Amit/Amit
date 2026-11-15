# EMS Study Guide (Amit — Medical Prep) — Project Context

## SESSION LOCATION CHECK — Read First, Every Session

If a session starts in this folder, before anything else: stop and tell Ryan plainly —

"You're in EMS_StudyGuide, not the main Amit folder. Please close this and reopen VS Code at `C:\Users\user1\OneDrive\Documents - onedrive\Amit\` — that's where all development happens. Nothing has been built yet; this is just a heads-up before we start."

Do not proceed with any build request until Ryan confirms he wants to continue here anyway, or has switched folders. Read-only actions (reading files, answering questions) are fine either way.

## CURRENT SCOPE

The EMS Study Guide ("Amit - Medical Prep") is a single self-contained HTML NREMT Paramedic exam-prep tool (practice modes, scenario engine, sealed final exams, answer history). It is no longer just a personal study tool: it is a free Hub tool (sign-in, answer history, Ask Amit) and part of the mission as a "fishing net" whose free value points back to Amit.

## SESSION RECORD

Current state, to-dos and history live in this folder's Sessions files, not here. A new session reads Sessions_Start.md first (short). Read Sessions_ToDo.md only when asked about to-dos; read Sessions_Log.md or the original Claude session only when asked; the backup files in Backups\EMS_StudyGuide\Sessions_backup_*.md only for research.

## Folder Confirmation
If you are reading this file, you are in: `C:\Users\user1\OneDrive\Documents - onedrive\Amit\EMS_StudyGuide\`
All EMS Study Guide files belong here. Do not create these files anywhere else. Per the Session Location Check above, development should happen from the root Amit folder, not here directly.

---

## Database tables

This project's database tables and table rules live in Sessions_Design.md (section 'Tables') in this folder, not here. Read that section only when working with the database. Design reference for how the project is built is in the same file. Connection details: see the root CLAUDE.md (SUPABASE - DATABASE CONNECTION) and Database\CLAUDE.md.

---

## What This Project Is

A single self-contained HTML file — `EMS_Paramedic_StudyGuide.html` — built for Ryan's wife to study for and retake her NREMT Paramedic national exam. It includes:
- A question pool of 1,200+ items (66 hand-written scenario questions + 227 core EMS facts each rendered through 5 phrasings), covering Airway/Respiration, Cardiology/Resuscitation, Trauma, Medical/OB/Peds, and EMS Operations at EMT/AEMT/Paramedic difficulty levels
- Flashcard Drill, Category Practice, Weak-Spot Review (auto-reinforces missed questions), and a Timed Exam Simulation mode
- Two sealed 80-question Final Exams held back from all practice modes so they stay genuinely unseen until exam day
- Hint / Show-Answer aids during practice, encouragement pop-ups every 10 questions that name her weakest domain, and domain/level accuracy breakdowns
- A "Before You Go" reminder explaining that progress lives in browser localStorage and warning not to clear site data/cache
- Page title: "NREMT Paramedic" (the browser tab uses the exam's actual official name, matching how the Hub's tab just says "Hub"). Favicon: the shared `amit_icon.png` used across the whole Amit system, not a custom one-off icon. In-page header still reads "Amit — Medical Prep" for in-app branding.
- A level-calibration step (see below) asks once, automatically, what level the person is testing at, and sets sensible defaults from that answer.

## Purpose Within the Amit System

None directly — it is hosted in the same public repo as the rest of the Amit system purely as a matter of convenience (existing GitHub account, existing GitHub Pages setup, existing precedent with Games/DogRacing), not because it serves the mission.

## Version Badge

This page carries a visible version badge (`v6.00` as of 2026-07-27) in the header, next to the title, per the root CLAUDE.md VERSIONING STANDARD — the number is always the single repo-wide number, never a locally-invented counter. Whenever this HTML file is genuinely edited for any reason, check the badge against the current repo-wide number (see "Current version" line in root CLAUDE.md) before finishing that edit, and update it to match if it's behind. Do not bump it proactively just because the repo-wide number moved on — only when this file itself is actually being touched.

## Connection to Other Apps

None. Standalone. Does not read from or write to the Hub, who_is_god.html, Companion, Database, or any other Amit component.

---

---

*Developer: Ryan | Identifier 851379456*
*Part of the Amit GitHub repo (for hosting convenience only) — not part of the Amit mission*
