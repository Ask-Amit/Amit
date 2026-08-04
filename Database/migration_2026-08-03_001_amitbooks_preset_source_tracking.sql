-- ══════════════════════════════════════════════
-- AmitBooks — track which preset a book's field/value actually came from
--
-- Supports the à la carte preset picker: a book can mix and match pieces
-- from several presets (some Construction cost codes, a couple Rental
-- Property fields, etc.) rather than being locked to one preset wholesale.
-- source_preset_id records provenance so the Nomenclature screen can show
-- a running count per preset card ("Construction (15)") — a visible
-- record of where each active field/value actually came from. Null means
-- manually added/edited by the user, not sourced from any preset.
--
-- Idempotent — safe to re-run.
-- ══════════════════════════════════════════════

alter table book_field_settings add column if not exists source_preset_id uuid references industry_presets(id);
alter table book_field_values add column if not exists source_preset_id uuid references industry_presets(id);
