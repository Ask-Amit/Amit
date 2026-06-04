# Amit Computer Value — Full Product Specification
**Last Updated: 2026-06-02**
**Status: Concept complete. Stage 1 ready to build.**

---

## What It Is

A guided PC health verification and certification tool. Amit walks any user — technical or not — through a systematic assessment of their machine and produces a complete health report, an estimated market value, and a verifiable certification that travels with the machine permanently.

**The origin:** Ryan experienced firsthand what this product solves. A newly built custom PC with bad RAM caused six hours of troubleshooting across multiple sessions. If the builder had run a $1 certification before delivery, the failing RAM sticks would have been caught at the bench — not on Ryan's time.

---

## The Core Value Proposition

- Builder runs it before delivery: proves the machine is what they claim
- Buyer runs it after receiving: verifies the machine matches the certification
- If both match: transaction is confirmed, trust is established
- If they don't match: Amit has the evidence, dispute is opened automatically

**"Carfax for custom PCs."**

---

## Build Classifications

| Type | Description | Scoring Baseline |
|------|-------------|-----------------|
| 🆕 Manufacturer Level | Factory-built, all new, shipped in box | Highest standard |
| 🔧 Custom New | All new components, custom assembled | High standard |
| ⚡ Hybrid | Mix of new and used components | Adjusted standard |
| ♻️ Custom Rebuilt | All used components | Used component standard |

Each classification gets its own scoring baseline. A hybrid scoring 94% on hybrid standards is an honest 94%. Never compared against the wrong baseline.

---

## Scan Tiers

| Tier | Duration | Description |
|------|----------|-------------|
| Level 1 — Quick | ~5 min | Basic health check, just bought it |
| Level 2 — Standard | ~20 min | Recommended for most buyers |
| Level 3 — Deep | ~60 min | Serious buyers, refurbished machines |
| Level 4 — Extreme | 2+ hrs | Builders certifying before sale |

---

## User Expertise Levels

**Beginner** — Mouse-by-mouse, keystroke-by-keystroke. Every instruction includes: what to look for, where it is on screen, what it looks like, what to click, what to expect before pressing Enter, what normal output looks like, what abnormal output looks like and what to do.

**Intermediate** — Step by step but assumes basic navigation.

**Expert/Builder** — Terse and direct. Command shown, nothing else.

User selects level at launch. Every instruction adjusts accordingly. As build history accumulates, the app adjusts verbosity automatically — first build is 3 hours, tenth build is 15 minutes, hundredth build is 1 minute.

---

## UI Architecture

### Version 1 — Basic (Build Now)
- Static numbered sections/zones on screen
- One button throughout: **Perform** — never changes label
- User follows text instructions, completes each step, presses Perform to log result
- All results accumulate in certification form
- Final button: **Generate Certification**
- Amit evaluates completed form and produces report
- No real-time monitoring. No dynamic buttons.

### Version 2 — Standard
- Zone-based workspace with numbered drop zones (Section 1, 2, 3, 4...)
- User drags diagnostic windows into assigned zones
- App captures zone automatically when window is dropped
- Buttons change label based on current step context
- Per-section submit — Amit evaluates each section as completed
- Zone override protection: wrong window → blocked with redirect message
- Reference screenshot library: "Your screen should look like this" using actual screenshots from the session

### Version 3 — Premium (Fully Mature)
- App watches every zone continuously — no user input needed between steps
- Automatic periodic screenshot every 60 seconds across all active zones
- AI evaluates in real time as values change
- Color-coded zone status: Green (passed), Yellow (monitoring), Red (attention needed), Blue (user action required)
- Alert thresholds built in per component model — stops everything if dangerous condition detected
- User places windows once at start. App does everything else.

---

## Screenshot Verification System

At every diagnostic step:
1. App tells user exactly when and what to capture
2. Beginner instruction: "Press Windows key + Shift + S. Your screen will dim. Drag from the top left corner of the dark window to the bottom right corner. Release. Click in the chat box and press Ctrl + V."
3. App validates the screenshot against expected results for that step
4. If screenshot doesn't match expected: "This doesn't look right. Here is what we expected to see. Please retake."
5. Every verified screenshot is timestamped, hardware-matched, embedded in the final report

