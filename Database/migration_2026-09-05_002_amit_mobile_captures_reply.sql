-- migration_2026-09-05_002_amit_mobile_captures_reply.sql
-- Amit Mobile — adds the two columns the desktop Realtime bridge writes
-- back into once Amit has actually thought about a capture. The phone
-- side inserts a row with `reply` left null, then watches (poll or
-- Realtime) for this same row to gain a non-null `reply`. Nullable /
-- additive only — does not touch or break the existing table or RLS
-- policy from migration_2026-09-05_001.

alter table amit_mobile_captures
  add column if not exists reply text,
  add column if not exists reply_at timestamptz;
