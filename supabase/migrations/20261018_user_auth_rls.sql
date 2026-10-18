-- Check Reminder: per-user data isolation
-- Run in Supabase SQL Editor after deploying phone OTP auth.
-- Existing rows are kept. Rows with user_id NULL are inaccessible until assigned below.

alter table public.checks
  add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.checks alter column user_id set default auth.uid();

alter table public.checks enable row level security;
alter table public.notifications enable row level security;

-- Remove existing policies on these tables so older permissive policies cannot override isolation.
do $$
declare p record;
begin
  for p in select schemaname, tablename, policyname from pg_policies
    where schemaname = 'public' and tablename in ('checks', 'notifications')
  loop
    execute format('drop policy if exists %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end
$$;

create policy "Users can view their own checks" on public.checks
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Users can create their own checks" on public.checks
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Users can update their own checks" on public.checks
  for update to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "Users can delete their own checks" on public.checks
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "Users can view notifications for their checks" on public.notifications
  for select to authenticated using (
    exists (select 1 from public.checks c
      where c.id = notifications.check_id and c.user_id = (select auth.uid()))
  );
create policy "Users can create notifications for their checks" on public.notifications
  for insert to authenticated with check (
    exists (select 1 from public.checks c
      where c.id = notifications.check_id and c.user_id = (select auth.uid()))
  );
create policy "Users can update notifications for their checks" on public.notifications
  for update to authenticated using (
    exists (select 1 from public.checks c
      where c.id = notifications.check_id and c.user_id = (select auth.uid()))
  ) with check (
    exists (select 1 from public.checks c
      where c.id = notifications.check_id and c.user_id = (select auth.uid()))
  );
create policy "Users can delete notifications for their checks" on public.notifications
  for delete to authenticated using (
    exists (select 1 from public.checks c
      where c.id = notifications.check_id and c.user_id = (select auth.uid()))
  );

-- Preserve access to existing checks:
-- 1. Sign in once with your phone number.
-- 2. Copy that user's UUID from Supabase Dashboard > Authentication > Users.
-- 3. If all current checks belong to that account, run once (replace UUID):
-- update public.checks set user_id = 'YOUR_USER_UUID' where user_id is null;
-- If records belong to multiple people, assign each row to its actual owner instead.
