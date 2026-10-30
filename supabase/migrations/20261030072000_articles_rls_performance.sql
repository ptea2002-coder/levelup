-- Remove the remaining article RLS initplan warning and cover the published_by FK.
create index if not exists articles_published_by_idx
  on public.articles (published_by);

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

drop policy if exists "Editors update articles" on public.articles;
create policy "Editors update articles"
  on public.articles
  for update
  to authenticated
  using ((select public.is_levelup_editor()))
  with check (
    (select public.is_levelup_editor())
    and (
      author_id is null
      or author_id = (select auth.uid())
      or (select public.is_levelup_admin())
    )
    and (status <> 'published' or published_at is not null)
  );

notify pgrst, 'reload schema';
