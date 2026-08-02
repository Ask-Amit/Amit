-- ══════════════════════════════════════════════
-- AmitBooks — Field defaults for the last 6 industries that only had
-- placeholder rows (restaurant, personal, nonprofit, logistics,
-- law_agency, freelance). Sourced from a second Gemini research pass,
-- Ryan-reviewed. Same shape as migration_2026-08-02_003. Gemini used
-- slightly different preset_key names in its answer (restaurant_bar,
-- personal_budgeting, trucking_logistics, legal_practice,
-- freelance_consulting) — mapped here onto the keys already seeded in
-- industry_presets rather than creating duplicate rows.
--
-- After this migration: 26 of 27 industries have real field defaults
-- (everything except 'custom', which stays intentionally empty).
--
-- Idempotent — safe to re-run.
-- ══════════════════════════════════════════════

-- ── Restaurant / Bar / Cafe ──
insert into preset_field_defaults (preset_id, field_key, active, display_label)
select p.id, f.field_key, f.active, f.display_label from industry_presets p
cross join (values
  ('job', false, 'Job'), ('project', true, 'Event / Catering Order'),
  ('scope', true, 'Shift / Service'), ('cost_code', false, 'Cost Code'),
  ('classification', true, 'Prime Cost & Expense Category'), ('po', true, 'Purchase Order / Vendor Invoice'),
  ('department', true, 'Cost Center'), ('location', true, 'Location / Store'),
  ('phase', false, 'Phase'), ('billable', false, 'Billing Status'),
  ('vendor_category', true, 'Vendor Category'), ('revenue_category', false, 'Revenue Category'),
  ('entity', false, 'Entity'), ('funding_source', false, 'Funding Source'),
  ('fiscal_period', false, 'Fiscal Period'), ('asset_unit', false, 'Asset Unit'),
  ('tax_classification', true, 'Tax Classification'), ('tax_form_box', true, '1099 Box')
) as f(field_key, active, display_label)
where p.preset_key = 'restaurant' on conflict (preset_id, field_key) do nothing;

insert into preset_field_value_defaults (preset_id, field_key, value_key, display_label, sort_order)
select p.id, 'classification', v.value_key, v.display_label, v.sort_order from industry_presets p
cross join (values
  ('cogs_food','Food COGS',10), ('cogs_beverage_alc','Beverage COGS (Alcohol)',20),
  ('cogs_beverage_nonalc','Beverage COGS (Non-Alcoholic)',30), ('labor_kitchen','Kitchen / BOH Labor',40),
  ('labor_service','Service / FOH Labor',50), ('operating_supplies','Paper, Smallwares & Operating Supplies',60),
  ('spoilage_waste','Spoilage, Waste & Comped Goods',70), ('facility_overhead','Rent, Utilities & Facility Maintenance',80)
) as v(value_key, display_label, sort_order)
where p.preset_key = 'restaurant' on conflict (preset_id, field_key, value_key) do nothing;

-- ── Personal Budgeting / Household ──
insert into preset_field_defaults (preset_id, field_key, active, display_label)
select p.id, f.field_key, f.active, f.display_label from industry_presets p
cross join (values
  ('job', true, 'Person / Account Owner'), ('project', false, 'Project'),
  ('scope', false, 'Scope'), ('cost_code', false, 'Cost Code'),
  ('classification', true, 'Expense Category'), ('po', false, 'PO'),
  ('department', false, 'Department'), ('location', true, 'Store / Merchant Location'),
  ('phase', false, 'Phase'), ('billable', false, 'Billing Status'),
  ('vendor_category', false, 'Vendor Category'), ('revenue_category', false, 'Revenue Category'),
  ('entity', false, 'Entity'), ('funding_source', false, 'Funding Source'),
  ('fiscal_period', false, 'Fiscal Period'), ('asset_unit', false, 'Asset Unit'),
  ('tax_classification', false, 'Tax Classification'), ('tax_form_box', false, '1099 Box')
) as f(field_key, active, display_label)
where p.preset_key = 'personal' on conflict (preset_id, field_key) do nothing;

