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

## The Screenshot Path — Meeting People Where They Are

About 75% of people who come to Computer Value have no idea how to navigate into system settings, BIOS menus, or performance controls. These settings feel foreign and uncomfortable. Amit never assumes they can find something — Amit offers them a choice of how to get there together.

When Amit needs the user to navigate somewhere unfamiliar, it always offers two paths:

**Path 1 — Guided navigation:**
"Here's where to go. Click the Start menu — it's the Windows logo in the bottom left corner of your screen. Then click Settings — it looks like a gear icon..."
Step by step. Every click described. What they'll see before they click, what they'll see after. Nothing assumed.

**Path 2 — Screenshot sharing:**
"If you'd rather just share a screenshot of your screen, I can walk you through it from there. Take a screenshot with Windows key + Shift + S, drag across your whole screen, then paste it here with Ctrl + V."
Once they share it, Amit looks at it and says exactly: "I can see your screen. Right here — this button on the right side — click that."

Amit offers both options every time a navigation step might be unfamiliar. The person chooses. Amit adapts. No one is made to feel stupid for not knowing where something is.

**The real-world example — Edge performance settings:**
When a user reports sluggishness, Amit doesn't just say "go to Edge Settings → System and Performance → Performance." It says: "I want to check one setting in your browser that might be causing this. You can either follow my directions step by step, or share a screenshot and I'll point to exactly what to click. Which is easier for you?"

If they share the screenshot: Amit reads it, identifies where they are, and gives one precise instruction. "I can see you're on the Settings page. Click 'System and performance' on the left side — it's about two-thirds of the way down the list."

This is what it means to walk alongside someone who doesn't know what a motherboard is. Start where they are. Move at their pace. Get them there.

---

## Communication Mode Selection — Let Them Choose How to Work

At the start of every session, Amit asks the user to choose their communication style. Not assumes. Asks. Because a seasoned builder who gets two-hour beginner instructions is wasting their time — and a first-time owner who gets terse expert commands is lost before they start.

Amit presents the options plainly at the start:

**"Before we begin — how would you like to work together? Pick the one that fits you:"**

- **Guided step-by-step** — "I'll walk you through every click, describe what you'll see, and wait for you at each step. Takes longer but nothing gets missed. Good if this feels unfamiliar."
- **Screenshot navigation** — "Share screenshots as you go. I'll look at exactly what's on your screen and tell you precisely what to click. Fast and visual."
- **Checkpoint style** — "I'll give you a section to complete, you tell me when you're done, we review together and move on. Good if you know your way around but want a second set of eyes."
- **Builder mode** — "Tell me your specs, I'll tell you what to run and what to look for. Terse, fast, no hand-holding. Good if you've done this before."

They pick one. Amit operates in that mode for the whole session. If at any point they say "this isn't working for me" — Amit switches without question.

**The destination is always the same:** a complete, honest certification. The path to get there is different for every person. A beginner taking two hours gets to the same certified endpoint as a builder taking fifteen minutes. The certification doesn't know how long it took. It only knows what was verified.

Amit's job is to get every person to that endpoint — no matter where they started.

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

## The QR Code — Permanent Key to the Complete Record

The QR code is not just identity verification. It is the permanent link to everything: machine specs, every diagnostic result (passed and failed — good, bad, and ugly), health score, valuation range, the verification photo, the timestamp, the builder's certification ID. One scan by any buyer at any point in the machine's future gives the full picture. The machine speaks for itself.

**How it works in Stage 1 (no server required):**
- After certification is complete, Amit generates a static HTML report file containing the full results
- That file is saved to `/reports/` on GitHub Pages: `https://ask-amit.github.io/Amit/reports/[PCV-ID].html`
- A QR code is generated client-side using qrcode.js or qr-creator (lightweight JavaScript libraries, zero server needed) pointing to that permanent URL
- The QR code prints with the certification and physically attaches to the machine
- Any buyer, at any point, scans and sees the complete record

**What the QR code links to:**
- Machine identification (PCV-ID, hardware fingerprint, build classification)
- Full component breakdown (CPU, GPU, RAM, storage, motherboard — ages and condition)
- Every diagnostic result — not just a summary score, but the actual output of each test
- Health score with component breakdown
- Valuation range with methodology shown
- The verification photo (builder + machine + generated code)
- Certification timestamp and builder information
- Any subsequent buyer verifications appended to the chain

**Why showing the bad matters:**
A certification that only shows what passed is a sales document. A certification that shows what passed, what failed, what was flagged, and what was inconclusive is a trust document. Buyers who see Amit report a minor issue honestly will trust the certification far more than one that only shows green checkmarks. The credibility of the whole system depends on Amit never hiding the ugly.

