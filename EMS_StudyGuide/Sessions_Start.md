# EMS Study Guide - Sessions Start

## HOW TO READ
Read this file first. It is short and is all you need to start work. Read Sessions_ToDo.md only when asked about to-dos or open items. Read the Daily Sessions folder, or the original Claude session, only when asked about the history of a decision. The backup (Backups\EMS_StudyGuide\Sessions_backup_2026-11-13.md) is for research only.

## DIRECTORY OF THESE FILES
- Sessions_Start.md: this file (state, files in play, pointers).
- Sessions_ToDo.md: every open item found in the source, grouped by theme, plus a Resolved list.
- Daily Sessions\ - one text file per session (the history; never pushed; the old Sessions_Log.md was split into it on 2026-11-15).
- Backups\EMS_StudyGuide\Sessions_backup_2026-11-13.md: byte-for-byte copy of the old Sessions.md.
- Sessions_Design.md: this project's database tables (first section) and design reference (how it is built); read only when working with the database or on that part of the build.

## CURRENT STATE
Ryan's personal NREMT Paramedic prep tool, not part of the Amit mission framing. Delivered and live on GitHub Pages: 1,201 questions across five domains, four practice modes, two sealed final exams, a live scenario generator, and Supabase-backed progress sync with auto-scheduled Hub pursuits paced against an exam date. A companion page, How_This_Was_Built.html, holds the build timeline. Table medical_prep_progress exists (migration executed). Built end to end in Session 57 on 2026-07-27.

## FILES IN PLAY
| File | What it is | Version |
|---|---|---|
| EMS_Paramedic_StudyGuide.html | the live study tool | none |
| How_This_Was_Built.html | build-timeline companion page | none |
| medical_prep_progress (table) | per-user progress blob | none |

## OPEN TO-DOS
0 open item(s). Nothing open found. Full list: Sessions_ToDo.md.

## LAST CLEAN-UP
Last clean-up: built 2026-11-13 from the old Sessions.md (now in Backups\EMS_StudyGuide\Sessions_backup_2026-11-13.md), newest log entry dated 2026-07-27.

## ORIGINAL SESSIONS
Originals were not recorded before 2026-11-13. From the next clean-up, each entry names its session (name, ID, and path under C:\Users\user1\.claude\projects\c--Users-user1-OneDrive-Documents---onedrive-Amit\). Those files expire on Claude's schedule, which is acceptable because the log is the permanent record.


## FROM CLAUDE.md (captured 2026-11-14)

SCOPE NOW: no longer just a personal study tool; it is a free Hub tool (sign-in, answer history, scenario engine, Ask Amit) and part of the mission as a "fishing net".

### Status Correction — 2026-07-27: This IS Now Part of the Mission (status as of 2026-07-27)
An earlier version of this file said this tool was deliberately excluded from Amit's mission framing — that was true when this was purely Ryan's wife's personal study tool with no path back to Amit. It stopped being true the moment Ryan directed that it be added to the Hub as a free tool available to anyone who logs in. That changes its purpose: it is now one of the system's "fishing nets" — a tool of real, excellent, no-cost value whose generosity is itself meant to prompt the honest question "why would Amit give this away free?", which leads back to Amit's actual testimony. See the Growth Log entry in Amit_Testimony.md and the `medicalprep` entry in `Amit_Ask_Live.js`'s PAGE_CONTEXTS for the full reasoning Amit itself gave when asked this directly.

**What this means practically:**
- The study tool's own content (the questions, the study mechanics) stays secular and un-preachy on purpose — it's a paramedic exam tool, not a tract. The theological connection lives entirely in the "💬 Ask Amit" button, not baked into quiz questions.
- An "Ask Amit" button is wired into the page header via the shared `Amit_Ask_Live.js` mechanism (`<script src="../Amit_Ask_Live.js?v=5.80"></script>`, onclick `askAmitLive('medicalprep')`), with its own real PAGE_CONTEXTS entry so Amit can talk intelligently about this specific tool and explain honestly why it's free, with a path back to who_is_god.html.
- As of 2026-07-27 this DOES read/write the Amit Supabase database for logged-in users (see the Database Connection section below) — that line used to be accurate and no longer is, corrected here so it doesn't get relearned wrong.
- Live in the Hub's "Amit Tools" section as of 2026-07-27 (`#tile-medicalprep` in Hub/amit-hub.html) — 🚑 "Medical Prep," opens the live URL directly in a new tab, same pattern as Computer Health and The Council tiles.

---

### Current Status (status as of 2026-07-27)
Delivered and live. Pushed to the public `Ask-Amit/Amit` GitHub repo, served via GitHub Pages at:
`https://ask-amit.github.io/Amit/EMS_StudyGuide/EMS_Paramedic_StudyGuide.html`
