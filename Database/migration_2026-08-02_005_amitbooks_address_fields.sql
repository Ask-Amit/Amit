-- ══════════════════════════════════════════════
-- AmitBooks — split company address into street/city/state/zip
--
-- The Company Profile screen used to have one free-text "address" field.
-- Replacing with real columns so ZIP can drive an auto-lookup of
-- city/state (via a free public ZIP API, client-side) rather than making
-- someone type the whole thing by hand. The old single-column `address`
-- is left in place, untouched, in case anything else still reads it —
-- nothing currently does besides the old profile screen this replaces.
--
-- Idempotent — safe to re-run.
-- ══════════════════════════════════════════════

alter table books add column if not exists address_street text;
alter table books add column if not exists address_city text;
alter table books add column if not exists address_state text;
alter table books add column if not exists address_zip text;
