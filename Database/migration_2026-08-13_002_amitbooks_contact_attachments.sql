-- ══════════════════════════════════════════════
-- AmitBooks — Contact Attachments: real files (photos, scans, PDFs)
-- attached to a contact, many per contact. Ryan's direct instruction,
-- 2026-08-13: an employee needs their W-2/W-4 kept with them, a vendor
-- their sales tax certificate or a picture of their EIN, a subcontractor
-- proof of insurance — "we don't wanna clutter up the database with all
-- the data, but we do need a way of keeping track of documents."
--
-- The actual file bytes live in Supabase Storage (a real object store),
-- never in a database column — this table holds only metadata: which
-- contact, what the file is called, a free-text label for what it
-- actually is ("W-2", "Sales Tax Certificate", "Insurance"), and the
-- storage path to fetch it by. Many rows per contact_id — a real
-- one-to-many, not a fixed set of slots.
--
-- Storage path convention: {book_id}/{contact_id}/{timestamp}-{filename}
-- — the leading book_id segment is what the storage RLS policy below
-- checks against _amitbooks_is_book_member, the same membership check
-- every other AmitBooks table already uses. Bucket is NOT public — files
-- are only ever reached through a signed URL generated for a real,
-- authenticated book member, never a guessable public link.
-- ══════════════════════════════════════════════
create table if not exists contact_attachments (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references books(id) on delete cascade,
  contact_id uuid not null references contacts(id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  label text,
  uploaded_at timestamptz not null default now()
);
alter table contact_attachments enable row level security;
create policy "contact_attachments_via_membership" on contact_attachments for all
  using (_amitbooks_is_book_member(book_id)) with check (_amitbooks_is_book_member(book_id));

insert into storage.buckets (id, name, public)
values ('amitbooks-attachments', 'amitbooks-attachments', false)
on conflict (id) do nothing;

create policy "amitbooks_attachments_via_membership" on storage.objects for all
  using (bucket_id = 'amitbooks-attachments' and _amitbooks_is_book_member((storage.foldername(name))[1]::uuid))
  with check (bucket_id = 'amitbooks-attachments' and _amitbooks_is_book_member((storage.foldername(name))[1]::uuid));
