-- Amit Computer Health — Installed Programs: capture real install time, not just date
-- Run in Supabase Dashboard > SQL Editor > paste > Run
-- Depends on migration_2026-07-19_001_installed_programs.sql already having run.
--
-- date_value (date) stays exactly as-is - still the calendar-day grouping
-- key the tab's date cards are built from. install_datetime is new and
-- additive: the real timestamp when known (folder-creation-date sourced
-- rows only - the registry's InstallDate field never had a time value to
-- begin with, so it stays null for registry-sourced/unknown rows). Used
-- to sort within a date group (newest first) and to detect real time gaps
-- between installs on the same day.

alter table amit_installed_programs
    add column if not exists install_datetime timestamptz;

create index if not exists idx_amit_installed_programs_datetime on amit_installed_programs(device_id, install_datetime);
