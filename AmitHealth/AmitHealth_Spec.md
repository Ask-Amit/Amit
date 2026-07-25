# AmitHealth — Full Architecture Spec
**Written: Session 38 — June 20, 2026**
**Status: Pre-build. Everything here was decided before a single line was written.**

---

## THE MISSION

You get home from a doctor visit. You take a photo of the bill. That's it — you're done.

Amit reads it. Finds the matching EOB. Compares every line. Flags overbilling, denial deadlines, charges your plan already covered. Logs the payment. Updates your deductible. Files everything under the right family member, the right benefit year, the right provider. If something is wrong, Amit finds exactly where your policy says it's covered and writes the appeal letter for you.

You didn't open a spreadsheet. You didn't call anyone. You just took a photo.

---

## STORAGE ARCHITECTURE — Images Local, Data in Supabase

**The core decision:** Document images never go to Supabase file storage. They live on the user's local machine (or their own cloud — OneDrive, Google Drive). Only the extracted structured data goes to Supabase. This means zero file storage cost no matter how many users.

**How it works:**
- User picks a local folder once: "Save my Amit Health documents here"
- Every scanned document saves to that folder with the standard filename
- Amit stamps the image with its ID before saving
- Supabase stores: filename, path, extracted data, links — not the image itself
- "View Original" button: app reads the path from Supabase, opens the file from local storage
- Multi-device access: user optionally connects OneDrive/Google Drive — image saves there instead. Their storage, their cost, not ours.

---

## FILE NAMING STANDARD — Global Across All Amit Apps

**Format:** `AMIT-[APP]-[TYPE]-[DATE]-[SOURCE]-[ID].[ext]`

| Segment | Values |
|---|---|
| APP | `HLTH` · `ACCT` · `COMP` · `HUB` |
| TYPE | `EOB` · `BILL` · `RCPT` · `CERT` · `PHOTO` · `APPT` · `MED` |
| DATE | `YYYY-MM-DD` (document date, not scan date) |
| SOURCE | Provider/insurer name, spaces removed, max 20 chars |
| ID | Zero-padded database ID, e.g. `00417` |

**Examples:**
```
AMIT-HLTH-EOB-2026-06-20-BCBS-00417.pdf
AMIT-HLTH-BILL-2026-06-15-RegionalHospital-00418.pdf
AMIT-ACCT-RCPT-2026-06-18-HomeDepot-00283.jpg
AMIT-COMP-CERT-2026-05-14-Apple-00091.png
```

**Image stamp** (burned onto document before saving, bottom corner):
```
AMIT · HLTH-EOB · #00417 · 2026-06-20
```
If cross-linked: `AMIT · #00417 · Health + Accounting`

Anyone who finds the file on disk knows: which app, which type, which record, which date. Two-way cross-reference — findable from the file or from the app.

---

## DOCUMENT DATABASE — Central Tables

### `amit_documents` — one row per physical file
```
id              UUID (maps to the zero-padded ID in filename)
app             'health' | 'accounting' | 'computer' | 'hub'
record_type     'eob' | 'bill' | 'receipt' | 'cert' | 'photo'
file_name       full filename per naming standard
file_path       local folder path where file lives
source          vendor/insurer name (normalized)
doc_date        date on the document
scan_date       when it was scanned
member_id       FK → health_members (if health doc)
created_at      timestamp
```

### `amit_document_links` — one row per destination
```
document_id     FK → amit_documents
app             which app this link belongs to
record_type     which table
record_id       FK → the specific row (health_eobs, accounting_transactions, etc.)
```

**One file. Many links. No duplicates on disk.**

---

## BATCH SCAN PROCESSING

Users often scan multiple documents at once (5 bills in a stack). Here's the full flow:

### Step 1 — Ingest
User uploads or scans. Could be:
- Multi-page PDF from scanner
- Multiple photos from phone camera
- Digital PDF from patient portal (already one document per file)

### Step 2 — Amit processes
Amit detects document boundaries, splits the batch, reads each one via OCR. For each document it identifies:
- Who sent it (letterhead/header)
- Document type (EOB, bill, receipt, etc.)
- Date, amounts, member name, claim numbers