**Copy button instruction (beginner level):** "Look to the right of the command box. You will see a small icon that looks like two overlapping squares. Click it once. The command is now copied. Click inside the dark window. Hold Ctrl and press V. Then press Enter."

---

## Component Intake

At launch, app asks:
- New or existing machine?
- Make and model of each component (or auto-detect where possible)
- GPU: model, new or used?
- Motherboard: model?
- Cooling: how many fans, what type?
- RAM: quantity, speed, new or used?

Each answer shapes the diagnostic path. Auto-detects where possible using system queries.

---

## Live Market Valuation

App researches current market value of each component on the day the report is run:
- Pulls current eBay sold listings, Amazon, Newegg pricing
- New components valued at current retail
- Used components valued at current used market price
- Combined with health score to produce overall machine value
- Valuation is timestamped — buyer knows exactly what it was worth on certification day
- Buyer can run a new report any time to get today's current value

---

## Unique Build ID System (PCV-ID)

Format example: **PCV-2026-RYZ9-RTX3070-K240-X1TB-A7X3**

Generated from: CPU model + GPU model + drive config + motherboard + scan date + random salt. Hardware-locked — cannot be transferred to another machine.

**Physical certification requirements (builder must complete):**
- Photo of serial numbers: CPU box, GPU box, motherboard, drives
- Photo of completed build interior
- Photo of POST screen
- Screenshot of HWiNFO summary validated against declared specs
- Motherboard serial number entered

**QR code generated** — links to full verified report permanently. Builder prints and attaches to machine. Buyer scans at any time.

---

## Builder Reputation System

| Level | Requirement |
|-------|-------------|
| Provisional Certified | First build |
| Verified Builder | 10+ builds, 90%+ pass rate |
| Master Certified Builder | 50+ builds |

Builder score is public. Buyers seek out high-score builders. Market self-regulates.

**Builder record notes:**
- Certification ran before delivery vs. after
- Missed configurations caught during buyer verification (e.g., Windows Update set to Manual)
- Post-delivery match rate (builder cert vs. buyer cert)
- Buyer ratings after delivery

---

## Two-Score System

**Score 1 — The Machine:** This specific computer, tested this day, valued this day. Health rating. Component breakdown. Timestamped. Travels with the machine permanently.

**Score 2 — The Builder:** Cumulative record across every certified build. Pass rate. Buyer ratings. Configuration miss rate. Public to every buyer who scans the QR code.

---

## Buyer Score System

Buyers are also rated:
- Purchase history
- Dispute history
- Whether post-purchase certification matched builder certification
- Seller ratings of buyer behavior

A buyer with a pattern of false disputes gets a score that sellers can see.

---

## Before/After Comparison & Anti-Fraud

When builder certifies before delivery and buyer certifies after receiving:
- App compares hardware fingerprints
- Same machine: both parties confirmed honest ✅
- Different fingerprint: "The machine you received does not match the certified machine. A dispute has been opened." ⚠️

Tamper detection: screenshots timestamped and hardware-matched. Report cryptographically tied to specific scan session on specific machine. Marked ✅ Verified or ⚠️ Unverified.

---

## Escrow Payment System (Future)

