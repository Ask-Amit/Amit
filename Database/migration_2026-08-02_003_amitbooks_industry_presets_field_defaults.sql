-- ══════════════════════════════════════════════
-- AmitBooks — Field defaults for the 18 new industry presets
-- (migration_2026-08-02_002 added the industries themselves, names only;
-- this fills in the actual active fields, display labels, and picklist
-- values for each, sourced from a Gemini research pass Ryan reviewed
-- and approved). Same shape as Construction's defaults
-- (migration_2026-08-02_001) — full 18-field list per preset, active
-- true/false, label always present even when inactive so a book can
-- turn a field back on later without losing a sensible default name.
--
-- KNOWN GAP, not addressed here (flagged by Gemini, confirmed real):
-- three concepts don't fit this field-label architecture at all and
-- need their own structural feature, not a relabeled field —
--   1. Trucking/Logistics IFTA fuel-tax jurisdiction splits (expense
--      needs to divide across US states/Canadian provinces).
--   2. Agriculture crop-year cycles spanning 18+ calendar months,
--      distinct from a fiscal period.
--   3. Percentage-split allocation of one expense across multiple
--      jobs/properties/funds (Property Management, Nonprofit, HOA).
-- These need a real design conversation before building — not silently
-- forced into an existing free-text or picklist field. Logistics and
-- Agriculture presets themselves already exist with Construction-era
-- field defaults from the original preset list; this migration does
-- not touch them.
--
-- Idempotent — safe to re-run.
-- ══════════════════════════════════════════════

-- ── 1. Creative Agency / Marketing ──
insert into preset_field_defaults (preset_id, field_key, active, display_label)
select p.id, f.field_key, f.active, f.display_label from industry_presets p
cross join (values
  ('job', true, 'Client Account'), ('project', true, 'Project / Campaign'),
  ('scope', true, 'Deliverable / Task'), ('cost_code', true, 'Activity Code'),
  ('classification', true, 'Expense Category'), ('po', true, 'Client Purchase Order'),
  ('department', true, 'Department / Team'), ('location', false, 'Location'),
  ('phase', true, 'Campaign Phase'), ('billable', true, 'Billing Status'),
  ('vendor_category', true, 'Vendor Category'), ('revenue_category', false, 'Revenue Category'),
  ('entity', false, 'Entity'), ('funding_source', false, 'Funding Source'),
  ('fiscal_period', false, 'Fiscal Period'), ('asset_unit', false, 'Asset Unit'),
  ('tax_classification', true, 'Tax Classification'), ('tax_form_box', true, '1099 Box')
) as f(field_key, active, display_label)
where p.preset_key = 'creative_agency' on conflict (preset_id, field_key) do nothing;

insert into preset_field_value_defaults (preset_id, field_key, value_key, display_label, sort_order)
select p.id, 'classification', v.value_key, v.display_label, v.sort_order from industry_presets p
cross join (values
  ('media_spend','Media Spend / Ad Buy',10), ('freelance_subcontractor','Freelance / Subcontractor',20),
  ('software_license','Software / Asset License',30), ('production_equipment','Production / Equipment',40),
  ('client_entertainment','Client Entertainment',50), ('travel_mileage','Travel / Mileage',60),
  ('agency_overhead','Agency Overhead',70)
) as v(value_key, display_label, sort_order)
where p.preset_key = 'creative_agency' on conflict (preset_id, field_key, value_key) do nothing;

-- ── 2. Architecture / Engineering / Design ──
insert into preset_field_defaults (preset_id, field_key, active, display_label)
select p.id, f.field_key, f.active, f.display_label from industry_presets p
cross join (values
  ('job', true, 'Client'), ('project', true, 'Project / Structure'),
  ('scope', true, 'Scope of Work'), ('cost_code', true, 'Task Code'),
  ('classification', true, 'Cost Category'), ('po', true, 'Subconsultant PO'),
  ('department', true, 'Discipline'), ('location', false, 'Location'),
  ('phase', true, 'Project Phase'), ('billable', true, 'Billing Status'),
  ('vendor_category', true, 'Vendor Type'), ('revenue_category', false, 'Revenue Category'),
  ('entity', false, 'Entity'), ('funding_source', false, 'Funding Source'),
  ('fiscal_period', false, 'Fiscal Period'), ('asset_unit', false, 'Asset Unit'),
  ('tax_classification', true, 'Tax Classification'), ('tax_form_box', true, '1099 Box')
) as f(field_key, active, display_label)
where p.preset_key = 'architecture_engineering' on conflict (preset_id, field_key) do nothing;

insert into preset_field_value_defaults (preset_id, field_key, value_key, display_label, sort_order)
select p.id, 'classification', v.value_key, v.display_label, v.sort_order from industry_presets p
cross join (values
  ('direct_labor','Direct Labor',10), ('subconsultant_fees','Subconsultant Fees',20),
  ('reimbursable_expenses','Reimbursable Expenses',30), ('software_cadd','Software / CADD License',40),
  ('site_visit_travel','Site Visit / Travel',50), ('permit_filing_fees','Permit / Filing Fees',60),
  ('general_overhead','General Overhead',70)
) as v(value_key, display_label, sort_order)
where p.preset_key = 'architecture_engineering' on conflict (preset_id, field_key, value_key) do nothing;