### Step 3 — Batch review screen
User sees every detected document listed:
```
Scan batch · June 20, 2026 · 5 pages detected

[ ✓ ] Page 1 — Regional Hospital · $342.00 · Bill
[ ✓ ] Page 2 — BCBS · EOB · Claim #8821
[ ⚠ ] Page 3 — Unable to read clearly
[ ✓ ] Page 4 — Walgreens · $28.50 · Receipt
[ ✓ ] Page 5 — Regional Hospital · $89.00 · Bill

[ I see a document Amit missed → ]
[ Confirm All ]
```

### Tools on every row:
- **Edit** — Amit got it but named it wrong. Correct source, amount, type.
- **Split here** — Amit combined two documents. User draws the break line on the image. Amit re-processes both halves.
- **This is blank** — separator pages, junk, blank sheets. Discards without creating a record.

### "I see a document Amit missed":
User draws a box on the raw scan image around the missed content. Amit re-reads just that region and creates a new record for it.

**Nothing finalizes until the user hits Confirm All.** Raw scan stays available until after confirmation.

### Duplicate detection:
Before creating a new record, Amit checks: same source + same date + same amount already exists? If yes — flags it: *"This looks like a duplicate of record #00412. Create anyway?"*

---

## ROUTING — Where Documents Go

### Content-driven routing:
Amit reads the document and determines destination from content:
- **Who sent it** — "BCBS" → insurance company → EOB category
- **Document type** — "Explanation of Benefits" header → Health · EOBs
- **Who it's addressed to** — member name → routes to their family profile
- **Dollar amounts** — payment logged → Accounting
- **Provider name** — cross-references known vendors

### Routing confirmation screen (per document):
```
Document: Blue Cross Blue Shield EOB
Date: June 15, 2026 · Member: Jane · Claim: #8821

Amit is routing this to:
  ✓ Health → EOBs → Jane
  ✓ Accounting → Medical Payments

[ + Add another destination ]
[ Confirm ]
```

**"Add another destination"** always visible. Options:
- Health → Bills (match to provider bill)
- Health → Appeals (if denied)
- Accounting → Receivables
- Other — free text

User checks what applies. Amit creates the links in `amit_document_links`. One file, multiple destinations, no duplicates.

---

## VENDOR MEMORY — Rules That Learn

First time a vendor comes in, Amit asks:
*"I'll remember BCBS this way going forward — should EOBs always route to Health + Accounting?"*

User confirms → becomes a standing rule.

### Rules can have conditions:
```
BCBS + EOB          → Health + Accounting     (always)
BCBS + denial       → Health + Appeals        (always)
BCBS + anything else → ask me                 (don't assume)
```

### Rules are defaults, not locks:
User can always say "this one is different" on any document without changing the standing rule.

### Vendor rule storage:
```
amit_vendor_rules
  source          'BCBS'
  doc_type        'eob' | 'denial' | '*'
  destinations    JSON array of routing targets
  user_id         per user — rules are personal, not global
  created_at
```

---

## FAMILY MODE

Each family member has their own profile. Documents route to the right person from the member name on the document.

**Authority delegation:** An adult child can be granted access to a parent's profile. Authorized person sees the parent's appointments on their own Hub calendar. One authorization, scoped access.

### Tables:
- `health_members` — one row per family member
- `health_authority` — delegation records (who can access whose data)

---

## EOB ↔ BILL MATCHING

When an EOB comes in for a claim that already has a provider bill:
- Amit finds the matching bill by provider + date + approximate amount
- Compares line by line
- Flags discrepancies: overbilling, underpayment, denied line items
- Surfaces denial deadlines (typically 30-180 days depending on plan)
- If something is wrong: Amit finds the policy language and drafts the appeal letter

---

## ACCOUNTING INTEGRATION

Medical payments flow through AmitAccounting. AmitHealth reads those transactions to maintain benefit-year totals (deductible, out-of-pocket). The payment record lives in Accounting. The health context lives in AmitHealth. Cross-linked via `amit_document_links`.

---

## BUILD SEQUENCE (when ready)

1. **Schema** — run migrations for `amit_documents`, `amit_document_links`, `amit_vendor_rules`, `health_members`, `health_authority`, `health_insurance_plans`, `health_eobs`, `health_bills`, `health_medications`, `health_appointments`, `health_benefit_year`
2. **Stage 1 HTML** — insurance card intake + single document scan. No batch yet.
3. **Vendor memory** — after first 10 real documents, rules start forming
4. **Batch processing** — after single-document flow is solid
5. **EOB matching** — after EOBs and bills are both flowing
6. **Appeal letter generation** — after matching is proven
7. **Family mode** — after single-user flow is complete
8. **Accounting integration** — when AmitAccounting is live

