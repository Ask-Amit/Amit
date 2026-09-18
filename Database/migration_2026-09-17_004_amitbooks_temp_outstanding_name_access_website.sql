-- ══════════════════════════════════════════════
-- AmitBooks — Outstanding: Name (sub-account), Website, and encrypted
-- Access fields. Ryan's direct instruction, 2026-09-17.
--
-- sub_account_name — a second name field alongside vendor_name, so
-- multiple sub-accounts under the same parent vendor (e.g. several
-- Chase accounts) can be told apart while still being groupable/
-- filterable by the shared vendor_name.
--
-- website_url — plain text, a clickable link column.
--
-- access_encrypted/access_iv — real client-side AES-256-GCM ciphertext,
-- same zero-knowledge model as the existing Company/Contact SSN vault
-- (see abDeriveVaultKey/unlockCompanyVault in NEW.html) — Amit never
-- sees the plaintext, and a lost passphrase makes it permanently
-- unrecoverable, by design, same as those.
--
-- ab_temp_outstanding_vault — this table's own vault salt, one row per
-- user. The existing SSN vault keys its salt off a book or a company
-- (books.vault_salt / companies.vault_salt) because those are what a
-- contact/SSN is scoped to. Outstanding isn't scoped to a book or
-- company at all (Ryan's own correction, earlier this session) — it's
-- scoped to the login — so its vault salt needs its own home the same
-- shape, just keyed by user_id instead.
-- ══════════════════════════════════════════════
alter table ab_temp_outstanding_balances add column if not exists sub_account_name text;
alter table ab_temp_outstanding_balances add column if not exists website_url text;
alter table ab_temp_outstanding_balances add column if not exists access_encrypted text;
alter table ab_temp_outstanding_balances add column if not exists access_iv text;

create table if not exists ab_temp_outstanding_vault (
  user_id uuid primary key default auth.uid(),
  vault_salt text not null,
  created_at timestamptz not null default now()
);
alter table ab_temp_outstanding_vault enable row level security;
create policy "ab_temp_outstanding_vault_owner_manage" on ab_temp_outstanding_vault for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

comment on table ab_temp_outstanding_vault is 'Vault salt for the Outstanding page''s Access field, one row per user (auth.uid()). Temporary, same as ab_temp_outstanding_balances — retire together.';
