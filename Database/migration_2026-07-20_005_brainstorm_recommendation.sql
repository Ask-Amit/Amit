-- Adds Amit's own initial good-faith recommendation to a brainstorm topic
-- (Ryan's direct request 2026-07-20): distinct from `analysis` (breaking
-- down what's really being asked) and `synthesis` (the final consented
-- conclusion once all rounds are done), this is the honest first answer
-- Amit would give on its own - drawing on the channel's accumulated
-- history (running_notes, prior resolved topics) - given right when a
-- topic starts, BEFORE any outside AI is consulted. Every other element
-- already built (channel history, prior topics, the event log) feeds into
-- producing this - it's the point where everything gathered so far moves
-- toward one real, good-faith answer, which then gets tested and
-- sharpened against what the other AIs bring back.

alter table amit_brainstorm_topics add column if not exists initial_recommendation text;

NOTIFY pgrst, 'reload schema';