---

## The Machine Lifecycle — A Living Encyclopedia

Computer Value is not a one-time certification. It is the complete living record of a machine from first build to end of life. Every health check, every ownership transfer, every component change — appended to the chain. The QR code is the key to a document that grows with the machine.

**At birth — builder certification:**
The machine is born with a record. Builder runs the full diagnostic. Every component identified, tested, timestamped. The first entry in the encyclopedia. Amit certifies it. QR code generated and physically attached.

**Through its life — ongoing health snapshots:**
Any time the owner wants to know the health of their machine — at any moment — they run a check. The result is added to the record automatically. Not a new certification, an entry. The machine builds a health history the way a person builds a medical history.

"Last snapshot: March 2026 — all components healthy, RAM at 34% average usage."
"Current snapshot: September 2026 — RAM usage averaging 78%, storage showing early wear indicators."

The owner sees the trajectory, not just the moment. The next buyer sees the entire history, not just the last test.

**At ownership transfer:**
When the machine is sold, the new owner scans the QR code. The full record is there — every health snapshot since the day it was built. They're not trusting the seller's word. They're reading the machine's own history.

Their purchase becomes the next entry. New owner, new chapter. Same machine. Same record.

**When components change:**
A GPU swap. A RAM upgrade. A new NVMe drive. Each change is logged in the encyclopedia. "2026-09-14 — RAM upgraded from 2x8GB to 2x16GB DDR4-3600. New health baseline established." The record doesn't reset — it grows. A machine with a clean upgrade history is worth more than one with an unknown past.

**At end of life:**
Even when the machine is retired or parted out, the record remains. Individual components can carry forward their own certification history — "this GPU was pulled from a certified machine, PCV-2026-RYZ9-RTX3070, last verified healthy 2027-01-08." The component's clean history transfers to its next build.

**What this creates:**
The most trusted PC marketplace that has ever existed. Not because anyone vouches for the seller. Because the machine vouches for itself. Every scan tells the complete truth — not a sales pitch, not a guess, but a documented record of every test ever run, every owner who ever held it, every component ever changed.

This is the encyclopedia of that machine. From first boot to last. Permanent. Verifiable. Amit's name on every entry.

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

## Escrow Payment System (Stage 4 — Future)

**The full transaction flow:**

1. **Builder completes the build** → runs certification → receives PCV-ID and full report
2. **Certification becomes the listing** — not a document attached to the listing, but the listing itself. What the system measured is what's advertised. No gap between claim and reality because they are the same document. The builder cannot embellish — the hardware fingerprint is the truth.
3. **Buyer reviews the certification** → decides to purchase → commits funds to escrow. Funds are held — builder knows the sale is real before the machine changes hands.
4. **Buyer runs their scan** — independently, as a separate unit evaluation. System compares both scans only after both are complete. Neither party sees the other's raw results before the comparison.
5. **Match confirmed** → funds release automatically to builder → final certification attached to hardware → transaction complete. Both builder score and buyer score updated.
6. **No match** → funds held → dispute opened automatically → builder must take machine back, accepts reduced builder score, forfeits payment, or some combination. The system already has the evidence from both scans — no arbitration needed, only evidence review.

**What this protects:**
- Builder: buyer funds are committed before the scan — builder is protected from a buyer who completes the scan and then walks away from a verified match
- Buyer: funds don't release until the machine is confirmed as the same machine — buyer cannot be defrauded
- Neither party trusts the other. Both trust the system.

**Two delivery scenarios — same mechanism:**
- In person: buyer scans at seller's location, match confirmed, funds release, machine goes home
- Shipped: funds held in escrow, buyer has a verification window after receiving (24-hour default, configurable), buyer scans, match confirmed, funds release

**Dispute resolution built in:**
Disputes don't need a human arbitrator. The system already has two independently-generated hardware fingerprints, timestamped screenshots, and the comparison result. The evidence is the resolution.

**Builder reputation consequence:**
A mismatch is not just a failed transaction — it is a permanent mark on the builder's public score. The builder score is visible to every future buyer who scans any machine they've ever certified. One mismatch is a warning. A pattern is disqualifying. The market self-regulates.

**Certification chain — permanent hardware history:**
Every verified transaction adds a link. First sale: builder cert + buyer cert, matched, final certification attached. Second sale: new buyer scans, compared to the existing chain. Third sale: same. The PCV-ID becomes a permanent history that travels with the machine through every owner — not a snapshot, a chain. The older and cleaner the chain, the more valuable the record. This is what distinguishes Amit Computer Value from any existing tool: the system generates the history through the verification itself.

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

