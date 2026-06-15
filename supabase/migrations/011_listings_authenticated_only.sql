-- 011_listings_authenticated_only.sql
--
-- Make published listings PRIVATE: only signed-in (authenticated) users may
-- read them. Previously "Public: view published listings" + `grant select to
-- anon` let the public anon key read every published listing directly from the
-- Supabase REST API, bypassing any app-level gate.
--
-- After this migration:
--   * authenticated users still see published listings (server queries carry
--     the user's session, so they run as `authenticated`);
--   * admins are unaffected ("Admins: full listing access" via is_admin());
--   * the anon role has neither a matching SELECT policy nor the table grant,
--     so it reads zero listings.
--
-- Idempotent and safe to re-run.

-- Replace the public-read policy with an authenticated-only one.
drop policy if exists "Public: view published listings" on public.listings;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'listings'
      and policyname = 'Authenticated: view published listings'
  ) then
    create policy "Authenticated: view published listings"
      on public.listings for select
      to authenticated
      using (status = 'published');
  end if;
end $$;

-- Remove the anon role's ability to read the table at all.
revoke select on table public.listings from anon;
