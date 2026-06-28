-- 018_end_user_kyc.sql
-- End-user (individual / entity) KYC + bid attribution.
--
-- Adds the notion of who the money actually comes from: an account holder can
-- invest as an individual, as one or more entities, or both. Each bid records
-- which end-user it belongs to.
--
-- Everything here is IDEMPOTENT and safe to run any number of times in the
-- Supabase SQL editor or via `supabase db push`.

-- ─── Enums ──────────────────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_type where typname = 'account_type') then
    create type account_type as enum ('individual', 'entity', 'both');
  end if;
  if not exists (select 1 from pg_type where typname = 'investor_kind') then
    create type investor_kind as enum ('individual', 'entity');
  end if;
end $$;

-- ─── users: onboarding intent ─────────────────────────────────────────────────
alter table public.users
  add column if not exists account_type account_type;

-- ─── kyc_individual: new fields (keep all existing) ───────────────────────────
alter table public.kyc_individual
  add column if not exists residence          text,
  add column if not exists primary_citizenship text,
  add column if not exists ssn_last4          text,
  add column if not exists origin_of_funds    text;

-- ─── kyc_entity: allow multiple entities per account + new fields ─────────────
-- Drop the one-entity-per-account limit (unique(user_id) from 001).
alter table public.kyc_entity
  drop constraint if exists kyc_entity_user_id_key;

alter table public.kyc_entity
  add column if not exists incorporation_location text,
  add column if not exists origin_of_funds        text;

-- Resubmission deletes+reinserts the account's entities; the "Users: manage own
-- entity KYC" RLS policy (001) is `for all` so it already covers delete, but the
-- table-level grant only had select/insert/update (006/010).
grant delete on table public.kyc_entity to authenticated;

-- ─── bids: end-user attribution ───────────────────────────────────────────────
alter table public.bids
  add column if not exists investor_kind investor_kind,
  add column if not exists entity_id     uuid;

-- Named FK so PostgREST can embed the entity on bid queries
-- (bids -> kyc_entity via entity_id). on delete set null: dropping an entity
-- profile must not delete the historical bid.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'bids_entity_id_fkey'
  ) then
    alter table public.bids
      add constraint bids_entity_id_fkey
      foreign key (entity_id) references public.kyc_entity(id) on delete set null;
  end if;
end $$;

-- Existing bids predate entities → they are individual.
update public.bids set investor_kind = 'individual' where investor_kind is null;
