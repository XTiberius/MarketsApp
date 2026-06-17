-- 014_platform_v1.sql
-- Platform features: minimum investment, expanded bid/investment state machine,
-- per-bid + per-listing documents, portfolio (active/closed + ROI), AI newsfeed,
-- and fundraising-round chart points.
--
-- Apply via the linked Supabase CLI (supabase db push) or the dashboard SQL editor.

-- ─── Enum extensions ──────────────────────────────────────────────────────────
-- Expanded bid lifecycle:
--   placed → pending_acceptance → accepted → documents_executed
--          → awaiting_payment → invested  (| rejected)
alter type bid_status add value if not exists 'pending_acceptance' after 'placed';
alter type bid_status add value if not exists 'documents_executed' after 'accepted';

-- Per-bid document categories for the structured workflow (kept alongside the
-- legacy investment_agreement/k1/reg_d/other values).
alter type document_type add value if not exists 'nii';                  -- Notice of Intended Investment
alter type document_type add value if not exists 'investment_doc';       -- executed investment documents (up to 4)
alter type document_type add value if not exists 'payment_instructions'; -- payment instructions PDF
alter type document_type add value if not exists 'filing';               -- post-invested filings (K-1s, etc.)

-- New enums (guarded so the migration is safe to re-run)
do $$ begin
  if not exists (select 1 from pg_type where typname = 'listing_doc_type') then
    create type listing_doc_type as enum ('memorandum', 'pitch_deck', 'other');
  end if;
  if not exists (select 1 from pg_type where typname = 'portfolio_status') then
    create type portfolio_status as enum ('active', 'closed');
  end if;
end $$;

-- ─── Listings: minimum investment + AI newsfeed toggle ────────────────────────
alter table public.listings
  add column if not exists minimum_investment  numeric(20,2),
  add column if not exists ai_newsfeed_enabled boolean not null default false;

-- ─── Bids: payment confirmation + portfolio tracking ──────────────────────────
alter table public.bids
  add column if not exists payment_confirmation text,            -- ≤100 words, off-platform payment receipt note
  add column if not exists invested_at          timestamptz,     -- set when status reaches 'invested'
  add column if not exists portfolio_status     portfolio_status,-- null until invested, then 'active'/'closed'
  add column if not exists invested_principal   numeric(20,2),   -- set by admin at close
  add column if not exists returned_principal   numeric(20,2),   -- set by admin at close
  add column if not exists closed_at            timestamptz;

-- ─── Per-bid documents: store the private storage path (signed on download) ───
-- (the legacy file_url column held a public URL, unusable on the private bucket)
alter table public.associated_documents
  add column if not exists storage_path text;

-- ─── Listing documents (memorandum + pitch deck), NDA-gated ───────────────────
create table if not exists public.listing_documents (
  id           uuid             primary key default gen_random_uuid(),
  listing_id   uuid             not null references public.listings(id) on delete cascade,
  doc_type     listing_doc_type not null,
  file_name    text             not null,
  storage_path text             not null,              -- path inside the private 'listing-docs' bucket
  uploaded_by  uuid             not null references public.users(id),
  created_at   timestamptz      not null default now()
);
create index listing_documents_listing_idx on public.listing_documents(listing_id);

-- ─── Fundraising rounds (chart points) ────────────────────────────────────────
create table if not exists public.funding_rounds (
  id             uuid          primary key default gen_random_uuid(),
  listing_id     uuid          not null references public.listings(id) on delete cascade,
  round_name     text          not null,                -- e.g. "Seed", "Series A"
  valuation      numeric(20,2) not null,
  event_date     date,                                  -- optional, for time-axis charts
  sequence_order int           not null default 0,      -- explicit ordering on the x-axis
  created_at     timestamptz   not null default now()
);
create index funding_rounds_listing_idx on public.funding_rounds(listing_id);

-- ─── AI newsfeed cache (one per listing) ──────────────────────────────────────
create table if not exists public.listing_newsfeed (
  id           uuid        primary key default gen_random_uuid(),
  listing_id   uuid        not null references public.listings(id) on delete cascade,
  bullets      jsonb       not null default '[]',       -- array of { text }
  disclosure   text        not null default '',
  generated_at timestamptz not null default now(),
  unique(listing_id)
);

-- ─── Row Level Security ───────────────────────────────────────────────────────
alter table public.listing_documents enable row level security;
alter table public.funding_rounds    enable row level security;
alter table public.listing_newsfeed  enable row level security;

-- Helper predicate (inline): investor has signed the NDA for this listing.
-- listing_documents
create policy "Admins: full listing_documents access"
  on public.listing_documents for all
  using (public.is_admin());

create policy "Investors: read listing_documents after NDA"
  on public.listing_documents for select
  using (
    exists (
      select 1 from public.nda_signatures n
      where n.listing_id = listing_documents.listing_id
        and n.investor_id = auth.uid()
    )
  );

-- funding_rounds
create policy "Admins: full funding_rounds access"
  on public.funding_rounds for all
  using (public.is_admin());

create policy "Investors: read funding_rounds after NDA"
  on public.funding_rounds for select
  using (
    exists (
      select 1 from public.nda_signatures n
      where n.listing_id = funding_rounds.listing_id
        and n.investor_id = auth.uid()
    )
  );

-- listing_newsfeed
create policy "Admins: full listing_newsfeed access"
  on public.listing_newsfeed for all
  using (public.is_admin());

create policy "Investors: read listing_newsfeed after NDA"
  on public.listing_newsfeed for select
  using (
    exists (
      select 1 from public.nda_signatures n
      where n.listing_id = listing_newsfeed.listing_id
        and n.investor_id = auth.uid()
    )
  );

-- ─── Grants (match repo convention: explicit grants to authenticated/service_role) ──
grant select, insert, update, delete on public.listing_documents to authenticated;
grant select, insert, update, delete on public.funding_rounds    to authenticated;
grant select, insert, update, delete on public.listing_newsfeed  to authenticated;
grant all on public.listing_documents to service_role;
grant all on public.funding_rounds    to service_role;
grant all on public.listing_newsfeed  to service_role;

-- ─── Private storage bucket for listing documents ─────────────────────────────
insert into storage.buckets (id, name, public)
values ('listing-docs', 'listing-docs', false)
on conflict (id) do nothing;

-- Path convention: {listing_id}/{timestamp}.{ext}  → first path segment = listing_id.
drop policy if exists "Admins: upload listing-docs" on storage.objects;
create policy "Admins: upload listing-docs"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'listing-docs' and public.is_admin());

drop policy if exists "Admins: read all listing-docs" on storage.objects;
create policy "Admins: read all listing-docs"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'listing-docs' and public.is_admin());

drop policy if exists "Investors: read listing-docs after NDA" on storage.objects;
create policy "Investors: read listing-docs after NDA"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'listing-docs'
    and exists (
      select 1 from public.nda_signatures n
      where n.listing_id = ((storage.foldername(name))[1])::uuid
        and n.investor_id = auth.uid()
    )
  );
