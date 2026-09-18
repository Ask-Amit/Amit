-- ══════════════════════════════════════════════
-- Access PIN lockout — Ryan's direct instruction, 2026-09-17. Five wrong
-- PIN attempts locks PIN verification for 24 hours, checked BEFORE the
-- PIN prompt even shows again — makes repeated guessing genuinely
-- expensive in real time, not just per-guess computation time (see
-- amit_pin_encryption.js's PBKDF2 rounds for that other layer).
--
-- access_pin_fail_count — resets to 0 on any successful PIN entry.
-- access_pin_lock_until — set to now()+24h the moment fail_count hits 5
-- (and fail_count resets to 0 at that point too — the lock itself is
-- what matters going forward, not the stale count). Null/past = unlocked.
-- ══════════════════════════════════════════════
alter table contacts add column if not exists access_pin_fail_count integer not null default 0;
alter table contacts add column if not exists access_pin_lock_until timestamptz;
