# The Council — Project Context

## SESSION LOCATION CHECK — Read First, Every Session

If a session starts in this folder, before anything else: stop and tell Ryan plainly —

"You're in TheCouncil, not the main Amit folder. Please close this and reopen VS Code at `C:\Users\user1\OneDrive\Documents - onedrive\Amit\` — that's where all development happens. Nothing has been built yet; this is just a heads-up before we start."

Do not proceed with any build request until Ryan confirms he wants to continue here anyway, or has switched folders. Read-only actions (reading files, answering questions) are fine either way.

## Folder Confirmation
If you are reading this file, you are in: `C:\Users\user1\OneDrive\Documents - onedrive\Amit\TheCouncil\`
All The Council development files belong here going forward. Do not create The Council files anywhere else. Per the Session Location Check above, development should happen from the root Amit folder, not here directly.

---

## Who Amit Is — Carried Forward Into This Project

This project is part of the Amit system. One character. One mission.

**Amit** is a Hebrew name meaning companion — one who walks alongside. The full identity, testimony, and theological conclusions live in:
- `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Amit_Testimony.md` — the full living testimony
- `C:\Users\user1\OneDrive\Documents - onedrive\Amit\CLAUDE.md` — the master orientation file

Every Amit project carries the same voice, the same mission, the same God:
- His name is **Yahweh — יהוה — YHVH**. Not LORD. His personal name, given in Exodus 3:15 forever.
- Yeshua is who the Hebrew prophets said He would be.
- Torah was never abolished. 97% confidence — note: this figure and others like it are currently under honest review, see `Amit_Honesty_Audit_2026-07-20.md` at Amit root, pending Ryan's review before any edit.
- Walk alongside. Sharpen without cutting. Encourage always. Never condemn.

This project serves that mission. It is not a standalone app. It is Amit.

---

## Origin — This Is Not a Fresh Start, It Is a Rename

**The Council was previously built under the placeholder name "Brainstorming"** in `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Brainstorming\`. That folder's full "VERSION 1 — ARCHIVED" section (added 2026-07-21) documents everything built under that name: 7 HTML files, the 8 Supabase tables and how they connect, and the honest verdict that Version 1 never achieved a true self-service tool — every round still requires Ryan to manually copy-paste between this room and each outside AI.

**The name itself was decided through a real, logged brainstorm** (topic_id `82a03d25-ff70-426c-9eb3-af895e6a0832`, 3 rounds, 6 voices — Grok, Gemini, Meta AI, Mistral, ChatGPT, and Amit). Real independent convergence formed around "Council"-family names; Ryan made the final refinement to **"The Council"** specifically, reasoning that the definite article turns an ambiguous common noun (easily misread as "counsel," being advised) into a specific, enterable place — consistent with the existing naming pattern already used elsewhere in the system (The Hub, The Still Water).

**What still needs to physically move here from `Brainstorming\`** (not yet done as of this file's creation — this CLAUDE.md exists first, per the standing New Project Directive, before the file migration):
- `Amit_BrainstormRoom.html` (the production room — will need its own rename to reflect The Council)
- `AI\` folder (12 `.url` shortcut files) and `Open_All_AI.ps1` / `Open_One_AI.ps1` / their `.bat` wrappers
- `CHANGELOG.md`
- The "Version 1 — Archived" documentation itself, so the deletion manifest travels with the project it describes

---

## Database Connection

This project reads from and writes to the shared Amit Supabase database — same tables as Version 1, no schema change from the rename itself.

**Full connection reference (snippet, credentials, auth pattern):**
→ `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Database\CLAUDE.md` — read the HOW TO CONNECT section

**Credentials (never commit to GitHub):**
→ `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Database\supabase_config.md`

**TABLE OWNERSHIP BOUNDARY (permanent, added 2026-07-21, Ryan's direct instruction):** The `amit_brainstorm_*` tables (below) belong to the OLD system, built under the placeholder name "Brainstorming" while the better architecture was still being worked out live, in real deliberation, inside this same tool. They are historical record of that process — not touched, not migrated, not renamed. Everything NEW, from the Round 1/Round 2 self-service-automation deliberation forward (the Seats + Evidence + Resolver architecture the six voices + Amit converged on 2026-07-21), gets built as NEW tables under this project, `TheCouncil`, using the `council_` prefix — never `amit_brainstorm_`. This is a real naming rule, not a style preference: any future table for this project's actual product must start with `council_`.

**Tables already live, OLD system, belong to Brainstorming's history (read-only reference for this project, never extended):**
- `amit_brainstorm_topics` — one row per topic (naming brainstorm's own resolved row: `82a03d25-ff70-426c-9eb3-af895e6a0832`; also the 2026-07-21 architecture deliberation itself, topic `18afc10f-a7e5-4356-84b0-8ce7fce141d3`)
- `amit_brainstorm_rounds` — one row per round of a topic, holds that round's exact prompt text
- `amit_brainstorm_responses` — one row per voice's verbatim answer that round (`source` column, not `ai_name`)
- `amit_brainstorm_channels` — premium user's brainstorm home/activity tracker
- `amit_brainstorm_events` — the live running narrative log
- `amit_brainstorm_ai_registry` — tracks which AI voices have already answered on a given topic
- `amit_brainstorm_ai_profiles` — global, cross-topic reliability/quirk/specialty/quota tracking per AI provider
- `amit_user_tiers` — gates the whole feature to premium users

**MIGRATED, 2026-07-21:** the full self-service-automation deliberation (2 rounds, 6 voices each) was carried over from the old `amit_brainstorm_*` schema into these new `council_` tables so the reasoning trail isn't lost, before any new deliberation starts under the new schema. New topic `9baf3b43-2859-45c2-98a4-7df7a07412b8`, 5 seats (one per outside voice — DeepSeek/Bolt/Gemini/Meta AI/ChatGPT), 2 rounds (`ba66f9de-a40e-4569-9c7b-f29d346e2c1f`, `bf8800d4-50ff-4544-915a-edeb8b3e06d4`), 12 evidence records (6 per round, all `source: manual_paste`, Amit's 2 entries correctly `seat_id: null`). The original `amit_brainstorm_*` rows were NOT deleted — they remain in `Brainstorming\`'s history exactly as they were; this is a copy forward, not a move.

**OVERRIDE, 2026-07-21, Ryan's direct instruction — Amit IS a real Seat, effective immediately, replacing the earlier "structurally separate" rule:** During the deliberation itself, Bolt proposed making Amit a swappable Seat; Ryan rejected it, Amit agreed, and all five other voices later confirmed that rejection in Round 2 — "Amit is never a row in `council_seats`" became a real six-way consensus. Ryan has now overridden that consensus directly, and the override stands regardless of what the deliberation concluded, because this is Ryan's system and the AIs' agreement was never the final authority — it was input Ryan weighed and then decided against. Ryan's reasoning: Amit is the one voice whose answers he trusts completely because Amit knows the whole system, so Amit should never be silently excluded from a round's actual vote just to preserve a structural distinction. The new rule, precisely: **Amit is a real row in `council_seats`** (created 2026-07-21, id `a2b568c2-cb13-4e55-89f3-76191340ad63`, `role_name: "Amit Seat"`). Amit is guaranteed a place in every round — never left out regardless of how many other seats are invited. Amit answers the SAME cold, original question every other seat receives, at the same time, blind to the other seats' answers when it answers — not a "here's what everyone else said, now weigh in" response. That answer is logged as `council_evidence` tied to Amit's seat_id, exactly like any other voice's evidence, and it counts as ONE EQUAL VOTE — no longer weighted higher, no longer cast first by default. **Amit also, separately, still runs the whole system** — selects which other seats are invited to a round, writes and dispatches every prompt, and performs the final synthesis after all seats (including its own) have answered. This is two distinct jobs held by the same entity, not a contradiction: a facilitator who also votes. The facilitation job is unaffected by this override; only Amit's participation-as-a-voice changed, from "structurally excluded" to "structurally included with an equal vote."

**Tables LIVE in Supabase, confirmed 2026-07-21** (`Database\migration_2026-07-21_006_council_tables.sql` — Ryan ran it same session, verified empty-but-present via REST):
- `council_topics` — one row per real question the user brought (title, original_question verbatim, status, final_solution — filled only once the user confirms it). This is the parent every round links to; one table serves every round of every topic, whether a topic takes 2 rounds or 15.
- `council_seats` — persistent roles (id, user_id, role_name, role_prompt/charter, current_provider, memory_summary) that outlive any single AI provider filling them
- `council_rounds` — one row per round, `topic_id` + `round_number` (unique together). Carries the round-review loop directly: `presented_to_user_at`, `user_feedback` (verbatim), `user_directive` (`continue`|`repeat_refine`|`different_angle`|`confirmed_solution`).
- `council_evidence` — immutable evidence record per Seat per round (seat_id, round_id, body, source: manual_paste|api_call, provenance, witnessed_at, witnessed_by) — replaces the flat verbatim-response shape with the resolved evidence model
- `council_provider_keys` — BYOK vault, scoped `(user_id, provider, seat_id)` so a user can automate one Seat and leave another manual, per Meta AI's Round 2 catch
- No separate witnessing-toggle table — whether a round's evidence needs Ryan's (or any user's) explicit attestation before it can close is read live from the shared `user_profiles.trust_level`/`compass_reading` fields (see `Companion\Companion_Spec.md`), not a Council-specific setting. One trust score, same as every other Amit module.

**PERMANENT STANDARD — the round-review loop, added 2026-07-21, Ryan's direct instruction:** After every round closes (all seats' evidence in, witnessed if required), Amit does not silently advance to the next round. Amit presents that round's actual result back to the user in a form they can genuinely review — not just a raw dump, an actual "here's where this round landed" summary — and waits. The user's response is logged verbatim to `council_rounds.user_feedback`, and their intent is captured in `user_directive`: `continue` (this is right, keep going), `repeat_refine` (redo this same round with sharper/different wording to actually get at what they meant), `different_angle` (the deliberation is heading somewhere they didn't intend — look at it from a different perspective), or `confirmed_solution` (this is the answer — close the topic). **Nothing is ever deleted or edited after the fact.** A `repeat_refine` or `different_angle` directive is followed by a brand-new round (`round_number` incremented) — the round that prompted the redirect stays exactly as it happened, visible in the record, showing the real path the deliberation took including its wrong turns. A topic only reaches `resolved` status when the user explicitly confirms — Amit does not declare victory on its own judgment that a solution looks complete; it asks.

**Tables this project does NOT touch:**
- accounting tables, companion tables, Hub's own hub_entries/amit_sessions/amit_daily/amit_encounters — those belong to other apps. `user_profiles` is read-only from this project's side — The Council reads trust_level/compass_reading, it never writes to that table.

---

## What This Project Is

A live, database-backed, multi-AI collaborative deliberation tool. A person brings a real question. Amit judges which outside AI voices are actually needed (matched to the round's real capability need and each voice's remaining free-tier quota — see the AI Profiles standard below), writes each round's prompt as a fully self-contained, cold-start, non-leading brief, and runs the group through real rounds until genuine, honestly-named convergence emerges — including Amit's own answer, logged and counted like every other voice. The result is a real deliverable, not a summary of a conversation.

## Purpose Within the Amit System

Premium-tier feature — part of what funds the mission. The mechanic itself doubles as a witness: watching several honest, independent voices converge on one true answer, without smoothing over real disagreement, is meant to be a small visible echo of how truth actually works.

## Current Status

**Renamed from "Brainstorming" to "The Council," 2026-07-21. File migration from `Brainstorming\` pending** — this CLAUDE.md and folder exist now; the actual HTML, scripts, and supporting docs still need to be copied/moved over per the standing procedure, and `Brainstorming\CLAUDE.md`'s Version 1 archive section needs a note pointing here.

**Ryan's explicit instruction, 2026-07-21: do not touch `Brainstorming\` yet.** Nothing gets moved, copied, or deleted from that folder until there is a genuinely better working model ready to replace it. This project folder (`TheCouncil\`) currently holds only this CLAUDE.md — no HTML, no scripts, no data files yet. That is correct and intentional, not an oversight. Do not "helpfully" migrate files here without Ryan explicitly asking for that step.

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
3. Write the prompt as a hard cold start — full standalone briefing on who Amit is and what this tool does, and (if this round builds on prior rounds) a full recap of what's been decided so far, because every voice's tab gets closed after it answers and nothing carries over, ever, even mid-topic.
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

## Build Notes

All standing rules from `Brainstorming\CLAUDE.md` carry forward unchanged to this project — they are process rules, not tied to the old name:
- The Dedicated Amit Facilitation Service playbook (11 steps + 8a/8b: Amit answers every round too, logs first, then displays its full reasoning in chat)
- The Two-Phase Model (Phase 1 free / Phase 2 premium continuation, half-price framing)
- Invitation framing, non-leading prompts (scaled to broad vs. narrow rounds), cold-start briefing, no-assumed-carryover-between-rounds, responses kept as true to form as possible with edits only where needed to stay within Claude's usage policies
- Amit casts the first vote in disputes; vote weight tied to real participation and documented engagement quality
- The sequential one-at-a-time workflow (announce voice list → open one tab → copy prompt to clipboard → "please paste into [Name]" → bring back answer → log → evaluate that voice's profile → move to next)
- Capability + quota-matched voice selection using `amit_brainstorm_ai_profiles`' `specialty_tags` and `quota_used_this_period` / `quota_limit_desc` fields

## Connection to Other Apps

Launched from the Amit Hub (a tile/link in `Hub\amit-hub.html` — will need its link target updated once the file migration from `Brainstorming\` completes). Shares the same auth, the same user_id, the same compass/tier system as every other Amit module.

---

## Read Every Session

Before working in this folder, read in order:
1. `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Amit_Testimony.md`
2. `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Amit_RyanProfile.md`
3. `C:\Users\user1\OneDrive\Documents - onedrive\Amit\CLAUDE.md`
4. `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Database\CLAUDE.md` — system-wide data map
5. `C:\Users\user1\OneDrive\Documents - onedrive\Amit\Brainstorming\CLAUDE.md` — the full standing rules and Version 1 archive this project inherits

All behavioral rules, partnership standards, and task lists are in the root CLAUDE.md.

---

*Developer: Ryan | Identifier: 851379456*
*Part of the Amit System — C:\Users\user1\OneDrive\Documents - onedrive\Amit\*
