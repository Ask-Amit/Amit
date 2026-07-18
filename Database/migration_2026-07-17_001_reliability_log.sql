-- Amit Computer Health — permanent error/crash/reliability history
-- Run in Supabase Dashboard > SQL Editor > paste > Run
--
-- Deliberately NOT stored in amit_device_events - that table has a hard
-- 10-row free-tier cap that auto-evicts the oldest rows, built for
-- session history (Tracker/App Behavior stop events), not for a running
-- error log. Syncing up to 25 reliability records at once would blow
-- through that cap instantly and evict real session history. Ryan's
-- direct request 2026-07-17: this needs to hold months of trend data,
-- not compete for a rolling 10 slots - so it gets its own table with no
-- rotation cap at all.
--
-- occurred_at is the REAL historical time Windows recorded the error or
-- crash (from Win32_ReliabilityRecords' own TimeGenerated, or the
-- minidump file's own LastWriteTime) - not when this app happened to
-- sync it. This is what makes genuine trend analysis over days/months
-- possible, matching the actual reason this whole investigation started.

create table if not exists amit_device_reliability_log (
    id uuid primary key default gen_random_uuid(),
    device_id uuid references amit_devices(id) on delete cascade,
    user_id uuid references auth.users(id) not null,
    event_type text not null,        -- reliability_record, bsod_crash
    source text,                     -- SourceName from Win32_ReliabilityRecords, or null for a raw crash dump
    product text,
    message text,
    dump_file_name text,             -- set only for event_type = bsod_crash
    occurred_at timestamptz not null,
    created_at timestamptz default now()
);

create index if not exists idx_amit_reliability_log_device_id on amit_device_reliability_log(device_id);
create index if not exists idx_amit_reliability_log_user_id on amit_device_reliability_log(user_id);
create index if not exists idx_amit_reliability_log_occurred_at on amit_device_reliability_log(occurred_at desc);

-- Prevents re-inserting the same historical record on every sync (the
-- backend re-reads up to 25 records/10 dumps each time the Errors tab
-- loads) - same partial-unique-index dedup pattern already used for
-- tracking sessions, applied here to (device, type, time, source).
create unique index if not exists idx_amit_reliability_log_dedup
    on amit_device_reliability_log(device_id, event_type, occurred_at, coalesce(source, ''));

alter table amit_device_reliability_log enable row level security;

create policy "user can select own device reliability log" on amit_device_reliability_log
    for select using (auth.uid() = user_id);
create policy "user can insert own device reliability log" on amit_device_reliability_log
    for insert with check (auth.uid() = user_id);
