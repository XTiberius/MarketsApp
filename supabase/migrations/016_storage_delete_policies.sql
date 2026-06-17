-- 016_storage_delete_policies.sql
--
-- Admins can DELETE objects in the private document buckets. Migrations 009
-- (`documents`) and 014 (`listing-docs`) added admin INSERT/SELECT policies but
-- no DELETE policy, so removing/replacing a document — and rolling back an
-- orphaned direct upload — failed at the storage layer. Add the missing admin
-- DELETE policies. Idempotent: drop-if-exists → create.

drop policy if exists "Admins: delete documents" on storage.objects;
create policy "Admins: delete documents"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'documents' and public.is_admin());

drop policy if exists "Admins: delete listing-docs" on storage.objects;
create policy "Admins: delete listing-docs"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'listing-docs' and public.is_admin());
