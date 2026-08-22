-- ══════════════════════════════════════════════
-- AmitBooks — opening_balance on contacts and jobs.
--
-- Ryan's direct instruction, 2026-08-14: the QuickBooks "Customer Contact
-- List" CSV report carries a real Balance Total per customer/job — worth
-- keeping as a reference starting point. This is deliberately NOT the
-- same thing as Clients' live Billed/Received/Outstanding columns (those
-- are computed fresh from real AmitBooks invoices, migration_2026-08-13
-- era work) — opening_balance is a frozen snapshot of what QuickBooks
-- said the balance was at the moment of import, so a legacy number is
-- never silently lost, but it also never gets confused with or
-- overwritten by AmitBooks' own live-computed totals going forward.
-- ══════════════════════════════════════════════
alter table contacts add column if not exists opening_balance numeric(12,2);
alter table jobs add column if not exists opening_balance numeric(12,2);