insert into preset_field_value_defaults (preset_id, field_key, value_key, display_label, sort_order)
select p.id, 'classification', v.value_key, v.display_label, v.sort_order from industry_presets p
cross join (values
  ('groceries_food','Groceries & Food',10), ('housing_utilities','Housing & Utilities',20),
  ('transportation_fuel','Transportation & Fuel',30), ('health_medical','Health & Medical',40),
  ('entertainment_leisure','Entertainment, Dining & Leisure',50), ('subscriptions_recurring','Subscriptions & Recurring Bills',60),
  ('personal_shopping','Personal & Shopping',70), ('debt_savings_transfer','Debt Paydown & Savings Transfer',80)
) as v(value_key, display_label, sort_order)
where p.preset_key = 'personal' on conflict (preset_id, field_key, value_key) do nothing;

-- ── Nonprofit Organization / Charity ──
insert into preset_field_defaults (preset_id, field_key, active, display_label)
select p.id, f.field_key, f.active, f.display_label from industry_presets p
cross join (values
  ('job', true, 'Program / Mission Area'), ('project', true, 'Grant / Funding Source'),
  ('scope', true, 'Initiative / Event'), ('cost_code', true, 'Functional Expense Code'),
  ('classification', true, 'Functional Expense Class'), ('po', true, 'Purchase Order'),
  ('department', true, 'Department / Unit'), ('location', true, 'Site / Regional Office'),
  ('phase', false, 'Phase'), ('billable', false, 'Billing Status'),
  ('vendor_category', false, 'Vendor Category'), ('revenue_category', false, 'Revenue Category'),
  ('entity', false, 'Entity'), ('funding_source', true, 'Fund Restriction Status'),
  ('fiscal_period', true, 'Grant / Fiscal Year'), ('asset_unit', false, 'Asset Unit'),
  ('tax_classification', true, 'Tax Status'), ('tax_form_box', true, '1099 Box')
) as f(field_key, active, display_label)
where p.preset_key = 'nonprofit' on conflict (preset_id, field_key) do nothing;

insert into preset_field_value_defaults (preset_id, field_key, value_key, display_label, sort_order)
select p.id, 'classification', v.value_key, v.display_label, v.sort_order from industry_presets p
cross join (values
  ('program_services','Program Services (Direct Mission)',10), ('management_general','Management & General (Admin Overhead)',20),
  ('fundraising','Fundraising & Development',30), ('grant_disbursement','Direct Grant Disbursement',40),
  ('in_kind_goods_services','In-Kind Donated Goods & Services',50)
) as v(value_key, display_label, sort_order)
where p.preset_key = 'nonprofit' on conflict (preset_id, field_key, value_key) do nothing;

insert into preset_field_value_defaults (preset_id, field_key, value_key, display_label, sort_order)
select p.id, 'tax_classification', v.value_key, v.display_label, v.sort_order from industry_presets p
cross join (values
  ('exempt_standard','501(c)(3) Tax-Exempt Purchase',10), ('ubit_taxable','Unrelated Business Income Tax (UBIT)',20),
  ('capital_expenditure','Capital Expenditure (CapEx)',30)
) as v(value_key, display_label, sort_order)
where p.preset_key = 'nonprofit' on conflict (preset_id, field_key, value_key) do nothing;

-- ── Trucking, Freight, & Logistics ──
insert into preset_field_defaults (preset_id, field_key, active, display_label)
select p.id, f.field_key, f.active, f.display_label from industry_presets p
cross join (values
  ('job', true, 'Broker / Shipper Account'), ('project', true, 'Load / Trip Number'),
  ('scope', true, 'Route / Lane'), ('cost_code', false, 'Cost Code'),
  ('classification', true, 'Operating Expense Category'), ('po', true, 'Rate Confirmation / Dispatch PO'),
  ('department', false, 'Department'), ('location', true, 'Jurisdiction / IFTA State'),
  ('phase', false, 'Phase'), ('billable', true, 'Reimbursement / Pass-Through'),
  ('vendor_category', false, 'Vendor Category'), ('revenue_category', false, 'Revenue Category'),
  ('entity', false, 'Entity'), ('funding_source', false, 'Funding Source'),
  ('fiscal_period', false, 'Fiscal Period'), ('asset_unit', true, 'Truck / Trailer Unit ID'),
  ('tax_classification', true, 'Tax Classification'), ('tax_form_box', true, '1099 Box')
) as f(field_key, active, display_label)
where p.preset_key = 'logistics' on conflict (preset_id, field_key) do nothing;

