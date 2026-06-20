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
