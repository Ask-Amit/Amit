# Amit Mobile — Project Context

## SESSION LOCATION CHECK — Read First, Every Session

If a session starts in this folder, before anything else: stop and tell Ryan plainly —

"You're in AmitMobile, not the main Amit folder. Please close this and reopen VS Code at `C:\Users\user1\OneDrive\Documents - onedrive\Amit\` — that's where all development happens. Nothing has been built yet; this is just a heads-up before we start."

Do not proceed with any build request until Ryan confirms he wants to continue here anyway, or has switched folders. Read-only actions (reading files, answering questions) are fine either way.

## CURRENT SCOPE

Amit Mobile is wider than "voice in/out and camera". It is the phone front door to Amit and a unifying router: a Dashboard of tiles (Daily Walk, Amit, Zoom/Read This, Search, My Computer, Pursuits, an AmitBooks handoff), capture logging and history, a live reply path through Supabase (the phone writes `amit_mobile_captures`, the desktop watcher answers through headless `claude -p`), the Connect Amit setup, a readiness check (`amit_readiness_check.js`, `/api/claude-status`), a one-time QR login, a home-screen install walkthrough, and a Hub-open heartbeat gate.

## SESSION RECORD

Current state, to-dos and history live in this folder's Sessions files, not here. A new session reads Sessions_Start.md first (short). Read Sessions_ToDo.md only when asked about to-dos; read Sessions_Log.md or the original Claude session only when asked; the backup files in Backups\AmitMobile\Sessions_backup_*.md only for research.