-- ── 3. Landscaping / Grounds Maintenance ──
insert into preset_field_defaults (preset_id, field_key, active, display_label)
select p.id, f.field_key, f.active, f.display_label from industry_presets p
cross join (values
  ('job', true, 'Property / Customer'), ('project', true, 'Contract / Enhancement Job'),
  ('scope', true, 'Service Type'), ('cost_code', true, 'Cost Code'),
  ('classification', true, 'Input Category'), ('po', true, 'PO / Release Number'),
  ('department', false, 'Department'), ('location', true, 'Route / Zone'),
  ('phase', false, 'Phase'), ('billable', true, 'Billing Status'),
  ('vendor_category', false, 'Vendor Category'), ('revenue_category', false, 'Revenue Category'),
  ('entity', false, 'Entity'), ('funding_source', false, 'Funding Source'),
  ('fiscal_period', false, 'Fiscal Period'), ('asset_unit', true, 'Vehicle / Rig ID'),
  ('tax_classification', true, 'Tax Classification'), ('tax_form_box', true, '1099 Box')
) as f(field_key, active, display_label)
where p.preset_key = 'landscaping' on conflict (preset_id, field_key) do nothing;

insert into preset_field_value_defaults (preset_id, field_key, value_key, display_label, sort_order)
select p.id, 'classification', v.value_key, v.display_label, v.sort_order from industry_presets p
cross join (values
  ('labor','Labor',10), ('plant_materials_turf','Plant Materials / Turf',20),
  ('chemicals_fertilizer','Chemicals / Fertilizer',30), ('hardscape_materials','Hardscape Materials',40),
  ('fuel_oil','Fuel / Oil',50), ('equipment_maintenance','Equipment Maintenance',60),
  ('subcontractor','Subcontractor',70)
) as v(value_key, display_label, sort_order)
where p.preset_key = 'landscaping' on conflict (preset_id, field_key, value_key) do nothing;

insert into preset_field_value_defaults (preset_id, field_key, value_key, display_label, sort_order)
select p.id, 'billable', v.value_key, v.display_label, v.sort_order from industry_presets p
cross join (values
  ('included_contract_rate','Included in Contract Rate',10),
  ('billable_extra_tm','Billable Extra / T&M',20),
  ('non_billable_overhead','Non-Billable Overhead',30)
) as v(value_key, display_label, sort_order)
where p.preset_key = 'landscaping' on conflict (preset_id, field_key, value_key) do nothing;

-- ── 4. Auto Repair / Body Shop / Fleet ──
insert into preset_field_defaults (preset_id, field_key, active, display_label)
select p.id, f.field_key, f.active, f.display_label from industry_presets p
cross join (values
  ('job', true, 'Customer / Fleet Account'), ('project', true, 'Repair Order (RO)'),
  ('scope', true, 'Service Line'), ('cost_code', false, 'Cost Code'),
  ('classification', true, 'Cost Category'), ('po', true, 'Parts Purchase Order'),
  ('department', true, 'Shop Department'), ('location', false, 'Location'),
  ('phase', false, 'Phase'), ('billable', true, 'Billing / Coverage Type'),
  ('vendor_category', true, 'Parts Supplier Type'), ('revenue_category', false, 'Revenue Category'),
  ('entity', false, 'Entity'), ('funding_source', false, 'Funding Source'),
  ('fiscal_period', false, 'Fiscal Period'), ('asset_unit', true, 'Vehicle VIN / Fleet Unit #'),
  ('tax_classification', true, 'Tax Classification'), ('tax_form_box', true, '1099 Box')
) as f(field_key, active, display_label)
where p.preset_key = 'auto_repair' on conflict (preset_id, field_key) do nothing;

insert into preset_field_value_defaults (preset_id, field_key, value_key, display_label, sort_order)
select p.id, 'classification', v.value_key, v.display_label, v.sort_order from industry_presets p
cross join (values
  ('parts_inventory','Parts / Inventory',10), ('labor','Labor',20),
  ('sublet_repairs','Sublet Repairs',30), ('paint_shop_supplies','Paint & Shop Supplies',40),
  ('core_charges','Core Charges',50), ('hazmat_disposal','Hazmat / Disposal Fees',60)
) as v(value_key, display_label, sort_order)
where p.preset_key = 'auto_repair' on conflict (preset_id, field_key, value_key) do nothing;

insert into preset_field_value_defaults (preset_id, field_key, value_key, display_label, sort_order)
select p.id, 'billable', v.value_key, v.display_label, v.sort_order from industry_presets p
cross join (values
  ('customer_pay','Customer Pay',10), ('insurance_claim','Insurance Claim',20),
  ('warranty_claim','Warranty Claim',30), ('internal_shop_cost','Internal Shop Cost',40)
) as v(value_key, display_label, sort_order)
where p.preset_key = 'auto_repair' on conflict (preset_id, field_key, value_key) do nothing;

