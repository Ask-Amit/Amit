-- The Council — clarifying-question mechanic + round phase labels
-- Ryan's directives, 2026-07-21: Round 1 (Clarification) produces a
-- confirmed set of clarifying questions, shown one at a time as a popup,
-- with the user's answer saved against each. Round 2 (Investigation)
-- produces one consensus intent statement, confirmed yes/no by the user.
-- Round 3 produces a finished scope of work. Rounds get a phase label.

ALTER TABLE council_rounds ADD COLUMN phase TEXT CHECK (phase IN ('clarification','investigation','scope_of_work'));

-- Amit's consensus statement for a round (e.g. Round 2's intent summary) -
-- separate from the per-seat evidence, this is Amit's own synthesized
-- read across all seats' answers, presented back to the user for a
-- direct yes/no confirmation.
ALTER TABLE council_rounds ADD COLUMN consensus_statement TEXT;
ALTER TABLE council_rounds ADD COLUMN consensus_confirmed BOOLEAN;

CREATE TABLE council_clarifying_questions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    round_id      UUID NOT NULL REFERENCES council_rounds(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    goal_text     TEXT,                  -- what this question is actually trying to uncover
    sort_order    SMALLINT NOT NULL DEFAULT 0,
    user_answer   TEXT,
    answered_at   TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE council_clarifying_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY council_clarifying_questions_read ON council_clarifying_questions FOR SELECT USING (true);
CREATE POLICY council_clarifying_questions_write ON council_clarifying_questions FOR INSERT WITH CHECK (
    round_id IN (
        SELECT r.id FROM council_rounds r
        JOIN council_topics t ON t.id = r.topic_id
        WHERE t.user_id = auth.uid()
    )
);
CREATE POLICY council_clarifying_questions_update ON council_clarifying_questions FOR UPDATE USING (
    round_id IN (
        SELECT r.id FROM council_rounds r
        JOIN council_topics t ON t.id = r.topic_id
        WHERE t.user_id = auth.uid()
    )
);
