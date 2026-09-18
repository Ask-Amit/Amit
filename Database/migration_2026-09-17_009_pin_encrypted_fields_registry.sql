-- ══════════════════════════════════════════════
-- PIN Encryption field registry — Ryan's direct instruction, 2026-09-17:
-- a real, live list of every table/column protected by PIN Encryption
-- anywhere in the Amit system, so a PIN reset can find and clear ALL of
-- it automatically, not just whatever's hardcoded into one project's
-- reset button. This is the single source of truth going forward —
-- whenever ANY project adds a new PIN-encrypted field, it inserts one
-- row here (documented in root CLAUDE.md's PIN ENCRYPTION section).
--
-- Not sensitive data itself — just table/column NAMES, same idea as
-- dev_playbook (see Database\CLAUDE.md). Public read, so any project's
-- reset logic can query it live; writes happen only when a real new
-- field is being registered (a build-time step, not something an end
-- user ever does), so kept restricted rather than wide open.
-- ══════════════════════════════════════════════
create table if not exists amit_pin_encrypted_fields (
  id bigint generated always as identity primary key,
  table_name text not null,
  enc_column text not null,
  iv_column text,
  user_column text not null default 'user_id',
  label text,
  registered_at timestamptz not null default now(),
  unique(table_name, enc_column)
);
alter table amit_pin_encrypted_fields enable row level security;
create policy "amit_pin_encrypted_fields_read_all" on amit_pin_encrypted_fields for select using (true);
-- No insert/update/delete policy for regular users — rows are added the
-- same way any other schema change happens in this project (Amit hands
-- Ryan the SQL, Ryan runs it in the Supabase SQL Editor), not through
-- the app itself.

insert into amit_pin_encrypted_fields (table_name, enc_column, iv_column, user_column, label)
values ('ab_temp_outstanding_balances', 'access_encrypted', 'access_iv', 'user_id', 'AmitBooks Outstanding — vendor Password field')
on conflict do nothing;
