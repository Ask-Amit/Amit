-- ══════════════════════════════════════════════
-- AmitScan — "Send to Amit" staging table + storage bucket.
--
-- This is the first half of getting a phone capture off the device and
-- into the cloud — NOT the full review/posting pipeline (that still
-- needs vendor-history autofill, PO lookup, Payment Source selection,
-- and the cross-book liability logic scoped in the AmitScan design
-- conversation, none of which exist yet). A row here just means "this
-- photo is safely backed up in Supabase, tagged with what kind of thing
-- it is." Turning it into a real Bill/Contact/Mileage record is the next
-- build phase, reading from this table.
--
-- Scoped by user_id, not book_id — these captures haven't been assigned
-- to a book yet (that assignment happens in the real review flow, along
-- with the Payment Source question). Idempotent — safe to re-run.
-- ══════════════════════════════════════════════

create table if not exists scan_captures (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('bill','receipt','contact','mileage','other')),
  storage_path text not null,
  captured_at timestamptz not null default now(),
  reviewed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table scan_captures enable row level security;

drop policy if exists "scan_captures_own_rows" on scan_captures;
create policy "scan_captures_own_rows" on scan_captures for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

insert into storage.buckets (id, name, public)
values ('amitscan-captures','amitscan-captures', false)
on conflict (id) do nothing;

drop policy if exists "amitscan_captures_own_folder" on storage.objects;
create policy "amitscan_captures_own_folder" on storage.objects for all
  using (
    bucket_id = 'amitscan-captures'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'amitscan-captures'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