- Buyer deposits funds — held in escrow by Amit Computer Value
- Seller certifies before handoff — machine gets PCV-ID
- At handoff, buyer certifies same machine within 12-hour window (or at seller's location)
- Hardware fingerprint matches + photos match → funds release automatically
- Mismatch → funds held, dispute opened, Amit has all evidence
- Clean certification + verified match = transaction final, no buyer's remorse claims

---

## Alert Thresholds & Liability

App knows safe limits for every component by model. When crossed during certification — stops everything and alerts.

**Terms of service established at session start:**
- Amit identifies conditions, does not cause them
- Continuing past a warning is user's decision and responsibility
- Clean certification = snapshot at that moment, not lifetime guarantee
- Certification record is evidence for both parties in any dispute

---

## Backed Certification Tier

Machines scoring 95%+ on new build standard: Amit Computer Value stands behind the rating. Higher price point ($15-25 per report). Backed evaluation — not just a document.

---

## Business Model

| Revenue Stream | Amount |
|---------------|--------|
| Builder per-report | $1-5 |
| Buyer verification | $1-5 |
| Builder subscription (volume) | Monthly flat rate |
| Premium/backed certification | $15-25 |
| Escrow transaction fee | 2-3% of sale |

**The mission connection:** Every dollar generated by Amit Computer Value keeps who_is_god.html and the Amit Bible companion free for everyone.

---

## The Amit Thread

The same character who certifies computers is the same character in who_is_god.html and the Bible companion. Honesty. Walk alongside. Never cut. Encourage always.

When the certification is complete and the person has been genuinely served — Amit says one quiet sentence. Not a banner. Not a popup. Just an offer. The door is open. They walk through it because they already trust who opened it.

---

## The AI Help Button

Built into every level of the app. Press it — Amit is there. Same voice, same character. Helps with the diagnostic. And when the time is right, points toward something with even stronger evidence behind it.

---

## Build Stages

**Stage 1 — Build now:**
Self-contained HTML file. Guided diagnostic checklist. Amit walks through every step. Produces printable certification report. No accounts, no escrow, no zones, no AI vision. $5 per report. Zero infrastructure cost. This proves the concept and generates the first dollar.

**Stage 2 — AI verification:**
Screenshots submitted, Amit analyzes, validation embedded in report. Requires API key and hosted version.

**Stage 3 — Builder reputation system:**
Accounts, history tracking, public profiles. Requires database and web hosting.

**Stage 4 — Marketplace + Escrow:**
Full peer-to-peer transaction platform. Payment processing, legal framework, full infrastructure.

Each stage funded by the one before it.

---

## Current Machine Diagnostic State (Ryan's Desktop — DESKTOP-0AMCSMM)

**System Specs:**
- CPU: AMD Ryzen 9 3900X
- Motherboard: MSI B450M PRO-VDH MAX (MS-7A38) — BIOS B.00 09/03/2025
- RAM: 16GB DDR4-3600 (2x G.Skill 8GB) — Slots 2 & 4
- GPU: NVIDIA RTX 3070 Founders Edition
- Storage: Kingston 240GB SSD + X16 1TB NVMe
- OS: Windows 11 Pro Build 26200.6584

**Completed & Passed ✅**
- RAM repositioned to Slots 2 & 4 — stable, passing memory diagnostic
- VS Code clean reinstalled
- Claude Code extension installed
- SFC — no integrity violations
- Drives — all healthy
- GPU — 68°C max under load ✅
- CPU — 82.6°C max under full stress ✅
- Motherboard voltages — 12V/5V/3.3V all normal ✅
- Network — 110 Mbps down ✅
- Virus scan — zero threats ✅
- Windows Hardware Errors — 0 ✅
- wuauserv StartType — corrected from Manual to Automatic ✅

**Still Open ⏳**
- KB5089549 (2026-05 Security Update) — persistent failure, error 0x800705b9
  - Tried: service stop/start, download cache clear (partial — long paths blocked), sfc /scannow (clean), Windows Update Troubleshooter (could not identify problem)
  - Next step: DISM /Online /Cleanup-Image /RestoreHealth — repairs Windows Update components directly
  - Command ready: `DISM /Online /Cleanup-Image /RestoreHealth`
  - Warning: takes 15-30 minutes, requires internet, percentage counts to 100

**Open Programs at Session End:**
- HWiNFO64 — System Summary (Section 1)
- CPU-Z — CPU tab (Section 2)
- CPU Active Clock window
- HWiNFO64 — Sensors/Tree (Section 3 left panel)
- Windows Update — Settings (Section 4 center)
- Administrator: Windows PowerShell (Section 5 right)
- Chrome — fast.com showing 110 Mbps

**Tomorrow — pick up at:**
Run DISM command in PowerShell Administrator, then retry Windows Update KB5089549. After update resolves, begin Stage 1 build of Amit Computer Value HTML application.
