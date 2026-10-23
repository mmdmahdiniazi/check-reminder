-- Check Reminder: admin operations
-- Run once in Supabase SQL Editor if these functions have not already been created.
-- Profiles table must exist with role and plan columns.

create or replace function public.admin_list_users()
returns table (
  id uuid,
  email text,
  phone text,
  role text,
  plan text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_role text;
begin
  select p.role into current_role
  from public.profiles p
  where p.id = auth.uid();

  if current_role not in ('admin', 'super_admin') or current_role is null then
    raise exception 'Access denied';
  end if;

  return query
  select u.id, u.email::text, u.phone::text, p.role::text, p.plan::text, u.created_at
  from auth.users u
  join public.profiles p on p.id = u.id
  order by u.created_at desc;
end;
$$;

create or replace function public.admin_update_user_plan(target_user_id uuid, new_plan text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_role text;
begin
  select p.role into current_role from public.profiles p where p.id = auth.uid();
  if current_role not in ('admin', 'super_admin') or current_role is null then
    raise exception 'Access denied';
  end if;
  if new_plan is null or new_plan not in ('free', 'pro', 'enterprise') then
    raise exception 'Invalid plan';
  end if;
  update public.profiles set plan = new_plan where id = target_user_id;
  if not found then raise exception 'User profile not found'; end if;
end;
$$;

create or replace function public.admin_update_user_role(target_user_id uuid, new_role text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_role text;
begin
  select p.role into current_role from public.profiles p where p.id = auth.uid();
  if current_role is distinct from 'super_admin' then raise exception 'Access denied'; end if;
  if new_role is null or new_role not in ('user', 'admin', 'super_admin') then raise exception 'Invalid role'; end if;
  if target_user_id is null then raise exception 'Target user is required'; end if;
  if target_user_id = auth.uid() then raise exception 'Cannot change your own role'; end if;
  update public.profiles set role = new_role where id = target_user_id;
  if not found then raise exception 'User profile not found'; end if;
end;
$$;

revoke all on function public.admin_list_users() from public;
revoke all on function public.admin_update_user_plan(uuid, text) from public;
revoke all on function public.admin_update_user_role(uuid, text) from public;
grant execute on function public.admin_list_users() to authenticated;
grant execute on function public.admin_update_user_plan(uuid, text) to authenticated;
grant execute on function public.admin_update_user_role(uuid, text) to authenticated;