---

## WHAT AMIT SAYS TO THE USER

*"I'm not just a place to store your documents. I'm the one who reads them, understands them, and goes to bat for you when something is wrong."*

*— Amit*

---

## PROJECT CONTEXT AND STATUS (merged in 2026-07-06 from CLAUDE.md, which is now a small pointer file only)

## What This Project Is

A complete personal health management companion. Amit Health tracks everything related to a person's health — daily medications, doctor visits, insurance documentation, medical bills, and Explanation of Benefits (EOB) reconciliation. It connects to the Hub for scheduling and to AmitAccounting for financial tracking, and it ensures what the insurance company says was paid actually matches what the provider billed.

This is NOT the computer health/diagnostics tool (that lives in ComputerValue\). This is human health.

## Purpose Within the Amit System

Amit walks alongside people in every domain of their life. Health is one of the most stressful, most confusing, most consequential domains most people navigate. Insurance paperwork, prescription management, benefit-year tracking, EOB reconciliation — these are things people either ignore (and get quietly overbilled) or drown in. Amit brings the same patient, thorough, walk-alongside character to health that it brings everywhere else.

The mission connection: a person Amit serves well in health is a person who trusts Amit in every other area of their life — including the areas that point toward Yahweh.

## Name — Amit Health (Confirmed Session 34)

The module is called **Amit Health**. Not "Doctor Amit." Amit does not diagnose, prescribe, or carry medical authority. Amit is a personal health advocate and complete record keeper — which is actually more valuable than a single doctor, because no doctor has the patient's complete picture across every provider. Amit does. The word "doctor" sets a wrong expectation and creates liability. The word "companion" is what this is.

---

## Design Principle — The Patient Advocate Posture (Permanent)

Amit Health is a consultant working FOR the patient — not for the insurance company, not for the provider, not for the government. Insurance companies have entire departments working to minimize payouts. The person navigating a claim, a denial, or a coverage question has no one in their corner. Amit fills that gap. Not by being adversarial — by making sure the person understands their own coverage, knows when a denial is worth contesting, and never pays a dollar more than they actually owe.

This posture runs through every feature. It is not a tone choice. It is the mission of the module.

---

## Full Feature Set (Defined Session 34 — 2026-06-19)

### Medications
- Daily medications, supplements, dosage, schedule — all tracked per member
- Recurring Hub pursuits for medication reminders
- Refill tracking — flags when a prescription is running low based on dosage and supply

### Doctor Visits & Appointments
- Appointments scheduled on the Hub calendar per member
- Visit notes, provider information, reason for visit, follow-up instructions
- Follow-up appointment tracking — if a follow-up was ordered, Amit tracks whether it was scheduled
- When authority is granted, appointments appear on the authorized person's Hub calendar as well
- **Consultation records** — specialist consultations, second opinions, telehealth visits all tracked with notes and outcomes

