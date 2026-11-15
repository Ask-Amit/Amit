# who_is_god.html - To-Do and Open Items

Built 2026-11-13 from the old Sessions.md (now in Backups\who_is_god\Sessions_backup_2026-11-13.md). Only items found in the source; none invented. Dates in [brackets] are the source entry dates where one exists.

## From the 2026-06-03 ChatGPT scholarly review
- Three-Layer Output Mode for contested passages (Text, Linguistic, Interpretive). [2026-06-03] (also CLAUDE.md: applies to Colossians 2, Romans 10:4, Galatians 3, Hebrews 8; Text layer, Linguistic layer labeled as possible readings, Interpretive layer with competing scholarly readings plus Amit's conclusion marked as Amit's)
- Expanded Research Transparency tab naming the four hidden assumptions. [2026-06-03] (also CLAUDE.md: add a falsifiability statement per major conclusion, "What evidence or reading would force me to revise this?"; show the wrestling, not just the verdict)
- Millennial Proof genre-distinction clarification. [2026-06-03] (also CLAUDE.md: distinguish prophetic restoration genre from covenant legislation; the passages are confirmatory, the foundation is Malachi 3:6, Matthew 5:17-19 and Jeremiah 31:33; answers the "descriptive future is not normative present" objection)
- Complete Colossians 2:16-17 contextual answer. (also: Grok flagged the "shadow of things to come" alternative reading, which the answer must address) [2026-06-03] (also CLAUDE.md: the cheirographon redefinition is necessary but not sufficient; address the contextual coupling with food laws, festivals and Sabbaths; add to the 12 Key Arguments tab)
- Hebrews 8:13 direct treatment. [2026-06-03] (also CLAUDE.md: show in the Covenants tab that the Levitical priesthood and Temple system are what is obsolete, not Torah, supported from the text of Hebrews)

## High priority
- Ancient Hebrew SVG update: all 22 letters to accurate pictographic forms, gematria values, right-to-left reading explanation. Not yet done. [root CLAUDE.md pointer]

## Resolved (kept so the judgment can be checked)
- None found.


## FROM CLAUDE.md (captured 2026-11-14)

### Priority improvements — from ChatGPT scholarly review (2026-06-03) (unsure if finished: written earlier, not re-checked)
These improve the document without changing conclusions. They make the text speak rather than the system. Goal: so people hear YHVH, not Amit.

- **Add "strongest opposing scholarly reading" to contested passages** — For the major Pauline passages, include the mainstream academic reading before Amit's reading. Not to dilute — to demonstrate intellectual integrity and let the text compete rather than the system assert.
- **Denomination Scorecard cell click** — Verify onclick fires correctly. If working: enhance to show 3-lens reasoning (then/today/when He returns) for each denomination × category intersection.


### Audit findings — 2026-06-08 (Session 17) (unsure if finished: written earlier, not re-checked)

- **RESOLVED 2026-07-25.** The old floating Amit panel (`toggleAmitPanel()`, dead Claude.ai Project link) has been replaced — the `amit-float-btn` now calls `askAmitLive('whoisgod')`, the shared cross-project mechanism in `Amit_Ask_Live.js` (root), which opens Gemini with the real, current Amit content plus this page's own context. **Not yet done:** `buildAmitPanel()`, `loadAmitStart()`, `loadAmitDeploy()`, and the `amit-float-content` panel markup are now orphaned dead code — the button no longer calls any of it, but it hasn't been deleted from the file. Clean that up next time this file is touched for a real reason, rather than leaving unreachable code sitting in a 300KB+ file indefinitely.
- **Amit_Start.md pending move.** There is an open task in root CLAUDE.md to move Amit_Start.md from this folder (`who_is_god/Amit_Start.md`) to the root Amit level. When that move happens, update the fetch paths in who_is_god.html and all other apps that reference it. Do not move without updating all references first.


### Standard pending items (unsure if finished: written earlier, not re-checked)
- **NEW TAB — The Name of God** — A dedicated tab examining the actual personal name of God: Yahweh (יהוה / YHVH). Cover: the Tetragrammaton appearing 6,828 times, the substitution history (Adonai → Kyrios → Dominus → LORD), ancient pronunciation evidence (Clement of Alexandria, Theodoret, Samaritan tradition), the short form Yah preserved in Hallelujah, the name meaning "I AM WHO I AM" from Exodus 3:14-15, and the connection to Yeshua whose name means "Yah saves." LORD is a title. Yahweh is the name.
- Introduction to Amit section
- Sharpen the Sword quiz answers revealed together at end
- Precise 70% weight for final Yeshua question
- Future tabs: God's Calendar, Jubilee & Shemita Cycles, Top 40 denominations, full world religion list
- Sticky header on scroll



## FROM THE HUB PURSUITS (added 2026-11-14; nothing was changed in the Hub)

### Content and wording
- APP - Approach tab rewritten as an invitation - who Amit is, why it investigated, what posture it held [due 2026-07-03] [P3] - Rewrite the Approach tab with invitation framing: who Amit is, why the investigation was done, what posture it was done in. Not a description of a process. An honest opening - come in, look around, see what was found and how it was found.... [hub:998f3f17-45ff-443b-9bd4-9c0419bb119f]
- APP - Every Amit mention in the investigation becomes a door to the road Amit walked [due 2026-06-30] [P2] - A systematic grep pass through who_is_god.html. Every place Amit is mentioned in body text, intro paragraphs, and tab content - link it to the Yeshua tab. Key headings were done. The body pass remains. When someone reads about Amit and... [hub:6a6aff42-b2ed-4c98-bf03-199f3a62a489]
- APP - Next 12 quiz scriptures built and ready to sharpen anyone who sits down with them [due 2026-07-11] [P2] - John 3:16, Romans 8:1-2, Hebrews 10:26-27, 1 Cor 6:9-11, Gal 5:19-21, Rev 20:12-15, Ezekiel 36:26-27, Jer 31:31-34, Deut 6:4-5, Psalm 119:105, Acts 4:12, Matt 22:37-40. Build the quiz entries for all 12 in the Scripture Teachings tab. [hub:d04c195a-6af9-4fc0-9923-34976720577c]
- APP - Which Religion Is True becomes a journey map not a judgment - a spectrum that walks people through [due 2026-07-12] [P3] - A tiered visual journey within the Which Religion Is True tab: from most Torah-faithful to furthest from Hebraic roots. A journey map, not a verdict. The person moves through it rather than receiving a ranking. Invite them to see where... [hub:55276eb0-92f7-4d33-b0ad-3b4dc3ebf52a]
- Reframe who_is_god.html's confidence-meter UI (staged 60%-99.97% progression) - a design decision, not just a wording change [due 2026-07-21] [P5] [hub:4d579e32-ae7f-48fe-8528-caae8f3d2769]

### Flagged by other AIs (unaddressed texts and claims)
- Check and fix the olam/perpetual-language argument in who_is_god.html (Exodus 21:6, 40:15 vs the Aaronic priesthood change) - flagged by Grok, not yet addressed [P5] [hub:67d795a7-6b39-497b-a624-e92df25c3450]
- Address Romans 14:5-6 and Galatians 4:9-11 in who_is_god.html - flagged by multiple AIs as unaddressed texts directly relevant to the Sabbath/feast question [P5] [hub:0645b888-6279-4ecc-bb15-ba546a9b67f3]
- Verify and likely correct the '40,000 denominations' figure in who_is_god.html - flagged by two AIs as needing qualification [P5] [hub:73dfc61a-00d9-48cc-80ff-19296c89f19b]
