-- Amit Computer Health — link Installed Programs entries back to the
-- specific Install Watch (install_diff) run that caught them
-- Run in Supabase Dashboard > SQL Editor > paste > Run
-- Depends on migration_2026-07-19_001_installed_programs.sql already having run.

alter table amit_installed_programs
    add column if not exists install_diff_event_id uuid references amit_device_events(id);

create index if not exists idx_amit_installed_programs_diff_event on amit_installed_programs(install_diff_event_id);
