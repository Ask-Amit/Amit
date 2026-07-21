-- The Council — add explicit next_step field to council_rounds
-- Ryan's direct instruction, 2026-07-21: users had no way to see what a round
-- actually achieved and what carries forward, because it was buried inside
-- the full synthesis prose. This is a short, separate line: "here is the one
-- thing that goes into the next round" — distinct from the full synthesis.

ALTER TABLE council_rounds ADD COLUMN next_step TEXT;
