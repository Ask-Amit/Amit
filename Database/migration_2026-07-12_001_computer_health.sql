-- Amit Computer Health — device registry, ownership history, and event log
-- Run in Supabase Dashboard > SQL Editor > paste > Run

create table if not exists amit_devices (
    id uuid primary key default gen_random_uuid(),
    device_name text not null,
    owner_user_id uuid references auth.users(id),
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    active boolean default true
);

create table if not exists amit_device_ownership_history (
    id uuid primary key default gen_random_uuid(),
    device_id uuid references amit_devices(id) on delete cascade,
    previous_owner uuid references auth.users(id),
    new_owner uuid references auth.users(id) not null,
    transferred_at timestamptz default now(),
    notes text
);

create table if not exists amit_device_events (
    id uuid primary key default gen_random_uuid(),
    device_id uuid references amit_devices(id) on delete cascade,
    user_id uuid references auth.users(id) not null,
    event_type text not null,        -- install_diff, resource_snapshot, behavior_flag, removal, resource_anomaly
    severity text default 'info',    -- info, warning, critical
    summary text,                    -- plain-language one-liner for the dashboard
    event_detail jsonb,              -- full structured data (diff report, sensor snapshot, etc.)
    resolved boolean default false,
    created_at timestamptz default now()
);

create index if not exists idx_amit_device_events_device_id on amit_device_events(device_id);
create index if not exists idx_amit_device_events_user_id on amit_device_events(user_id);
create index if not exists idx_amit_device_events_created_at on amit_device_events(created_at desc);

-- keep updated_at current on amit_devices (reuses existing trigger function from base schema)
drop trigger if exists set_updated_at on amit_devices;
create trigger set_updated_at
    before update on amit_devices
    for each row execute function handle_updated_at();

-- Row Level Security
alter table amit_devices enable row level security;
alter table amit_device_ownership_history enable row level security;
alter table amit_device_events enable row level security;

-- Devices: owner can see/manage their own devices
create policy "owner can select own devices" on amit_devices
    for select using (auth.uid() = owner_user_id);
create policy "owner can insert own devices" on amit_devices
    for insert with check (auth.uid() = owner_user_id);
create policy "owner can update own devices" on amit_devices
    for update using (auth.uid() = owner_user_id);

-- Ownership history: visible to either party in the transfer
create policy "parties can view ownership history" on amit_device_ownership_history
    for select using (auth.uid() = previous_owner or auth.uid() = new_owner);
create policy "new owner can insert transfer record" on amit_device_ownership_history
    for insert with check (auth.uid() = new_owner);

-- Events: visible/writable only by the user_id tagged on the event (current device owner at time of logging)
create policy "user can select own device events" on amit_device_events
    for select using (auth.uid() = user_id);
create policy "user can insert own device events" on amit_device_events
    for insert with check (auth.uid() = user_id);
create policy "user can update own device events" on amit_device_events
    for update using (auth.uid() = user_id);
