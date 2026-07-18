-- Amit Computer Health — add clock-speed and VRM temp estimate columns
-- Run in Supabase Dashboard > SQL Editor > paste > Run
--
-- Ryan's direct request 2026-07-17: the Clock gauge needs the chip's
-- RATED range (base to max boost) as its axis, not an auto-scale to
-- whatever was merely observed - only that way can "did it exceed spec"
-- actually be visible. Motherboard/VRM needs a real estimated ceiling
-- instead of no limit at all, since "no data" was rendering as "any
-- temperature here is fine," which isn't true - VRMs genuinely can
-- overheat, we just lack a universal per-model number.

alter table amit_hardware_specs add column if not exists min_clock_mhz numeric;
alter table amit_hardware_specs add column if not exists max_boost_mhz numeric;

-- Real AMD-published boost specs for the CPU generations already seeded.
update amit_hardware_specs set min_clock_mhz = 3800, max_boost_mhz = 4600, source = 'AMD published base/boost clock specs'
    where model_family = 'AMD Ryzen 3000 series (Zen 2)' and component_type = 'CPU';
update amit_hardware_specs set min_clock_mhz = 3700, max_boost_mhz = 4900, source = 'AMD published base/boost clock specs'
    where model_family = 'AMD Ryzen 5000 series (Zen 3)' and component_type = 'CPU';
update amit_hardware_specs set min_clock_mhz = 4500, max_boost_mhz = 5700, source = 'AMD published base/boost clock specs'
    where model_family = 'AMD Ryzen 7000/8000 series (Zen 4)' and component_type = 'CPU';

-- Motherboard VRM - no universal per-model number exists (Ryan's own
-- point: "we're not gonna be able to hit [every model]"), so this is
-- explicitly an estimated-average industry-typical ceiling, not a
-- verified datasheet figure. ~100C is a commonly cited safe operating
-- ceiling for consumer-grade VRMs before thermal throttling/damage risk
-- becomes a real concern.
update amit_hardware_specs set max_temp_c = 100
    where component_type = 'Motherboard' and max_temp_c is null;