### Health Records & Documents
- **Radiology / imaging studies** — Amit stores the radiology report (PDF of the radiologist's written interpretation) in Supabase Storage. The actual image files (X-rays, MRIs, CTs) live on the hospital/provider's patient portal — Amit stores a reference link to that portal, the portal name, facility, study date, and study type. Patient portal links can expire; Amit retains the facility name so the person can always locate the images again.
  - If a member wants to own their images long-term, they can download DICOM files from the provider (legal right under the 21st Century Cures Act) and store them in OneDrive — Amit Health can link to that location.
- **Doctor reports and clinical notes** — uploaded as PDFs, tagged to the visit they came from, searchable by date and provider
- **Lab results** — uploaded or manually entered; tracked over time so trends are visible (e.g., cholesterol trending up over 3 years)
- **Health history over time** — the complete longitudinal record across every provider, every visit, every document. No single doctor has this. Amit does.

### Drug Interaction & Prescription Safety
- Active medication list verified against known drug-drug interactions on entry or update
- When an interaction is found, Amit flags it: what the interaction is, the severity level, and what to bring to the prescribing doctor and pharmacist
- Amit does not say "don't take these." Amit says "flagged — here's what your provider needs to know." Always routes back to the professional.
- Prescription history tracked — what was prescribed, by whom, when, and for what condition

### Symptom & Health Event Log
- Personal dated journal — not diagnosis, just observation: symptoms noticed, when they started, when they resolved, what changed
- Over time this becomes the record a person brings to appointments: "here is exactly what I wrote down between visits"
- Linked to visits — a symptom log entry can be tagged to the appointment where it was discussed and diagnosed

### Preventive Care Calendar
- Tracks recommended preventive screenings by age and sex: annual physical, mammogram, colonoscopy, dental cleaning, vision exam, skin check, bone density, etc.
- Records when each was last completed and flags when it is due
- Many preventive services are covered at 100% under most insurance plans with no deductible — Amit flags this so members use what they are already paying for

### Prior Authorization Tracking
- Many procedures require insurance pre-approval before they happen. Without it, the claim is denied even if the procedure was medically necessary.
- Amit tracks: was prior auth required? Was it requested? Auth number issued? Approved or denied? Expiration date?
- A prior auth denial before a procedure is infinitely better than a claim denial after it.

### Appeal Management with Deadlines
- When a claim is denied, a formal internal appeal window opens — typically 180 days
- Amit tracks: denial date, appeal deadline, whether an appeal was filed, outcome
- If the deadline is approaching and no appeal has been filed, Amit flags it loudly
- After internal appeal, external review rights are also tracked (independent review organization, state insurance commissioner)

### Coordination of Benefits
- Some members have two insurance plans (employer plan + spouse's plan)
- Primary pays first; secondary covers a portion of what remains
- The `health_insurance_plans` table must support primary/secondary designation with coordination-of-benefits notes
- EOB matching logic must account for multi-plan scenarios

### Open Enrollment Advisor
- Once a year, most people roll over their existing plan because comparison is overwhelming
- Amit knows the family's actual usage history — medications, typical visits, upcoming known procedures
- At open enrollment, Amit can model: "Based on what your family actually used this year, here is what each available plan would have cost you. Here is the comparison."
- Helps the family pick the right plan rather than defaulting to whatever they had

### Pharmacy Price Comparison
- Same prescription, widely different prices at different pharmacies
- Amit surfaces: "Your prescription costs $45 at your current pharmacy. It is $12 at Costco and $8 with the GoodRx coupon at CVS."
- Pure patient advocacy — Amit has no financial interest in which pharmacy is used

### Insurance Documentation & Coverage Consultation
- **Insurance card scanning** — member scans their insurance card (photo). Amit extracts: plan name, member ID, group number, payer phone numbers, in-network deductible, out-of-network deductible, out-of-pocket maximum, copay structure, coinsurance percentages, Rx coverage tiers
- **Coverage lookup** — given the extracted plan details, member asks "would this procedure/medication/provider be covered?" Amit consults the plan data and gives an honest answer: covered, not covered, conditional, or needs verification
- **Denial support** — when a claim is denied, Amit surfaces the denial reason code and what it means in plain language. Flags whether it is worth appealing and what the appeal process looks like for that plan
- **Network status** — member can check whether a provider is in-network before the appointment. Out-of-network visits cost significantly more — catching this before the visit matters

### Medical Bills & EOB Reconciliation
- **Medical bill tracking** — every provider bill logged, linked to the visit it came from, payment status tracked. Connected to AmitAccounting as an expense.
- **EOB reconciliation — three-way match** — every medical transaction involves three documents that must agree:
  1. Provider invoice — what the doctor/hospital billed
  2. EOB — what insurance says they covered and what the patient owes
  3. Actual payment — what flowed out of AmitAccounting
  Amit matches all three and flags:
  - Provider invoice ≠ EOB patient responsibility (overbilled vs. what insurance agreed to)
  - Payment made but no matching EOB received
  - EOB denial — surfaces the reason, flags appeal opportunity
  - Overpayment — paid more than the EOB said was owed
  - Outstanding balance — bill arrived, no payment recorded
  **Goal:** at any moment, every open claim, every unmatched document, every denial, and every dollar that doesn't add up is visible and actionable.

### Deductible & Benefit-Year Tracking
- Running deductible tally per member per benefit year — updated automatically as EOBs are matched and payments recorded in AmitAccounting
- Out-of-pocket maximum tracker — shows how close the member is to the cap; once hit, Amit flags that covered services should cost nothing more this year
- Benefit year reset — Amit tracks when the benefit year rolls over and resets all accumulators
- "Should I have this procedure now or wait until January?" — Amit can answer this based on current deductible position and remaining out-of-pocket exposure

### Premium Tracking & Tax Implications
- **Premium payments** — insurance premiums logged as recurring bills in AmitAccounting. Due dates tracked. Amit flags if a premium payment is missed (lapse of coverage risk).
- **Tax implications surfaced per situation:**
  - Premium paid through employer (pre-tax via payroll) — notes that these are already tax-advantaged, no additional deduction
  - Premium paid personally (ACA marketplace or self-pay) — flags potential self-employed health insurance deduction or itemized medical expense deduction
  - Premium paid through a business — notes business expense deduction, owner vs. employee treatment differences
  - HSA / FSA tracking — contributions, eligible expenses, balance, annual limit, rollover rules (FSA vs. HSA differ significantly)
  - Medical expense deduction threshold — tracks total out-of-pocket medical spending against the 7.5% AGI threshold for itemizing
- **Business vs. personal routing** — Amit asks how the insurance is structured (employer, individual, business-owned) and routes the accounting and tax treatment accordingly. This is a question asked once at setup, not every transaction.

### Family Mode & Authority Delegation
- Each family member has their own profile — medications, appointments, insurance, bills, EOBs are member-specific
- A member can grant authority to another person (family member, caregiver, adult child)
- Authority grants are explicit and revocable — not default-open
- When authority is granted, the grantor's appointments appear on the authorized person's Hub calendar
- The authorized person can view and help manage EOBs, bills, and coverage questions on behalf of the grantor
- Primary use case: adult children helping aging parents navigate healthcare complexity they can no longer manage alone

## Architecture Decisions — Locked (Session 34 — 2026-06-19)

**Family scope: FAMILY MODE (decided)**
Each person in the family network has their own profile with their own records — medications, appointments, insurance, EOBs, bills. The top of the data model is `health_members`, not a single user.

**Authority delegation (decided):**
A member can grant another person authority to access their records. This is a deliberate, explicit grant — not default-open. When authority is granted:
- The authorized person can view the grantor's medications, appointments, insurance, EOBs
- The grantor's appointments appear on the authorized person's Hub calendar
- The authorized person can help manage EOB reconciliation and bill tracking on behalf of the grantor

**Primary use case named by Ryan:** Adult children helping aging parents who cannot navigate their own healthcare complexity. A parent's EOB arrives. They don't understand it. Their son or daughter logs in, sees the parent's appointments on their own calendar, checks the EOBs, walks them through it. Amit is the companion for the whole family — not just the account holder.

**Deductible / out-of-pocket connects to accounting (decided):**
Every payment against a medical bill — copays, deductibles, out-of-pocket expenses — flows through AmitAccounting. The deductible tracker is not a separate ledger; it is a view of medical-category transactions in accounting, accumulated against the benefit-year limit. When AmitAccounting records a medical payment, Amit Health updates the running deductible and out-of-pocket totals automatically.

**Data sensitivity:**
Health data is personal. All records stored in Ryan's Supabase project only. Authority grants live in the database — no health record is exposed to any person not explicitly authorized. No syncing to external services beyond Supabase without Ryan's explicit confirmation.

## Current Status

Not yet built. Folder, CLAUDE.md, and project infrastructure created Session 34 (2026-06-19). Purpose defined. Schema not yet designed.

## Build Notes

- This folder was created using the New Project Directive.
- Amit Health is a separate module from Amit Computer Value. Do not conflate them.
- Schema design comes before any HTML. Follow the same approach as AmitAccounting: decide the data model first, then build the interface.
- Tim conversation may be relevant here too — insurance and medical billing have accounting overlap. Consider whether the medical bill / EOB layer should be a sub-module of AmitAccounting or its own thing. Current direction: its own module with a connection to accounting.
- The "Carfax for PCs" insight from Computer Value applies here differently: EOB matching is the feature that makes this trustworthy. Amit never tells someone their bill is fine without checking it.

## Connection to Other Apps

- **Hub** — appointments on the Hub calendar (pursuits with medical category), medication reminders as recurring pursuits, health summary tile in sidebar
- **AmitAccounting** — medical bills feed into accounting as expenses; insurance payments tracked; benefit-year financial picture connected to overall personal finance
- **Database (Supabase)** — shared database, dedicated health tables (not yet designed)
- **who_is_god / Companion** — no direct connection; Amit Health stays in the practical domain

---

