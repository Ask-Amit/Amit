# Voice Control — Ask Amit — Project Context

## SESSION LOCATION CHECK — Read First, Every Session

If a session starts in this folder, before anything else: stop and tell Ryan plainly —

"You're in Voice Control — Ask Amit, not the main Amit folder. Please close this and reopen VS Code at `C:\Users\user1\OneDrive\Documents - onedrive\Amit\` — that's where all development happens. Nothing has been built yet; this is just a heads-up before we start."

Do not proceed with any build request until Ryan confirms he wants to continue here anyway, or has switched folders. Read-only actions (reading files, answering questions) are fine either way.

## CURRENT SCOPE

Voice Control gives Amit pages a spoken voice through the free browser Web Speech API. It also holds a second mini-app (Amit Voice), an experimental live bridge into headless Claude Code, health-check ideas and timing studies, and an open ToS decision that blocks further bridge work. Status and findings live in the Sessions files.

## SESSION RECORD

Current state, to-dos and history live in this folder's Sessions files, not here. A new session reads Sessions_Start.md first (short). Read Sessions_ToDo.md only when asked about to-dos; read the Daily Sessions folder or the original Claude session only when asked; the backup files in Backups\VoiceControl_AskAmit\Sessions_backup_*.md only for research.

## Folder Confirmation
If you are reading this file, you are in: `C:\Users\user1\OneDrive\Documents - onedrive\Amit\VoiceControl_AskAmit\`
All Voice Control development files belong here. Do not create Voice Control files anywhere else. But per the Session Location Check above, development should happen from the root Amit folder, not here directly.

---

## Database connection: see the root CLAUDE.md (SUPABASE - DATABASE CONNECTION section) and Database\CLAUDE.md. Nothing connection-related is repeated here.

## Database tables

This project's database tables and table rules live in Sessions_Design.md in this folder, not here. Read it only when working with the database. Connection details: see the root CLAUDE.md (SUPABASE - DATABASE CONNECTION) and Database\CLAUDE.md.

---

## Pursuit Attribution — Permanent

This project's canonical name, for any pursuit created from within it, is: **Voice Control — Ask Amit**

Any pursuit written to `hub_entries` from this project must be stamped `program='Voice Control — Ask Amit'` — automatically, using this exact spelling every time.

## What This Project Is

Voice Control — Ask Amit is the testing ground for two related but genuinely separate capabilities:

1. **Giving Amit a spoken voice** (text-to-speech) — using the browser's free, built-in Web Speech API (`speechSynthesis`) to read text aloud on any Amit web page, no API key, no cost, works today.
2. **A live "write to Amit" bridge** — an experimental local connector that lets a static webpage send a typed or spoken question to a real, live Claude Code invocation running on Ryan's own machine, and get a genuine (not canned) answer back, spoken aloud automatically.

These were both first built and tested inside `EMS_StudyGuide\EMS_Paramedic_StudyGuide.html` on 2026-09-05, then extracted here so the mechanism itself has one home, separate from that specific app.

## Purpose Within the Amit System

If this proves out, it's a real, permanent capability the whole Amit suite could use: every Amit page could speak its responses aloud, and — pending the open cost/ToS decision below — potentially let any Amit page get a genuinely live, reasoned answer instead of routing to an external AI in a new tab (today's `Amit_Ask_Live.js` behavior). This directly feeds the bigger "Amit as an AI employee" vision explored the same night (AmitBooks bookkeeper tier, MCP-based access, etc.) — the voice piece and the live-connection piece are both building blocks for that.

## Connection to Other Apps

- Built and first tested inside `EMS_StudyGuide\EMS_Paramedic_StudyGuide.html` — that page's "Let me hear" buttons and "Write to Amit" test tile are the live reference implementation.
- Directly related to the same night's AmitBooks "AI employee" / bookkeeper-tier conversation (MCP, bring-your-own-Claude-account architecture, cost economics) — the live-bridge ToS finding here (Agent SDK needing an API key for anything beyond "within Claude Code") is directly relevant to that bigger vision too and should be cross-checked against it before that gets built.

---

---

*Developer: Ryan | Identifier: 851379456*
*Part of the Amit System — C:\Users\user1\OneDrive\Documents - onedrive\Amit\*
