-- P6: source-reviewed news intake, deduplication, and editor-only draft promotion.
-- This migration creates no approved sources. Every feed remains disabled until an admin
-- records a licensing/reuse review and explicitly enables it.

create table if not exists public.news_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 3 and 120),
  feed_url text not null unique check (feed_url ~ '^https://'),
  site_url text not null check (site_url ~ '^https://'),
  feed_format text not null default 'rss' check (feed_format in ('rss', 'atom', 'json')),
  license_status text not null default 'unreviewed' check (license_status in ('unreviewed', 'approved', 'denied')),
  reuse_policy text not null default 'link_only' check (reuse_policy in ('link_only', 'metadata_excerpt')),
  license_notes text,
  license_review_url text,
  license_reviewed_at timestamptz,
  license_reviewed_by uuid references auth.users(id) on delete set null,
  is_enabled boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_fetched_at timestamptz,
  last_error text,
  constraint news_sources_approved_has_review check (
    license_status <> 'approved'
    or (
      license_reviewed_at is not null
      and license_reviewed_by is not null
      and license_review_url is not null
      and license_review_url ~ '^https://'
      and char_length(trim(coalesce(license_notes, ''))) >= 20
    )
  ),
  constraint news_sources_enabled_requires_review check (
    not is_enabled
    or (
      license_status = 'approved'
      and license_reviewed_at is not null
      and license_reviewed_by is not null
      and license_review_url is not null
      and license_review_url ~ '^https://'
      and char_length(trim(coalesce(license_notes, ''))) >= 20
    )
  )
);

create table if not exists public.news_ingest_items (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.news_sources(id) on delete restrict,
  external_id text not null check (char_length(external_id) between 1 and 512),
  canonical_url text not null check (canonical_url ~ '^https://') unique,
  title text not null check (char_length(trim(title)) between 5 and 240),
  excerpt text not null default '' check (char_length(excerpt) <= 280),
  author_name text,
  published_at timestamptz,
  fingerprint text not null check (fingerprint ~ '^[a-f0-9]{64}$') unique,
  status text not null default 'pending' check (status in ('pending', 'converted', 'dismissed')),
  article_id uuid references public.articles(id) on delete set null,
  fetched_at timestamptz not null default now(),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  review_notes text,
  unique (source_id, external_id)
);

create index if not exists news_ingest_items_pending_idx
  on public.news_ingest_items (published_at desc nulls last, fetched_at desc)
  where status = 'pending';
create index if not exists news_ingest_items_source_fetched_idx
  on public.news_ingest_items (source_id, fetched_at desc);
create index if not exists news_ingest_items_article_idx
  on public.news_ingest_items (article_id) where article_id is not null;

create table if not exists public.news_ingest_runs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.news_sources(id) on delete set null,
  started_by uuid references auth.users(id) on delete set null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running' check (status in ('running', 'succeeded', 'failed')),
  fetched_count integer not null default 0 check (fetched_count >= 0),
  inserted_count integer not null default 0 check (inserted_count >= 0),
  duplicate_count integer not null default 0 check (duplicate_count >= 0),
  error_message text
);

create index if not exists news_ingest_runs_started_idx on public.news_ingest_runs (started_at desc);

alter table public.news_sources enable row level security;
alter table public.news_ingest_items enable row level security;
alter table public.news_ingest_runs enable row level security;

drop policy if exists "Editors read news sources" on public.news_sources;
create policy "Editors read news sources"
  on public.news_sources for select to authenticated
  using ((select public.is_levelup_editor()));

