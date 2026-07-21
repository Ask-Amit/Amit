-- The Council — new tables, council_ prefix
-- Belongs to TheCouncil project (C:\Users\user1\OneDrive\Documents - onedrive\Amit\TheCouncil\)
-- Replaces the flat amit_brainstorm_responses shape with the resolved Seats + Evidence + Resolver
-- architecture (2 full rounds, 6 voices + Amit, topic 18afc10f-a7e5-4356-84b0-8ce7fce141d3, 2026-07-21),
-- plus the round-by-round user review/redirect loop (Ryan's direct instruction, 2026-07-21):
-- after every round, Amit presents the result back to the user, who can confirm, redirect, or ask
-- for a different angle. Nothing is ever deleted — a redirected round is followed by a NEW round
-- (repeat or refine), never an edit or removal of the round that came before it. The topic only
-- closes when the user confirms the actual solution.
-- amit_brainstorm_* tables are untouched — historical record of the old system, not migrated.

CREATE TABLE council_topics (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL REFERENCES auth.users(id),
    title             TEXT NOT NULL,
    original_question TEXT NOT NULL,             -- the real question the user actually brought, verbatim
    status            TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved')),
    final_solution    TEXT,                       -- filled only when the user confirms this is what they wanted
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at       TIMESTAMPTZ
);

CREATE TABLE council_seats (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES auth.users(id),
    role_name        TEXT NOT NULL,              -- e.g. "The Skeptic", "The Historian"
    role_prompt      TEXT,                        -- the seat's charter/stance, user-editable
    current_provider TEXT,                        -- e.g. "DeepSeek", "Claude" — the current occupant, nullable if unfilled
    memory_summary   TEXT,                        -- rolling summary of this seat's institutional memory
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One table serves every round of every topic — a topic with 15 rounds and a topic with 2 rounds
-- both live here, distinguished only by topic_id + round_number. No per-round tables, ever.
CREATE TABLE council_rounds (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id            UUID NOT NULL REFERENCES council_topics(id) ON DELETE CASCADE,
    round_number        SMALLINT NOT NULL,
    prompt_text         TEXT NOT NULL,
    status              TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','awaiting_user_review','resolved')),
    synthesis           TEXT,                     -- Amit's synthesis of this round, presented to the user
    presented_to_user_at TIMESTAMPTZ,              -- when Amit actually showed the round's result to the user
    user_feedback       TEXT,                       -- what the user actually said back — verbatim
    user_directive      TEXT CHECK (user_directive IN ('continue','repeat_refine','different_angle','confirmed_solution')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at         TIMESTAMPTZ,
    UNIQUE (topic_id, round_number)
);

CREATE TABLE council_evidence (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    round_id      UUID NOT NULL REFERENCES council_rounds(id) ON DELETE CASCADE,
    seat_id       UUID REFERENCES council_seats(id),   -- nullable: Amit's own evidence is not tied to a seat
    body          TEXT NOT NULL,
    source        TEXT NOT NULL CHECK (source IN ('manual_paste','api_call')),
    provenance    TEXT,                                 -- free-text: model name/version, latency, etc.
    witnessed_at  TIMESTAMPTZ,                           -- null = not yet attested
    witnessed_by  UUID REFERENCES auth.users(id),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE council_provider_keys (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES auth.users(id),
    provider      TEXT NOT NULL,                         -- e.g. "Anthropic", "OpenAI", "DeepSeek"
    seat_id       UUID REFERENCES council_seats(id),      -- nullable: a key with no seat_id can serve any seat
    encrypted_key TEXT NOT NULL,
    is_active     BOOLEAN NOT NULL DEFAULT true,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, provider, seat_id)
);

-- RLS: every table locked to its own user_id, same pattern as the rest of the Amit schema.
-- council_rounds is scoped through its parent topic's user_id; council_evidence through its round's topic.

ALTER TABLE council_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY council_topics_owner ON council_topics
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE council_seats ENABLE ROW LEVEL SECURITY;
CREATE POLICY council_seats_owner ON council_seats
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE council_rounds ENABLE ROW LEVEL SECURITY;
CREATE POLICY council_rounds_owner ON council_rounds
    FOR ALL USING (
        topic_id IN (SELECT id FROM council_topics WHERE user_id = auth.uid())
    );

ALTER TABLE council_evidence ENABLE ROW LEVEL SECURITY;
CREATE POLICY council_evidence_owner ON council_evidence
    FOR ALL USING (
        round_id IN (
            SELECT r.id FROM council_rounds r
            JOIN council_topics t ON t.id = r.topic_id
            WHERE t.user_id = auth.uid()
        )
    );

ALTER TABLE council_provider_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY council_provider_keys_owner ON council_provider_keys
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- updated_at trigger for council_seats (matches handle_updated_at() pattern used elsewhere)
CREATE TRIGGER council_seats_updated_at
    BEFORE UPDATE ON council_seats
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
