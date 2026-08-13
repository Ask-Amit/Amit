-- ══════════════════════════════════════════════
-- AmitBooks — Active/Inactive on Contacts + Clients, and a real "Vendor"
-- nomenclature field.
--
-- Ryan's direct instruction, 2026-08-13: "All contacts should have one
-- toggle, and that's active... if it's not checkmarked, that means it's
-- an inactive contact, so wouldn't show up on a vendor's list unless it's
-- reactivated. Same thing for clients list." Every existing row defaults
-- to active=true (nothing already entered silently disappears).
--
-- Separately: "Vendors" becomes its own sidebar page (Ryan's instruction,
-- same session) — built as a filtered view over the existing `contacts`
-- table (Vendor-labeled rows), not a new table, so it inherits Labels,
-- Billing/Mailing, Attachments, and cross-account Connections for free
-- rather than starting those over from zero. It still needs to be a real,
-- renamable nomenclature field like Client/Scope — master_fields didn't
-- have a plain "vendor" entry (only "vendor_category", a different,
-- unrelated classification concept), so it's added here.
-- ══════════════════════════════════════════════
alter table contacts add column if not exists is_active boolean not null default true;
alter table clients add column if not exists is_active boolean not null default true;

insert into master_fields (field_key, is_picklist, sort_order)
values ('vendor', false, 6)
on conflict (field_key) do nothing;
