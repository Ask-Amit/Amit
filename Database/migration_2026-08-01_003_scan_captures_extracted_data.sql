-- ══════════════════════════════════════════════
-- AmitScan local processing — where extracted results land. Written by
-- process_inbox.bat's unattended Claude Code run, using the SENDING
-- USER's own access token (never the service-role key — RLS already
-- restricts this write to that user's own rows, same protection as
-- every other AmitBooks write).
--
-- extracted_data is a PROPOSAL for human review, never a posted
-- transaction — the review/posting pipeline (vendor-history autofill,
-- PO lookup, Payment Source, cross-book liability) still has to exist
-- before anything here becomes a real Bill/Contact/Mileage record.
-- Idempotent.
-- ══════════════════════════════════════════════

alter table scan_captures add column if not exists extracted_data jsonb;
alter table scan_captures add column if not exists processed_at timestamptz;