drop policy if exists "Admins create news sources" on public.news_sources;
create policy "Admins create news sources"
  on public.news_sources for insert to authenticated
  with check (
    (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    and (created_by is null or created_by = (select auth.uid()))
  );

drop policy if exists "Admins update news sources" on public.news_sources;
create policy "Admins update news sources"
  on public.news_sources for update to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins delete news sources" on public.news_sources;
create policy "Admins delete news sources"
  on public.news_sources for delete to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Editors read news intake queue" on public.news_ingest_items;
create policy "Editors read news intake queue"
  on public.news_ingest_items for select to authenticated
  using ((select public.is_levelup_editor()));

drop policy if exists "Editors read news ingest runs" on public.news_ingest_runs;
create policy "Editors read news ingest runs"
  on public.news_ingest_runs for select to authenticated
  using ((select public.is_levelup_editor()));

grant select, insert, update, delete on public.news_sources to authenticated;
grant select on public.news_ingest_items, public.news_ingest_runs to authenticated;
grant all on public.news_sources, public.news_ingest_items, public.news_ingest_runs to service_role;

create or replace function public.set_news_source_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

drop trigger if exists news_sources_set_updated_at on public.news_sources;
create trigger news_sources_set_updated_at
  before update on public.news_sources
  for each row execute function public.set_news_source_updated_at();

-- Ingestion writes are atomic and idempotent. ON CONFLICT covers duplicate source IDs,
-- canonical URLs, and cross-source title/date fingerprints.
create or replace function public.ingest_news_items(p_items jsonb)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  inserted_count integer := 0;
begin
  if p_items is null or pg_catalog.jsonb_typeof(p_items) <> 'array'
     or pg_catalog.jsonb_array_length(p_items) > 500 then
    raise exception 'Invalid news intake batch' using errcode = '22023';
  end if;

  insert into public.news_ingest_items
    (source_id, external_id, canonical_url, title, excerpt, author_name, published_at, fingerprint)
  select
    item.source_id,
    item.external_id,
    item.canonical_url,
    item.title,
    coalesce(item.excerpt, ''),
    nullif(item.author_name, ''),
    item.published_at,
    item.fingerprint
  from pg_catalog.jsonb_to_recordset(p_items) as item(
    source_id uuid,
    external_id text,
    canonical_url text,
    title text,
    excerpt text,
    author_name text,
    published_at timestamptz,
    fingerprint text
  )
  join public.news_sources source
    on source.id = item.source_id
   and source.is_enabled
   and source.license_status = 'approved'
   and source.license_reviewed_at is not null
  where item.canonical_url ~ '^https://'
    and item.fingerprint ~ '^[a-f0-9]{64}$'
    and char_length(item.title) between 5 and 240
  on conflict do nothing;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;
revoke all on function public.ingest_news_items(jsonb) from public, anon, authenticated;
grant execute on function public.ingest_news_items(jsonb) to service_role;

-- Convert an intake item into an unpublished CMS draft. It is never auto-published.
create or replace function public.create_article_draft_from_news_item(p_item_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  intake public.news_ingest_items%rowtype;
  source_record public.news_sources%rowtype;
  v_article_id uuid;
  slug_base text;
  article_slug text;
  article_body text;
begin
  if (select auth.uid()) is null or not (select public.is_levelup_editor()) then
    raise exception 'Editor access required' using errcode = '42501';
  end if;

  select * into intake
    from public.news_ingest_items
    where id = p_item_id
    for update;

  if not found then
    raise exception 'News intake item not found' using errcode = 'P0002';
  end if;
  if intake.status <> 'pending' then
    raise exception 'News intake item has already been reviewed' using errcode = '55000';
  end if;

  select * into source_record
    from public.news_sources
    where id = intake.source_id
      and license_status = 'approved'
      and license_reviewed_at is not null;

  if not found then
    raise exception 'Source licensing review is no longer approved' using errcode = '42501';
  end if;

  slug_base := pg_catalog.btrim(pg_catalog.regexp_replace(pg_catalog.lower(intake.title), '[^a-z0-9]+', '-', 'g'), '-');
  if char_length(slug_base) < 3 then
    slug_base := 'news-item';
  end if;
  article_slug := pg_catalog.left(slug_base, 70) || '-' || pg_catalog.substr(pg_catalog.replace(intake.id::text, '-', ''), 1, 8);

  article_body :=
    '## Ghi chú biên tập' || E'\n\n' ||
    'Đây là đầu mối tin tức từ nguồn bên ngoài, không phải bài viết đã được xác minh. Hãy kiểm tra thông tin với nguồn độc lập, bổ sung bối cảnh và viết lại bằng lời của LevelUP trước khi xuất bản.' || E'\n\n' ||
    '## Nguồn tham khảo' || E'\n\n' ||
    '- ' || source_record.name || ': ' || intake.canonical_url || E'\n\n' ||
    '## Bản tin LevelUP' || E'\n\n' ||
    '[Viết nội dung nguyên bản sau khi xác minh dữ kiện.]';

  insert into public.articles
    (slug, title, excerpt, body_md, status, author_id, category, source_url, source_name, published_at)
  values
    (
      article_slug,
      pg_catalog.left(intake.title, 180),
      'Tin tham khảo từ ' || source_record.name || '. Biên tập viên cần xác minh dữ kiện và viết tóm tắt nguyên bản trước khi xuất bản.',
      article_body,
      'draft',
      (select auth.uid()),
      'NEWS INTELLIGENCE',
      intake.canonical_url,
      source_record.name,
      null
    )
  returning id into v_article_id;

  update public.news_ingest_items
    set status = 'converted',
        article_id = v_article_id,
        reviewed_by = (select auth.uid()),
        reviewed_at = pg_catalog.now(),
        review_notes = 'Converted to an editorial draft; human verification required.'
    where id = p_item_id;

  return v_article_id;
end;
$$;
revoke all on function public.create_article_draft_from_news_item(uuid) from public, anon;
grant execute on function public.create_article_draft_from_news_item(uuid) to authenticated;

create or replace function public.dismiss_news_ingest_item(p_item_id uuid, p_notes text default null)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not (select public.is_levelup_editor()) then
    raise exception 'Editor access required' using errcode = '42501';
  end if;

  update public.news_ingest_items
    set status = 'dismissed',
        reviewed_by = (select auth.uid()),
        reviewed_at = pg_catalog.now(),
        review_notes = pg_catalog.left(pg_catalog.btrim(coalesce(p_notes, '')), 1000)
    where id = p_item_id
      and status = 'pending';

  if not found then
    raise exception 'News intake item not found or already reviewed' using errcode = '55000';
  end if;

  return true;
end;
$$;
revoke all on function public.dismiss_news_ingest_item(uuid, text) from public, anon;
grant execute on function public.dismiss_news_ingest_item(uuid, text) to authenticated;

-- Guard against accidentally publishing a generated intake template before the editor has
-- replaced its placeholders and written an original, verified summary.
create or replace function public.prevent_unedited_news_intake_publish()
returns trigger
language plpgsql
set search_path = ''
as $
begin
  if new.status = 'published' and (
    pg_catalog.strpos(new.body_md, '[Viết nội dung nguyên bản') > 0
    or pg_catalog.strpos(new.body_md, 'Đây là đầu mối tin tức từ nguồn bên ngoài') > 0
    or pg_catalog.left(new.excerpt, char_length('Tin tham khảo từ ')) = 'Tin tham khảo từ '
  ) then
    raise exception 'News Intelligence draft needs original verified editorial content before publishing'
      using errcode = '23514';
  end if;
  return new;
end;
$;

drop trigger if exists articles_require_original_news_content on public.articles;
create trigger articles_require_original_news_content
  before insert or update of status, body_md, excerpt on public.articles
  for each row execute function public.prevent_unedited_news_intake_publish();

notify pgrst, 'reload schema';
