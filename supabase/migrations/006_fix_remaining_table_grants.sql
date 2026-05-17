-- 006_fix_remaining_table_grants.sql
--
-- Same defect as migrations 003 (users) and 005 (listings): migration 001
-- created these tables with no GRANT statements, and Supabase's default
-- privileges did not apply. Without these grants the investor and admin
-- flows hit "permission denied for table ..." on read/write.
--
-- Idempotent — re-granting an existing privilege is a harmless no-op.
-- RLS still gates every row. None of these tables are read anonymously, so
-- no grant is issued to the anon role.
--
-- DELETE is intentionally omitted: no feature deletes these rows, and the
-- "manage own" RLS policies on kyc_individual / kyc_entity / nda_signatures
-- are FOR ALL — granting DELETE would let an investor delete their own KYC
-- or NDA records. Add a DELETE grant per-table only when a real delete
-- feature is built.

grant select, insert, update on table public.bids                 to authenticated;
grant select, insert, update on table public.kyc_individual       to authenticated;
grant select, insert, update on table public.kyc_entity           to authenticated;
grant select, insert, update on table public.associated_documents to authenticated;
grant select, insert, update on table public.nda_signatures       to authenticated;
