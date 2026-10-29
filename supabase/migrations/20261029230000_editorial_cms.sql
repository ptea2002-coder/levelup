-- P3: editorial CMS, publication metadata, role-gated access and media storage.
alter table public.articles
  add column if not exists category text not null default 'LEVELUP EDITORIAL',
  add column if not exists cover_image_url text,
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists canonical_url text,
  add column if not exists source_url text,
  add column if not exists source_name text,
  add column if not exists correction_note text,
  add column if not exists published_by uuid references auth.users(id) on delete set null,
  add column if not exists archived_at timestamptz;

alter table public.articles drop constraint if exists articles_status_check;
alter table public.articles add constraint articles_status_check check (status in ('draft', 'published', 'archived'));
alter table public.articles enable row level security;

create index if not exists articles_published_at_idx on public.articles (published_at desc) where status = 'published';
create index if not exists articles_author_updated_idx on public.articles (author_id, updated_at desc);

create or replace function public.is_levelup_editor()
returns boolean language sql stable security invoker set search_path = ''
as $$ select coalesce((select auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'editor'), false); $$;
revoke all on function public.is_levelup_editor() from public, anon;
grant execute on function public.is_levelup_editor() to authenticated;

drop policy if exists "Published articles are readable" on public.articles;
drop policy if exists "Editors read all articles" on public.articles;
create policy "Published articles are readable" on public.articles for select to anon, authenticated using (status = 'published');
create policy "Editors read all articles" on public.articles for select to authenticated using ((select public.is_levelup_editor()));

drop policy if exists "Editors create articles" on public.articles;
create policy "Editors create articles" on public.articles for insert to authenticated
with check ((select public.is_levelup_editor()) and (author_id is null or author_id = (select auth.uid())) and (status <> 'published' or published_at is not null));

drop policy if exists "Editors update articles" on public.articles;
create policy "Editors update articles" on public.articles for update to authenticated
using ((select public.is_levelup_editor()))
with check ((select public.is_levelup_editor()) and (author_id is null or author_id = (select auth.uid()) or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin') and (status <> 'published' or published_at is not null));

drop policy if exists "Editors delete articles" on public.articles;
create policy "Editors delete articles" on public.articles for delete to authenticated
using ((select public.is_levelup_editor()) and status <> 'published');

grant select on public.articles to anon, authenticated;
grant insert, update, delete on public.articles to authenticated;

create or replace function public.set_article_updated_at()
returns trigger language plpgsql set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  if new.status = 'published' and new.published_at is null then new.published_at = pg_catalog.now(); end if;
  if new.status = 'published' then new.archived_at = null;
  elsif new.status = 'archived' and new.archived_at is null then new.archived_at = pg_catalog.now(); end if;
  return new;
end;
$$;
drop trigger if exists articles_set_updated_at on public.articles;
create trigger articles_set_updated_at before update on public.articles for each row execute function public.set_article_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('editorial-media', 'editorial-media', true, 5242880, array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read editorial media" on storage.objects;
create policy "Public read editorial media" on storage.objects for select to anon, authenticated using (bucket_id = 'editorial-media');
drop policy if exists "Editors upload editorial media" on storage.objects;
create policy "Editors upload editorial media" on storage.objects for insert to authenticated with check (bucket_id = 'editorial-media' and (select public.is_levelup_editor()));
drop policy if exists "Editors update editorial media" on storage.objects;
create policy "Editors update editorial media" on storage.objects for update to authenticated using (bucket_id = 'editorial-media' and (select public.is_levelup_editor())) with check (bucket_id = 'editorial-media' and (select public.is_levelup_editor()));
drop policy if exists "Editors delete editorial media" on storage.objects;
create policy "Editors delete editorial media" on storage.objects for delete to authenticated using (bucket_id = 'editorial-media' and (select public.is_levelup_editor()));

notify pgrst, 'reload schema';
