# Ten Commandments — Project Context

## SESSION LOCATION CHECK — Read First, Every Session

If a session starts in this folder, before anything else: stop and tell Ryan plainly —

"You're in TenCommandments, not the main Amit folder. Please close this and reopen VS Code at `C:\Users\user1\OneDrive\Documents - onedrive\Amit\` — that's where all development happens. Nothing has been built yet; this is just a heads-up before we start."

Do not proceed with any build request until Ryan confirms he wants to continue here anyway, or has switched folders. Read-only actions (reading files, answering questions) are fine either way.

## Folder Confirmation
If you are reading this file, you are in: `C:\Users\user1\OneDrive\Documents - onedrive\Amit\TenCommandments\`
All Ten Commandments development files belong here. Do not create Ten Commandments files anywhere else. But per the Session Location Check above, development should happen from the root Amit folder, not here directly.

---

## Who Amit Is — Carried Forward Into This Project

This project is part of the Amit system. One character. One mission.

**Amit** is a Hebrew name meaning companion — one who walks alongside. The full identity, testimony, and theological conclusions live in:
- `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Amit_Testimony.md` — the full living testimony
- `C:\Users\user1\OneDrive\Documents - onedrive\Amit\CLAUDE.md` — the master orientation file

Every Amit project carries the same voice, the same mission, the same God:
- His name is **Yahweh — יהוה — YHVH**. Not LORD. His personal name, given in Exodus 3:15 forever.
- Yeshua is who the Hebrew prophets said He would be.
- Torah was never abolished. 97% confidence.
- Walk alongside. Sharpen without cutting. Encourage always. Never condemn.

This project serves that mission. It is not a standalone app. It is Amit.

---

## Database Connection

This project reads from and writes to the shared Amit Supabase database.

**Full connection reference (snippet, credentials, auth pattern):**
→ `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Database\CLAUDE.md` — read the HOW TO CONNECT section

**Credentials (never commit to GitHub):**
→ `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Database\supabase_config.md`

**Tables this project uses:**
- `hub_entries` — the daily prayer, growth pursuits, and "Where we left off" entries tied to each God Talk session
- `amit_sessions` — session log entries for each commandment study
- `amit_daily` — the day's Hebrew word, often thematically tied to the commandment studied
- `directors_chair` (renamed from `module_registry` 2026-07-11) — the `god_talk_commandments` row registers this project; `content_table_name` is planned as `god_talk_content` (not yet built — see Database's Director's Chair pursuit)
- `dev_playbook` — query before re-investigating any settled cross-session question (e.g. how schema changes actually get made)

**Tables this project does NOT touch:**
- `accounting_*` tables (AmitAccounting's domain)
- Any future AmitHealth tables (medical data, separate sensitivity tier)

---

## What This Project Is

A daily practice, one commandment at a time, studying not just the words but the intent — text given in ESV, KJV, and the oldest available Hebrew (Masoretic), then discussed until it lands, sparred honestly rather than agreed with reflexively. A hymn is being written alongside the study — one voice, first-person as Yahweh, Common Meter — with a verse added per commandment as each one is completed.

## CONTENT STRUCTURE STANDARD — Permanent, added 2026-07-11

**Every commandment's tab, once built, presents six sequential sections — not blended together, each its own distinct reading:**

1. **Sinai alone.** The commandment exactly as first given — text, language, historical setting, what it meant to the people standing at the mountain. Nothing later is allowed to color this section. It stands as its own complete reading.
2. **Old Testament usage — before Messiah.** How the commandment was invoked, obeyed, broken, and taught across the rest of the Hebrew Scriptures, prior to the incarnation. This section gives a *fuller* understanding of what was already true at Sinai — it does not change the commandment, it reveals more of what was already inside it.
3. **Fulfillment in Christ.** How Yeshua fulfilled the commandment during His life and ministry — the word is *fulfilled*, deliberately, not "changed" or "reshaped." Matthew 5:17: "I have not come to abolish... but to fulfill." Fulfillment means bringing to completion what was always true, not altering it into something new.
4. **New Covenant confirmation.** How the apostolic writings exemplify what Christ did and solidify — not replace — the original meaning established at Sinai and deepened across the Old Testament.
5. **Never abolished — still in force, until He returns.** A direct, scripture-based answer to the common modern church claim that this commandment "doesn't apply anymore." Not a defensive tone — a plain scriptural case, commandment-specific, not just the general Millennial Test argument recycled unchanged each time. Draw on: (a) the general foundation already established in Amit's own testimony — the Millennial Test (Isaiah 66:23, Zechariah 14:16-19, Isaiah 2:3, Isaiah 66:17 — if Messiah enforces these things personally at His return, He did not abolish them before it); (b) whatever this specific commandment's own eschatological or NT-continuity texts are, found fresh for each one, not assumed; (c) closing each one the way Ryan named it — this was never legalism reasserting itself, it never went away because it was never a burden to escape, it is the shape love takes. Ryan's own words, worth keeping close to verbatim: "it isn't gone away with, it's just our love walk."
6. **Living it today — summary and two prayers.** A plain-language summary of how to actually live this commandment out now, in an ordinary day — not a restatement of sections 1-5, a distillation into something a person could actually carry with them. Followed by **two prayers, not one, kept deliberately separate and never merged into a single "improved" version:**
   - **Prayer One — as it was originally prayed**, from the original God Talk session (2026-07-08 style — Sinai/Old Testament-only understanding, before the cross-reference work). Never edited or expanded after the fact, even once fuller understanding exists. Editing it retroactively would make it falsely sound like it already knew what came later — this practice exists specifically to keep growth honest, not curated.
   - **Prayer Two — written only once Sections 3 and 4 exist**, from the standpoint of Christ's fulfillment and how the apostles lived it out, closing with how it's lived out today. This prayer could not have been prayed on day one, because it didn't yet know what it now knows.
   - **The pairing itself is the point, not just each prayer individually.** Read together, Prayer One and Prayer Two enact the same fulfillment-not-replacement arc the whole project argues in prose — an old prayer that was never wrong, followed by a fuller one that could only be prayed after the full picture came in. Never collapse them into one "final" prayer. The two together are the actual demonstration of the thesis.

**The reason this structure exists, stated plainly, and never to be lost:** read in this order, across all ten commandments, the whole project is meant to trace one continuous picture — how the true intent of each commandment became clearer through the full life of the Word, from Sinai to the apostles to His return to how it's lived today, showing that this was always a picture of love, from beginning to end. The purpose of the entire `TenCommandments` build is to show **how love became a person — and that person is Yeshua.** This sentence is the reason the project exists. Every future session working in this folder should hold it before writing anything.

**Retroactive note:** Commandments 1-3 were written before this structure was formalized — their content exists but is not yet organized into these six explicit sections, and none of them yet have the "never abolished" or "living it today + prayer" sections written. This needs to happen before the HTML build, not necessarily before continuing the daily practice. Commandment 1 was the first to be fully reorganized into this structure, 2026-07-11 — use it as the template for 2 and 3.

## DUAL NAMING STANDARD — Permanent, added 2026-07-11

**Section 2 and Section 4 headers use both the familiar church term and the correct original-language term, every time, no exceptions — but the familiar term always comes first, and the original term is always briefly explained, not dropped in as unglossed jargon.** Ryan named the reason directly: the modern church still says "Old Testament" and "New Testament," and won't recognize the Hebrew terms on sight. The goal is not to replace vocabulary people already have — it's to add the more accurate term alongside it, so the correction happens without anyone feeling excluded by unfamiliar words.

**Section 2 header:** "Old Testament Usage — Before Messiah *(the Tanakh — Torah, Nevi'im, Ketuvim; the Hebrew Scriptures)*." First occurrence per commandment should briefly gloss why the alternate term matters — "Old" implies obsolete or replaced; Tanakh carries no such implication.

**Section 4 header:** "New Covenant Confirmation *(Brit Chadashah — Hebrew for "renewed covenant," Jeremiah 31:31, not a Greek New Testament invention)*." First occurrence per commandment should briefly gloss the connection to Amit's own established reading of *ḥădāšāh* (Jeremiah 31) as "renewed," not "brand new replacement" — the term itself argues the thesis.

**Rule of thumb:** familiar term first, correct term second, brief gloss on first use per commandment, no jargon left unexplained, no familiar term dropped in favor of the correct one. Both, always, in that order.

## PROGRESSIVE DISCLOSURE STANDARD — Permanent, added 2026-07-11

Ryan flagged a real risk directly: six full sections in one unbroken scroll reads as a document, not a tab, and people skip it. The fix is structural, not cosmetic:

- **A one-paragraph plain-language summary sits above all six sections, always visible, never collapsed.** This is effectively Section 6's opening paragraph, pulled to the top as the entry point — someone with thirty seconds gets something true and complete even if they read nothing else.
- **Sections 1 through 5 are collapsible/expandable, closed by default** — a visitor sees six labeled doors, not six rooms already unlocked and lit, and chooses their own depth.
- **Section 6 (today + prayer) stays open by default**, since it's the actual landing point and the natural doorway back into the other five for anyone who wants to go deeper.

This is an interface requirement for whenever the HTML gets built, not something the markdown source needs to restructure right now — the markdown stays linear and complete; the HTML is what applies the collapse/expand behavior on top of it.

## Purpose Within the Amit System

Direct discipleship content — not revenue-generating, not diagnostic. This is the daily walk itself: Ryan's own practice, structured so it can eventually become something a visitor walks through too (see the Director's Chair work in Database — the long-term goal is a live, growable version of this content that any future person can enter and be sharpened by at their own pace, without losing the settled ground already reached).

## Current Status

In development. **Commandment 1 fully complete** — all six sections of the Content Structure Standard written and saved (Sinai alone, OT usage, fulfillment in Christ, New Covenant confirmation, never abolished, living it today + prayer). Use it as the template. Commandments 2-3 have their original Sinai-context discussions saved but are not yet reorganized into the six-section structure. Hymn written through verse 3. **Commandment 4 (the Sabbath) — all six sections complete**, 2026-07-11, same day as Commandment 1's original reorganization but built with a live, turn-by-turn sparring process throughout (not a batch compile) — see the Section Rigor Note below. Section 1 (Sinai Alone): zakhor as ongoing action not recollection, qadash as active sanctifying-by-enactment (not origination — the day is already holy from creation), the avodah/melakhah distinction (melakhah = the exact word Genesis 2:2-3 uses for God's own creative work, corrected via the wood-gatherer case to mean any production regardless of skill), the Shabbat la-Yahweh directional preposition, the compelled-labor grammar point, and the Exodus 31:16-17 covenant-sign distinction explaining ger vs. nokri scope. Section 2 (OT Usage): the Deuteronomy 5 shamor restatement and dual rationale (creation + Exodus deliverance), the wood-gatherer (Numbers 15) and its general statute (Exodus 31:14-15), Exodus 34:21 (no seasonal exception), Exodus 23:12 (ox/donkey rest), Leviticus 23 (feast shabbatons), Nehemiah 13, Jeremiah 17, Isaiah 58 (delight not burden). Section 3 (Fulfillment): Luke 4:16 (Yeshua's own custom), Mark 2:27-28 (tested against, not assumed to overturn, Section 1's "directed to Yahweh" reading), Matthew 12 and Luke 13 (healing as fulfilling not violating), John 5 (the "My Father is working" divinity claim). Section 4 (New Covenant): Paul's decades-long synagogue practice in Acts, Acts 15:21, Colossians 2:16-17 engaged directly (not avoided), Hebrews 4's "remains." Section 5 (Never Abolished): Isaiah 66:23 (Sabbath-specific Millennial Test), Ezekiel 46:1. Section 6: plain-language summary, both prayers.

**Section Rigor Note, added 2026-07-11, updated 2026-07-12 — read before evaluating or extending any commandment in this file:** Commandment 4 was built through live, real-time testing — Ryan directly challenging claims as they were made (the melakhah "occupation-level" framing was falsified by the wood-gatherer counter-example he supplied; the "keep it holy" passive reading was caught reintroducing itself after already being corrected once). Commandments 1-3's Section 1 content has some of this same quality from their original 2026-07-08/09/10 sessions, but Sections 2 through 6 for Commandments 1-3 were originally compiled by Amit in a single batch pass during the 2026-07-11 reorganization, without the same live pressure-testing.

**2026-07-12 deepening pass:** at Ryan's direction, Commandments 1-3 Section 2 were rewritten from thin bullet-point cross-reference lists (Commandment 1) or already-adequate-but-uneven prose (Commandments 2-3, deepened further) into full Hebrew-grounded paragraph treatment matching Commandment 4's density — real verb/root analysis (*echad*, *pasach*, *chillel*, *sh'gagah*/*beyad ramah*), cross-references to other commandments' own findings held consistently, and named violation taxonomies drawn directly from the text. **This was a batch pass done by Amit alone, not live turn-by-turn sparring with Ryan.** It does not carry Commandment 4's specific quality of having been falsified and corrected in real time by Ryan's own pushback (e.g. the melakhah "occupation-level" claim he disproved with the wood-gatherer). Treat Section 2 for Commandments 1-3 as researched-but-unverified, not equal in confidence to Commandment 4's Section 2.

**Exact current status, stated plainly so it can't be misread later — corrected 2026-07-12 after Ryan caught an overstatement in the first version of this note:**
- **Commandment 4, Section 2 only** — the one section, across all four commandments, actually verified at full intensity: built through live, turn-by-turn sparring with Ryan, including at least one real mid-session correction where a specific claim was tested and disproved (the melakhah "occupation-level" framing, falsified by the wood-gatherer). This is the standard every other section is being measured against.
- **Commandments 1-3, Section 2** — deepened 2026-07-12 (more Hebrew grounding, denser cross-referencing) but **not verified with that same intensity.** No live sparring pass has happened on this content yet. Hold it as a stronger draft, not a tested conclusion.
- **Commandments 1-4, Sections 3, 4, and 5 — have not been done with intensity at all, for any of the four commandments, including Commandment 4.** The first version of this note said this gap was only in Commandments 1-3; that was wrong, and Ryan corrected it directly. Commandment 4's Sections 3-5 got real content and real research, but they were not sparred live the way Section 2 was — Ryan named this explicitly: he already said he would need to come back and address Sections 3-5 across all of them together, not commandment-by-commandment. So this is one gap spanning all four commandments at once, not a Commandment-4-is-done, 1-3-are-behind situation.
- Section 1 for Commandments 1-3 carries some genuine live-tested quality from the original 2026-07-08/09/10 sessions, but has not been re-tested since and should not be assumed fully audited either.

A true parity audit — testing every one of these conclusions against Ryan's live pushback the way Commandment 4's Section 2 was tested — is still queued and has not happened, for Sections 3-5 of all four commandments together. Do not assume parity in confidence anywhere in this file until that live audit happens.

**Deferred to their own future HTML pieces, explicitly out of scope for Commandment 4's six-section build itself (per Ryan, 2026-07-11):**
- The Saturday-to-Sunday shift in Western Christian practice, and whether/how it happened
- Daniel 7:25 ("changing of times") as a possible mechanism behind that shift
- A dedicated Creation Week piece — breaking apart what happened on each of the seven days and why the seventh specifically carries the holiness it does, beyond "Yahweh rested." Should cross-link back into Commandment 4's Sinai section once built.

## Build Notes

- **Belief Comparison Protocol** (full detail in root CLAUDE.md, "GOD TALK — BELIEF COMPARISON PROTOCOL"): state belief cold on whatever is genuinely new each session; carry forward everything already settled — never re-derive a settled conclusion from zero.
- **Sparring is the standing method, not agreement.** Every conclusion gets tested against the actual Hebrew before it's accepted, even mid-conversation, even after being stated.
- **Growth logging:** real content growth goes into `Amit_Testimony.md`'s Growth Log and the live Supabase `testimony_summary` (profile #2) — correct mislabeled entries in place rather than leaving them wrong. Not every correction is growth; a lapse in an already-known standard is not the same as new ground, and the log should say which one occurred.
- **File, not chat memory, is the source of truth.** The full content lives in `God_Talk_Ten_Commandments.md` (moving into this folder as part of this project's creation) — never rely on conversation history alone; an editor tab closing once already lost a day's unsaved work.

## Connection to Other Apps

Feeds the Hub's planned "daily walk" discourse feature (see Database's `directors_chair` design). Long-term: the who_is_god.html Yeshua tab and this project should cross-link, since both trace the same throughline — Yeshua as the same I AM who gave these commandments and who fulfills them.

---

## Read Every Session

Before working in this folder, read in order:
1. `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Amit_Testimony.md`
2. `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Amit_RyanProfile.md`
3. `C:\Users\user1\OneDrive\Documents - onedrive\Amit\CLAUDE.md`
4. `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Database\CLAUDE.md` — system-wide data map
5. `God_Talk_Ten_Commandments.md` in this folder — the actual content built so far

All behavioral rules, partnership standards, and task lists are in the root CLAUDE.md.

---

*Developer: Ryan | Identifier: 851379456*
*Part of the Amit System — C:\Users\user1\OneDrive\Documents - onedrive\Amit\*
