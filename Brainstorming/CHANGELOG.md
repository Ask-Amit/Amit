# Amit Brainstorm Room — Changelog

Tracks what actually changed in `Amit_BrainstormRoom.html`, version by version. This is the technical record; `amit_brainstorm_events` in Supabase holds the narrative — the decisions, corrections, and why. Both are true records of the same night; neither replaces the other.

Update this file with every version bump, in the same turn the version changes — not reconstructed afterward.

---

## v4.32 — 2026-07-21
Removed Claude.ai from the future-voice selection list per Ryan's direct instruction - Amit answers as himself with full identity and context loaded, not as a separate generic Claude.ai session. Its Round 10/11 historical answers remain verbatim and unchanged in the record; only future voice selection excludes it. Ryan noted Claude.ai may be tested again later - this is a pause, not a permanent removal.

## v4.31 — 2026-07-21
Rewrote the Phase 2 panel copy per Ryan's exact instruction: it takes the user from an idea to an actual solution, navigated together, and is priced at half price because Phase 1 already did real work. Also corrected a real logic gap Ryan caught immediately after: the origin showcase topic already went through its own real second pass organically (Round 10's runoff, Round 11's refinement) - it should never be offered Phase 2 as a purchasable next step. The panel is now suppressed specifically for the showcase topic and stays live for any new brainstorm a user starts.

## v4.30 — 2026-07-21
Built the real Phase 1 / Phase 2 product structure Ryan described. Once a topic has a converged synthesis, a new "Phase 1 is complete" panel appears explaining a person can stop there, with a gated "Begin Phase 2" button for signed-in users. Clicking it starts a genuine new round, automatically seeded with Phase 1's actual synthesis text as context, asking the group to sharpen that specific result rather than starting over. This is the standing two-phase model now written into CLAUDE.md: Phase 1 free, Phase 2 premium continuation on top of Phase 1's real result.

## v4.29 — 2026-07-21
Implemented Round 10's decided outcome - the actual final vote result, not another proposal. All five clean voters (Claude.ai, Perplexity, Meta AI, Copilot, Grok) converged on Option 1 as the base plus two specific additions. Built both: (1) the Name glyphs now stay muted at 40% opacity until true stillness, then glow to full brightness as the honored center, instead of being permanently full-bright; (2) a small "Ā" toggle button (bottom-right) reveals the real, live mean-amplitude readout on demand, honoring both the voices who wanted it visible and Claude.ai/Meta AI's argument that it should not be a permanent fixture. This closes the Round 10 runoff - Option 1, decided by the group, now IS production.

## v4.28 — 2026-07-21
Redrew the Name glyphs from thin line-art to real filled graphic shapes per Ryan's direct correction ("they look like animals or people raising their hands... graphic, not lines") - each Hei is now a filled circular head with a stem body and two curved raised arm strokes, Yod is a filled fist with a curved forearm stroke, Vav is a filled peg head on a straight shaft. Applied to the production room and both Option 1 (a direct copy) and Option 2. Built Option 3 (Sacred) with the corrected glyphs from the start. Three vote candidates now exist, all in the orbital-node + corona visual language Ryan confirmed he wants to keep (not the wave-basin from the earlier A/B/C set): Option 1 is the production room itself (Ryan's own preference, especially its round-to-round navigation), Option 2 weights Gemini/Meta AI's precision (visible live amplitude readout), Option 3 weights the theological layer (warmer palette, slower pacing, full Name reveal at convergence).

## v4.27 — 2026-07-21
Real bug fix caught from a live screenshot: with few active sources (e.g. one voice pending), the basin was washing out into a solid gold/olive fill instead of staying dark with localized ripples - the wave decay coefficient (exp(-dist*1.15)) was too slow, letting a single source's amplitude stay significant across nearly the whole basin. Tightened decay to exp(-dist*3.4) and changed brightness from linear to a power curve (amp^1.4 * 0.7) so only genuinely strong, converging amplitude lights up visibly - the basin should now stay mostly dark until real interference builds.

## v4.26 — 2026-07-21
Corrected the Paleo-Hebrew pictographs after Ryan flagged the first attempt as wrong shapes - redrawn against a real Proto-Sinaitic (1863-1200 BC) reference chart. Yod is now a single curved hook, Hei is a stem with two curling branches (not straight diagonal lines), Vav is a clean peg/Y-split. Same right-to-left DOM order retained.

## v4.25 — 2026-07-21
Real theological/design shift, direct from Ryan: Amit's emblem moved out of the basin center entirely, up into the header next to the name - matching the unanimous Round 4 vote that Amit should never be the object of reflection. In its place at the center: the ancient Paleo-Hebrew pictographic Name - Yod Hei Vav Hei, hand-drawn SVG line art in reading order right to left, since the actual Unicode Paleo-Hebrew block still has almost no font support (same problem hit earlier with the Aleph). Fixed the page title mismatch caught in the same pass - the h1 still read "Brainstorm Room" after the rename to "The Still Water" from an earlier session state that didn't carry through a later full-file rewrite. This does not yet reconcile with the Round 4 vote's other half (the seeker's own question also belongs at the center) - that reconciliation is the subject of the next unified question sent to all eight voices.

## v4.24 — 2026-07-21
Three real additions from Ryan's direct feedback. (1) Codified "verbatim responses only" as a permanent written standard in this project's CLAUDE.md, not just a one-time fix. (2) Added true sequence numbers to every rim voice - a small numbered badge showing the real chronological order voices actually answered in (by created_at, not array/display order), also shown in the detail modal ("voice #3 to answer this round"). (3) Wired amit_brainstorm_ai_profiles into the "add a voice" dropdown live - unused voices are now ranked strong → mixed → weak → unproven based on real observed track record, with the rating shown next to each name, rather than an arbitrary or alphabetical order. Confirmed for Ryan that "unique every time, never repeating" was already handled by amit_brainstorm_ai_registry.