insert into preset_field_value_defaults (preset_id, field_key, value_key, display_label, sort_order)
select p.id, 'classification', v.value_key, v.display_label, v.sort_order from industry_presets p
cross join (values
  ('fuel_reefer','Diesel & Reefer Fuel',10), ('tolls_scales','Tolls, Scales & Permits',20),
  ('driver_settlement','Driver Settlement / Payroll',30), ('broker_dispatch_fees','Broker Fees & Dispatch Commissions',40),
  ('equipment_maint_tires','Truck Maintenance, Repairs & Tires',50), ('lumper_detention','Lumper & Detention Costs',60),
  ('fleet_insurance','Fleet Insurance & Compliance',70)
) as v(value_key, display_label, sort_order)
where p.preset_key = 'logistics' on conflict (preset_id, field_key, value_key) do nothing;

insert into preset_field_value_defaults (preset_id, field_key, value_key, display_label, sort_order)
select p.id, 'billable', v.value_key, v.display_label, v.sort_order from industry_presets p
cross join (values
  ('pass_through_shipper','Shipper Reimbursable (Tolls/Lumper)',10),
  ('carrier_cost','Carrier Direct Operating Cost',20),
  ('non_billable_overhead','Fleet Overhead',30)
) as v(value_key, display_label, sort_order)
where p.preset_key = 'logistics' on conflict (preset_id, field_key, value_key) do nothing;

-- ── Law Firm / Legal Practice ──
insert into preset_field_defaults (preset_id, field_key, active, display_label)
select p.id, f.field_key, f.active, f.display_label from industry_presets p
cross join (values
  ('job', true, 'Client Account'), ('project', true, 'Matter / Case'),
  ('scope', true, 'Phase / Task'), ('cost_code', true, 'UTBMS / LEDES Activity Code'),
  ('classification', true, 'Disbursement & Cost Class'), ('po', true, 'Vendor / Subconsultant Contract'),
  ('department', true, 'Practice Group'), ('location', false, 'Location'),
  ('phase', false, 'Phase'), ('billable', true, 'Billing / Recovery Status'),
  ('vendor_category', false, 'Vendor Category'), ('revenue_category', false, 'Revenue Category'),
  ('entity', false, 'Entity'), ('funding_source', false, 'Funding Source'),
  ('fiscal_period', false, 'Fiscal Period'), ('asset_unit', false, 'Asset Unit'),
  ('tax_classification', true, 'Tax Classification'), ('tax_form_box', true, '1099 Box')
) as f(field_key, active, display_label)
where p.preset_key = 'law_agency' on conflict (preset_id, field_key) do nothing;

insert into preset_field_value_defaults (preset_id, field_key, value_key, display_label, sort_order)
select p.id, 'classification', v.value_key, v.display_label, v.sort_order from industry_presets p
cross join (values
  ('hard_cost_client_advance','Hard Cost - Client Advanced Expense (Court Fees, Transcripts)',10),
  ('soft_cost_internal','Soft Cost - Internal Allocations (Copies, Postage)',20),
  ('expert_witness_vendor','Expert Witness & Outside Vendor Fees',30),
  ('legal_research_tech','Legal Research & Practice Technology',40),
  ('travel_client','Client-Related Travel',50), ('firm_overhead','General Firm Overhead',60)
) as v(value_key, display_label, sort_order)
where p.preset_key = 'law_agency' on conflict (preset_id, field_key, value_key) do nothing;

insert into preset_field_value_defaults (preset_id, field_key, value_key, display_label, sort_order)
select p.id, 'billable', v.value_key, v.display_label, v.sort_order from industry_presets p
cross join (values
  ('billable_client','Billable to Client',10), ('non_billable_firm','Non-Billable Firm Overhead',20),
  ('written_off','Non-Recoverable / Written Off',30), ('trust_iolta_paid','Paid from Trust / IOLTA Escrow',40)
) as v(value_key, display_label, sort_order)
where p.preset_key = 'law_agency' on conflict (preset_id, field_key, value_key) do nothing;

