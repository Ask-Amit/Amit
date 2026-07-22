-- The Council — the diary field. A living, printable, user-editable
-- summary document of the whole session: original question, current
-- solution, and a round-by-round log. Grows as rounds complete. Ryan's
-- direct instruction, 2026-07-22.

ALTER TABLE council_topics ADD COLUMN diary_text TEXT;