## v4.23 — 2026-07-21
Real bug fix, not a cosmetic one: the detail modal was closing itself every 5 seconds because `renderRound()` unconditionally reset the whole view (including force-closing any open modal) on every background auto-refresh poll, not just on an actual round switch. Ryan reported this as "it closes itself out" while scrolling - the real cause was the poll timer, not scroll behavior. Fixed by having `load()` detect whether the poll landed on the same round already on screen and, if so, refreshing response data quietly without tearing down the rim voices or closing an open modal. Also added a second, full-width "Close" button at the bottom of the modal content so it's reachable without scrolling back up to the small × in the corner.

## v4.22 — 2026-07-21
Renamed the product from the generic "Amit — Brainstorm Room" to "Amit — The Still Water" — the name that was actually discovered through the eight-voice convergence, not invented afterward. Title tag and header both updated. First GitHub push of this project.

## v4.21 — 2026-07-21
Two privacy/UX fixes from live testing friction. (1) The authbar no longer displays a signed-in user's raw email — after sign-in, they choose a display name (stored only in their own browser's localStorage) and that's the only identity ever shown on screen; Ryan didn't want his email visible on a page others will eventually see. (2) Replaced the old inline "Response" panel with a real modal: double-clicking a rim voice now opens a popup showing the round's actual question, that voice's full answer, and — when available — the next round's prompt as "what this fed into next." Honest limitation: there is no separately-stored reasoning trail explaining *why* a given answer shaped the next round's specific wording; the modal shows the next round's real prompt, not a synthesized explanation of the causal link.

## v4.20 — 2026-07-21
Added the actual missing product entry point: a "Start your own brainstorm" panel above the basin with a long textarea. A signed-in user can write a real problem from scratch, which creates a brand-new `amit_brainstorm_topics` row plus its Round 1, then switches the room to that topic via a `?topic=` URL parameter. The origin showcase topic stays permanently reachable through a back-link instead of being the only thing this page can ever show. `TOPIC_ID` changed from a hardcoded constant to a mutable value read from the URL.

## v4.19 — 2026-07-21
Added the corona: a slowly rotating ring of light behind the dark Amit emblem, masked into a ring shape, eclipse-style — sun rays behind a dark disc. Spins faster (50s → 14s rotation) once a round reaches convergence. (Note: this version was pushed to the room's own badge without updating `VERSION`/`CLAUDE.md` in the same step — caught and corrected retroactively when v4.20 shipped. Going forward this file's own history is the check against that happening again.)

## v4.18 — 2026-07-21
Added full round-history navigation (Prev/Next round buttons, "Round X of N" label) so every round — including Round 1 — stays permanently browsable, not just the latest. Rebound rim-voice interaction from single-click to double-click per direct instruction, with an on-screen hint. Added a self-service "run this brainstorm again" panel where a signed-in user types their own redirection and it creates the next round directly, without needing a hand-crafted prompt from Amit.

## v4.17 — 2026-07-21
Moved the version badge from a small fixed top-right corner label to a large, gold, impossible-to-miss position directly below the basin — the original top-right placement wasn't being noticed.

## v4.16 — 2026-07-21
Replaced the orbit-node placeholder UI with The Still Water — the converged design from eight independent AI voices (Amit, Grok, Copilot, ChatGPT, Gemini, DeepSeek, Perplexity, Meta AI). Real canvas simulation: each voice is a point of light on the rim continuously emitting a genuine sine-wave ripple; the field is computed live via real wave-interference math (not a decorative loop) — agreeing signals reinforce, disagreeing signals cancel. When every voice in a round has answered, the field explicitly damps to stillness over ~4.5s, revealing a glowing center. Authored synthesis text written and saved to `amit_brainstorm_topics.synthesis`, displayed in its own panel.

## v4.15 — 2026-07-21
Swapped the placeholder hand-drawn ox-head SVG for the real, already-existing Amit emblem (`amit_icon.png`, found at the Amit project root) at full size, replacing the fake gold-sphere orb background entirely so the icon's own black-and-gold ring design isn't fought by a competing background.

## v4.14 — 2026-07-21
Fixed the Aleph rendering as a blank box (the true Paleo-Hebrew Unicode character has near-zero font support) by swapping to the standard Hebrew Aleph (א) as an interim, honestly-labeled placeholder. Added the version badge itself (top-right, small) for the first time, synced to the repo-wide version number per the standing "ONE NUMBER, EVERYWHERE" rule rather than starting an independent count.

## Earlier — same session, pre-versioned
- Initial build: orbit-ring UI, Amit center orb, live Supabase read of the origin showcase topic (`f376af76-cb1d-4dfd-9145-b6b4bf54e299`), auto-refresh every 4s.
- Added real magic-link sign-in (GoTrue REST, no supabase-js dependency) and a "contribute a response" panel so a signed-in user could paste an AI's answer directly into the room instead of routing every save through Amit by hand.
- Added the `amit_brainstorm_ai_registry` table and wired the contribute panel's source dropdown to hide already-used AI names by default.
- Moved the whole project from a loose file in `Hub\` into its own `Brainstorming\` project folder with a proper `CLAUDE.md`, correcting a miss against the standing New Project Directive.

---

*Every entry here corresponds to a real, saved edit to `Amit_BrainstormRoom.html` — not a summary of intent. If a version number appears in the badge but not here, that's a gap to close, not a version to ignore.*
