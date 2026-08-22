-- ══════════════════════════════════════════════
-- AmitBooks — real Job Type/Description/dates, from the fuller QuickBooks
-- Customer Contact List export (every column selected).
--
-- Ryan's direct instruction, 2026-08-14: re-ran the Customer Contact List
-- report with every available column turned on via Customize Report —
-- Job Status/Job Type/Job Description/Start Date/Projected End/End Date
-- are all real fields in that export with nowhere on the jobs table to
-- land yet (status already existed; the rest didn't).
-- ══════════════════════════════════════════════
alter table jobs add column if not exists job_type text;
alter table jobs add column if not exists description text;
alter table jobs add column if not exists start_date date;
alter table jobs add column if not exists projected_end_date date;
alter table jobs add column if not exists end_date date;
