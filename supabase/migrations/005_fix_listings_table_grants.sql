-- 005_fix_listings_table_grants.sql
--
-- Same defect as migration 003 (public.users): migration 001 created
-- public.listings with no GRANT statements and Supabase's default
-- privileges did not apply. Without these grants, admins hit
-- "permission denied for table listings" when creating/deleting a
-- listing, and anonymous visitors get an empty /listings page.
--
-- Idempotent — granting an already-granted privilege is a harmless no-op.
-- RLS still gates every row: "Public: view published listings" and
-- "Admins: full listing access" are unchanged.

grant select on table public.listings to anon;
grant select, insert, update, delete on table public.listings to authenticated;
