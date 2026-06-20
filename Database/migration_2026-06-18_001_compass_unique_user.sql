-- Migration 001 — Add unique constraint on compass_profiles.user_id
-- Needed so upsert onConflict:'user_id' works correctly.
-- One compass profile per user, ever.

alter table public.compass_profiles
  add constraint compass_profiles_user_id_unique unique (user_id);