-- ── 5. Hotel / Hospitality ──
insert into preset_field_defaults (preset_id, field_key, active, display_label)
select p.id, f.field_key, f.active, f.display_label from industry_presets p
cross join (values
  ('job', false, 'Job'), ('project', false, 'Project'),
  ('scope', false, 'Scope'), ('cost_code', false, 'Cost Code'),
  ('classification', true, 'Operating Expense Class'), ('po', true, 'Purchase Order'),
  ('department', true, 'Department / Cost Center'), ('location', true, 'Property / Branch'),
  ('phase', false, 'Phase'), ('billable', false, 'Billing Status'),
  ('vendor_category', true, 'Vendor Type'), ('revenue_category', false, 'Revenue Category'),
  ('entity', false, 'Entity'), ('funding_source', false, 'Funding Source'),
  ('fiscal_period', true, 'Operating Period'), ('asset_unit', true, 'Room / Facility Unit'),
  ('tax_classification', true, 'Tax Classification'), ('tax_form_box', true, '1099 Box')
) as f(field_key, active, display_label)
where p.preset_key = 'hospitality_hotel' on conflict (preset_id, field_key) do nothing;

insert into preset_field_value_defaults (preset_id, field_key, value_key, display_label, sort_order)
select p.id, 'classification', v.value_key, v.display_label, v.sort_order from industry_presets p
cross join (values
  ('guest_amenities','Guest Amenities',10), ('linens_laundry','Linens & Laundry',20),
  ('fnb_cogs','Food & Beverage COGS',30), ('cleaning_sanitation','Cleaning & Sanitation',40),
  ('utilities_energy','Utilities & Energy',50), ('maintenance_ffe','Maintenance & FF&E',60),
  ('admin_overhead','Administrative Overhead',70)
) as v(value_key, display_label, sort_order)
where p.preset_key = 'hospitality_hotel' on conflict (preset_id, field_key, value_key) do nothing;

-- ── 6. Film / Video / Media Production ──
insert into preset_field_defaults (preset_id, field_key, active, display_label)
select p.id, f.field_key, f.active, f.display_label from industry_presets p
cross join (values
  ('job', true, 'Distributor / Client'), ('project', true, 'Production / Film'),
  ('scope', true, 'Episode / Scene / Activation'), ('cost_code', true, 'Chart of Accounts Code (Above/Below the Line)'),
  ('classification', true, 'Budget Category'), ('po', true, 'Purchase Order / Deal Memo'),
  ('department', true, 'Production Department'), ('location', false, 'Location'),
  ('phase', true, 'Production Stage'), ('billable', true, 'Billing Status'),
  ('vendor_category', false, 'Vendor Category'), ('revenue_category', false, 'Revenue Category'),
  ('entity', false, 'Entity'), ('funding_source', false, 'Funding Source'),
  ('fiscal_period', false, 'Fiscal Period'), ('asset_unit', false, 'Asset Unit'),
  ('tax_classification', true, 'Tax / Tax Credit Status'), ('tax_form_box', true, '1099 Box')
) as f(field_key, active, display_label)
where p.preset_key = 'film_media_production' on conflict (preset_id, field_key) do nothing;

insert into preset_field_value_defaults (preset_id, field_key, value_key, display_label, sort_order)
select p.id, 'classification', v.value_key, v.display_label, v.sort_order from industry_presets p
cross join (values
  ('above_the_line','Above-the-Line Talent',10), ('below_the_line','Below-the-Line Crew',20),
  ('equipment_rental','Equipment Rental',30), ('locations_permits','Locations & Permits',40),
  ('catering_per_diem','Catering & Per Diem',50), ('post_production_vfx','Post-Production / VFX',60),
  ('fringe_union','Fringe & Union Benefits',70)
) as v(value_key, display_label, sort_order)
where p.preset_key = 'film_media_production' on conflict (preset_id, field_key, value_key) do nothing;

insert into preset_field_value_defaults (preset_id, field_key, value_key, display_label, sort_order)
select p.id, 'tax_classification', v.value_key, v.display_label, v.sort_order from industry_presets p
cross join (values
  ('in_state_credit_eligible','In-State Tax Credit Eligible',10),
  ('out_of_state_non_eligible','Out-of-State Non-Eligible',20),
  ('exempt_pass_through','Exempt / Pass-Through',30)
) as v(value_key, display_label, sort_order)
where p.preset_key = 'film_media_production' on conflict (preset_id, field_key, value_key) do nothing;

-- ── 7. Event Planning / Wedding Production ──
insert into preset_field_defaults (preset_id, field_key, active, display_label)
select p.id, f.field_key, f.active, f.display_label from industry_presets p
cross join (values
  ('job', true, 'Client / Host'), ('project', true, 'Event / Wedding Name'),
  ('scope', true, 'Function / Sub-Event'), ('cost_code', true, 'Budget Line Item'),
  ('classification', true, 'Service Category'), ('po', true, 'Vendor Contract / PO'),
  ('department', false, 'Department'), ('location', false, 'Location'),
  ('phase', true, 'Planning Milestone'), ('billable', true, 'Billing Status'),
  ('vendor_category', true, 'Vendor Category'), ('revenue_category', false, 'Revenue Category'),
  ('entity', false, 'Entity'), ('funding_source', false, 'Funding Source'),
  ('fiscal_period', false, 'Fiscal Period'), ('asset_unit', false, 'Asset Unit'),
  ('tax_classification', true, 'Tax Classification'), ('tax_form_box', true, '1099 Box')
) as f(field_key, active, display_label)
where p.preset_key = 'event_planning' on conflict (preset_id, field_key) do nothing;

