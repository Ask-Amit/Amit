-- ══════════════════════════════════════════════
-- AmitBooks — Contacts: shared, cross-account contact records.
--
-- Ryan's direct instruction, 2026-08-13: two completely separate
-- AmitBooks accounts (different companies, different logins) should be
-- able to connect to the SAME real-world contact so the core info —
-- name, phone, email, mailing/billing address — stays in sync between
-- them, live, without either side ever seeing the other's login. What
-- stays private per book: labels, payment terms, default account, and
-- every attachment — none of that is shared, ever.
--
-- Mechanism, exactly as discussed: a one-time, single-use CONNECT LINK
-- (a random token tied to one specific contact, not a login) that the
-- other party redeems from inside their own account. Redemption either
-- links to one of their own existing contacts (a real merge, since
-- Ryan's plan is entering vendors by hand now and connecting them
-- later) or creates a brand-new one on their side.
--
-- contact_entities — the shared core record. No book_id: this is the
-- one thing in AmitBooks that is genuinely NOT book-scoped, on purpose.
-- Everything else about a contact (labels, terms, default account,
-- attachments) stays on the existing book-scoped `contacts` row.
--
-- contacts.entity_id — nullable. NULL (the default, and the case for
-- every contact that exists today) means "fully local, not connected to
-- anyone" — nothing changes for existing data. Once set, the app treats
-- name/contact_name/phone/email/street_address/city_state/zip/billing_*
-- on contact_entities as the source of truth for that contact instead
-- of the same-named columns on the local `contacts` row (those columns
-- are left in place, untouched, as a pre-connection snapshot).
--
-- contact_connect_invites — the token itself. Owned/managed by the
-- inviting book under normal RLS. Redemption does NOT go through direct
-- table RLS (the redeeming party isn't a member of the inviting book,
-- by definition) — it goes through the two SECURITY DEFINER functions
-- below, which validate the token server-side instead of trusting a
-- client-side RLS policy to gate cross-account writes.
-- ══════════════════════════════════════════════
create table if not exists contact_entities (
  id uuid primary key default gen_random_uuid(),
  name text,
  contact_name text,
  phone text,
  email text,
  street_address text,
  city_state text,
  zip text,
  billing_street_address text,
  billing_city_state text,
  billing_zip text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table contact_entities enable row level security;

-- contacts.entity_id must exist BEFORE the policies below (they reference
-- it) — this column-add was originally placed after the policies, which
-- fails with "column c.entity_id does not exist" since Postgres resolves
-- policy definitions against the schema as it stands at creation time.
alter table contacts add column if not exists entity_id uuid references contact_entities(id) on delete set null;

-- Readable/writable only by someone whose own book has a contact
-- actually linked to this entity — i.e. only after a real connection
-- has happened, never by a stranger guessing an id.
create policy "contact_entities_select_if_linked" on contact_entities for select
  using (exists (select 1 from contacts c where c.entity_id = contact_entities.id and _amitbooks_is_book_member(c.book_id)));
create policy "contact_entities_update_if_linked" on contact_entities for update
  using (exists (select 1 from contacts c where c.entity_id = contact_entities.id and _amitbooks_is_book_member(c.book_id)))
  with check (exists (select 1 from contacts c where c.entity_id = contact_entities.id and _amitbooks_is_book_member(c.book_id)));
-- Insert is only ever performed by redeem_contact_invite() below (as the
-- function owner, which bypasses RLS) — no direct client insert path.

create table if not exists contact_connect_invites (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references books(id) on delete cascade,
  contact_id uuid not null references contacts(id) on delete cascade,
  token text not null unique,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked boolean not null default false,
  redeemed_by_book_id uuid references books(id) on delete set null,
  redeemed_by_contact_id uuid references contacts(id) on delete set null,
  redeemed_at timestamptz
);
alter table contact_connect_invites enable row level security;
create policy "contact_connect_invites_owner_manage" on contact_connect_invites for all
  using (_amitbooks_is_book_member(book_id)) with check (_amitbooks_is_book_member(book_id));

-- get_invite_preview — lets the redeeming party see who/what they're
-- about to connect to (the inviting contact's name) BEFORE they accept,
-- without ever granting them any other access to the inviting book. The
-- token itself is the capability; simply knowing it is what unlocks this
-- one read-only preview.
create or replace function get_invite_preview(p_token text)
returns table(business_name text, contact_person text, valid boolean, reason text)
language plpgsql security definer set search_path = public as $$
declare inv record; c record;
begin
  select * into inv from contact_connect_invites where token = p_token;
  if inv is null then return query select null::text,null::text,false,'That connect link is not valid.'; return; end if;
  if inv.revoked then return query select null::text,null::text,false,'That connect link has been revoked.'; return; end if;
  if inv.redeemed_at is not null then return query select null::text,null::text,false,'That connect link has already been used.'; return; end if;
  if inv.expires_at is not null and inv.expires_at < now() then return query select null::text,null::text,false,'That connect link has expired.'; return; end if;
  select * into c from contacts where id = inv.contact_id;
  if c is null then return query select null::text,null::text,false,'The original contact no longer exists.'; return; end if;
  return query select c.name, c.contact_name, true, null::text;
end; $$;
grant execute on function get_invite_preview(text) to authenticated;

-- redeem_contact_invite — the actual connect step. p_my_contact_id must
-- already be a real contact row in a book the caller belongs to (the app
-- creates it first — either an existing pick or a fresh insert — then
-- calls this). Runs as the function owner (bypasses contact_entities'
-- normal RLS just for the insert this performs), but every check inside
-- it is against the CALLING user's actual auth.uid()/book membership, so
-- nothing here grants broader access than "connect this one contact."
create or replace function redeem_contact_invite(p_token text, p_my_contact_id uuid)
returns uuid
language plpgsql security definer set search_path = public as $$
declare inv record; my_book_id uuid; ent_id uuid; src record;
begin
  select * into inv from contact_connect_invites where token = p_token for update;
  if inv is null then raise exception 'That connect link is not valid.'; end if;
  if inv.revoked then raise exception 'That connect link has been revoked.'; end if;
  if inv.redeemed_at is not null then raise exception 'That connect link has already been used.'; end if;
  if inv.expires_at is not null and inv.expires_at < now() then raise exception 'That connect link has expired.'; end if;

  select book_id into my_book_id from contacts where id = p_my_contact_id;
  if my_book_id is null or not _amitbooks_is_book_member(my_book_id) then
    raise exception 'You do not have access to that contact.';
  end if;
  if my_book_id = inv.book_id then
    raise exception 'That connect link belongs to your own book already.';
  end if;

  select * into src from contacts where id = inv.contact_id;
  if src is null then raise exception 'The original contact no longer exists.'; end if;

  if src.entity_id is not null then
    ent_id := src.entity_id;
  else
    insert into contact_entities (name,contact_name,phone,email,street_address,city_state,zip,billing_street_address,billing_city_state,billing_zip)
    values (src.name,src.contact_name,src.phone,src.email,src.street_address,src.city_state,src.zip,src.billing_street_address,src.billing_city_state,src.billing_zip)
    returning id into ent_id;
    update contacts set entity_id = ent_id where id = src.id;
  end if;

  update contacts set entity_id = ent_id where id = p_my_contact_id;
  update contact_connect_invites set redeemed_at = now(), redeemed_by_book_id = my_book_id, redeemed_by_contact_id = p_my_contact_id where id = inv.id;

  return ent_id;
end; $$;
grant execute on function redeem_contact_invite(text,uuid) to authenticated;
