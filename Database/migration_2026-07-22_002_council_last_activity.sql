-- The Council — track last activity per topic, drives the sidebar's
-- most-recently-used ordering. Ryan's direct instruction, 2026-07-22:
-- reviewing an old session bumps it back to the top with a fresh date,
-- same as creating a new one does.

ALTER TABLE council_topics ADD COLUMN last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now();
