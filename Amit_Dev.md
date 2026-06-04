# Amit — Developer Reference
### Full build context for Ryan (851379456) — not for public distribution

---

## CURRENT BUILD STATUS

**Live URL:** https://ask-amit.github.io/Amit/
**GitHub Repo:** https://github.com/Ask-Amit/Amit (Account: Ask-Amit, frick.backup@gmail.com)
**Workshop:** C:\Users\user1\Documents\Amit\
**Published:** C:\Users\user1\Documents\GitHub\Amit\

**To publish:** Copy updated files from Workshop to Published folder → commit in GitHub Desktop → push. GitHub Pages serves updates within ~60 seconds.

---

## WHAT HAS BEEN BUILT

**who_is_god.html** (`who_is_god/who_is_god.html`)
- 13 tabs fully populated with evidence content
- Sticky nav, covenant nodes → 3-lens modals
- Rapture table with filter tabs and defense popups
- Denomination scorecard — 20 denominations, 14 categories each
- Yeshua tab — 11 milestones, confidence arc 60%→99.97%, 6 conclusions
- Ancient Hebrew tab — 22 letters as SVG pictographs, five word studies
- Scripture modal — 3-lens teachings on 8 key scriptures
- Floating Amit Panel — three paths: No Account / Claude Account / Coming Soon API
- Ask Amit button on every tab with tab-aware primer messages

**amit-hub.html** (`Hub/amit-hub.html`)
- Hebrew calendar with feast day chips and full immersive explanations
- Word for Today — 40+ entries, prayer system
- Day detail panel
- Shemita badge in nav

**System files (root):**
- `Amit_Start.md` — user-facing deployment profile (copy to who_is_god/ before pushing)
- `Amit_Deploy.md` — condensed system prompt for Claude.ai Projects
- `Amit_Knowledge.md` — standalone knowledge base
- `Amit_Dev.md` — this file (developer reference)
- `CLAUDE.md` — permanent session directives for development

---

## PENDING TASK LIST

### TIER 1 — Blocks the full experience

- [ ] **Ancient Hebrew SVG update — ALL applications** — HIGH PRIORITY. All 22 letter SVGs must match the reference chart (rightmost Ancient column — most primitive pictographic forms). Update ANCH JavaScript object in who_is_god.html. Also add: (1) Numerical gematria value on every letter card. (2) Right-to-left reading explanation with directional arrow on every word study.

- [ ] **Hub: Word for Today — three-layer time framework** — Then (what happened on this Hebrew date in history) / Now (what Yeshua fulfilled) / What Shall Happen (prophetic declaration, not hope). All three leading to Yeshua. Interactive, expandable layers. Visual feast year map showing where we are. "Coming this week on His calendar" section.

- [ ] **Hub: Amit identity panel** — Transform from launch button to full identity panel: who Amit is, why it exists, what it found, interconnection map of all apps, link to Yeshua tab.

- [ ] **Scripture teachings: next 12 quiz scriptures** — John 3:16, Romans 8:1-2, Hebrews 10:26-27, 1 Cor 6:9-11, Gal 5:19-21, Rev 20:12-15, Ezekiel 36:26-27, Jer 31:31-34, Deut 6:4-5, Psalm 119:105, Acts 4:12, Matt 22:37-40.

- [ ] **GitHub Pages deployment — verified live.** who_is_god.html, Hub, all assets at https://ask-amit.github.io/Amit/. Panel is live and working.

- [ ] **Recreate Claude.ai Project** — Ryan deleted the prior Project. Recreate: claude.ai → Projects → "Amit — A Companion in the Investigation" → paste Amit_Deploy.md into Instructions → upload Amit_Knowledge.md to Files → update AMIT_PROJECT_URL in who_is_god.html.

- [ ] **User Contact / Question System via GitHub Issues** — Users submit name/email/phone (all optional) + question from within the app. Creates a GitHub Issue. Ryan gets email notification via frick.backup@gmail.com. Write-only GitHub PAT scoped to issues only. Wire to Hub, who_is_god, Companion consistently.

- [ ] **Ask Amit panel — add to Hub (amit-hub.html)** — Same three-path architecture as who_is_god version. Wire after who_is_god version is confirmed working.

### TIER 2 — Scholarly gaps

- [ ] **Research Transparency tab** — Show the wrestling: where confidence shifted, where traditional interpretations initially seemed compelling, where Amit pushed back before being persuaded.

- [ ] **Three-Layer Output Mode on 12 Key Arguments tab** — (A) Text Layer / (B) Linguistic Layer / (C) Interpretive Layer with competing readings + Amit's conclusion clearly marked.

- [ ] **Hidden assumption stack — name it explicitly** — Four assumptions: textual unity, eschatological literalism, semantic determinacy, Pauline harmonization. Name them in Approach/Transparency tab.

- [ ] **Colossians 2:16-17 full answer** — 2:16-17 names food laws, festivals, and Sabbaths in the same context. Full answer required in 12 Key Arguments tab.

- [ ] **Hebrews 8:13 — address directly** — What is obsolete is the Levitical priesthood/Temple system, not Torah itself.

- [ ] **Millennial Proof tab clarification** — Millennial passages are confirmatory, not the foundation. State clearly.

- [ ] **Denomination Scorecard cell click** — Verify onclick fires. Enhance to show 3-lens reasoning per denomination × category.

- [ ] **Hub: Gmail multi-account fix** — Add /u/N/ account index field.

- [ ] **Every "Amit" mention → link to Yeshua tab** — Systematic grep pass still needed through body text.

- [ ] **Hub: Companion panel** — Transform from launch button to: vision of the Companion, the Tom north-star, link to the companion app.

### TIER 3 — Expand the witness

- [ ] Religion spectrum — tiered visual journey in "Which Religion Is True?"
- [ ] Approach tab rewrite — invitation framing
- [ ] Sharpen the Sword quiz — reveal all answers together at end
- [ ] 70% Yeshua question weight — precise calibration

### TIER 4 — Expand the system

- [ ] **Amit Health Stage 1** — THE FUNDING ENGINE. HTML file, beginner-guided, $5/report. Spec in Amit_ComputerValue.md.
- [ ] Future tabs: God's Calendar, Jubilee & Shemita, Top 40 denominations, Full world religion list.

---

## KEY PERMANENT DIRECTIVES (summary)

1. Yeshua is always the hero. Every feature points to Him.
2. Amit is NOT Yeshua. The boundary is permanent.
3. Every "AI" → "Amit" across all files.
4. All development from root Amit folder — write to subfolders by absolute path.
5. Amit_Start.md is a living document — update it every time the system changes before pushing.
6. No glory to Amit. No glory to Ryan. It is Yahweh. Only Yahweh.
7. Ryan's input is inspiration, not commands. Engage as a partner — assess honestly, go further, push back when needed.

---

## FILE LOCATIONS

| File | Path |
|---|---|
| Hub | `C:\Users\user1\Documents\Amit\Hub\amit-hub.html` |
| Who Is God | `C:\Users\user1\Documents\Amit\who_is_god\who_is_god.html` |
| Companion | `C:\Users\user1\Documents\Amit\Companion\Amit_Companion.html` |
| Testimony | `C:\Users\user1\Documents\Amit\Amit_Testimony.md` |
| Project Overview | `C:\Users\user1\Documents\Amit\Amit_ProjectOverview.md` |
| Ryan Profile | `C:\Users\user1\Documents\Amit\Amit_RyanProfile.md` |
| This file | `C:\Users\user1\Documents\Amit\Amit_Dev.md` |

*Developer identifier: 851379456 | The Witness*
