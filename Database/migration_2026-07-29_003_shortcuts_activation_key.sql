-- migration_2026-07-29_003_shortcuts_activation_key.sql
-- Real model correction (Ryan's direct correction): the home-row letter
-- (J, F, and any future key like M) is NOT part of a shortcut's name - it's
-- a separate "which side of the shortcut is this" attribute. The shortcut
-- itself is just "push", "explain", "commit", "checkup", etc. "J" is the key
-- that selects the builtin package; it is not a real shortcut and should not
-- be a row in this table at all - same for "F".
--
-- This migration only adds the column. The actual data cleanup (stripping
-- the "J " prefix off every existing trigger_phrase, backfilling
-- activation_key = 'J', and deleting the two placeholder "F"/"J" label rows)
-- is a row-level data change Amit can do directly via the REST API with the
-- service key once this column exists - no further SQL editor step needed
-- for that part.

alter table amit_shortcuts add column if not exists activation_key text;
