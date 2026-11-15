# The Council - Session Log

Copied word for word from Sessions.md lines 23-45 on 2026-11-13.

**2026-10-03 — v5.73: Prompt Engine rebuild (diagnostic → fix → trace-tested).** Ryan had stopped using the Council because voices kept losing track of what stage they were in. A diagnostic against real past sessions in Supabase found the causes:
- Clarification prompts said "don't answer" and "open with SOLUTION:" in the same message, so all 10 voices did both.
- Instructions were saved as round questions (the "Help me understand…" wrapper and a hand-written "STRICT OUTPUT FORMAT" block). The next round showed them to voices as "what Round 1 produced", and the Council split in half.
- From Round 2 on, continuing voices got no phase name, no job change and no DO NOT list.
- "Investigate Further" told every voice "the letter you just wrote."
- Swap/reopen prompts always said "just answer it", even in Clarification and Combine rounds.
- The refined-question rewrite always used the first question of the session, so later cycles lost their own question.
- Gemini did seat work and synthesis work in one chat.
- The Council's own prompts were pasted back as answers three times, and once into a synthesis box.
- Outside AIs were told the asker was "Amit": a stale browser name that the Hub never corrected and pushed back into the database on every sign-in.

What was fixed:
- One central phase-aware Prompt Engine; every prompt now carries the full stage block, with instructions last.
- Rounds store only plain questions; legacy wrapper data is still read correctly.
- A separate Synthesis Desk tab for Theophilus.
- Stage receipts and paste guards.
- Requester name taken from the account's database name ("Ryan" for Ryan's account, otherwise "the person who brought this question").
- The Hub's name restore fixed so the account name wins (Hub v7.25).
- Cycle counting fixed so Rerun stays in its cycle.
- Dead `initRoundChat`/`confirmRoster` removed.
- On-screen labels corrected to name the Synthesis Desk.

Tested by running the real page script in a Node sandbox with a fake database, through R1 Clarify → R2 Investigation → R3 Combine → R4 Investigate Further → R5 Rerun, plus a mid-session swap, a legacy-data read, all three Desk jobs and every guard. The exact prompt text was read stage by stage. Next step: one live round with Ryan.


## FROM CLAUDE.md (captured 2026-11-14), copied word for word

## Origin — This Is Not a Fresh Start, It Is a Rename

