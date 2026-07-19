-- Amit Computer Health — Installed Programs tab
-- Run in Supabase Dashboard > SQL Editor > paste > Run
--
-- Two tables:
--   amit_installed_programs — append-only log, one row per program per time
--     it was first detected OR detected as changed (a real version/date
--     change on an already-known program). Never edited or deleted except
--     by the accepted uninstall-then-reinstall duplicate case. entry_type
--     distinguishes "new" (never seen before on this device) from "update"
--     (same reg_key_id as an existing row, but date or version changed).
--   amit_installed_program_date_notes — one optional free-text comment per
--     device+date group, shown in the tab's date-grouped view. Not
--     auto-generated except client-side for the earliest date on a device
--     ("Initial build") and any date where several items share one
--     publisher ("Potential install of <publisher> software") - both are
--     just default suggested text the user can freely overwrite; nothing
--     server-side forces them.

create table if not exists amit_installed_programs (
    id uuid primary key default gen_random_uuid(),
    device_id uuid references amit_devices(id) on delete cascade,
    user_id uuid references auth.users(id) not null,
    reg_key_id text not null,        -- stable registry subkey/GUID - the real identity, not display_name
    display_name text not null,
    publisher text,
    version text,
    date_value date,                 -- folder creation date if known, else registry InstallDate, else null
    date_source text,                -- 'folder' | 'registry' | 'unknown'
    entry_type text not null default 'new',  -- 'new' | 'update'
    created_at timestamptz default now()
);

create index if not exists idx_amit_installed_programs_device_id on amit_installed_programs(device_id);
create index if not exists idx_amit_installed_programs_reg_key on amit_installed_programs(device_id, reg_key_id);
create index if not exists idx_amit_installed_programs_date on amit_installed_programs(device_id, date_value);

create table if not exists amit_installed_program_date_notes (
    id uuid primary key default gen_random_uuid(),
    device_id uuid references amit_devices(id) on delete cascade,
    user_id uuid references auth.users(id) not null,
    date_value date,  -- null represents the "date unknown" group
    note text,
    updated_at timestamptz default now(),
    unique (device_id, date_value)
);

-- Row Level Security — same pattern as amit_device_events/amit_device_session_metrics
alter table amit_installed_programs enable row level security;
alter table amit_installed_program_date_notes enable row level security;

create policy "user can select own installed programs" on amit_installed_programs
    for select using (auth.uid() = user_id);
create policy "user can insert own installed programs" on amit_installed_programs
    for insert with check (auth.uid() = user_id);

create policy "user can select own date notes" on amit_installed_program_date_notes
    for select using (auth.uid() = user_id);
create policy "user can insert own date notes" on amit_installed_program_date_notes
    for insert with check (auth.uid() = user_id);
create policy "user can update own date notes" on amit_installed_program_date_notes
    for update using (auth.uid() = user_id);
