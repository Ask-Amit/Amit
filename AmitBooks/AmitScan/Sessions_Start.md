# AmitScan - Sessions Start

Built 2026-11-14 from CLAUDE.md. No session history exists.

SCOPE NOW: grew beyond the purpose statement. It is no longer capture-only: it also covers the AmitBooks-side local processing chain (Scan Now via the local bridge, Send Selected to Local Processing, inbox processing via the Claude CLI) and a "Send to Amit" staging upload to the scan_captures table.

## How to read this file
This is the short entry point. Read it first, then open only the file you need. CLAUDE.md holds purpose and scope only; everything else lives in the Sessions_ files below.

| File | What it holds |
|---|---|
| Sessions_Start.md | This file: directory, current state, files in play |
| Sessions_ToDo.md | Every open, pending, next or blocked item, plus a Resolved list |
| Sessions_Log.md | Dated build history, decisions with reasons, narratives |

Sessions_Design.md: design reference (how AmitScan is built); read only when working on that part.

## Current state
- AmitScan is a phone PWA (field capture companion to AmitBooks). It is part of AmitBooks, not a standalone project.
- Capture flow works: camera, crop, classify after capture, queue, QR connect sign-in, install prompt.
- Send to Amit (v1.05) uploads photos to a private storage bucket and inserts scan_captures rows. This is staging only; no review pipeline yet.
- The unattended processing step is blocked: the Claude CLI was not installed on the machine when last checked.
- Write-back into AmitBooks real tables is not built.

## Files in play
- AmitScan.html - v1.04 per Current Status heading (v1.05 "Send to Amit" is described after it; badge not re-checked)
- sw.js (network-first service worker), manifest.json
- AmitBooks.html v2.02 (as of 2026-08-01; AmitScan panel #20 with three tabs)
- Database migration for amitscan_captures (needs running in SQL editor)
- get-scan-link Edge Function (needs dashboard deploy)

## Open to-dos
About 16 items; see Sessions_ToDo.md.

## ORIGINAL SESSIONS
Original sessions were not recorded before 2026-11-14. From the next clean-up, each entry will name the session it came from.