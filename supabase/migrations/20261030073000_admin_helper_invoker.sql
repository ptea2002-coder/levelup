-- Keep the role helper invoker-safe so it is not exposed as a SECURITY DEFINER RPC.
create or replace function public.is_levelup_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

revoke all on function public.is_levelup_admin() from public, anon;
grant execute on function public.is_levelup_admin() to authenticated;

notify pgrst, 'reload schema';
