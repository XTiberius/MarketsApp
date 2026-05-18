-- 008_signature_storage_policies.sql
--
-- BUG: signing an NDA failed with "new row violates row-level security
-- policy". Migration 001 created the private 'signatures' storage bucket but
-- never created any RLS policies on storage.objects. storage.objects has RLS
-- enabled by default, so with no INSERT policy every upload is rejected
-- before it ever reaches the nda_signatures table.
--
-- /api/nda uploads to:  signatures/{investor_id}/{listing_id}/{file}.png
-- — the first path segment is the investor's UUID, which these policies match.

-- Investors upload signatures into their own (UUID-named) folder.
drop policy if exists "Investors: upload own signatures" on storage.objects;
create policy "Investors: upload own signatures"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'signatures'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Investors read their own signatures.
drop policy if exists "Investors: read own signatures" on storage.objects;
create policy "Investors: read own signatures"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'signatures'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admins read every signature.
drop policy if exists "Admins: read all signatures" on storage.objects;
create policy "Admins: read all signatures"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'signatures'
    and public.is_admin()
  );
