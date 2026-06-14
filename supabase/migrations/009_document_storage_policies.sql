-- 009_document_storage_policies.sql
--
-- Same gap as migration 008 (signatures): the private 'documents' storage
-- bucket created in migration 001 has no storage.objects RLS policies, so
-- every upload/read is rejected. Admin document uploads (/api/documents)
-- would fail with "new row violates row-level security policy".
--
-- PATH: /api/documents uploads to  {bid_id}/{file}  inside the 'documents'
-- bucket, so the bid_id is the first path segment:
-- (storage.foldername(name))[1].

-- Admins upload documents.
drop policy if exists "Admins: upload documents" on storage.objects;
create policy "Admins: upload documents"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'documents'
    and public.is_admin()
  );

-- Admins read every document.
drop policy if exists "Admins: read all documents" on storage.objects;
create policy "Admins: read all documents"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'documents'
    and public.is_admin()
  );

-- Investors read documents only for bids they own. The bid_id is the first
-- path segment. The subquery is itself gated by the bids RLS policy
-- "Investors: view own bids", so an investor can only ever match own bids.
drop policy if exists "Investors: read documents for own bids" on storage.objects;
create policy "Investors: read documents for own bids"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'documents'
    and exists (
      select 1 from public.bids b
      where b.id = ((storage.foldername(name))[1])::uuid
        and b.investor_id = auth.uid()
    )
  );
