-- 015_fixes.sql
--
-- Corrective migration for issues found in hands-on testing:
--
--  1. funding_rounds.amount_raised — new column (chart now plots valuation over
--     time and labels each point with name + valuation + amount raised).
--
--  2. `documents` bucket storage.objects policies — Bug A: admin NII upload failed
--     with "new row violates row-level security policy". Migration 009 declared
--     these policies, but the remote was originally migrated by hand via the SQL
--     editor, which CANNOT create storage.objects policies ("must be owner of
--     table objects"). A later `supabase db push` skipped 009 as already-applied,
--     so the documents-bucket policies were never actually created on the remote.
--     Re-declaring them here (a pending migration) makes `db push` create them via
--     the admin connection. Idempotent: drop-if-exists → create.
--
--  3. Bucket file_size_limit — Bug B: large pitch-deck PDFs (≈11 MB) failed to
--     upload. The private doc buckets were created with no explicit limit. Set a
--     generous explicit limit so large memoranda / decks are accepted.

-- ── 1. amount_raised on funding_rounds ───────────────────────────────────────
alter table public.funding_rounds
  add column if not exists amount_raised numeric(20,2);

-- ── 2. documents-bucket storage.objects policies (mirror migration 009) ───────
-- Path scheme: documents live at {bid_id}/{file}, so bid_id = foldername[1].
drop policy if exists "Admins: upload documents" on storage.objects;
create policy "Admins: upload documents"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'documents' and public.is_admin());

drop policy if exists "Admins: read all documents" on storage.objects;
create policy "Admins: read all documents"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'documents' and public.is_admin());

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

-- ── 3. Generous explicit size limit on the private document buckets (50 MB) ───
-- (Effective limit is min(bucket, project-global); see verification notes.)
update storage.buckets set file_size_limit = 52428800 where id in ('documents', 'listing-docs');
