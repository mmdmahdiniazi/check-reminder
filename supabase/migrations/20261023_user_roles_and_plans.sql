-- Check-yar: separate authorization role from subscription plan.
-- Apply through Supabase SQL Editor after reviewing this migration.
-- Clients may read their own profile but cannot insert/update role or plan fields.
-- Privileged role/plan changes must be performed by trusted server-side tooling.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user'
    check (role in ('user', 'admin', 'super_admin')),
  plan text not null default 'free'
    check (plan in ('free', 'pro', 'enterprise')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
  on public.profiles
  for select
  to authenticated
  using (id = (select auth.uid()));

-- No client-side INSERT, UPDATE, or DELETE policies are intentionally created.
-- This prevents users from promoting themselves or changing their subscription.

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, role, plan)
  values (new.id, 'user', 'free')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute procedure public.handle_new_user_profile();

-- Backfill accounts that existed before this migration.
insert into public.profiles (id, role, plan)
select u.id, 'user', 'free'
from auth.users u
on conflict (id) do nothing;

