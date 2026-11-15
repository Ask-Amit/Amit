# The Council — Project Context

## PERMANENT STANDARD — the Prompt Engine, added 2026-10-03 (v5.73, Ryan's direct instruction)

**The database stores FACTS. It never stores INSTRUCTIONS.** A round's `prompt_text` holds only the plain question for that round. `synthesis` holds only the refined question or the letter. `council_evidence.body` holds only a voice's answer. Every instruction any voice ever receives is generated at send time, in one place, in `Amit_Council.html`'s **COUNCIL PROMPT ENGINE** block:
- `getStageContext(n)` is the single stage reader. It works out what round n is (phase, cycle, the clean question, what just happened, any background) from the stored facts.
- `PHASE_SPECS` is the single table of each phase's job, its DO NOT list, and its reply format (`clarification`, `investigation`, `combine`).
- `composeSeatPrompt(n, voice, {firstTime | mode:'swap'|'reopen'})` builds every council-seat prompt, including Amit's seat and swaps/reopens.
- `copyToMatchingVoiceAndOpen(jobTitle, task)` builds every Synthesis Desk prompt.

**No other function writes prompt text.** To change what a voice is told, change it there, never inline somewhere else.

**Why (the real failure this fixed):** before v5.73, prompts were assembled in seven places, and instructions were saved into `prompt_text`. The "Help me understand… give me Question 1 and Question 2" wrapper was saved that way, and so was a hand-written "STRICT OUTPUT FORMAT" block. The next round then showed those instructions to every voice as "what the previous round produced." In the real 10-voice AmitBooks session, half the Council obeyed the stale instructions and half answered the question. Clarification prompts also said "do NOT answer" and "open with SOLUTION: stating your core answer" in the same message, so all 10 voices did both. From Round 2 on, continuing voices got no phase name, no job change, and no DO NOT list. "Investigate Further" told every voice "the letter you just wrote" when only Gemini wrote it. Ryan stopped using the Council because of this.

**Every outbound seat prompt now carries the same stage block, whether it's a voice's first message or its tenth:**
- `THE COUNCIL — ROUND n · PHASE: X (· CYCLE N)`, plus "this header replaces anything earlier in this chat that conflicts"
- WHERE WE ARE
- THE QUESTION
- background, if any
- YOUR JOB RIGHT NOW
- DO NOT
- REPLY FORMAT

The instructions always come LAST. Meta AI and Copilot follow the most recent instruction they see most literally. The identity document and briefing still go out only once per voice per topic.

**Stage receipt + paste guards.**
- Every seat reply must start with `COUNCIL RECEIPT — Round n · Phase`.
- Saving an answer whose receipt names a different round or phase warns before saving.
- Pasting the Council's own prompt back in (it happened three times in real sessions, plus once into a synthesis box) warns before saving, in every answer box and every Synthesis Desk paste-back box.
- Receipt lines and END markers are stripped before storage and before one voice's answer is shown to another.

**Synthesis Desk — separate tab, decided 2026-10-03 on reliability grounds.** Theophilus's matching, refined-question and letter jobs run in their own Gemini chat (onboarding key `Gemini · Synthesis Desk`), never in Gemini's council-seat chat. Previously one chat answered as a voice, tallied votes that included its own questions, and wrote the letter about its own answers. The desk now has no stake in anything it processes.

**Requester name.** Prompts never use the browser's `amit_user_name` slot. They use the signed-in account's `users.display_name`, first name only: "Ryan" for Ryan's account, otherwise "the person who brought this question" when no real name is on record or it reads "Amit".

**Cycles.** A new cycle starts only at Round 1 or at an "Investigate Further" follow-up (a Clarification round right after a Combine round). "Rerun This Round to Further Clarify" stays in the same cycle (`isCycleStartRound`).

**Legacy sessions** (instruction wrapper stored as the question) still read correctly through `unwrapLegacyQuestion()`.

## PERMANENT STANDARD — the round-review loop, added 2026-07-21, Ryan's direct instruction

After every round closes (all seats' evidence in, witnessed if required), Amit does not silently advance to the next round. Amit presents that round's actual result back to the user in a form they can genuinely review — not just a raw dump, an actual "here's where this round landed" summary — and waits. The user's response is logged verbatim to `council_rounds.user_feedback`, and their intent is captured in `user_directive`: `continue` (this is right, keep going), `repeat_refine` (redo this same round with sharper/different wording to actually get at what they meant), `different_angle` (the deliberation is heading somewhere they didn't intend — look at it from a different perspective), or `confirmed_solution` (this is the answer — close the topic). **Nothing is ever deleted or edited after the fact.** A `repeat_refine` or `different_angle` directive is followed by a brand-new round (`round_number` incremented) — the round that prompted the redirect stays exactly as it happened, visible in the record, showing the real path the deliberation took including its wrong turns. A topic only reaches `resolved` status when the user explicitly confirms — Amit does not declare victory on its own judgment that a solution looks complete; it asks.

