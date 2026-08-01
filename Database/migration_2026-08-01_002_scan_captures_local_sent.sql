-- ══════════════════════════════════════════════
-- AmitBooks/AmitScan — tracks when a capture was sent out for local
-- processing, separate from `reviewed` (which means it's already part
-- of a real Bill/Contact/Mileage record). Lets Pending Scans and a new
-- Working Scans tab show genuinely different states instead of an item
-- just silently disappearing with no confirmation it went anywhere —
-- the exact confusion Ryan hit live 2026-08-01. Idempotent.
-- ══════════════════════════════════════════════

alter table scan_captures add column if not exists local_sent_at timestamptz;
