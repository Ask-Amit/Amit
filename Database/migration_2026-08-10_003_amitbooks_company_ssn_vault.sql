-- ══════════════════════════════════════════════
-- AmitBooks — Company SSN vault
--
-- Ryan caught this directly, 2026-08-10: the adaptive EIN/SSN field added
-- to the Company popup (Sole Proprietorship → SSN formatting) was storing
-- a real SSN in PLAIN TEXT in `companies.ein` — a real exposure, unlike
-- the Contacts SSN field which already has real client-side zero-knowledge
-- encryption. This closes that gap the same way: AES-256-GCM, key derived
-- via PBKDF2 from a passphrase that never touches Supabase.
--
-- Separate vault from the Contacts one on purpose — a company isn't
-- scoped to one book (see migration_2026-08-07_001), so it needs its own
-- salt, not a book's.
--
-- Plain `ein` column is untouched and still used for every entity type
-- OTHER than Sole Proprietorship — a regular EIN isn't equivalent to a
-- personal SSN in sensitivity (it already appears on public filings/1099s)
-- and doesn't need this. Only the sole-prop SSN case routes through
-- ein_encrypted/ein_iv instead.
--
-- Idempotent — safe to re-run.
-- ══════════════════════════════════════════════

alter table companies add column if not exists vault_salt text;
alter table companies add column if not exists ein_encrypted text;
alter table companies add column if not exists ein_iv text;