insert into preset_field_value_defaults (preset_id, field_key, value_key, display_label, sort_order)
select p.id, 'classification', v.value_key, v.display_label, v.sort_order from industry_presets p
cross join (values
  ('venue_deposit_rental','Venue Deposit / Rental',10), ('catering_beverage','Catering & Beverage',20),
  ('floral_decor','Floral & Decor',30), ('av_entertainment','Audio / Visual & Entertainment',40),
  ('photography_video','Photography / Video',50), ('print_stationery','Print & Stationery',60),
  ('planning_fee_travel','Planning Fee / Travel',70)
) as v(value_key, display_label, sort_order)
where p.preset_key = 'event_planning' on conflict (preset_id, field_key, value_key) do nothing;

insert into preset_field_value_defaults (preset_id, field_key, value_key, display_label, sort_order)
select p.id, 'billable', v.value_key, v.display_label, v.sort_order from industry_presets p
cross join (values
  ('client_direct_reimbursable','Client Direct Reimbursable',10),
  ('pass_through_no_markup','Pass-Through (No Markup)',20),
  ('agency_fee_commissioned','Agency Fee / Commissioned',30),
  ('internal_overhead','Internal Overhead',40)
) as v(value_key, display_label, sort_order)
where p.preset_key = 'event_planning' on conflict (preset_id, field_key, value_key) do nothing;

-- ── 8. Retail / E-Commerce ──
insert into preset_field_defaults (preset_id, field_key, active, display_label)
select p.id, f.field_key, f.active, f.display_label from industry_presets p
cross join (values
  ('job', false, 'Job'), ('project', false, 'Project'),
  ('scope', false, 'Scope'), ('cost_code', false, 'Cost Code'),
  ('classification', true, 'Cost Category'), ('po', true, 'Merchandise PO'),
  ('department', true, 'Merchandise Department'), ('location', true, 'Store Location / Sales Channel'),
  ('phase', false, 'Phase'), ('billable', false, 'Billing Status'),
  ('vendor_category', true, 'Supplier Category'), ('revenue_category', true, 'Sales Channel / Line'),
  ('entity', false, 'Entity'), ('funding_source', false, 'Funding Source'),
  ('fiscal_period', false, 'Fiscal Period'), ('asset_unit', false, 'Asset Unit'),
  ('tax_classification', true, 'Tax Classification'), ('tax_form_box', true, '1099 Box')
) as f(field_key, active, display_label)
where p.preset_key = 'retail_ecommerce' on conflict (preset_id, field_key) do nothing;

insert into preset_field_value_defaults (preset_id, field_key, value_key, display_label, sort_order)
select p.id, 'classification', v.value_key, v.display_label, v.sort_order from industry_presets p
cross join (values
  ('inventory_cogs','Inventory / COGS',10), ('freight_inbound','Freight & Inbound Shipping',20),
  ('packaging_supplies','Packaging & Supplies',30), ('merchant_fees','Merchant Processing Fees',40),
  ('storage_fulfillment','Storage & Fulfillment',50), ('advertising_promotion','Advertising & Promotion',60),
  ('store_overhead','Store Overhead',70)
) as v(value_key, display_label, sort_order)
where p.preset_key = 'retail_ecommerce' on conflict (preset_id, field_key, value_key) do nothing;

-- ── 9. Salon / Spa / Personal Care ──
insert into preset_field_defaults (preset_id, field_key, active, display_label)
select p.id, f.field_key, f.active, f.display_label from industry_presets p
cross join (values
  ('job', false, 'Job'), ('project', false, 'Project'),
  ('scope', false, 'Scope'), ('cost_code', false, 'Cost Code'),
  ('classification', true, 'Product / Expense Type'), ('po', true, 'Supply Order PO'),
  ('department', true, 'Service Department'), ('location', true, 'Salon Branch / Site'),
  ('phase', false, 'Phase'), ('billable', false, 'Billing Status'),
  ('vendor_category', false, 'Vendor Category'), ('revenue_category', false, 'Revenue Category'),
  ('entity', false, 'Entity'), ('funding_source', false, 'Funding Source'),
  ('fiscal_period', false, 'Fiscal Period'), ('asset_unit', true, 'Station / Booth ID'),
  ('tax_classification', true, 'Tax Classification'), ('tax_form_box', true, '1099 Box')
) as f(field_key, active, display_label)
where p.preset_key = 'salon_spa' on conflict (preset_id, field_key) do nothing;

insert into preset_field_value_defaults (preset_id, field_key, value_key, display_label, sort_order)
select p.id, 'classification', v.value_key, v.display_label, v.sort_order from industry_presets p
cross join (values
  ('back_bar_supplies','Back-Bar Professional Supplies',10), ('retail_inventory','Retail Product Inventory',20),
  ('station_equipment','Station Equipment & Tools',30), ('linen_laundry','Linen & Laundry',40),
  ('contractor_commission','Contractor Commission Payout',50), ('facility_overhead','Facility Overhead',60)
) as v(value_key, display_label, sort_order)
where p.preset_key = 'salon_spa' on conflict (preset_id, field_key, value_key) do nothing;

