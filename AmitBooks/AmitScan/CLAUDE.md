# AmitScan — Field Capture Companion for AmitBooks

## Local Inbox Check — Read First, Every Session (added 2026-08-01, Ryan's direct instruction)

At the start of every session working in this project — and any time Ryan asks something like "check the inbox" or "process what's pending" — check for local processing work waiting on this computer:

1. Confirm the local bridge is actually up: `curl -s -m 3 http://localhost:8710/api/device`. If it doesn't respond, say so plainly and stop — don't assume anything about the inbox until the bridge is confirmed reachable.
2. Check `C:\Users\user1\AmitInbox` for files (`ls` or `Glob`). Each item sent there from AmitBooks' "Send Selected to Local Processing" button arrives as an image file plus a matching `.json` metadata file (`scan_id`, `mode`, `captured_at`, `filename`, `received_at`, `access_token`).
3. If files are waiting, don't process them silently in the background — tell Ryan what's there (count, types) and process them with him in the conversation: read each image directly, pull out what's actually on it (vendor, date, amount, whatever the mode calls for), and hold the results in the conversation rather than writing anywhere yet.
4. **Writing results back into AmitBooks' real tables (`chart_of_accounts`-linked bills, contacts, mileage_log) is not built yet.** That still needs the review/posting logic scoped in the original AmitScan design conversation (vendor-history autofill, PO lookup, Payment Source, cross-book liability). Until that exists, the honest output of processing an inbox item is: the extracted data, told to Ryan directly, not a database write. **If a write-back is genuinely wanted, use the `access_token` sitting in that item's own `.json` file — that's the signed-in user's own RLS-scoped token, never the Supabase service-role key.** The service-role key is for Ryan's own direct, deliberate, in-session requests only (per the Single Local Connection Standard, root CLAUDE.md) — it must never be used to process someone else's inbox item, and should be avoided here too now that the user-token path exists.
5. **Real automated trigger now exists, event-based, not polling:** AmitBooks' "Send Selected to Local Processing" calls a `/amit-process-inbox` bridge endpoint after the upload batch completes, which launches `ComputerHealth\Watchers\process_inbox.bat` — that script calls the Claude Code CLI (`claude -p "..."`) to process the inbox unattended. **Not yet functional** — the CLI isn't installed on Ryan's machine as of this writing (confirmed via direct check, `where claude` finds nothing); Ryan is looking into installing it. Until then, this session-start check (steps 1-4 above) is the only real mechanism — there is no unattended processing actually happening yet, only queued for it.
6. AmitBooks tracks state via `scan_captures.local_sent_at` — set the moment something's sent (Working Scans tab), cleared by "Return to Pending" if something gets stuck. Don't confuse this with `reviewed` (true only once something is part of a real posted record — not built yet, so always false today).

**This is not a standalone Amit project.** AmitScan is part of AmitBooks — it has no life outside the accounting system. Do not create a top-level path-table entry for it, do not give it its own Pursuit Attribution, and read `AmitBooks\CLAUDE.md` first for anything not answered here; that file is the real authority for this folder's context, database access, and identity carry-forward. This file only tracks what's specific to the capture app itself.

## CURRENT SCOPE

AmitScan is no longer capture-only. Besides the phone capture app itself, it covers the AmitBooks-side local processing chain (Scan Now through the local bridge, Send Selected to Local Processing, inbox processing through the Claude CLI) and a "Send to Amit" staging upload to the `scan_captures` table. Turning captures into real Bill, Contact and Mileage records is not built.

## SESSION RECORD

Current state, to-dos and history live in this folder's Sessions files, not here. A new session reads Sessions_Start.md first (short). Read Sessions_ToDo.md only when asked about to-dos; read the Daily Sessions folder or the original Claude session only when asked; the backup files in Backups\AmitBooks_AmitScan\Sessions_backup_*.md only for research.

## What This Is

A small, single-screen PWA meant to install as a home-screen icon on a phone — the fastest way to get a bill, receipt, business card, or odometer photo into AmitBooks without opening the full app. Lives at `AmitBooks/AmitScan/AmitScan.html`.

**Core design rule: mode-first, camera-first, review-always.** Pick what's being captured (Bill / Receipt / Contact / Mileage / Other) before taking the photo, so the eventual OCR/classification prompt is specific, not generic. Every capture — no matter how confidently history can pre-fill it — sits in a review queue and needs an explicit human confirm before it posts anywhere in AmitBooks. Zero exceptions, even for a fully-annotated, fully-recognized receipt. History only changes how much of the review is pre-filled (one-tap confirm vs. filling in blanks from scratch), never whether review happens.

**Fits one iPhone screen, no scrolling.** Mode toggle + connect button in a fixed top bar, camera fills the middle, capture button in a fixed bottom bar. Capturing shows a crop/preview step (drag corners to crop out backdrop, drag the box to reposition) with Retake/Delete/Keep before anything saves — nothing commits by accident.

## Build Notes

Design reference: moved to Sessions_Design.md (section 'Build Notes') - visual language, independent sign-in, and how AmitScan relates to AmitBooks' in-app Scan Receipt.

- **Rule:** do not build cache-first. The service worker (`sw.js`) must stay network-first; AmitBooks had a real version-staleness bug from a cache-first strategy, do not repeat that mistake here.