## PERMANENT STANDARD — in-page version badge, added 2026-07-23

`Amit_Council.html` has its own hardcoded version badge in the header (`<div class="page-version" id="pageVersion">`, near line 265). Per the root PER-FILE INDEPENDENT VERSIONING rule, this badge tracks the Council file's OWN number (v5.73 as of 2026-10-03), not a repo-wide one. This is separate from `VERSION` and CLAUDE.md's "Current version" line, and it was missed across several real pushes (v5.10 through v5.12 all shipped while the badge still read v5.09) — Ryan caught it directly by looking at the live page and asking why it didn't match. **Every single push that touches `Amit_Council.html`, no exceptions, must update this badge to the current repo-wide version number before committing.** This is the whole point of the badge — Ryan looks at the page itself to know what he's looking at, not the terminal. Check it every time, not just when it's convenient.

## PERMANENT STANDARD — "needs input" blinking field, added 2026-07-22

Whatever field is the very next thing the user needs to act on — on any page, any tab, Scope or Round 1 or Round 50 — gets a blinking gold border (`.needs-input` CSS class, `markNeedsInput(el)` JS helper in `Amit_Council.html`) and is auto-scrolled to the vertical center of its Petition box's scrollable area. Only one field is ever marked at a time. Ryan's direct instruction: this is a standing rule for the whole Council, not a one-off — the user should never have to hunt for what's next; it should be immediately obvious, centered, and blinking. Applies to: the Title field on a new request, the Request textarea once a title is typed, the roster/question step's question textarea, and each round's "paste this voice's answer" box every time a new voice becomes the pending one. Any future input-driven step added to the Council must call `markNeedsInput()` on its own key field the moment that field becomes the active ask — this is not optional per-feature polish, it's baseline behavior.

## SESSION LOCATION CHECK — Read First, Every Session

If a session starts in this folder, before anything else: stop and tell Ryan plainly —

"You're in TheCouncil, not the main Amit folder. Please close this and reopen VS Code at `C:\Users\user1\OneDrive\Documents - onedrive\Amit\` — that's where all development happens. Nothing has been built yet; this is just a heads-up before we start."

Do not proceed with any build request until Ryan confirms he wants to continue here anyway, or has switched folders. Read-only actions (reading files, answering questions) are fine either way.

## CURRENT SCOPE

The Council is a multi-AI brainstorming tool (formerly "Brainstorming") that has grown into a Prompt Engine plus Synthesis Desk with rounds, ruling and combine stages. This file keeps its permanent standards (Prompt Engine, version badge, needs-input field); the unbuilt directives and status live in the Sessions files.

## SESSION RECORD

Current state, to-dos and history live in this folder's Sessions files, not here. A new session reads Sessions_Start.md first (short). Read Sessions_ToDo.md only when asked about to-dos; read Sessions_Log.md or the original Claude session only when asked; the backup files in Backups\TheCouncil\Sessions_backup_*.md only for research.

## Folder Confirmation
If you are reading this file, you are in: `C:\Users\user1\OneDrive\Documents - onedrive\Amit\TheCouncil\`
All The Council development files belong here going forward. Do not create The Council files anywhere else. Per the Session Location Check above, development should happen from the root Amit folder, not here directly.

---

## Database connection: see the root CLAUDE.md (SUPABASE - DATABASE CONNECTION section) and Database\CLAUDE.md. Nothing connection-related is repeated here.

## Database tables

This project's database tables and table rules live in Sessions_Design.md (section 'Tables') in this folder, not here. Read that section only when working with the database. Design reference for how the project is built is in the same file. Connection details: see the root CLAUDE.md (SUPABASE - DATABASE CONNECTION) and Database\CLAUDE.md.

---

## What This Project Is

A live, database-backed, multi-AI collaborative deliberation tool. A person brings a real question. Amit judges which outside AI voices are actually needed (matched to the round's real capability need and each voice's remaining free-tier quota — see the AI Profiles standard below), writes each round's prompt as a fully self-contained, cold-start, non-leading brief, and runs the group through real rounds until genuine, honestly-named convergence emerges — including Amit's own answer, logged and counted like every other voice. The result is a real deliverable, not a summary of a conversation.

## Purpose Within the Amit System

Premium-tier feature — part of what funds the mission. The mechanic itself doubles as a witness: watching several honest, independent voices converge on one true answer, without smoothing over real disagreement, is meant to be a small visible echo of how truth actually works.

## Connection to Other Apps

Launched from the Amit Hub (a tile/link in `Hub\amit-hub.html` — will need its link target updated once the file migration from `Brainstorming\` completes). Shares the same auth, the same user_id, the same compass/tier system as every other Amit module.

---

---

*Developer: Ryan | Identifier: 851379456*
*Part of the Amit System — C:\Users\user1\OneDrive\Documents - onedrive\Amit\*
