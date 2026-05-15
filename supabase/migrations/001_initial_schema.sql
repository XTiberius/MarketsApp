-- MarketsApp — Initial Schema
-- Paste this entire block into: Supabase Dashboard → SQL Editor → New query → Run

-- ─── Extensions ───────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Enums ────────────────────────────────────────────────────────────────────
create type user_role      as enum ('investor', 'admin');
create type kyc_status     as enum ('pending', 'approved', 'rejected');
create type entity_type    as enum ('LLC', 'Corp', 'Fund', 'Trust', 'Partnership', 'Other');
create type listing_type   as enum ('primary', 'secondary');
create type listing_status as enum ('draft', 'published', 'closed');
create type bid_status     as enum ('placed', 'accepted', 'awaiting_payment', 'invested', 'rejected');
create type document_type  as enum ('investment_agreement', 'k1', 'reg_d', 'other');

-- ─── Users ────────────────────────────────────────────────────────────────────
create table public.users (
  id          uuid        primary key references auth.users(id) on delete cascade,
  email       text        not null unique,
  role        user_role   not null default 'investor',
  kyc_status  kyc_status  not null default 'pending',
  created_at  timestamptz not null default now()
);

-- Auto-create profile row when a user signs up via Supabase Auth
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Admin helper (avoids RLS infinite recursion) ─────────────────────────────
-- All admin-check policies call this function instead of querying users directly.
create or replace function public.is_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ─── KYC Individual ───────────────────────────────────────────────────────────
create table public.kyc_individual (
  id                  uuid        primary key default uuid_generate_v4(),
  user_id             uuid        not null references public.users(id) on delete cascade,
  first_name          text        not null,
  last_name           text        not null,
  dob                 date        not null,
  address             text        not null,
  phone               text        not null,
  occupation          text        not null,
  accredited_investor boolean     not null default false,
  submitted_at        timestamptz,
  reviewed_at         timestamptz,
  admin_notes         text,
  unique(user_id)
);

-- ─── KYC Entity ───────────────────────────────────────────────────────────────
create table public.kyc_entity (
  id                  uuid        primary key default uuid_generate_v4(),
  user_id             uuid        not null references public.users(id) on delete cascade,
  entity_name         text        not null,
  entity_type         entity_type not null,
  ein                 text        not null,
  address             text        not null,
  phone               text        not null,
  owner_info          jsonb       not null default '{}',
  signatory_info      jsonb       not null default '{}',
  accredited_investor boolean     not null default false,
  submitted_at        timestamptz,
  reviewed_at         timestamptz,
  admin_notes         text,
  unique(user_id)
);

-- ─── Listings ─────────────────────────────────────────────────────────────────
create table public.listings (
  id                   uuid           primary key default uuid_generate_v4(),
  admin_id             uuid           not null references public.users(id),
  company_name         text           not null,
  logo_url             text,
  description          text           not null,
  valuation            numeric(20,2),
  amount_raised        numeric(20,2),
  investment_structure text,
  nda_text             text           not null default '',
  listing_type         listing_type   not null,
  industry             text           not null,
  status               listing_status not null default 'draft',
  created_at           timestamptz    not null default now(),
  updated_at           timestamptz    not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger listings_updated_at
  before update on public.listings
  for each row execute procedure public.set_updated_at();

-- ─── Bids ─────────────────────────────────────────────────────────────────────
create table public.bids (
  id            uuid          primary key default uuid_generate_v4(),
  investor_id   uuid          not null references public.users(id) on delete cascade,
  listing_id    uuid          not null references public.listings(id) on delete cascade,
  amount        numeric(20,2) not null check (amount >= 0),
  status        bid_status    not null default 'placed',
  nda_signed    boolean       not null default false,
  nda_signed_at timestamptz,
  created_at    timestamptz   not null default now(),
  updated_at    timestamptz   not null default now()
);

create trigger bids_updated_at
  before update on public.bids
  for each row execute procedure public.set_updated_at();

-- One active bid per investor per listing (rejected bids don't block a new one)
create unique index bids_investor_listing_unique
  on public.bids(investor_id, listing_id)
  where status <> 'rejected';

-- ─── Associated Documents ─────────────────────────────────────────────────────
create table public.associated_documents (
  id            uuid          primary key default uuid_generate_v4(),
  bid_id        uuid          not null references public.bids(id) on delete cascade,
  file_name     text          not null,
  file_url      text          not null,
  document_type document_type not null,
  uploaded_by   uuid          not null references public.users(id),
  uploaded_at   timestamptz   not null default now()
);

-- ─── NDA Signatures ───────────────────────────────────────────────────────────
create table public.nda_signatures (
  id                  uuid        primary key default uuid_generate_v4(),
  bid_id              uuid        not null references public.bids(id) on delete cascade,
  signature_image_url text        not null,
  signed_at           timestamptz not null default now(),
  unique(bid_id)
);

-- ─── Row Level Security ───────────────────────────────────────────────────────
alter table public.users                enable row level security;
alter table public.kyc_individual       enable row level security;
alter table public.kyc_entity           enable row level security;
alter table public.listings             enable row level security;
alter table public.bids                 enable row level security;
alter table public.associated_documents enable row level security;
alter table public.nda_signatures       enable row level security;

-- users
create policy "Users: view own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Admins: view all users"
  on public.users for select
  using (public.is_admin());

create policy "Admins: update users"
  on public.users for update
  using (public.is_admin());

-- kyc_individual
create policy "Users: manage own KYC"
  on public.kyc_individual for all
  using (auth.uid() = user_id);

create policy "Admins: view all KYC"
  on public.kyc_individual for select
  using (public.is_admin());

create policy "Admins: update KYC"
  on public.kyc_individual for update
  using (public.is_admin());

-- kyc_entity
create policy "Users: manage own entity KYC"
  on public.kyc_entity for all
  using (auth.uid() = user_id);

create policy "Admins: view all entity KYC"
  on public.kyc_entity for select
  using (public.is_admin());

-- listings
create policy "Public: view published listings"
  on public.listings for select
  using (status = 'published');

create policy "Admins: full listing access"
  on public.listings for all
  using (public.is_admin());

-- bids
create policy "Investors: view own bids"
  on public.bids for select
  using (auth.uid() = investor_id);

create policy "Investors: create bids"
  on public.bids for insert
  with check (auth.uid() = investor_id);

create policy "Investors: update own bids"
  on public.bids for update
  using (auth.uid() = investor_id);

create policy "Admins: full bid access"
  on public.bids for all
  using (public.is_admin());

-- associated_documents
create policy "Investors: view own documents"
  on public.associated_documents for select
  using (
    exists (
      select 1 from public.bids b
      where b.id = bid_id and b.investor_id = auth.uid()
    )
  );

create policy "Admins: full document access"
  on public.associated_documents for all
  using (public.is_admin());

-- nda_signatures
create policy "Investors: manage own NDA signatures"
  on public.nda_signatures for all
  using (
    exists (
      select 1 from public.bids b
      where b.id = bid_id and b.investor_id = auth.uid()
    )
  );

create policy "Admins: view all NDA signatures"
  on public.nda_signatures for select
  using (public.is_admin());

-- ─── Storage Buckets ──────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values
  ('logos',      'logos',      true),   -- company logos (public CDN)
  ('documents',  'documents',  false),  -- investment docs (private)
  ('signatures', 'signatures', false);  -- NDA signature images (private)
