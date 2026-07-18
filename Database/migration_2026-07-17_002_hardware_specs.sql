-- Amit Computer Health — shared hardware specs reference table
-- Run in Supabase Dashboard > SQL Editor > paste > Run
--
-- Ryan's direct request 2026-07-17: replaces the hardcoded SAFE_TEMP_LIMITS
-- and HARDWARE_GENERATION_DB arrays that were living directly in the
-- dashboard's JavaScript with a real, growable database table. This is
-- GLOBAL reference data (a Ryzen 9 3900X's spec is the same fact for
-- every Amit user, not something tied to one device) - readable by
-- anyone signed in, writable only by the service role, so Ryan can bulk-
-- upload real spec sheets over time without touching app code, and this
-- is the eventual target table for an automated yearly manufacturer-spec
-- import agent (captured as a real future idea, not built yet).
--
-- confidence is honest about data quality: 'manufacturer-spec' for a
-- real datasheet number, 'estimated-average' for a reasonable industry-
-- typical figure used when the exact model's real spec isn't on hand yet
-- (Ryan's own words: "we're not gonna be able to hit [every model], but
-- we can just average the others out"). The report always states which
-- kind of number it's showing, never presents an estimate as measured.

create table if not exists amit_hardware_specs (
    id uuid primary key default gen_random_uuid(),
    component_type text not null,       -- CPU, GPU, RAM, Storage, Motherboard, Network
    manufacturer text,                  -- AMD, Intel, NVIDIA, Samsung, etc.
    model_family text not null,         -- human label, e.g. "AMD Ryzen 9 3900X" or "AMD Ryzen 3000 series"
    model_pattern text not null,        -- case-insensitive substring/regex matched against the sensor's own title
    max_temp_c numeric,
    min_voltage numeric,
    max_voltage numeric,
    release_year integer,
    typical_lifespan_years numeric,
    confidence text not null default 'estimated-average',  -- manufacturer-spec | estimated-average | community
    source text,                        -- URL or note on where this number came from
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create index if not exists idx_amit_hardware_specs_component_type on amit_hardware_specs(component_type);

drop trigger if exists set_updated_at on amit_hardware_specs;
create trigger set_updated_at
    before update on amit_hardware_specs
    for each row execute function handle_updated_at();

alter table amit_hardware_specs enable row level security;

-- Readable by any signed-in user - this is shared reference data, not
-- anyone's personal information.
create policy "any signed-in user can read hardware specs" on amit_hardware_specs
    for select using (auth.role() = 'authenticated');

-- Deliberately no insert/update policy for regular users - only the
-- service role (used from the SQL Editor, or a future import agent) can
-- write to this table. Keeps community-submitted numbers from silently
-- overwriting verified manufacturer specs.

-- Seed data - the same figures that were hardcoded in the dashboard
-- before this table existed, so nothing regresses. Ryan: this is also
-- the exact INSERT format to follow when bulk-adding more from real
-- spec sheets - just repeat the pattern below with new values.
insert into amit_hardware_specs (component_type, manufacturer, model_family, model_pattern, max_temp_c, release_year, confidence, source) values
    ('CPU', 'AMD', 'AMD Ryzen 7000/8000 series (Zen 4)', 'ryzen 9 7|ryzen 7 7|ryzen 5 7|ryzen 9 8|ryzen 7 8', 95, 2022, 'manufacturer-spec', 'AMD published Tjmax specs'),
    ('CPU', 'AMD', 'AMD Ryzen 5000 series (Zen 3)', 'ryzen 9 5|ryzen 7 5|ryzen 5 5', 95, 2020, 'manufacturer-spec', 'AMD published Tjmax specs'),
    ('CPU', 'AMD', 'AMD Ryzen 3000 series (Zen 2)', 'ryzen 9 39|ryzen 7 37|ryzen 5 36|ryzen 9 38', 95, 2019, 'manufacturer-spec', 'AMD published Tjmax specs'),
    ('CPU', 'AMD', 'AMD Ryzen 2000 series (Zen+)', 'ryzen 7 2|ryzen 5 2', 95, 2018, 'manufacturer-spec', 'AMD published Tjmax specs'),
    ('CPU', 'Intel', 'Intel 13th/14th Gen', 'core i9-13|core i7-13|core i5-13|core i9-14|core i7-14', 100, 2022, 'manufacturer-spec', 'Intel published Tjmax specs'),
    ('CPU', 'Intel', 'Intel 12th Gen', 'core i9-12|core i7-12|core i5-12', 100, 2021, 'manufacturer-spec', 'Intel published Tjmax specs'),
    ('CPU', 'Intel', 'Intel 10th/11th Gen', 'core i9-10|core i7-10|core i5-10|core i9-11|core i7-11', 100, 2020, 'manufacturer-spec', 'Intel published Tjmax specs'),
    ('CPU', 'Intel', 'Intel 9th Gen', 'core i9-9|core i7-9|core i5-9', 100, 2018, 'manufacturer-spec', 'Intel published Tjmax specs'),
    ('GPU', 'NVIDIA', 'NVIDIA RTX 40 series', 'rtx 40', 93, 2022, 'manufacturer-spec', 'NVIDIA published thermal throttle specs'),
    ('GPU', 'NVIDIA', 'NVIDIA RTX 30 series', 'rtx 30', 93, 2020, 'manufacturer-spec', 'NVIDIA published thermal throttle specs'),
    ('GPU', 'NVIDIA', 'NVIDIA RTX 20 series', 'rtx 20', 93, 2018, 'manufacturer-spec', 'NVIDIA published thermal throttle specs'),
    ('GPU', 'NVIDIA', 'NVIDIA GTX 16 series', 'gtx 16', 88, 2019, 'estimated-average', 'Typical GTX-class throttle point'),
    ('GPU', 'NVIDIA', 'NVIDIA GTX 10 series', 'gtx 10', 94, 2016, 'manufacturer-spec', 'NVIDIA published thermal throttle specs'),
    ('GPU', 'AMD', 'AMD Radeon RX 7000 series', 'radeon rx 7', 110, 2022, 'manufacturer-spec', 'AMD published junction temp specs'),
    ('GPU', 'AMD', 'AMD Radeon RX 6000 series', 'radeon rx 6', 110, 2020, 'manufacturer-spec', 'AMD published junction temp specs'),
    ('Storage', null, 'SSD/NVMe (generic)', 'nvme|ssd|samsung ssd|wd |crucial|kingston', 70, null, 'estimated-average', 'Typical consumer NVMe/SSD throttle point'),
    ('Motherboard', 'AMD', 'AMD 600-series chipset', 'x670|b650', null, 2022, 'estimated-average', 'Chipset generation only, no universal VRM temp spec'),
    ('Motherboard', 'AMD', 'AMD 500-series chipset', 'b550|x570', null, 2019, 'estimated-average', 'Chipset generation only, no universal VRM temp spec'),
    ('Motherboard', 'AMD', 'AMD 400-series chipset', 'b450|x470', null, 2018, 'estimated-average', 'Chipset generation only, no universal VRM temp spec'),
    ('Motherboard', 'Intel', 'Intel 700-series chipset', 'z790|b760', null, 2022, 'estimated-average', 'Chipset generation only, no universal VRM temp spec'),
    ('Motherboard', 'Intel', 'Intel 600-series chipset', 'z690|b660', null, 2021, 'estimated-average', 'Chipset generation only, no universal VRM temp spec')
on conflict do nothing;