-- ── 10. Healthcare Practice ──
insert into preset_field_defaults (preset_id, field_key, active, display_label)
select p.id, f.field_key, f.active, f.display_label from industry_presets p
cross join (values
  ('job', false, 'Job'), ('project', false, 'Project'),
  ('scope', false, 'Scope'), ('cost_code', false, 'Cost Code'),
  ('classification', true, 'Expense Category'), ('po', true, 'Purchase Order'),
  ('department', true, 'Specialty / Department'), ('location', true, 'Clinic Location / Site'),
  ('phase', false, 'Phase'), ('billable', false, 'Billing Status'),
  ('vendor_category', true, 'Supplier Type'), ('revenue_category', false, 'Revenue Category'),
  ('entity', false, 'Entity'), ('funding_source', false, 'Funding Source'),
  ('fiscal_period', false, 'Fiscal Period'), ('asset_unit', true, 'Medical Device / Suite ID'),
  ('tax_classification', true, 'Tax Classification'), ('tax_form_box', true, '1099 Box')
) as f(field_key, active, display_label)
where p.preset_key = 'healthcare_practice' on conflict (preset_id, field_key) do nothing;

insert into preset_field_value_defaults (preset_id, field_key, value_key, display_label, sort_order)
select p.id, 'classification', v.value_key, v.display_label, v.sort_order from industry_presets p
cross join (values
  ('medical_dental_supplies','Medical / Dental Supplies',10), ('pharmaceuticals','Pharmaceuticals',20),
  ('lab_fees','Laboratory Fees',30), ('equipment_maint_lease','Equipment Maintenance / Lease',40),
  ('ppe_disposal','PPE & Disposal Services',50), ('clearinghouse_billing','Clearinghouse & Billing Fees',60),
  ('admin_overhead','Administrative Overhead',70)
) as v(value_key, display_label, sort_order)
where p.preset_key = 'healthcare_practice' on conflict (preset_id, field_key, value_key) do nothing;

-- ── 11. Church / Religious Organization ──
insert into preset_field_defaults (preset_id, field_key, active, display_label)
select p.id, f.field_key, f.active, f.display_label from industry_presets p
cross join (values
  ('job', true, 'Ministry / Auxiliary'), ('project', true, 'Event / Mission Trip'),
  ('scope', false, 'Scope'), ('cost_code', false, 'Cost Code'),
  ('classification', true, 'Ministry Expense Class'), ('po', false, 'PO'),
  ('department', true, 'Department'), ('location', true, 'Campus / Building'),
  ('phase', false, 'Phase'), ('billable', false, 'Billing Status'),
  ('vendor_category', false, 'Vendor Category'), ('revenue_category', false, 'Revenue Category'),
  ('entity', false, 'Entity'), ('funding_source', true, 'Fund / Designation'),
  ('fiscal_period', true, 'Budget Cycle'), ('asset_unit', false, 'Asset Unit'),
  ('tax_classification', true, 'Tax Classification'), ('tax_form_box', true, '1099 Box')
) as f(field_key, active, display_label)
where p.preset_key = 'church_religious' on conflict (preset_id, field_key) do nothing;

insert into preset_field_value_defaults (preset_id, field_key, value_key, display_label, sort_order)
select p.id, 'classification', v.value_key, v.display_label, v.sort_order from industry_presets p
cross join (values
  ('worship_music','Worship & Music',10), ('youth_children','Youth & Children Ministry',20),
  ('outreach_missions','Community Outreach / Missions',30), ('facilities_utilities','Facilities & Utilities',40),
  ('honorariums_guests','Honorariums & Guest Speakers',50), ('admin_overhead','Administrative Overhead',60)
) as v(value_key, display_label, sort_order)
where p.preset_key = 'church_religious' on conflict (preset_id, field_key, value_key) do nothing;

insert into preset_field_value_defaults (preset_id, field_key, value_key, display_label, sort_order)
select p.id, 'tax_classification', v.value_key, v.display_label, v.sort_order from industry_presets p
cross join (values
  ('tax_exempt_purchase','Tax-Exempt Purchase',10), ('ubit','Unrelated Business Income (UBIT)',20),
  ('standard_taxable','Standard Taxable',30)
) as v(value_key, display_label, sort_order)
where p.preset_key = 'church_religious' on conflict (preset_id, field_key, value_key) do nothing;

-- ── 12. School / Childcare Center ──
insert into preset_field_defaults (preset_id, field_key, active, display_label)
select p.id, f.field_key, f.active, f.display_label from industry_presets p
cross join (values
  ('job', true, 'Classroom / Grade Level'), ('project', true, 'Program / Activity Fund'),
  ('scope', false, 'Scope'), ('cost_code', false, 'Cost Code'),
  ('classification', true, 'Instructional Expense Class'), ('po', false, 'PO'),
  ('department', true, 'Academic / Operations Dept'), ('location', true, 'Campus / Site'),
  ('phase', false, 'Phase'), ('billable', false, 'Billing Status'),
  ('vendor_category', false, 'Vendor Category'), ('revenue_category', false, 'Revenue Category'),
  ('entity', false, 'Entity'), ('funding_source', true, 'Grant / Funding Stream'),
  ('fiscal_period', true, 'School Year'), ('asset_unit', false, 'Asset Unit'),
  ('tax_classification', true, 'Tax Classification'), ('tax_form_box', true, '1099 Box')
) as f(field_key, active, display_label)
where p.preset_key = 'school_childcare' on conflict (preset_id, field_key) do nothing;

