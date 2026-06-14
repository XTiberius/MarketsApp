-- Allow authenticated users to recreate their own profile row if the auth
-- trigger did not finish before the app reads public.users.
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'users'
      and policyname = 'Users: insert own profile'
  ) then
    create policy "Users: insert own profile"
      on public.users for insert
      with check (auth.uid() = id);
  end if;
end $$;