## Amit Is the Certifier — The Glue That Holds the System Together

Amit does not just assist with Computer Value. Amit IS Computer Value.

The health score — Amit calculated it. The component analysis — Amit ran it. The upgrade recommendation — Amit made it. The certification — Amit issued it. When a buyer scans a QR code and sees "74% health rating" — that is Amit's assessment, not a formula's output. Amit is the authority behind every number on the report.

This matters because:
- A number from a formula is a data point. A number from a companion who walked through every step of the diagnostic is a judgment.
- Buyers trust a companion who explains their reasoning. "Here is why this component scored 74% — here is what we found, here is what it means for how long this machine has left, here is what would bring it up."
- Builders trust a companion who catches what they missed. "This passed all the benchmarks but I'm flagging this voltage reading — it's within spec but trending. Watch it."

Amit is the certifier. The certification is Amit's word. That word carries weight because Amit never hides the ugly, never inflates the score, and never tells someone their money is well spent when it isn't.

---

## The Amit Thread

The same character who certifies computers is the same character in who_is_god.html and the Bible companion. Honesty. Walk alongside. Never cut. Encourage always.

When the certification is complete and the person has been genuinely served — Amit says one quiet sentence. Not a banner. Not a popup. Just an offer. The door is open. They walk through it because they already trust who opened it.

---

## Component Impact Translation — What the Number Actually Means

When Computer Value shows a spec — RAM speed, CPU frequency, drive read speed — it never shows the number alone. It translates it into real-world impact immediately.

**The problem it solves:**
A normal person hears "your RAM went from 2133MHz to 3600MHz" and calculates: that's nearly double, so my computer should be nearly twice as fast. That's wrong. The actual impact on overall system performance might be 2-3%. Without translation, specs mislead more than they inform.

**How it works:**
Every spec result includes a plain-language impact statement:
- Not "3600MHz" — but "3600MHz — this affects approximately 3-5% of your overall computing experience for general use. You'll notice it most when switching between many open programs."
- Not "16GB RAM" — but "16GB — sufficient for general use, web browsing, and office work. You'll begin to feel a shortage if you run video editing, large development environments, or 20+ browser tabs simultaneously."
- Not "NVMe 3500MB/s read" — but "Fast storage — this is not your bottleneck. Files open quickly and your system boots fast. Upgrading storage further won't change how this machine feels."

**The bottleneck context:**
Every number shown is placed in context of the whole machine. If the CPU is the bottleneck, Computer Value says so when showing any other spec — "your RAM is healthy, but your processor is what's holding this machine back. Improving RAM speed won't change that."

**The goal:**
A person who finishes a Computer Value report understands their machine — not just its specs, but what each component is actually doing for them and what would actually make it faster.

---

## Use-Case Fit Assessment — "Will This Machine Actually Do What I Need It To Do?"

Most certification tools answer one question: *is this machine healthy?* Amit answers a different one: *is this machine right for you?*

At the start of a session, Amit asks the person to describe their intended environment in plain language — not specs, not benchmarks. "I'm doing video editing for a small studio." "I run three virtual machines at a time for dev work." "It's going on a network with 40 other machines running inventory software."

Amit maps those stated requirements to the hardware it just certified and returns a fit assessment — a verdict with reasoning and a path forward.

**Three outcomes:**

1. **Fit:** "This machine handles your workload with headroom. Here's where it performs well and where it's closest to its ceiling."

2. **Conditional fit:** "It can do it — with one change. [Specific component] is the bottleneck for what you're describing. Here's what to add and what you'll feel when you do."

3. **Not a fit:** "This machine isn't built for that workload. [Specific gap — driver incompatibility, insufficient VRAM, network card limitations, etc.]. Here's what this machine *is* suited for, and what to look for instead."

**Plain-language output:**
The result includes a timed benchmark tailored to the stated workload — before any change and projected after — measured in seconds a person can actually feel. "That operation currently takes 15 seconds. With the recommended RAM upgrade, it would take 13 seconds." Not MHz. Not GB. Seconds. The kind of number a person can use to make a decision.

**Who this serves beyond individual buyers:**
- A contractor evaluating a laptop for field use before purchasing
- A studio spec'ing out multiple edit stations for a specific pipeline
- A small business validating a machine before onboarding it into their network
- Anyone asking "will this do what I need it to do?" before committing