insert into preset_field_value_defaults (preset_id, field_key, value_key, display_label, sort_order)
select p.id, 'classification', v.value_key, v.display_label, v.sort_order from industry_presets p
cross join (values
  ('curriculum_textbooks','Curriculum & Textbooks',10), ('classroom_supplies','Classroom Supplies',20),
  ('food_nutrition','Food & Nutrition Program',30), ('playground_safety','Playground & Facility Safety',40),
  ('staff_training','Staff Training & Certifications',50), ('student_activities','Student Activities',60)
) as v(value_key, display_label, sort_order)
where p.preset_key = 'school_childcare' on conflict (preset_id, field_key, value_key) do nothing;

-- ── 13. Real Estate Property Management ──
insert into preset_field_defaults (preset_id, field_key, active, display_label)
select p.id, f.field_key, f.active, f.display_label from industry_presets p
cross join (values
  ('job', true, 'Property / Building'), ('project', true, 'Unit / Tenant Lease'),
  ('scope', true, 'Work Order / Issue'), ('cost_code', true, 'Maintenance Account'),
  ('classification', true, 'Expense Category'), ('po', true, 'Work Order / PO'),
  ('department', false, 'Department'), ('location', false, 'Location'),
  ('phase', false, 'Phase'), ('billable', true, 'Tenant Reimbursable (CAM)'),
  ('vendor_category', false, 'Vendor Category'), ('revenue_category', false, 'Revenue Category'),
  ('entity', false, 'Entity'), ('funding_source', false, 'Funding Source'),
  ('fiscal_period', false, 'Fiscal Period'), ('asset_unit', false, 'Asset Unit'),
  ('tax_classification', true, 'Tax Classification'), ('tax_form_box', true, '1099 Box')
) as f(field_key, active, display_label)
where p.preset_key = 'property_management' on conflict (preset_id, field_key) do nothing;

insert into preset_field_value_defaults (preset_id, field_key, value_key, display_label, sort_order)
select p.id, 'classification', v.value_key, v.display_label, v.sort_order from industry_presets p
cross join (values
  ('routine_repairs','Routine Repairs / Maintenance',10), ('turnover_makeready','Turnover / Make-Ready',20),
  ('utilities','Utilities',30), ('landscaping_grounds','Landscaping & Grounds',40),
  ('janitorial_trash','Janitorial & Trash',50), ('property_insurance_taxes','Property Insurance / Taxes',60),
  ('capital_improvements','Capital Improvements (CapEx)',70)
) as v(value_key, display_label, sort_order)
where p.preset_key = 'property_management' on conflict (preset_id, field_key, value_key) do nothing;

insert into preset_field_value_defaults (preset_id, field_key, value_key, display_label, sort_order)
select p.id, 'billable', v.value_key, v.display_label, v.sort_order from industry_presets p
cross join (values
  ('cam_reimbursable','Common Area Maintenance (CAM) Reimbursable',10),
  ('direct_tenant_charge','Direct Tenant Charge',20),
  ('non_reimbursable_owner_cost','Non-Reimbursable Owner Cost',30)
) as v(value_key, display_label, sort_order)
where p.preset_key = 'property_management' on conflict (preset_id, field_key, value_key) do nothing;

-- ── 14. Manufacturing ──
insert into preset_field_defaults (preset_id, field_key, active, display_label)
select p.id, f.field_key, f.active, f.display_label from industry_presets p
cross join (values
  ('job', true, 'Customer / Sales Order'), ('project', true, 'Production Order / Job'),
  ('scope', true, 'Assembly / Sub-Assembly'), ('cost_code', true, 'Operation / Routing Code'),
  ('classification', true, 'Cost Element'), ('po', true, 'Purchase Order'),
  ('department', true, 'Work Center / Dept'), ('location', false, 'Location'),
  ('phase', true, 'Production Phase'), ('billable', false, 'Billing Status'),
  ('vendor_category', false, 'Vendor Category'), ('revenue_category', false, 'Revenue Category'),
  ('entity', false, 'Entity'), ('funding_source', false, 'Funding Source'),
  ('fiscal_period', false, 'Fiscal Period'), ('asset_unit', true, 'Machine / Line ID'),
  ('tax_classification', true, 'Tax Classification'), ('tax_form_box', true, '1099 Box')
) as f(field_key, active, display_label)
where p.preset_key = 'manufacturing' on conflict (preset_id, field_key) do nothing;

insert into preset_field_value_defaults (preset_id, field_key, value_key, display_label, sort_order)
select p.id, 'classification', v.value_key, v.display_label, v.sort_order from industry_presets p
cross join (values
  ('direct_raw_materials','Direct Raw Materials',10), ('direct_labor','Direct Labor',20),
  ('outside_processing','Outside Processing / Subcontract',30), ('tooling_consumables','Tooling & Consumables',40),
  ('factory_overhead_energy','Factory Overhead / Energy',50), ('scrap_allowance','Scrap / Scrap Allowance',60),
  ('packaging_shipping','Packaging / Shipping',70)
) as v(value_key, display_label, sort_order)
where p.preset_key = 'manufacturing' on conflict (preset_id, field_key, value_key) do nothing;

