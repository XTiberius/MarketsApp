-- 007_nda_signatures_per_listing.sql
--
-- An NDA is signed per investor per listing, BEFORE any bid exists. The
-- original nda_signatures table keyed off bid_id, which forced a bid to be
-- created first — backwards. This re-keys the table to (investor_id, listing_id).

-- The existing RLS policy references bid_id, so it must be dropped first.
drop policy if exists "Investors: manage own NDA signatures" on public.nda_signatures;

-- The old NDA flow never produced valid rows (it errored before inserting),
-- so there is no signature data worth migrating. Clear the table so the
-- NOT NULL columns below can be added cleanly.
truncate table public.nda_signatures;

-- Drop the bid linkage. This also drops the FK and the unique(bid_id)
-- constraint that depended on the column.
alter table public.nda_signatures drop column if exists bid_id;

-- Re-key to investor + listing.
alter table public.nda_signatures
  add column investor_id uuid not null references public.users(id)    on delete cascade,
  add column listing_id  uuid not null references public.listings(id) on delete cascade;

-- One NDA signature per investor per listing.
alter table public.nda_signatures
  add constraint nda_signatures_investor_listing_key unique (investor_id, listing_id);

-- Recreate the investor RLS policy, now keyed on investor_id directly
-- (no longer routed through the bids table).
create policy "Investors: manage own NDA signatures"
  on public.nda_signatures for all
  using (auth.uid() = investor_id)
  with check (auth.uid() = investor_id);

-- "Admins: view all NDA signatures" is unchanged — it uses is_admin().
