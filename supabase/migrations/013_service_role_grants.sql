-- 013_service_role_grants.sql
--
-- `service_role` (the privileged backend key used by the e2e test seeder and any
-- server-side admin task) was missing table grants on the public schema —
-- Supabase's default GRANT ALL to service_role was lost when earlier migrations
-- were applied manually (same root cause as 005/006/010 for anon/authenticated).
-- Symptom: "permission denied for table users/listings" (42501) when the seeder
-- talks to PostgREST as service_role. service_role bypasses RLS but still needs
-- the underlying SQL GRANTs. Idempotent and safe to re-run.

grant all privileges on all tables    in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;

-- cover objects created later, too
alter default privileges in schema public grant all on tables    to service_role;
alter default privileges in schema public grant all on sequences to service_role;
