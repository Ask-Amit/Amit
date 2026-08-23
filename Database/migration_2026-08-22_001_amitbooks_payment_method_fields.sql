-- ══════════════════════════════════════════════
-- AmitBooks — real "how they pay" fields, keyed off Preferred Method.
--
-- Credit Card on File stays reference-only: processor, card brand, last 4,
-- and a processor reference ID. No raw card number, expiry, or CVV is ever
-- stored here — that's a PCI-DSS scope boundary already decided earlier in
-- this build (2026-08-14) and it doesn't change here. Actually charging a
-- card goes through the real processor (Stripe/Square) using that
-- reference — this table only records that the arrangement exists.
--
-- Bank Transfer / ACH is different — real routing/account numbers aren't
-- governed by PCI-DSS the way card numbers are, and storing them directly
-- is the normal, expected shape for accounting software paying vendors or
-- receiving from clients via ACH (same as QuickBooks/ADP-style vendor
-- payment records). Stored in full here, per direct instruction.
-- ══════════════════════════════════════════════
alter table contact_billing_details add column if not exists card_processor text;
alter table contact_billing_details add column if not exists card_brand text;
alter table contact_billing_details add column if not exists card_last4 text;
alter table contact_billing_details add column if not exists card_processor_ref text;

alter table contact_billing_details add column if not exists ach_bank_name text;
alter table contact_billing_details add column if not exists ach_account_holder text;
alter table contact_billing_details add column if not exists ach_routing_number text;
alter table contact_billing_details add column if not exists ach_account_number text;
alter table contact_billing_details add column if not exists ach_account_type text;