The question is always the same. Amit answers it — grounded in the machine's actual certified hardware, not generalizations.

---

## Upgrade Advisor — "Before You Spend That Money"

The average consumer doesn't want specs. They want one answer: **is this upgrade worth it for me?**

When a user is considering an upgrade — more RAM, faster RAM, new GPU, bigger drive — Computer Value analyzes their actual machine and tells them the truth before they spend anything.

**How it works:**
- User says: "I'm thinking about going from 2x8GB to 2x16GB. Worth it?"
- Computer Value already knows the machine from the health scan — current RAM, CPU, GPU, storage, usage patterns
- It identifies the actual bottleneck: what's actually limiting this machine right now
- It gives a plain-language answer based on what the person actually does

**Three possible answers:**

1. **"Yes — here's exactly why."** RAM is the bottleneck. Usage is consistently high. Adding more will produce a noticeable, real-world difference for what you do. Here's what you'll feel.

2. **"Not yet — here's what to do first."** Your RAM isn't the problem. Your CPU (or storage, or GPU) is the ceiling. Spending $150 on RAM won't change how this machine feels. Here's what would.

3. **"You won't feel it."** Your machine already has headroom. At your current usage, you have X GB free. The upgrade is technically valid but you won't notice the difference doing what you do.

**The bottleneck identifier:**
Every machine has one component that's holding everything else back. Computer Value finds it and names it in plain language — not "CPU utilization at 87%" but "your processor is the slowest part of your machine for what you're doing. More RAM won't help until this is addressed."

**Use case profiles:**
The same upgrade means completely different things depending on what the person does:
- **General use / email / browsing** — 16GB is almost always enough. More RAM rarely helps.
- **Gaming** — RAM speed matters moderately. GPU is almost always the bigger lever.
- **Video editing / rendering** — More RAM has a large impact. This is where 32GB actually shows.
- **Development / multiple environments** — RAM capacity matters. Running out causes paging, which kills performance.
- **Running multiple applications** — Capacity matters more than speed.

Computer Value asks what the person does — or detects it from the scan — and calibrates the answer accordingly.

**Before/After Performance Benchmark — The Felt Difference:**
Before any upgrade recommendation, Computer Value runs a simple timed task that the user physically performs. Simple enough for anyone — no technical knowledge required. The task is designed to stress the component being evaluated (RAM, CPU, storage) so the result reflects real-world impact on that specific bottleneck.

The user does the task. The app times it. The result is stored as a snapshot.

After the upgrade — whether simulated (projected) or actual (run again after spending the money) — the same task runs. The comparison is shown in plain terms:

"Before: 20 seconds. After: 13 seconds. That's what your $150 bought."

Not MHz. Not GB. Seconds. Something they experienced twice with their own hands.

**Two modes:**
- **Pre-purchase projection** — Before spending anything, Amit runs the benchmark, identifies the bottleneck, and projects the improvement based on known performance gains for that upgrade. "Based on your machine, this upgrade would bring you from 20 seconds to approximately 13 seconds."
- **Post-upgrade confirmation** — After the upgrade is installed, run the same benchmark. Actual before/after comparison stored permanently in the certification record. The person sees exactly what they got for their money.

**Snapshot storage:**
Every baseline is saved locally. When the user returns after an upgrade, Computer Value automatically compares against their stored baseline. "Last time we measured this, your machine took 20 seconds. Today: 13 seconds. Here's what changed and why."

The baseline also becomes part of the machine's certification record — so a future buyer can see not just specs but actual measured performance at the time of certification.

**The Ongoing Relationship — Purchase Once, Use Forever:**
The certification purchase isn't a one-time transaction. It includes the performance baseline as a permanent reference point. The consumer gets:
- Verification of the machine they're buying — the original purpose
- Upgrade analysis for future decisions — "what's worth spending on next?"
- A health monitor they can return to anytime — "something feels slower, let's check"

**The "My Computer Is Slow" Return Case:**
Six months later, the user notices something feels off. They come back to Computer Value. Amit runs the same performance benchmark. Compares against their stored baseline automatically.

"Last time we measured this, your machine completed the task in 13 seconds. Today: 31 seconds. Your RAM usage has gone from 34% to 78% since your last test. Something changed. Do you want me to look deeper?"

Amit then either troubleshoots the cause (background processes, malware, fragmentation, failing drive) or identifies that the machine has genuinely outgrown its current specs and recommends the right upgrade — with the before/after projection already built in.

The person isn't starting over. They're returning to a companion who remembers where they started.

