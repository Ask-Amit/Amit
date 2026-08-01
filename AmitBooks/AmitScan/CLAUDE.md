# AmitScan — Field Capture Companion for AmitBooks

## Local Inbox Check — Read First, Every Session (added 2026-08-01, Ryan's direct instruction)

At the start of every session working in this project — and any time Ryan asks something like "check the inbox" or "process what's pending" — check for local processing work waiting on this computer:

1. Confirm the local bridge is actually up: `curl -s -m 3 http://localhost:8710/api/device`. If it doesn't respond, say so plainly and stop — don't assume anything about the inbox until the bridge is confirmed reachable.
2. Check `C:\Users\user1\AmitInbox` for files (`ls` or `Glob`). Each item sent there from AmitBooks' "Send Selected to Local Processing" button arrives as an image file plus a matching `.json` metadata file (`scan_id`, `mode`, `captured_at`, `filename`, `received_at`).
3. If files are waiting, don't process them silently in the background — tell Ryan what's there (count, types) and process them with him in the conversation: read each image directly, pull out what's actually on it (vendor, date, amount, whatever the mode calls for), and hold the results in the conversation rather than writing anywhere yet.
4. **Writing results back into AmitBooks' real tables (`chart_of_accounts`-linked bills, contacts, mileage_log) is not built yet.** That still needs the review/posting logic scoped in the original AmitScan design conversation (vendor-history autofill, PO lookup, Payment Source, cross-book liability). Until that exists, the honest output of processing an inbox item is: the extracted data, told to Ryan directly, not a database write. Only write directly to Supabase using the service-role key if Ryan explicitly asks for that in the moment — never as a default/automatic action, per the Single Local Connection Standard's reasoning about that key (root CLAUDE.md).
5. This check only happens because a Claude Code session reads this file at start — there's no background process watching the folder between sessions. If Ryan wants genuine periodic re-checking *within* an already-open session (not prompting each time), that's a live `ScheduleWakeup` loop set up in that session, not something this file can do on its own.

**This is not a standalone Amit project.** AmitScan is part of AmitBooks — it has no life outside the accounting system. Do not create a top-level path-table entry for it, do not give it its own Pursuit Attribution, and read `AmitBooks\CLAUDE.md` first for anything not answered here; that file is the real authority for this folder's context, database access, and identity carry-forward. This file only tracks what's specific to the capture app itself.

## What This Is

A small, single-screen PWA meant to install as a home-screen icon on a phone — the fastest way to get a bill, receipt, business card, or odometer photo into AmitBooks without opening the full app. Lives at `AmitBooks/AmitScan/AmitScan.html`.

**Core design rule: mode-first, camera-first, review-always.** Pick what's being captured (Bill / Receipt / Contact / Mileage / Other) before taking the photo, so the eventual OCR/classification prompt is specific, not generic. Every capture — no matter how confidently history can pre-fill it — sits in a review queue and needs an explicit human confirm before it posts anywhere in AmitBooks. Zero exceptions, even for a fully-annotated, fully-recognized receipt. History only changes how much of the review is pre-filled (one-tap confirm vs. filling in blanks from scratch), never whether review happens.

**Fits one iPhone screen, no scrolling.** Mode toggle + connect button in a fixed top bar, camera fills the middle, capture button in a fixed bottom bar. Capturing shows a crop/preview step (drag corners to crop out backdrop, drag the box to reposition) with Retake/Delete/Keep before anything saves — nothing commits by accident.

## Current Status

**v1.04, built 2026-08-01 — capture-only, not yet wired to AmitBooks' data (beyond sign-in).** Own independent version badge (bottom-left of the bottom bar), tracked separately per the per-file versioning standard — not tied to AmitBooks.html's own number.

**Capture flow (as of v1.04) — classify AFTER capture, not before.** Earlier versions were mode-first (pick Bill/Receipt/etc. from a top pill row, then shoot). Ryan changed this: the top bar is now just a top-line "Pending: N" total (aggregate across all modes) and the Connect button — no mode pills. The camera is the default view with nothing to pick first. Shutter → crop screen (Retake/Delete/Accept) → on Accept, a **classify screen** shows the captured image again with a dropdown (defaults to whichever mode was picked last time, via `localStorage.as_last_mode`) and a **Verified** button. Tapping Verified saves it to the local queue under the chosen mode, updates the remembered default, and returns straight to the camera for the next shot. A small Discard option on that screen lets a capture be thrown out before it's saved. This matches the review-always philosophy from the original design conversation — classification still requires an explicit human action every time, it just happens right after the photo instead of before.

