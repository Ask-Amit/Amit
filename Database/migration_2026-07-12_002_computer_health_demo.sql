-- Amit Computer Health — demo mode carve-out, matching the existing
-- hub_entries pattern (AMIT_DEMO_UID content is publicly readable so demo
-- mode visitors can browse Amit's own real tracked history). Read-only:
-- no equivalent insert/update policy is added, so demo visitors can look
-- but never touch anything.

create policy "anyone can view Amit's demo devices" on amit_devices
    for select using (owner_user_id = '8b95d057-fd6b-44ec-abe7-658e08872d1a');

create policy "anyone can view Amit's demo device events" on amit_device_events
    for select using (user_id = '8b95d057-fd6b-44ec-abe7-658e08872d1a');