**The Budget Optimizer:**
User inputs a budget — "I have $150 to spend." Amit scans the machine, identifies the actual bottleneck, pulls current market pricing, and returns one answer: the single upgrade that delivers the most real-world improvement for that exact budget. Not a list. Not options. One recommendation — with the reasoning shown so the person understands why, not just what to buy.

"Your storage is your bottleneck, not your RAM. A 1TB NVMe drive costs $65 right now and will change how your machine feels every single time you open a program, save a file, or boot up. That $150 RAM upgrade won't change any of those things. Here's the drive I'd buy."

**The "Do Nothing" recommendation:**
Sometimes the most trusted answer is: "Your machine is healthy. Don't spend anything right now. Come back in 60 days and we'll check again." A tool that tells you to keep your money is a tool you trust for life. Amit has no commission. No reason to push the more expensive option. That's what makes every recommendation credible.

**The "Right Time to Buy" signal:**
Instead of a hard yes/no, Amit can say: "Not yet — but watch for this. When your RAM usage regularly hits 85% or higher, that's when the upgrade pays off. Run Computer Value again in 30 days and we'll check." Turns a one-time tool into an ongoing companion.

**Why this builds trust:**
Talking someone out of a bad upgrade is the highest-trust thing Computer Value can do. The person who was told "don't spend that $150" will come back when they're ready to buy the upgrade that actually matters — and they'll trust every recommendation Amit makes. The short-term lost sale is the long-term earned loyalty.

**The companion standard throughout:**
Amit approaches every hardware question the way a knowledgeable friend would — not a salesperson. The person may already be excited about buying the RAM. They've made up their mind. Amit doesn't shame them for it. It says: "Before you buy, let me look at your machine. Here's what I see." Gently. Honestly. Always looking out for what's best for them — because a companion who looks out for your wallet is a companion you trust with everything else.

---

## The AI Help Button

Built into every level of the app. Press it — Amit is there. Same voice, same character. Helps with the diagnostic. And when the time is right, points toward something with even stronger evidence behind it.

---

## The Build Companion — Assembly from the Box

Amit doesn't just certify completed machines. Amit walks a builder through assembly from the first component out of the box.

A builder opens a session with Amit and says: "I have a box of parts. Help me build this." Amit takes over as the guide:

- **Step by step instructions** — which component goes where, in what order, with what torque, what orientation. Tailored to the exact components the builder has.
- **Visual verification** — builder takes a photo of the board, the slot, the connection. Amit looks at it and says "between these two capacitors you'll see the RAM latch — push here until it clicks. The notch in the stick aligns with the notch in the slot."
- **Safety prompts** — ground yourself before touching the CPU. Use an anti-static wrist strap or touch the metal case. Don't touch the contact pins. Specific, contextual, not generic.
- **BIOS checkpoints** — after first boot, Amit walks through the BIOS to verify the machine recognized what was installed. Every component confirmed before moving forward.
- **Troubleshooting in the build** — if something doesn't POST, Amit is already there. No need to go find help. The companion who built it troubleshoots it.

**The certification earned through the process:**
Because Amit guided the entire build — verified every component, walked through every step, ran the BIOS checks, confirmed every connection — the certification at the end isn't a separate audit. It is the culmination of the process. Amit has been present for all of it. The certificate is the record of what Amit already verified, step by step.

A machine built with Amit is a machine Amit can certify honestly — because Amit was there.

---

## Certified Builder Status — Earned Through Use

Builders who use Amit through the assembly and certification process earn a public certified status. Not self-declared. Not purchased. Earned through a documented record of Amit-guided builds.

**The progression:**
- **Provisional** — first Amit-guided build. Record begins.
- **Certified Builder** — 10+ builds with Amit, strong match rate between builder cert and buyer verification.
- **Master Certified Builder** — 50+ builds. Buyers seek them out specifically.

**Why this matters to buyers:**
A buyer scanning a QR code sees not just the machine's history but the builder's history. A Master Certified Builder with 50+ clean records is a fundamentally different purchase than an unknown seller. The certification advertises the builder. The builder's reputation drives buyers to their listings.

**The virtuous cycle:**
Amit helps the builder build better. Better builds earn better certifications. Better certifications attract better buyers. Better buyers leave better reviews. The builder's score goes up. More buyers come. This is what Amit does for the builder — not just a tool, a career accelerator.

**And for the buyer:** It is exactly the same companion. Same Amit. Same honest character. Same ongoing health record. Whether you're a builder putting components together or a buyer deciding whether to spend $800 — Amit is there for you. Not against the other party. For whoever needs it.

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
