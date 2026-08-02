-- ══════════════════════════════════════════════
-- AmitBooks — Industry preset expansion
--
-- Adds the 18 new industries surfaced by Amit's own research plus a
-- Gemini cross-check (Ryan requested a comprehensive list before filling
-- in field defaults, so this is names-only for now). Deliberately
-- excludes "Franchise" as its own preset — that's a modifier that
-- layers onto any other industry (a franchised restaurant needs
-- Restaurant's fields plus a royalty/ad-fund field), not a distinct
-- vertical. Revisit as a book-level flag later, not a 28th preset.
--
-- No preset_field_defaults or preset_field_value_defaults rows yet for
-- any of these — only Construction has real field data
-- (migration_2026-08-02_001). Picking one of these today via
-- apply_preset_to_book() would set books.industry_preset_id but copy
-- zero fields, since there's nothing yet to copy.
--
-- Idempotent — safe to re-run.
-- ══════════════════════════════════════════════

insert into industry_presets (preset_key, display_name) values
  ('creative_agency', 'Creative Agency / Marketing'),
  ('architecture_engineering', 'Architecture / Engineering / Design'),
  ('landscaping', 'Landscaping / Grounds Maintenance'),
  ('auto_repair', 'Auto Repair / Body Shop / Fleet'),
  ('hospitality_hotel', 'Hotel / Hospitality'),
  ('film_media_production', 'Film / Video / Media Production'),
  ('event_planning', 'Event Planning / Wedding Production'),
  ('retail_ecommerce', 'Retail / E-Commerce'),
  ('salon_spa', 'Salon / Spa / Personal Care'),
  ('healthcare_practice', 'Healthcare Practice (Medical, Dental, Chiropractic)'),
  ('church_religious', 'Church / Religious Organization'),
  ('school_childcare', 'School / Childcare Center'),
  ('property_management', 'Real Estate Property Management'),
  ('manufacturing', 'Manufacturing'),
  ('hoa_coa', 'HOA / COA (Homeowners / Condo Association)'),
  ('real_estate_investor', 'Real Estate Investor / Flipper'),
  ('veterinary', 'Veterinary Practice'),
  ('fitness_gym', 'Fitness / Gym')
on conflict (preset_key) do nothing;
