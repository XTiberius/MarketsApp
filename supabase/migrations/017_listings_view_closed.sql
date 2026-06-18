-- 017_listings_view_closed.sql
--
-- Closed listings should stay VIEWABLE to authenticated users so the new
-- Active/Closed badge + filter work and a closed deal remains browsable — they
-- simply stop accepting new bids (enforced in the app + the bids API). Widen the
-- authenticated read policy from published-only to published OR closed. Drafts
-- stay hidden; admins are unaffected (is_admin). Idempotent.

drop policy if exists "Authenticated: view published listings" on public.listings;
drop policy if exists "Authenticated: view active or closed listings" on public.listings;
create policy "Authenticated: view active or closed listings"
  on public.listings for select
  to authenticated
  using (status in ('published', 'closed'));