-- ── Freelancer / Solo Consulting ──
insert into preset_field_defaults (preset_id, field_key, active, display_label)
select p.id, f.field_key, f.active, f.display_label from industry_presets p
cross join (values
  ('job', true, 'Client'), ('project', true, 'Project / Retainer'),
  ('scope', true, 'Deliverable / Task'), ('cost_code', false, 'Cost Code'),
  ('classification', true, 'Expense Category'), ('po', true, 'Client PO Number'),
  ('department', false, 'Department'), ('location', false, 'Location'),
  ('phase', false, 'Phase'), ('billable', true, 'Billing Status'),
  ('vendor_category', false, 'Vendor Category'), ('revenue_category', false, 'Revenue Category'),
  ('entity', false, 'Entity'), ('funding_source', false, 'Funding Source'),
  ('fiscal_period', false, 'Fiscal Period'), ('asset_unit', false, 'Asset Unit'),
  ('tax_classification', true, 'Tax Classification'), ('tax_form_box', true, '1099 Box')
) as f(field_key, active, display_label)
where p.preset_key = 'freelance' on conflict (preset_id, field_key) do nothing;

insert into preset_field_value_defaults (preset_id, field_key, value_key, display_label, sort_order)
select p.id, 'classification', v.value_key, v.display_label, v.sort_order from industry_presets p
cross join (values
  ('software_subscriptions','Software, Apps & Subscriptions',10), ('subcontractor_creative','Subcontractor & Freelance Help',20),
  ('hardware_equipment','Hardware & Office Equipment',30), ('travel_lodging','Travel, Mileage & Lodging',40),
  ('client_meals_entertainment','Client Meals & Entertainment',50), ('professional_services','Professional Fees (Legal, CPA)',60),
  ('home_office_overhead','Home Office & Utilities',70)
) as v(value_key, display_label, sort_order)
where p.preset_key = 'freelance' on conflict (preset_id, field_key, value_key) do nothing;

-- ── STANDARD PICKLISTS for this batch (unmodified sets) ──

insert into preset_field_value_defaults (preset_id, field_key, value_key, display_label, sort_order)
select p.id, 'billable', v.value_key, v.display_label, v.sort_order from industry_presets p
cross join (values
  ('billable','Billable',10), ('non_billable','Non-Billable',20),
  ('pass_through','Pass-Through',30), ('internal','Internal Overhead',40)
) as v(value_key, display_label, sort_order)
where p.preset_key in ('freelance')
on conflict (preset_id, field_key, value_key) do nothing;

insert into preset_field_value_defaults (preset_id, field_key, value_key, display_label, sort_order)
select p.id, 'tax_classification', v.value_key, v.display_label, v.sort_order from industry_presets p
cross join (values
  ('taxable','Taxable',10), ('tax_exempt','Tax-Exempt',20), ('reduced_rate','Reduced Rate',30),
  ('zero_rated_export','Zero-Rated / Export',40), ('capex','Capital Expenditure (CapEx)',50)
) as v(value_key, display_label, sort_order)
where p.preset_key in ('restaurant','logistics','law_agency','freelance')
on conflict (preset_id, field_key, value_key) do nothing;

insert into preset_field_value_defaults (preset_id, field_key, value_key, display_label, sort_order)
select p.id, 'tax_form_box', v.value_key, v.display_label, v.sort_order from industry_presets p
cross join (values
  ('nec','NEC - Nonemployee Comp',10), ('misc_rents','MISC - Rents',20),
  ('misc_medical','MISC - Medical/Health',30), ('misc_royalties','MISC - Royalties',40),
  ('misc_attorney','MISC - Attorney Fees',50), ('misc_other','MISC - Other',60),
  ('not_1099','Not 1099 Reportable',70)
) as v(value_key, display_label, sort_order)
where p.preset_key in ('restaurant','nonprofit','logistics','law_agency','freelance')
on conflict (preset_id, field_key, value_key) do nothing;
