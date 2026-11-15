# The Council - Design and tables

Read the section '## Tables' first when you only need the database tables. The other sections (if any) describe how the project is built; read them only when working on that part.

## Tables

# Tables used by this project

Tables used by this project (copied from CLAUDE.md 2026-11-14)

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
- `council_topics` — one row per real question the user brought (title, original_question verbatim, status, final_solution — filled only once the user confirms it; `onboarded_voices` JSONB array, added 2026-07-24, persists which voices have ever been briefed/had a tab auto-opened for this specific topic, so that stays correct across a page reload - in-memory tab tracking alone can't survive one). This is the parent every round links to; one table serves every round of every topic, whether a topic takes 2 rounds or 15.
- `council_seats` — persistent roles (id, user_id, role_name, role_prompt/charter, current_provider, memory_summary) that outlive any single AI provider filling them
- `council_rounds` — one row per round, `topic_id` + `round_number` (unique together). Carries the round-review loop directly: `presented_to_user_at`, `user_feedback` (verbatim), `user_directive` (`continue`|`repeat_refine`|`different_angle`|`confirmed_solution`).
- `council_evidence` — immutable evidence record per Seat per round (seat_id, round_id, body, source: manual_paste|api_call, provenance, witnessed_at, witnessed_by) — replaces the flat verbatim-response shape with the resolved evidence model
- `council_provider_keys` — BYOK vault, scoped `(user_id, provider, seat_id)` so a user can automate one Seat and leave another manual, per Meta AI's Round 2 catch
- No separate witnessing-toggle table — whether a round's evidence needs Ryan's (or any user's) explicit attestation before it can close is read live from the shared `user_profiles.trust_level`/`compass_reading` fields (see `Companion\Companion_Spec.md`), not a Council-specific setting. One trust score, same as every other Amit module.


**Tables this project does NOT touch:**
- accounting tables, companion tables, Hub's own hub_entries/amit_sessions/amit_daily/amit_encounters — those belong to other apps. `user_profiles` is read-only from this project's side — The Council reads trust_level/compass_reading, it never writes to that table.