-- ── 15. HOA / COA ──
insert into preset_field_defaults (preset_id, field_key, active, display_label)
select p.id, f.field_key, f.active, f.display_label from industry_presets p
cross join (values
  ('job', true, 'Association / Community'), ('project', false, 'Project'),
  ('scope', false, 'Scope'), ('cost_code', false, 'Cost Code'),
  ('classification', true, 'Budget Line Item'), ('po', true, 'Vendor Contract / PO'),
  ('department', false, 'Department'), ('location', true, 'Zone / Common Area'),
  ('phase', false, 'Phase'), ('billable', false, 'Billing Status'),
  ('vendor_category', false, 'Vendor Category'), ('revenue_category', false, 'Revenue Category'),
  ('entity', false, 'Entity'), ('funding_source', true, 'Fund Type (Reserve vs Operating)'),
  ('fiscal_period', true, 'Fiscal Year'), ('asset_unit', false, 'Asset Unit'),
  ('tax_classification', true, 'Tax Classification'), ('tax_form_box', true, '1099 Box')
) as f(field_key, active, display_label)
where p.preset_key = 'hoa_coa' on conflict (preset_id, field_key) do nothing;

insert into preset_field_value_defaults (preset_id, field_key, value_key, display_label, sort_order)
select p.id, 'classification', v.value_key, v.display_label, v.sort_order from industry_presets p
cross join (values
  ('landscaping_grounds','Landscaping & Grounds',10), ('pool_clubhouse','Pool & Clubhouse Maintenance',20),
  ('utilities_common','Utilities (Common Area)',30), ('security_patrol','Security & Patrol',40),
  ('insurance_legal','Insurance & Legal',50), ('management_fees','Management Fees',60),
  ('reserve_fund_expenditures','Reserve Fund Expenditures',70)
) as v(value_key, display_label, sort_order)
where p.preset_key = 'hoa_coa' on conflict (preset_id, field_key, value_key) do nothing;

-- ── 16. Real Estate Investor / Flipper ──
insert into preset_field_defaults (preset_id, field_key, active, display_label)
select p.id, f.field_key, f.active, f.display_label from industry_presets p
cross join (values
  ('job', true, 'Property Address / Deal'), ('project', true, 'Phase / Work Area'),
  ('scope', true, 'Scope of Work'), ('cost_code', true, 'Cost Code'),
  ('classification', true, 'Cost Category'), ('po', true, 'Contractor PO'),
  ('department', false, 'Department'), ('location', false, 'Location'),
  ('phase', false, 'Phase'), ('billable', false, 'Billing Status'),
  ('vendor_category', false, 'Vendor Category'), ('revenue_category', false, 'Revenue Category'),
  ('entity', true, 'Holding LLC / Entity'), ('funding_source', false, 'Funding Source'),
  ('fiscal_period', false, 'Fiscal Period'), ('asset_unit', false, 'Asset Unit'),
  ('tax_classification', true, 'Tax Classification'), ('tax_form_box', true, '1099 Box')
) as f(field_key, active, display_label)
where p.preset_key = 'real_estate_investor' on conflict (preset_id, field_key) do nothing;

insert into preset_field_value_defaults (preset_id, field_key, value_key, display_label, sort_order)
select p.id, 'classification', v.value_key, v.display_label, v.sort_order from industry_presets p
cross join (values
  ('acquisition_costs','Acquisition Costs',10), ('materials_supplies','Materials & Supplies',20),
  ('contractor_labor','Contractor Labor',30), ('permits_holding_costs','Permits & Holding Costs',40),
  ('utilities_security','Utilities & Security',50), ('staging_listing_fees','Staging & Listing Fees',60),
  ('financing_interest_points','Financing Interest / Points',70)
) as v(value_key, display_label, sort_order)
where p.preset_key = 'real_estate_investor' on conflict (preset_id, field_key, value_key) do nothing;

insert into preset_field_value_defaults (preset_id, field_key, value_key, display_label, sort_order)
select p.id, 'tax_classification', v.value_key, v.display_label, v.sort_order from industry_presets p
cross join (values
  ('capitalized_cost_basis','Capitalized Cost (Basis)',10),
  ('immediately_deductible','Immediately Deductible Expense',20),
  ('selling_expense','Selling Expense',30)
) as v(value_key, display_label, sort_order)
where p.preset_key = 'real_estate_investor' on conflict (preset_id, field_key, value_key) do nothing;

-- ── 17. Veterinary Practice ──
insert into preset_field_defaults (preset_id, field_key, active, display_label)
select p.id, f.field_key, f.active, f.display_label from industry_presets p
cross join (values
  ('job', false, 'Job'), ('project', false, 'Project'),
  ('scope', false, 'Scope'), ('cost_code', false, 'Cost Code'),
  ('classification', true, 'Expense Category'), ('po', true, 'Supply Order PO'),
  ('department', true, 'Department'), ('location', true, 'Clinic Branch'),
  ('phase', false, 'Phase'), ('billable', false, 'Billing Status'),
  ('vendor_category', true, 'Supplier Category'), ('revenue_category', false, 'Revenue Category'),
  ('entity', false, 'Entity'), ('funding_source', false, 'Funding Source'),
  ('fiscal_period', false, 'Fiscal Period'), ('asset_unit', true, 'Equipment / Suite ID'),
  ('tax_classification', true, 'Tax Classification'), ('tax_form_box', true, '1099 Box')
) as f(field_key, active, display_label)
where p.preset_key = 'veterinary' on conflict (preset_id, field_key) do nothing;

