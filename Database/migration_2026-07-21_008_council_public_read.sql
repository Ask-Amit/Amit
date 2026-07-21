-- The Council — fix RLS: public read, owner-only write
-- Bug found 2026-07-21 while wiring Amit_Council.html: the original policies
-- (FOR ALL USING auth.uid()=user_id) blocked even anonymous SELECT, so a
-- visitor who hasn't signed in couldn't see the showcase topic at all —
-- the old amit_brainstorm_topics table allows public read (confirmed via
-- direct query with the anon key), and council_ tables need the same
-- pattern: anyone can read, only the owner can write.

DROP POLICY council_topics_owner ON council_topics;
CREATE POLICY council_topics_read ON council_topics FOR SELECT USING (true);
CREATE POLICY council_topics_write ON council_topics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY council_topics_update ON council_topics FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY council_topics_delete ON council_topics FOR DELETE USING (auth.uid() = user_id);

DROP POLICY council_seats_owner ON council_seats;
CREATE POLICY council_seats_read ON council_seats FOR SELECT USING (true);
CREATE POLICY council_seats_write ON council_seats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY council_seats_update ON council_seats FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY council_seats_delete ON council_seats FOR DELETE USING (auth.uid() = user_id);

DROP POLICY council_rounds_owner ON council_rounds;
CREATE POLICY council_rounds_read ON council_rounds FOR SELECT USING (true);
CREATE POLICY council_rounds_write ON council_rounds FOR INSERT WITH CHECK (
    topic_id IN (SELECT id FROM council_topics WHERE user_id = auth.uid())
);
CREATE POLICY council_rounds_update ON council_rounds FOR UPDATE USING (
    topic_id IN (SELECT id FROM council_topics WHERE user_id = auth.uid())
) WITH CHECK (
    topic_id IN (SELECT id FROM council_topics WHERE user_id = auth.uid())
);
CREATE POLICY council_rounds_delete ON council_rounds FOR DELETE USING (
    topic_id IN (SELECT id FROM council_topics WHERE user_id = auth.uid())
);

DROP POLICY council_evidence_owner ON council_evidence;
CREATE POLICY council_evidence_read ON council_evidence FOR SELECT USING (true);
CREATE POLICY council_evidence_write ON council_evidence FOR INSERT WITH CHECK (
    round_id IN (
        SELECT r.id FROM council_rounds r
        JOIN council_topics t ON t.id = r.topic_id
        WHERE t.user_id = auth.uid()
    )
);
CREATE POLICY council_evidence_update ON council_evidence FOR UPDATE USING (
    round_id IN (
        SELECT r.id FROM council_rounds r
        JOIN council_topics t ON t.id = r.topic_id
        WHERE t.user_id = auth.uid()
    )
);
CREATE POLICY council_evidence_delete ON council_evidence FOR DELETE USING (
    round_id IN (
        SELECT r.id FROM council_rounds r
        JOIN council_topics t ON t.id = r.topic_id
        WHERE t.user_id = auth.uid()
    )
);

-- council_provider_keys stays fully private — API keys must never be
-- publicly readable, even the fact that a key exists for a given seat.
-- No change to that table's policy.
