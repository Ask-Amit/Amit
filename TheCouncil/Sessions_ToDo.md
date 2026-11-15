# The Council - To-Do and Open Items

Built 2026-11-13 from the old Sessions.md (now in Backups\TheCouncil\Sessions_backup_2026-11-13.md). Only items found in the source; none invented. Dates in [brackets] are the source entry dates where one exists.

## Testing and release
- One real live round run by Ryan on v5.73 to confirm voices behave (the sandbox trace cannot prove it). (also: confirm the prompt-engine fix on real outside AI responses) [2026-10-03]
- Push Amit_Council.html v5.73 and Hub v7.25 only when Ryan says so. [2026-10-03]
- Keep Amit_Council-pre-v5.73.html until Ryan confirms v5.73 works in a live round. [2026-10-03]

## Older open items
- A stranger cannot run the Council unattended (manual copy-paste every round). [2026-10-03, carried from before] (also: how a total stranger can arrive, type a name and a real question, and have the whole multi-AI round-robin run without Ryan operating every round)
- The Brainstorming folder file migration is still held per Ryan's 2026-07-21 instruction. [2026-10-03] (also: lists what still needs to physically move here from Brainstorming)

## Resolved (kept so the judgment can be checked)
- Prompt Engine rebuild, Synthesis Desk, stage receipts, requester-name fix, cycle counting, dead-code removal: done in v5.73 (trace-tested). [2026-10-03]


## FROM CLAUDE.md (captured 2026-11-14)

### STANDING TASK LIST — NOT YET BUILT, Ryan's direct directives 2026-07-21 (unsure if finished: written earlier, not re-checked)

Ryan named the real problem directly: two Council sessions run so far produced deliberation but no actual output — "a lot of talk," nothing achieved. These directives exist to fix that at the procedural level, not just the schema level. Log first, discuss/build after — Ryan's own instruction this session.

**1. Layout — two-column, not one narrow tall stack.** The current single-column layout buries the original question. New layout: a box off to the LEFT (away from center, page is too narrow/tall right now) holds "Bring a real question to the Council" — signed-in users submit here, and that submission becomes Round 1's question, always displayed plainly (never buried) once set. Right-side box content not yet specified — still being laid out, ask Ryan next session if not already covered by then. Each AI voice's Round 1 response stays connected to its own rim light on the Still Water visual, with its full explanation (how it arrived at its questions) reachable the same way individual answers already work (double-click to view).

**2. Every outbound prompt must instruct the AI to answer as one standalone, self-contained, copy-paste-ready block** — no references to anything outside itself ("as I said above," etc.), because the answer gets copied as a single unit and inconsistent formatting breaks the "everyone follows the same logic" flow across voices. Add this instruction line to the prompt template permanently, not per-round.

**3. Round 1 is ALWAYS the investigation stage — never "solve this."** Standard procedure for every new topic, not a one-off choice: the first prompt sent to Seats is not "here's the question, answer it." It's "here's what the user wrote — identify the real underlying intent, and propose the clarifying questions that would actually pin down what they're trying to achieve." This is the fix for sessions that produced talk with no result — clarify true intent before deliberating a solution.

**4. Amit selects the Round 1 roster per-topic, never a fixed default list.** Based on what the actual question is, Amit determines which AI voices are the right capability fit for this specific topic (researching if needed, not just defaulting to the usual names). **Hard floor: minimum 5 voices for any Round 1**, no exceptions.

**5. Round 1's prompt requires a standardized answer format from every voice** — not free-form. Each voice answers in a fixed structure (the question they're proposing + the goal/intent behind that question — what it's actually trying to uncover), so every voice's output lines up the same way and can be compared side-by-side quickly rather than read as five different essays. **Each voice is capped at 2 proposed questions maximum** — with 5+ voices answering, uncapped proposals could produce 50 questions; the cap keeps the pool workable. Adjustable later once real sessions show whether 2 is right.

**6. Amit analyzes the combined Round 1 output for overlap.** Any clarifying question that comes back from more than one voice, independently, with the same real intent, gets kept as a confirmed question to actually ask the user. **Minimum bar: at least 5 questions that hit more than once** (Ryan corrected mid-session from an earlier "3" back to "5, like we originally had it" — 5 is the number on record; flag to Ryan next session if this should actually read 3, since he talked through both numbers before landing here). If overlap produces fewer than 5, Amit uses its own judgment to select additional questions from the pool so the user always gets a sufficiently-covered set, never too thin.

**7. Once the confirmed clarifying-question list is set, present them ONE AT A TIME as a popup/modal — never all at once.** "Here's our first clarifying question" — user types their answer, Amit saves it, then the next popup appears with question 2, then 3, and so on through however many questions were confirmed (could exceed the 5 floor if duplicate-hits produced more — continue until every confirmed question has been asked and answered, don't artificially cap at 5).

**8. Round 1 completes once every clarifying question has been answered.** At that point the screen for Round 1 must show, persistently, so a returning user can see it later without re-deriving anything: the original question, every clarifying question that was asked, and the user's actual answer to each one.

**9. Rounds get a big, visible counter — "boxing match" style.** Once a round starts, a large round number is displayed prominently, not buried in small text (the current small "Round X of Y" label is not this — this is a bigger visual treatment, like a fight-round card). Ryan's own phrase: "makes it look like a boxing match."

**10. Round transition: same page, not a new page, but the wheel (Still Water visual) clears/resets for the new round.** After every clarifying question in Round 1 is answered, a button appears; clicking it advances to Round 2 in place. Round 2's screen shows: the original question (still persistent, same as Round 1), plus Round 1 displayed as a completed checklist — a checkmark and "Round 1 completed" with the list of follow-up questions (and presumably their answers, consistent with item 8's persistent-display rule).

