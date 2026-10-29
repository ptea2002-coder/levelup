-- P3.1: harden editorial collaboration and archive feedback.
-- Editors may collaborate on any article, while only admins may reassign authors.
create index if not exists articles_published_by_idx
  on public.articles (published_by)
  where published_by is not null;

create or replace function public.guard_article_author_id()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') <> 'admin' then
    new.author_id := old.author_id;
  end if;
  return new;
end;
$$;

revoke all on function public.guard_article_author_id() from public, anon;
grant execute on function public.guard_article_author_id() to authenticated;

drop trigger if exists articles_guard_author_id on public.articles;
create trigger articles_guard_author_id
before update on public.articles
for each row execute function public.guard_article_author_id();

drop policy if exists "Editors update articles" on public.articles;
create policy "Editors update articles"
  on public.articles
  for update to authenticated
  using ((select public.is_levelup_editor()))
  with check (
    (select public.is_levelup_editor())
    and (status <> 'published' or published_at is not null)
  );

notify pgrst, 'reload schema';
