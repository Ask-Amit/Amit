-- The Council — gate self-service topic creation to premium tier
-- Ryan's direct instruction, 2026-07-21: The Council is a subscription product.
-- Free/anonymous visitors can view Amit's own sessions read-only (the showcase
-- sells the product). Only premium users get to start and run their own topic,
-- linked to their own login. Matches amit_user_tiers, same table the old
-- Brainstorming room used for its premium gate.

DROP POLICY council_topics_write ON council_topics;
CREATE POLICY council_topics_write ON council_topics FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
        SELECT 1 FROM amit_user_tiers
        WHERE amit_user_tiers.user_id = auth.uid()
        AND amit_user_tiers.tier = 'premium'
    )
);