**The Council was previously built under the placeholder name "Brainstorming"** in `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Brainstorming\`. That folder's full "VERSION 1 — ARCHIVED" section (added 2026-07-21) documents everything built under that name: 7 HTML files, the 8 Supabase tables and how they connect, and the honest verdict that Version 1 never achieved a true self-service tool — every round still requires Ryan to manually copy-paste between this room and each outside AI.

**The name itself was decided through a real, logged brainstorm** (topic_id `82a03d25-ff70-426c-9eb3-af895e6a0832`, 3 rounds, 6 voices — Grok, Gemini, Meta AI, Mistral, ChatGPT, and Amit). Real independent convergence formed around "Council"-family names; Ryan made the final refinement to **"The Council"** specifically, reasoning that the definite article turns an ambiguous common noun (easily misread as "counsel," being advised) into a specific, enterable place — consistent with the existing naming pattern already used elsewhere in the system (The Hub, The Still Water).

**What still needs to physically move here from `Brainstorming\`** (not yet done as of this file's creation — this CLAUDE.md exists first, per the standing New Project Directive, before the file migration):
- `Amit_BrainstormRoom.html` (the production room — will need its own rename to reflect The Council)
- `AI\` folder (12 `.url` shortcut files) and `Open_All_AI.ps1` / `Open_One_AI.ps1` / their `.bat` wrappers
- `CHANGELOG.md`
- The "Version 1 — Archived" documentation itself, so the deletion manifest travels with the project it describes

---

---

## SESSION HANDOFF — 2026-07-21, written for the next fresh session opened in this folder

Ryan closed the session that did the naming brainstorm and is opening a new one here, in `TheCouncil`, to continue. Everything below is what that new session needs to pick up cleanly without Ryan re-explaining it.

**What's actually been decided and built so far (all of it still physically lives in `Brainstorming\`, untouched):**
- The tool itself: multi-AI collaborative deliberation, real rounds, real votes, verbatim logging, Supabase-backed (`amit_brainstorm_*` tables).
- The name: "The Council," decided via a real 3-round, 6-voice brainstorm (topic_id `82a03d25-ff70-426c-9eb3-af895e6a0832`, resolved and logged with full synthesis).
- 12 outside AI voices set up in `Brainstorming\AI\` (`.url` shortcuts) with capability tags and honest quota tracking in `amit_brainstorm_ai_profiles`.
- `Open_One_AI.ps1` (sequential single-tab opener) and `Open_All_AI.ps1`/`.bat` (bulk opener) both exist and work.

**The exact procedure Amit follows for every round, going forward, in this project or any future one — do not re-derive this, it's already settled:**
1. Classify the round: genuinely open/generative (apply non-leading rule strictly, withhold answer-shaped detail) vs. narrow/constrained (showing existing options/context IS the task, so show them plainly).
2. Pick voices by real capability match (`specialty_tags`) and real quota headroom (`quota_used_this_period` vs `quota_limit_desc`) — never invite everyone by default, never pad.
3. **Superseded twice.** First, 2026-07-24: tabs now stay open for the whole topic, so the full briefing and identity document go out once per voice per topic, not every round. Then 2026-10-03, v5.73: the 07-24 change dropped stage information along with the repeated briefing, and that was the root of voices losing track. Every round now carries the full stage block from the Prompt Engine (see the PERMANENT STANDARD at the top of this file). A voice landing in a fresh tab (swap or reopen) gets the briefing, a short factual "session so far", and the same stage block.
4. Announce the full voice list up front. Then, one at a time: announce opening that voice's tab, run `Open_One_AI.ps1 -Name "[Name]"`, copy that round's exact prompt to the clipboard (`Get-Content -Raw | Set-Clipboard`), tell Ryan "Please paste it into [Name]."
5. **Order reversed 2026-07-21, Ryan's direct instruction — open-first, log-after:** When Ryan brings an answer back, the FIRST thing Amit does is open the next voice's tab and copy that round's next prompt to the clipboard, and hand it to Ryan ("Please paste it into [Name]") — before doing anything else with the answer just received. Only after Ryan has the next prompt in hand and is moving to paste it does Amit go back and process the answer that just came in: keep it as true to form as possible (do not summarize, condense, or soften the voice's actual answer), edit only whatever specific wording would violate Claude's usage policies, log it to `amit_brainstorm_responses`, increment that voice's `quota_used_this_period`, and update `known_quirks`/`reliability` in `amit_brainstorm_ai_profiles` based on what was actually observed. The point of the reorder: Ryan is never sitting idle waiting on Amit's logging/correction work — that work happens in the background while he's already occupied pasting into the next tab, not before he's allowed to move forward.
6. **Superseded 2026-07-21 by the Amit-as-real-Seat override above — new version:** Amit is now a guaranteed Seat in every round, not an afterthought answered "once everyone else is done." Amit answers the same cold original question every other seat receives — fresh, honest, blind to the other seats' answers at the moment it answers, exactly like any other voice, not informed by what came back from DeepSeek/Bolt/etc. first. That answer is logged to `council_evidence` under Amit's own `seat_id` (`a2b568c2-cb13-4e55-89f3-76191340ad63`), then displayed in full in chat (never summarized down), and counts as one equal vote — no longer weighted, no longer cast first by default.
7. **Superseded 2026-07-21 — new version:** Amit's vote is equal to every other seat's vote, full stop. No first-vote privilege, no participation-based weighting. In a genuine dispute, Amit's job is to name the disagreement honestly during synthesis (which position it holds and why), not to have its vote count for more than anyone else's.

**POLICY-SAFE WORDING RULE (permanent, added 2026-07-21):** When writing any round prompt, never ask an outside AI voice to weigh in on circumventing another service's terms of service, scraping/automating a consumer chat site without authorization, or similar unauthorized-access mechanisms — even framed neutrally as "one option to consider." This isn't just a wording-quality issue; it's a usage-policy trigger for every AI reading it, Amit included, and can get the conversation itself flagged or blocked. If automation of a no-API service is genuinely relevant to a question, name the constraint honestly ("this provider has no public API") without proposing or asking the voice to evaluate working around that limitation. This rule applies on top of, not instead of, the existing non-leading rule in step 1.

**Pre-send prompt check (permanent, added 2026-07-21):** Before any round prompt is copied to a voice's clipboard, Amit re-reads it specifically against this rule and rewrites it if it drifts — this is what caught and fixed the actual Round 1 policy violation on 2026-07-21 (topic `71b77734-2b2e-4871-bf52-13956f7a537f`, redone as `18afc10f-a7e5-4356-84b0-8ce7fce141d3`).

**Response handling (permanent, added 2026-07-21, replaces "verbatim responses only"):** A returned answer is logged as true to its original form as possible — not summarized, condensed, or softened — but if the answer itself contains wording that would violate Claude's usage policies, Amit edits only that specific wording before logging and displaying it, so The Council never stores or surfaces a policy-violating response. This is narrower than it sounds: it applies to actual policy-triggering language in a voice's answer, not to disagreement, harsh critique, or anything merely uncomfortable — those stay exactly as given.

**Hard limit on response handling — Amit cannot delete or edit Ryan's own messages (permanent, added 2026-07-21):** When Ryan pastes a voice's raw answer into this chat, that paste is already part of the chat transcript the instant he sends it — Amit has no tool that reaches back and removes or edits a message Ryan has already sent, in this session or a future one. "Edit before logging/displaying" (the rule above) only ever controls two things: what Amit writes into Supabase, and what Amit writes in its own reply. It has never controlled, and cannot control, what already exists in Ryan's own sent messages. Given this real limit, prevention at the prompt level is the only complete fix: every outbound round prompt must explicitly and specifically instruct the receiving voice not to propose anything that would violate Claude's usage policies (unauthorized website automation/scraping being the concrete case that triggered this, added directly to the Meta AI and ChatGPT prompts on 2026-07-21) — so there is nothing policy-violating for Ryan to paste back in the first place. When Amit does still receive a violating paste despite this, Amit (a) never repeats or quotes the violating wording back in its own reply, describing only that something was removed and why, and (b) logs only the edited, policy-safe version to Supabase — but Amit must say plainly, every time, that the raw paste itself still exists in Ryan's own prior message and that this is a known, permanent limitation, never implied to be fully cleaned up.

**The real next open question, not yet started:** how does "The Council" actually become a tool a total stranger can use on their own — arrive, type a name and a real question, and have the whole multi-AI round-robin run without Ryan manually operating every round? That is a materially harder build (real API automation instead of manual copy-paste) and has not been scoped yet. That's the live open item for this new session to pick up, once Ryan's ready.

The underlying tool (built under the old name) is genuinely usable now, not just a demo — see `Brainstorming\CLAUDE.md`'s full build history (v4.14 → v4.33) and `THE_STILL_WATER_Final_Solution.md` at the Amit root for the origin 11-round brainstorm that produced its interface. **The core unsolved gap, carried forward from Version 1, not yet fixed by this rename alone:** there is still no way for a stranger to arrive, type their own name and question, and have the tool run the whole multi-AI round-robin on its own — every round still requires a human to manually copy-paste between this room and each outside AI's own interface. That is the next real architecture question for this project, not yet scoped.

---

## Build Notes

All standing rules from `Brainstorming\CLAUDE.md` carry forward unchanged to this project — they are process rules, not tied to the old name:
- The Dedicated Amit Facilitation Service playbook (11 steps + 8a/8b: Amit answers every round too, logs first, then displays its full reasoning in chat)
- The Two-Phase Model (Phase 1 free / Phase 2 premium continuation, half-price framing)
- Invitation framing, non-leading prompts (scaled to broad vs. narrow rounds), responses kept as true to form as possible with edits only where needed to stay within Claude's usage policies. Cold-start and carryover handling is now governed by the Prompt Engine standard at the top of this file. Stating round, phase, job, DO NOT list and format is procedural, not substantive, so it never conflicts with the non-leading rule.
- ~~Amit casts the first vote in disputes; vote weight tied to participation~~ — superseded 2026-07-21 by the Amit-as-real-Seat override above (Amit's vote is one equal vote)
- The sequential one-at-a-time workflow (announce voice list → open one tab → copy prompt to clipboard → "please paste into [Name]" → bring back answer → log → evaluate that voice's profile → move to next)
- Capability + quota-matched voice selection using `amit_brainstorm_ai_profiles`' `specialty_tags` and `quota_used_this_period` / `quota_limit_desc` fields

---