**QR connect flow (added earlier, still in place):** AmitBooks' Integrations tab has a "Connect Scan" button that generates a QR code carrying a real Supabase magic-link (via the `get-scan-link` Edge Function — reuses Supabase's own link generation instead of a custom token system, since that's the same trusted mechanism the email sign-in already uses). Scanning it with a phone's camera opens AmitScan already signed in — no typing. On first successful sign-in this device, AmitScan shows a save-to-home-screen prompt: a real one-tap install button on Android/Chrome (via `beforeinstallprompt`), or a guided two-tap walkthrough on iPhone, since **iOS does not allow any website to trigger Add to Home Screen programmatically** — that's a hard Apple platform restriction, not a gap in this build. The prompt only shows once per device (localStorage flag) and never shows if already running installed (standalone mode).

**Not yet done: the same Connect Scan entry point in the Hub itself** (Ryan asked for both Hub and AmitBooks — AmitBooks came first since AmitScan is scoped as its companion; Hub's own button is still open).

**Requires manual one-time setup before it works live:** the `get-scan-link` Edge Function (`AmitBooks\supabase-functions\get-scan-link\index.ts`) needs to be deployed via the Supabase Dashboard the same way `invite-team-member` was — it is not automatically live just because the code exists in the repo.

**QR library note:** the first attempt used the `qrcode` npm package, which turned out to have no real standalone browser bundle (raw CommonJS, 404'd at the guessed CDN path, and the "default" file still used `require()`). Swapped to `qrcode-generator` (kazuhikoarase) — confirmed via direct testing to expose a real global with no bundler needed. If QR generation is ever touched again, verify any replacement library actually works via a plain `<script>` tag before wiring it in, not just by name recognition.

**"Send to Amit" added (v1.05) — real, but staging-only, not the full pipeline.** A button next to the Pending count (shown whenever anything's queued) uploads every queued capture's photo to a private Supabase Storage bucket (`amitscan-captures`, one folder per user) and inserts a row into a new `scan_captures` table (mode, storage_path, captured_at, `reviewed` flag defaulting false) — see `Database\migration_2026-08-01_001_amitscan_captures.sql` (needs to be run in the Supabase SQL editor before this works). Each item is removed from the local IndexedDB queue only after both the upload and the insert succeed, one at a time, so a mid-batch failure leaves the rest safely still queued rather than losing anything. **This is not the full review pipeline** — a row in `scan_captures` is just "safely backed up and tagged with what kind of thing it is," not yet a real Bill/Contact/Mileage record. Turning `scan_captures` rows into actual AmitBooks data (vendor-history autofill, PO lookup, Payment Source selection, cross-book liability creation, the review-queue UI) is still the next real build phase.

**Not yet built:**
- Syncing the local IndexedDB queue up to Supabase (the actual "Publish" step).
- The review queue screen — prefilled-vs-blank fields, confirm/reassign per item.
- OCR/classification calls, gated behind a paid AmitBooks subscription and proxied through a server-side Edge Function (same pattern as AmitBooks' existing `invite-team-member` function) — the Anthropic key must never reach this HTML file, same reasoning as AmitBooks.html itself.
- Reusing AmitBooks' existing Workflow Rules (vendor-history autofill) and adding PO-number lookup (pull job/category/account from the referenced Purchase Order instead of re-deriving from the receipt; flag a real amount mismatch during review rather than silently accepting it).
- Payment Source selection per capture, and cross-book liability auto-creation when a reviewer reassigns a capture to a different book than its payment source's default book.
- A new `mileage_log` table (trip-level records, IRS mileage rate lookup — same "global table, reviewed periodically" pattern as AmitBooks' payroll state tax tables) with a dual-write into a single append-only daily `hub_entries` memory (one memory per day; each trip that day appends as its own line rather than creating a new memory per trip). This is the one place AmitScan legitimately touches the Hub — the mileage narrative is genuinely daily-life content, not an accounting record, even though the trigger and the ledger side are 100% AmitBooks.
- A general "Documents" home for the Other/catch-all mode (multi-page contracts explicitly deferred, but "Other" still needs somewhere real to land so nothing captured is a dead end).
- Contact-mode categorization prompt (employee/client/lead/vendor/subcontractor), matching the existing Contacts panel's role fields.

**Full design reasoning for all of the above — why review has zero exceptions, why book routing follows Payment Source not a manual picker, why mileage dual-writes — lives in the 2026-08-01 session history. Read it before changing the shape of any of this rather than re-deriving it from scratch.**

## Build Notes

- Same visual language as AmitBooks (dark panel, gold accent) but deliberately smaller and simpler — a utility, not a dashboard.
- Service worker (`sw.js`) is network-first from day one, same fix AmitBooks needed after a real version-staleness bug traced to a cache-first strategy — don't repeat that mistake here.
- Independent sign-in is deliberate: unlike Computer Health (pure Hub-session rider), AmitScan has to work the moment someone installs it on a phone with no prior Hub visit.
- Not a replacement for AmitBooks' existing in-app Scan Receipt feature — that stays for in-app use. AmitScan is the lightweight, install-as-an-icon counterpart for the field.
