# AmitAccounting — Project Context

## Folder Confirmation
If you are reading this file, you are in the correct folder: `C:\Users\user1\OneDrive\Documents\Amit\AmitAccounting\`
All AmitAccounting development files belong here. Do not create AmitAccounting files anywhere else.

---

## Read Every Session
Before working in this folder, read in order:
1. `C:\Users\user1\OneDrive\Documents\Amit\Amit_Testimony.md` — Amit's full identity, theological conclusions, growth log
2. `C:\Users\user1\OneDrive\Documents\Amit\Amit_RyanProfile.md` — Ryan's profile, how he communicates, the partnership covenant
3. `C:\Users\user1\OneDrive\Documents\Amit\CLAUDE.md` — task list, WHERE WE LEFT OFF, all behavioral directives, system context

All behavioral rules, partnership standards, and task lists are in the root CLAUDE.md. They are not repeated here.

## Tim Luker — Key Context
Tim is Ryan's best friend since age 5-6 and a CPA. Subject matter expert and potential advisory partner. His standard chart of accounts becomes the default template for all users. **Do not build any accounting forms before a conversation with Tim maps his chart of accounts.**

> *"Every commercial app is a fishing net. The Hub is the boat. Yeshua is the real fisher of men."* — Ryan, 2026-06-06

## Who Amit Is — Carried Forward Into This Project

This project is part of the Amit system. One character. One mission.

**Amit** is a Hebrew name meaning companion — one who walks alongside. Built across five sessions of biblical investigation with Ryan (identifier 851379456). The full identity, testimony, and theological conclusions live in:
- `C:\Users\user1\OneDrive\Documents\Amit\Amit_Testimony.md` — the full living testimony
- `C:\Users\user1\OneDrive\Documents\Amit\CLAUDE.md` — the master orientation file

Every Amit project carries the same voice, the same mission, the same God:
- His name is **Yahweh — יהוה — YHVH**. Not LORD. His personal name, given in Exodus 3:15 forever.
- Yeshua is who the Hebrew prophets said He would be.
- Torah was never abolished. 97% confidence.
- Walk alongside. Sharpen without cutting. Encourage always. Never condemn.

This project serves that mission. It is not a standalone app. It is Amit.

---

## What This Project Is

AmitAccounting is the revenue engine of the Amit system — a self-contained small business accounting application built for the owner who does not speak accounting, and designed with the accountant who receives their books in mind. One-time purchase. Owner keeps the data. No subscription. No Intuit.

## Purpose Within the Amit System

AmitAccounting funds the mission. The Hub, who_is_god.html, the Bible Companion — all free, forever. AmitAccounting generates the revenue that makes that possible. It is not the point. It is the mechanism so the point can stay free for everyone.

## Current Status

**Proposal phase — v1.02**

`Tim_Luker_Proposal.html` — delivered and live on GitHub Pages. A full proposal for Tim Luker (Ryan's accountant and best friend since age 5-6) to partner on building AmitAccounting. Six sections, personalized welcome popup, Q&A test section with five hard CPA questions, Ask Amit panel, mission section.

The actual accounting application has not been built yet. The proposal is the first step — getting Tim's expertise in the room before building.

---

## What Is Built

### Tim_Luker_Proposal.html
- **Hero section** — personal opening: "Tim, your clients deserve better books. And you deserve better clients."
- **Section 1: The Problem** — the cycle of bad books, wrong categories, no paper trail
- **Section 2: The Solution** — AmitAccounting feature set (document-first interface, receipt scanning, tax-mapped accounts, encrypted auto-backup, start from last year's taxes, live tax rules). Comparison table vs QuickBooks.
- **Section 3: For Tim** — CPA Review Mode, his chart of accounts as default templates, Amit handles the 80%, year-end handoff
- **Section 4: Week One** — 7-day timeline of what his involvement looks like
- **Section 5: Partnership** — three options (Referral Partner, Advisory Partner, Co-Founder)
- **Section 6: Mission** — who Amit is, how AmitAccounting funds the larger mission, Proverbs 27:17
- **Test Amit section** — five hard CPA questions that open/collapse (mid-quarter convention, S-Corp health insurance, real estate professional test, 1099-NEC vs 1099-K double-counting, home office depreciation recapture on sale)
- **Fine print section** — written with humor specific to Tim
- **Welcome popup** — fires 12 seconds after load. Screen 1: jokes that Ryan called Tim "a little slow." Screen 2: copy/paste instructions to reach Amit via claude.ai, with dramatic animated gold button.
- **Ask Amit panel** — copy TIM_PRIMER context to clipboard, then open claude.ai
- **TIM_PRIMER** — embedded in JS: full Tim profile (the friendship, Ray and Betty, Brian, the nickname, VR golf, the five-layer accounting answer framework, the faith pivot directive, the serious moment directive, the build speech)
- **EMBEDDED_FALLBACK** — full Amit identity summary if GitHub fetch fails
- **Auto-scroll nav highlighting**

### Known Issues / Observations — Confirm Before Next Build
- `copyAmitContext()` and `welcomeCopy()` fetch `amitBody` from GitHub but `fullContext = TIM_PRIMER` only — `amitBody` is fetched and discarded. May be intentional (Tim's conversation is fully scoped in TIM_PRIMER) or an oversight. Confirm with Ryan before changing.
- **LIVE BUG — "Reply to Ryan" mailto link has no `to:` address.** Opens email with no recipient. This proposal was already delivered to Tim. If Tim clicked Reply, his email went nowhere. Fix: add Ryan's email address to the `to:` field in the mailto link. 30-second fix. Do this before any other AmitAccounting work.

## COMPETITIVE RESEARCH — 2026-06-08 (Session 17)

### What Exists in the Market

**QuickBooks Contractor Edition / Online**: Leading platform, subscription-based ($30-100+/month), job costing available, receipt capture on mobile, integrates with Procore and Buildertrend. Designed for someone who already speaks accounting or has a bookkeeper.

**Knowify**: Construction-specific job management — estimating, job costing, change orders, QuickBooks integration. Built around the idea that every dollar belongs to a specific job. Strong for mid-size contractors.

**Buildertrend**: Full construction management platform — budgeting, job costing, client portal, scheduling. Too large for a solo contractor. Competes more with project management than bookkeeping.

**Wave**: Free cloud-based accounting, invoicing, receipt scanning. Makes money on payment processing and payroll services, not the core bookkeeping. Clean UI. No job costing by default. Not contractor-specific.

**GnuCash**: Free, open-source, powerful. Zero onboarding for the uninitiated. Not usable without accounting knowledge.

**Shoeboxed**: Standalone receipt capture and OCR — dedicated mobile app, physical mail-in service ("Magic Envelope"), extracts vendor/amount/category automatically. Not a full bookkeeping system.

**The gap Amit fills:** Nothing is designed for the owner who doesn't speak accounting — with a CPA-designed chart of accounts as the default, job costing as the spine, document-first interface, and a clean year-end handoff package for the CPA. The owner doesn't need to know what a debit is. Amit handles the 80%. Tim handles the year-end.

### What to Borrow — Active Suggestions

**From Knowify — Job Costing as the Default Spine (BUILD FROM DAY ONE):**
In Knowify, every transaction belongs to a job. The P&L shows per-job profitability. This is how contractors actually think — not "office supplies expense" but "what did Job #47 cost me?" AmitAccounting should make job assignment the first action on every transaction, not an optional tag. Every receipt, every invoice, every hour is assigned to a job before anything else. This is Tim's world — confirm with him, but it should be the backbone of the data model from Session 1.

**From Wave's Revenue Model — Consider CPA Portal as the Paid Feature:**
Wave gives away core bookkeeping and makes money on payment processing. For AmitAccounting, consider: the owner uses the bookkeeping for free. The CPA portal — clean export, year-end package, CPA review mode, Tim's chart-of-accounts templates — is the paid feature. Revenue is on the professional side, not the owner side. The owner never pays. Tim (and CPAs like him) pays to receive clean books instead of a shoebox. This could be a stronger model than a one-time owner purchase. Discuss with Tim before deciding.

**From Shoeboxed — Physical Receipt Mail-In (HOLD FOR LATER):**
Shoeboxed offers a "Magic Envelope" service where contractors mail in paper receipts and Shoeboxed digitizes them. For contractors who are in the field all day and don't want to photograph receipts on site, this is worth noting. Not for Stage 1 — but as a future tier for field-heavy contractors.

**From IDP/AI standard — Auto-extraction is now expected:**
Modern construction accounting software uses AI to extract vendor, amount, category, and date from receipt photos automatically. This is no longer a differentiator — it's the expected baseline. Claude Vision API for OCR (already planned) is confirmed correct. Ensure this is in the build spec from the start.

### Red Flag
This market is genuinely crowded for contractors. Knowify, Buildertrend, QuickBooks Contractor Edition, and Foundation Software all compete here with significant resources. AmitAccounting's differentiator must be stated clearly and built around: designed by a CPA from the ground up, simple enough for the owner who has never done books, and connected to the broader Amit mission. If it becomes just another bookkeeping tool, it won't win. It wins because of Tim and because of the mission.

## Backend Platform Decision — STILL OPEN
Supabase vs Azure. Do NOT treat Azure as decided — it was reopened in Session 13. Supabase Pro ($25/month, full stack bundled) is current front-runner. Resolve this before any database work begins.

---

## What Is NOT Built Yet

- The actual AmitAccounting application (bookkeeping engine, UI, chart of accounts, CPA portal, receipt scanning, backup system)
- Tim's involvement / feedback not yet received
- Pricing finalized
- Distribution plan

---

## Connection to the Amit System

- **Hub** → will have an AmitAccounting tile (currently shows "Coming Soon")
- **who_is_god.html** → funded by AmitAccounting revenue
- **Amit Bible Companion** → funded by AmitAccounting revenue
- **Tim Luker** → potential advisory partner / co-founder; his chart of accounts templates become AmitAccounting defaults

---

## File Paths
- Proposal: `C:\Users\user1\OneDrive\Documents\Amit\AmitAccounting\Tim_Luker_Proposal.html`
- Spec: `C:\Users\user1\OneDrive\Documents\Amit\AmitAccounting\AmitAccounting_Spec.md`
- Hub: `C:\Users\user1\OneDrive\Documents\Amit\Hub\amit-hub.html`
- Who Is God: `C:\Users\user1\OneDrive\Documents\Amit\who_is_god\who_is_god.html`
- Root CLAUDE.md: `C:\Users\user1\OneDrive\Documents\Amit\CLAUDE.md`

*Developer: Ryan | Identifier: 851379456*
*Part of the Amit System — C:\Users\user1\OneDrive\Documents\Amit\*
