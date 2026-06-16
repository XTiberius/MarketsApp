-- 012_logos_storage_policies.sql
--
-- The public `logos` bucket (created in 001) had NO storage.objects RLS policies,
-- so admin logo uploads fail with "new row violates row-level security policy"
-- (same gap that 008/009 fixed for signatures/documents). Add:
--   * admins may upload/update/delete logos
--   * anyone may read logos (bucket is public, used as a CDN on listing cards)
-- Idempotent and safe to re-run.

-- Admins upload logos.
drop policy if exists "Admins: upload logos" on storage.objects;
create policy "Admins: upload logos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'logos' and public.is_admin());

-- Admins update/replace logos.
drop policy if exists "Admins: update logos" on storage.objects;
create policy "Admins: update logos"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'logos' and public.is_admin());

-- Admins delete logos.
drop policy if exists "Admins: delete logos" on storage.objects;
create policy "Admins: delete logos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'logos' and public.is_admin());

-- Anyone may read logos (public CDN).
drop policy if exists "Anyone: read logos" on storage.objects;
create policy "Anyone: read logos"
  on storage.objects for select
  to public
  using (bucket_id = 'logos');
