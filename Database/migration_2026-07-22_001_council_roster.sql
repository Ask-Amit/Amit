-- The Council — track the intended roster for a round, so the page can
-- drive a sequential "open tab, copy prompt, paste answer, next voice"
-- roundtable UI and know when every voice has actually answered.

ALTER TABLE council_rounds ADD COLUMN roster TEXT[];