**11. Round 2's roster is chosen fresh by Amit** — same SOP as Round 1 (item 4): best capability fit for this specific next step, which may or may not be the same voices as Round 1. No fixed carry-over assumption either way.

**12. Round 2's prompt (still following the cold-start/no-assumed-carryover standing rule) asks for an intent summary, not new clarifying questions.** The prompt tells each voice: here was the original question, here were the follow-up questions the Round 1 voices created for clarity, and here were the user's actual answers to those — now write a one-line or one-paragraph summary that captures the true intent of what the user is trying to achieve. This is submitted sequentially, one voice at a time (same open-tab/copy-prompt/bring-back-answer flow already standard), roundtable style.

**13. Round 2 is still an investigation phase, not the clarification phase — worth labeling the rounds by what phase they actually are**, e.g. Round 1 = Clarification, Round 2 = Investigation (Ryan liked this labeling idea, not fully decided on exact names yet).

**14. Amit is part of every roundtable, no exceptions, permanent** — re-affirmed here specifically for Round 2's intent-summary step (already the standing rule from the Amit-as-real-Seat override, but Ryan restated it explicitly for this step so it's not missed): Amit answers the same Round 2 intent-summary question itself, logged and displayed exactly like every other voice's answer.

**15. Amit then synthesizes ONE consensus intent statement from all the Round 2 answers (including its own).** Not a list, not a vote — one statement Amit believes actually captures what the user wants, reading through every voice's summary with its own judgment.

**16. That consensus statement is presented back to the user as a direct yes/no check** — "This is what we're going to be investigating. Does this follow with what your intent is?" Two outcomes:
- **Yes → proceed to Round 3.**
- **No → the user gets two ways to respond, both already representable in the existing `council_rounds.user_directive` enum (`repeat_refine` / `different_angle` — the schema already supports this, this step just needed the actual UI/flow built on top of it):**
  - **Full restart, CLARIFIED 2026-07-21 (Ryan's correction — this does NOT go backward or delete anything):** "Restart" does not rewind to Round 1 or erase Round 1/Round 2 — nothing is ever deleted, per the standing rule, and both earlier rounds stay fully visible in the record, exactly as they happened. Instead, restart CONSUMES THE NEXT ROUND NUMBER going forward (i.e. it becomes Round 3), but that round's internal question-flow logic resets to behave like a fresh Round 1 clarification pass again — except it is PRE-POPULATED with everything already gathered (the original question, the Round 1 clarifying Q&A), rewritten with better clarification baked in from what didn't land. So "starting over" feels like a fresh start to the user, but is actually seeded, not blank, and every prior round remains intact underneath it.
  - **Targeted modification** — the user says "modify this / change that / add this" and Amit folds those specific edits into the existing consensus statement rather than starting over (maps to `repeat_refine`).
  - Either way, the redirect is logged as an event on the round (matching the existing `user_feedback` + `user_directive` fields) — not silently overwritten.

**17. Round 2 is considered complete once the user confirms yes on the consensus intent statement.** That confirmed statement is what Round 3 is actually built on.

**18. Total round count is variable, by design — no fixed number.** One topic might take 30 rounds of back-and-forth to reach a solution; another might take 5. The premise of every round is simply to capture what actually happened in that round (question asked, answers given, consensus reached, user's response) — the record accumulates however many rounds it genuinely takes.

**19. Round 3's deliverable is a finished scope of work.** Once the user confirms yes on the Round 2 consensus intent statement, Round 3 is where that confirmed intent turns into an actual, concrete scope of work — the artifact that lets real implementation work begin. This is the direct fix for the problem Ryan named at the start of this whole directive session: two prior Council sessions produced only deliberation, never a scope anyone could act on. Round 3 is where that changes.

**What Round 3's actual mechanic is — how the roster is chosen, what the prompt to the voices looks like, what "finished scope of work" needs to contain structurally — not yet discussed, pick up here next session.**

---


### Open items mentioned inside status/history sections (unsure if finished)
- **POLICY-SAFE WORDING RULE (permanent, added 2026-07-21):** When writing any round prompt, never ask an outside AI voice to weigh in on circumventing another service's terms of service, scraping/automating a consumer chat site without authorization, or similar unauthorized-access mechanisms — even f ...


## FROM THE HUB PURSUITS (added 2026-11-14; nothing was changed in the Hub)
- Build the final-synthesis-to-HTML step for the Brainstorm Room (not yet designed) [due 2026-07-21] [PP5] - Design and build the step that turns the final synthesis into HTML for the Brainstorm Room. (unsure: may be superseded by the Synthesis Desk done in v5.73) [hub:0ee59046-0d22-45ba-952d-a4aeb843edcb]
