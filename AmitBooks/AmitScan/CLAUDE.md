# AmitScan — Field Capture Companion for AmitBooks

**This is not a standalone Amit project.** AmitScan is part of AmitBooks — it has no life outside the accounting system. Do not create a top-level path-table entry for it, do not give it its own Pursuit Attribution, and read `AmitBooks\CLAUDE.md` first for anything not answered here; that file is the real authority for this folder's context, database access, and identity carry-forward. This file only tracks what's specific to the capture app itself.

## What This Is

A small, single-screen PWA meant to install as a home-screen icon on a phone — the fastest way to get a bill, receipt, business card, or odometer photo into AmitBooks without opening the full app. Lives at `AmitBooks/AmitScan/AmitScan.html`.

**Core design rule: mode-first, camera-first, review-always.** Pick what's being captured (Bill / Receipt / Contact / Mileage / Other) before taking the photo, so the eventual OCR/classification prompt is specific, not generic. Every capture — no matter how confidently history can pre-fill it — sits in a review queue and needs an explicit human confirm before it posts anywhere in AmitBooks. Zero exceptions, even for a fully-annotated, fully-recognized receipt. History only changes how much of the review is pre-filled (one-tap confirm vs. filling in blanks from scratch), never whether review happens.

**Fits one iPhone screen, no scrolling.** Mode toggle + connect button in a fixed top bar, camera fills the middle, capture button in a fixed bottom bar. Capturing shows a crop/preview step (drag corners to crop out backdrop, drag the box to reposition) with Retake/Delete/Keep before anything saves — nothing commits by accident.

## Current Status

**v1.00, built 2026-08-01 — capture-only, not yet wired to AmitBooks' data.** Own independent version badge (bottom-left of the bottom bar), tracked separately per the per-file versioning standard — not tied to AmitBooks.html's own number. Built: six-mode toggle (front-end tagging only), camera capture via `getUserMedia`, a drag-to-crop step (corner handles + move, mapped from rendered pixels to full-resolution canvas coordinates before export), a local IndexedDB queue that kept captures land in, a queue counter, and an independent magic-link sign-in (own `emailRedirectTo`, same Supabase auth as every other Amit app — this one is deliberately NOT dependent on the Hub session, since it's meant to be opened cold on a phone that may never have visited the Hub).

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
