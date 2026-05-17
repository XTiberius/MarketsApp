-- 004_add_user_names.sql
--
-- Adds first_name / last_name to public.users, lets a user update their OWN
-- profile row, and blocks non-admins from changing role / kyc_status.
--
-- Run order: 003_fix_users_table_grants.sql must be applied first — the
-- authenticated role needs the table-level UPDATE grant before the policy
-- below can take effect.

-- 1. New columns. NULL is allowed for now so existing rows keep working;
--    the app routes users without names to /auth/complete-profile.
alter table public.users add column if not exists first_name text;
alter table public.users add column if not exists last_name  text;

-- 2. RLS: let a user UPDATE their own row.
--    Migration 001 only created an admin UPDATE policy, so without this a
--    user could not save their own name. The trigger in step 3 stops this
--    policy from being abused to change role / kyc_status.
drop policy if exists "Users: update own profile" on public.users;
create policy "Users: update own profile"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 3. Guard rail: an authenticated non-admin may only change their name
--    fields. This holds even if someone PATCHes Supabase's REST API directly
--    with the public anon key, bypassing /api/users/me.
create or replace function public.prevent_unauthorized_user_changes()
returns trigger language plpgsql as $$
begin
  -- No auth context (SQL editor / service_role) — trusted backend, allow.
  if auth.uid() is null then
    return new;
  end if;
  -- Authenticated non-admins may not change privileged columns.
  if not public.is_admin() then
    if new.role is distinct from old.role then
      raise exception 'Only admins can change a user role';
    end if;
    if new.kyc_status is distinct from old.kyc_status then
      raise exception 'Only admins can change KYC status';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists users_protect_privileged_columns on public.users;
create trigger users_protect_privileged_columns
  before update on public.users
  for each row execute procedure public.prevent_unauthorized_user_changes();
