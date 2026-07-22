-- Fix: council_topics_write policy checks amit_user_tiers via a subquery,
-- but that subquery runs as the requesting user - if amit_user_tiers has
-- no SELECT policy letting a user read their OWN row, the subquery always
-- returns empty and the premium check always fails, even for a real
-- premium user. This adds exactly that: a user can read their own tier
-- row, nothing else. Safe - never exposes anyone else's tier.

DROP POLICY IF EXISTS amit_user_tiers_self_read ON amit_user_tiers;
CREATE POLICY amit_user_tiers_self_read ON amit_user_tiers FOR SELECT USING (auth.uid() = user_id);