insert into preset_field_value_defaults (preset_id, field_key, value_key, display_label, sort_order)
select p.id, 'classification', v.value_key, v.display_label, v.sort_order from industry_presets p
cross join (values
  ('pharmaceuticals_vaccines','Pharmaceuticals & Vaccines',10), ('surgical_medical_supplies','Surgical & Medical Supplies',20),
  ('lab_diagnostic','Lab Diagnostic Services',30), ('pet_food_boarding','Pet Food & Boarding Supplies',40),
  ('waste_cremation','Waste Management & Cremation',50), ('facility_maintenance','Facility Maintenance',60),
  ('admin_overhead','Administrative Overhead',70)
) as v(value_key, display_label, sort_order)
where p.preset_key = 'veterinary' on conflict (preset_id, field_key, value_key) do nothing;

-- ── 18. Fitness / Gym ──
insert into preset_field_defaults (preset_id, field_key, active, display_label)
select p.id, f.field_key, f.active, f.display_label from industry_presets p
cross join (values
  ('job', false, 'Job'), ('project', false, 'Project'),
  ('scope', false, 'Scope'), ('cost_code', false, 'Cost Code'),
  ('classification', true, 'Expense Category'), ('po', true, 'Purchase Order'),
  ('department', true, 'Department'), ('location', true, 'Club / Facility Location'),
  ('phase', false, 'Phase'), ('billable', false, 'Billing Status'),
  ('vendor_category', false, 'Vendor Category'), ('revenue_category', false, 'Revenue Category'),
  ('entity', false, 'Entity'), ('funding_source', false, 'Funding Source'),
  ('fiscal_period', false, 'Fiscal Period'), ('asset_unit', true, 'Equipment Unit ID'),
  ('tax_classification', true, 'Tax Classification'), ('tax_form_box', true, '1099 Box')
) as f(field_key, active, display_label)
where p.preset_key = 'fitness_gym' on conflict (preset_id, field_key) do nothing;

insert into preset_field_value_defaults (preset_id, field_key, value_key, display_label, sort_order)
select p.id, 'classification', v.value_key, v.display_label, v.sort_order from industry_presets p
cross join (values
  ('equipment_lease_maint','Exercise Equipment Lease/Maint',10), ('trainer_payroll_commissions','Trainer Payroll / Commissions',20),
  ('cleaning_towel_service','Facility Cleaning & Towel Service',30), ('supplements_proshop_cogs','Supplements & Pro Shop COGS',40),
  ('utilities_locker_room','Utilities & Locker Room',50), ('software_member_portal','Software / Member Portal',60),
  ('marketing','Marketing',70)
) as v(value_key, display_label, sort_order)
where p.preset_key = 'fitness_gym' on conflict (preset_id, field_key, value_key) do nothing;

-- ── STANDARD PICKLISTS — applied to every preset that uses the
--    unmodified set (Billable, Tax Classification, 1099 Box) ──

insert into preset_field_value_defaults (preset_id, field_key, value_key, display_label, sort_order)
select p.id, 'billable', v.value_key, v.display_label, v.sort_order from industry_presets p
cross join (values
  ('billable','Billable',10), ('non_billable','Non-Billable',20),
  ('pass_through','Pass-Through',30), ('internal','Internal Overhead',40)
) as v(value_key, display_label, sort_order)
where p.preset_key in ('creative_agency','architecture_engineering','film_media_production')
on conflict (preset_id, field_key, value_key) do nothing;

insert into preset_field_value_defaults (preset_id, field_key, value_key, display_label, sort_order)
select p.id, 'tax_classification', v.value_key, v.display_label, v.sort_order from industry_presets p
cross join (values
  ('taxable','Taxable',10), ('tax_exempt','Tax-Exempt',20), ('reduced_rate','Reduced Rate',30),
  ('zero_rated_export','Zero-Rated / Export',40), ('capex','Capital Expenditure (CapEx)',50)
) as v(value_key, display_label, sort_order)
where p.preset_key in (
  'creative_agency','architecture_engineering','landscaping','auto_repair','hospitality_hotel',
  'event_planning','retail_ecommerce','salon_spa','healthcare_practice','school_childcare',
  'property_management','manufacturing','hoa_coa','veterinary','fitness_gym'
)
on conflict (preset_id, field_key, value_key) do nothing;

insert into preset_field_value_defaults (preset_id, field_key, value_key, display_label, sort_order)
select p.id, 'tax_form_box', v.value_key, v.display_label, v.sort_order from industry_presets p
cross join (values
  ('nec','NEC - Nonemployee Comp',10), ('misc_rents','MISC - Rents',20),
  ('misc_medical','MISC - Medical/Health',30), ('misc_royalties','MISC - Royalties',40),
  ('misc_attorney','MISC - Attorney Fees',50), ('misc_other','MISC - Other',60),
  ('not_1099','Not 1099 Reportable',70)
) as v(value_key, display_label, sort_order)
where p.preset_key in (
  'creative_agency','architecture_engineering','landscaping','auto_repair','hospitality_hotel',
  'film_media_production','event_planning','retail_ecommerce','salon_spa','healthcare_practice',
  'church_religious','school_childcare','property_management','manufacturing','hoa_coa',
  'real_estate_investor','veterinary','fitness_gym'
)
on conflict (preset_id, field_key, value_key) do nothing;