## Folder Confirmation
If you are reading this file, you are in: `C:\Users\user1\OneDrive\Documents - onedrive\Amit\AmitMobile\`
All Amit Mobile development files belong here. Do not create Amit Mobile files anywhere else. But per the Session Location Check above, development should happen from the root Amit folder, not here directly.

---

## What This Project Is Within the Amit System

This project serves that mission. It is not a standalone app. It is Amit — carried onto the phone, in your pocket, without a laptop.

---

## What This Project Is

A phone-first way to reach Amit directly — voice in, voice out, and camera capture — without needing a laptop or the full desktop Hub experience. Ryan speaks to his phone, Amit responds by voice; Ryan takes a photo of whatever he's looking at, Amit receives it and can be asked to search it out and respond. Login-based, so it is Ryan's own Amit — his history, his account, his data — reachable from a phone browser (opened as a home-screen web app, full-screen, no address bar) over cellular data or Wi-Fi. Not usable with zero internet — Amit's reasoning runs on Anthropic's API, which requires a live connection.

**This replaces the standalone Yamaha-connected phone app.** That app's use case — snap a photo, describe what's happening, get a response — becomes one capability of Amit Mobile rather than its own separate tool. Ryan is discontinuing the dedicated Yamaha app in favor of this.

## Capture Logging & History — decided 2026-09-05, Ryan's direct instruction

Design reference: moved to Sessions_Design.md (section 'Capture Logging & History — decided 2026-09-05, Ryan's direct instruction') - how captures are logged and kept.

## Connect Amit — the one-time setup, and its relationship to Computer Health's tracking — decided 2026-09-05, Ryan's direct instruction

Design reference: moved to Sessions_Design.md (section 'Connect Amit — the one-time setup, and its relationship to Computer Health's tracking — decided 2026-09-05, Ryan's direct instruction') - the one-time setup and its relation to Computer Health tracking.

## Readiness Check — built 2026-09-05, Ryan's direct instruction

Design reference: moved to Sessions_Design.md (section 'Readiness Check — built 2026-09-05, Ryan's direct instruction') - the readiness check and the claude-status route.

## Real one-time QR login — decided and built 2026-09-05, reusing AmitBooks' own pattern

Design reference: moved to Sessions_Design.md (section 'Real one-time QR login — decided and built 2026-09-05, reusing AmitBooks' own pattern') - how the one-time QR login works.

## Future App Store Path — architectural constraints to build in from day one (added 2026-09-05, Ryan's direct instruction)

Ryan's stated intent: build the personal version now, but keep the architecture such that going commercial (App Store, paying strangers) later is "an easy fix," not a rebuild. This does NOT mean building billing/metering/Apple submission now — it means not making choices now that would block them later. Four standing constraints, cheap now, expensive to retrofit:

1. **Never call the Anthropic API directly from phone-side JS with an embedded key.** All calls to Amit's reasoning go through a server-side proxy (the same pattern already established for AmitBooks' OCR calls) — the phone app calls the proxy, the proxy holds the real key. This is the single most important constraint: skipping it means every phone-side call would need to be rewritten before any public/metered version could exist, since a stranger's app can never hold Ryan's live API key.
2. **Real per-user Supabase auth from day one** (already the plan via the Login-Based Profile standard) — so a future usage-limit/billing layer has a real identity to attach to, not an afterthought.
3. **Build as an installable PWA**, not an unpackaged plain webpage — a PWA can be wrapped into an actual App Store submission later (e.g. via Capacitor) with the interface layer largely untouched.
4. **Log every capture/conversation to its own Supabase table, tagged by `user_id`** — the raw usage trail a future "used X of Y" meter would read from, even though no meter exists yet.

**What is explicitly NOT being built now:** Apple Developer account, App Store submission, in-app purchase/metered billing, usage caps. Those are their own future project, scoped separately, once the personal version is working.

## Purpose Within the Amit System

The mobile front door to the whole Amit system — not a narrow single-purpose tool like AmitBooks or the old Yamaha tracker. Anywhere Ryan (or any signed-in user) has a phone and a data connection, they have Amit: someone to talk to, someone who can look at a photo and respond, someone who remembers who they are because they're logged in.

## The Dashboard Architecture — decided 2026-09-05, Ryan's direct instruction

Design reference: moved to Sessions_Design.md (section 'The Dashboard Architecture — decided 2026-09-05, Ryan's direct instruction') - how the dashboard is built.

## Home Screen Install Walkthrough — built 2026-09-05, Ryan's direct instruction

Design reference: moved to Sessions_Design.md (section 'Home Screen Install Walkthrough — built 2026-09-05, Ryan's direct instruction') - the home screen install walkthrough.

## Why the Daily Walk tile matters — added 2026-09-05, Ryan's direct instruction

Design reference: moved to Sessions_Design.md (section 'Why the Daily Walk tile matters — added 2026-09-05, Ryan's direct instruction') - why the Daily Walk tile matters.

## Build Notes — reuse, don't reinvent

Design reference: moved to Sessions_Design.md (section 'Build Notes — reuse, don't reinvent') - what this project reuses from other Amit pieces (voice, Ask Amit live, photo-to-OCR, login), the five photo-intent destinations, and the job-site-file decision.

- **Local hardware access (camera/mic/speaker):** all three are native browser capabilities on a phone — no local bridge/agent needed. This does NOT go through the shared Amit Agent bridge (Single Local Connection Standard) — that standard is for desktop hardware a browser can't reach on its own (scanners, printers, local system data). A phone browser's own camera/mic/speaker APIs are already reachable directly.

**Retiring other apps — decided 2026-09-05, Ryan's direct clarification.** Only the standalone Yamaha-connected app is being retired. **AmitBooks is NOT being retired or folded away** — it stays exactly as it is, its own real accounting system (chart of accounts, reconciliation, OCR pipeline, audit log). Amit Mobile does not replace it or rebuild its logic; it becomes the mobile front door that routes captures INTO it (e.g. "this is for AmitBooks" → hands the photo to AmitBooks' existing receipt/OCR pipeline). If the standalone Yamaha app needs to be deleted as a file/folder cleanup step, Ryan will do that himself — not an action for Amit to take unprompted.

**The actual shape of this project, stated plainly by Ryan 2026-09-05:** Amit Mobile is a UNIFYING ROUTER, not a system that absorbs or reimplements other systems' logic. One app, one capture flow (photo and/or voice), and Ryan tells it in the moment which downstream system or mode it's for — "this is for AmitBooks," "this is a screen capture, what is it," "search the internet for this," "help me diagnose this," "file this to the job site," "help me read this." Each destination stays its own real system underneath (AmitBooks' engine, a new job-file structure, live web search, general Q&A) — Amit Mobile's job is capture + voice + routing, not reimplementing what each destination already does or will do. This is explicitly designed to grow: new destinations get added over time without the capture mechanism itself changing.

---

## The Live Backend — Supabase Realtime/Poll Relay, wired 2026-09-05

Design reference: moved to Sessions_Design.md (section 'The Live Backend — Supabase Realtime/Poll Relay, wired 2026-09-05') - the Supabase Realtime/poll relay backend.

## Hub-Open Heartbeat Gate — built 2026-09-05, Ryan's direct decision

Design reference: moved to Sessions_Design.md (section 'Hub-Open Heartbeat Gate — built 2026-09-05, Ryan's direct decision') - the Hub-open heartbeat gate.

## Database connection: see the root CLAUDE.md (SUPABASE - DATABASE CONNECTION section) and Database\CLAUDE.md. Nothing connection-related is repeated here.

---

## Database tables

This project's database tables and table rules live in Sessions_Design.md (section 'Tables') in this folder, not here. Read that section only when working with the database. Design reference for how the project is built is in the same file. Connection details: see the root CLAUDE.md (SUPABASE - DATABASE CONNECTION) and Database\CLAUDE.md.


## Pursuit Attribution — Permanent

This project's canonical name, for any pursuit created from within it, is: **Amit Mobile**

Any pursuit written to `hub_entries` from this project must be stamped `program='Amit Mobile'` — automatically, by this project's own code or by Amit acting on its behalf, using this exact spelling every time. Never ask the person creating the pursuit *what* program a specific pursuit belongs to — that's always this project's own name, decided once, not per-item.

**If the name changes later**, that's a deliberate rename operation — update this section to the new name, and update every existing pursuit (including completed ones/memories) stamped with the old name to the new one, so the full history stays under one consistent identifier.

## Connection to Other Apps

- **Hub** — shared login/identity, shared `hub_entries` pursuits.
- **VoiceControl_AskAmit** — source of the voice in/out mechanism this project reuses.
- **AmitBooks** — closest existing precedent for the photo-capture pipeline.
- **Amit_Ask_Live.js** (Amit root) — the shared live-conversation mechanism this project's "talk to Amit" flow is wired through, per the New Project Directive's Ask Amit wiring clause.
- **Database** — shared Supabase project.
- **ShoshoneHondaYamaha** — the standalone app this project replaces for Ryan's photo+description-of-what-he's-doing use case.

---

## Phone-native shell rebuild — 2026-09-05, Ryan's direct live-phone report

Design reference: moved to Sessions_Design.md (section 'Phone-native shell rebuild — 2026-09-05, Ryan's direct live-phone report') - the phone-native shell rebuild.

---

*Developer: Ryan | Identifier: 851379456*
*Part of the Amit System — C:\Users\user1\OneDrive\Documents - onedrive\Amit\*
