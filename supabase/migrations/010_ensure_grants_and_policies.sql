-- 010_ensure_grants_and_policies.sql
--
-- RECONCILE / ENSURE migration (table grants + public-schema policies). The
-- remote project's migrations were applied manually (no supabase link /
-- config.toml), so some grants from 003/005/006 are missing on the live DB.
-- Symptom: "permission denied for table listings" on the anonymous query.
--
-- Everything here is IDEMPOTENT and safe to run any number of times in the
-- Supabase SQL editor. RLS stays enabled and existing row policies are
-- unchanged — grants only control whether a role may touch a table at all;
-- RLS still filters which rows it sees.
--
-- NOTE: storage.objects RLS policies (migrations 008/009) are deliberately NOT
-- included here. The Supabase SQL editor usually cannot create policies on
-- storage.objects ("must be owner of table objects"), and a failure there would
-- roll back this whole script. Those policies are applied separately (via the
-- proper migration channel once the project is linked, or the Storage policy
-- UI). They are not needed for browse/login — only for NDA-signature and
-- document uploads.

-- ── Table grants (003 users, 005 listings, 006 remaining) ───────────────────
grant select on table public.listings to anon;
grant select, insert, update, delete on table public.listings to authenticated;
grant select, update on table public.users                       to authenticated;
grant select, insert, update on table public.bids                 to authenticated;
grant select, insert, update on table public.kyc_individual       to authenticated;
grant select, insert, update on table public.kyc_entity           to authenticated;
grant select, insert, update on table public.associated_documents to authenticated;
grant select, insert, update on table public.nda_signatures       to authenticated;

-- ── Self-insert profile policy (002, guarded so it never errors) ────────────
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'users'
      and policyname = 'Users: insert own profile'
  ) then
    create policy "Users: insert own profile"
      on public.users for insert with check (auth.uid() = id);
  end if;
end $$;

-- ── kyc_entity admin UPDATE policy (known gap; mirrors kyc_individual) ───────
drop policy if exists "Admins: update entity KYC" on public.kyc_entity;
create policy "Admins: update entity KYC"
  on public.kyc_entity for update using (public.is_admin());

-- storage.objects policies intentionally omitted — see header note. They live
-- in migrations 008 (signatures) and 009 (documents) and are applied via the
-- proper migration channel / Storage UI, not this manual SQL-editor run.
