-- ══════════════════════════════════════════════
-- AmitBooks — people underneath a contact
--
-- A vendor/subcontractor record (e.g. "Harvard Electric") often has
-- several actual people you deal with (three different superintendents),
-- each individually reachable. Rather than a separate table, a "person"
-- is just another contacts row with parent_contact_id pointing at the
-- company-level contact — same table, same RLS, one level of nesting.
-- title holds their role at that company ("Superintendent", "Project
-- Manager"). phone/email already exist on contacts for this purpose.
--
-- Idempotent — safe to re-run.
-- ══════════════════════════════════════════════

alter table contacts add column if not exists parent_contact_id uuid references contacts(id) on delete cascade;
alter table contacts add column if not exists title text;
