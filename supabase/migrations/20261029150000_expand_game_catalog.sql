create extension if not exists pg_trgm with schema extensions;

alter table public.games
  add column if not exists source_provider text,
  add column if not exists source_id text,
  add column if not exists cover_url text,
  add column if not exists background_url text,
  add column if not exists short_description text,
  add column if not exists positive_reviews bigint not null default 0,
  add column if not exists negative_reviews bigint not null default 0,
  add column if not exists concurrent_players integer not null default 0,
  add column if not exists owners_estimate text,
  add column if not exists source_synced_at timestamptz,
  add column if not exists source_metadata jsonb not null default '{}'::jsonb,
  add column if not exists is_catalog_visible boolean not null default true;

create unique index if not exists games_source_provider_id_unique
  on public.games (source_provider, source_id)
  where source_provider is not null and source_id is not null;

create index if not exists games_visible_popularity_idx
  on public.games (is_catalog_visible, concurrent_players desc, positive_reviews desc, title);

create index if not exists games_title_trgm_idx
  on public.games using gin (title extensions.gin_trgm_ops);

create index if not exists games_developer_trgm_idx
  on public.games using gin (developer extensions.gin_trgm_ops);

create index if not exists games_genres_gin_idx
  on public.games using gin (genres);

create index if not exists games_platforms_gin_idx
  on public.games using gin (platforms);

create table if not exists public.game_catalog_sync_state (
  id smallint primary key check (id = 1),
  sync_secret text not null,
  next_page integer not null default 0 check (next_page >= 0),
  status text not null default 'idle' check (status in ('idle', 'running', 'retrying', 'complete')),
  total_synced bigint not null default 0,
  last_attempt_at timestamptz,
  last_success_at timestamptz,
  last_error text,
  updated_at timestamptz not null default now()
);

alter table public.game_catalog_sync_state enable row level security;
revoke all on public.game_catalog_sync_state from anon, authenticated;
grant all on public.game_catalog_sync_state to service_role;

insert into public.game_catalog_sync_state (id, sync_secret, next_page, status, total_synced)
values (1, encode(gen_random_bytes(32), 'hex'), 0, 'idle', 0)
on conflict (id) do nothing;

create or replace function public.search_games_catalog(
  p_query text default null,
  p_category text default null,
  p_platform text default null,
  p_sort text default 'popular',
  p_limit integer default 24,
  p_offset integer default 0
)
returns jsonb
language sql
stable
security invoker
set search_path = public, extensions
as $$
  with filtered as materialized (
    select
      g.id, g.slug, g.title, g.category, g.genres, g.platforms, g.developer,
      g.release_year, g.description, g.official_url, g.mark, g.art_primary,
      g.art_secondary, g.source_provider, g.source_id, g.cover_url,
      g.background_url, g.short_description, g.positive_reviews,
      g.negative_reviews, g.concurrent_players, g.owners_estimate,
      g.source_synced_at
    from public.games g
    where g.is_catalog_visible = true
      and (
        coalesce(trim(p_query), '') = ''
        or g.title ilike '%' || trim(p_query) || '%'
        or coalesce(g.developer, '') ilike '%' || trim(p_query) || '%'
        or coalesce(g.category, '') ilike '%' || trim(p_query) || '%'
        or coalesce(g.description, '') ilike '%' || trim(p_query) || '%'
        or exists (
          select 1 from unnest(coalesce(g.genres, '{}'::text[])) genre
          where genre ilike '%' || trim(p_query) || '%'
        )
      )
      and (
        coalesce(trim(p_category), '') = ''
        or g.category = trim(p_category)
        or trim(p_category) = any(coalesce(g.genres, '{}'::text[]))
      )
      and (
        coalesce(trim(p_platform), '') = ''
        or trim(p_platform) = any(coalesce(g.platforms, '{}'::text[]))
      )
  ),
  ranked as (
    select filtered.*,
      row_number() over (
        order by
          case when p_sort = 'newest' then nullif(release_year, 0) end desc nulls last,
          case when p_sort = 'positive' then positive_reviews end desc nulls last,
          case when p_sort in ('popular', 'recommended') then concurrent_players end desc nulls last,
          positive_reviews desc nulls last,
          title asc
      ) as row_rank
    from filtered
  ),
  page as (
    select * from ranked
    order by row_rank
    limit greatest(1, least(coalesce(p_limit, 24), 48))
    offset greatest(0, least(coalesce(p_offset, 0), 1000000))
  )
  select jsonb_build_object(
    'items',
    coalesce(
      (select jsonb_agg(to_jsonb(page) - 'row_rank' order by page.row_rank) from page),
      '[]'::jsonb
    ),
    'total', (select count(*) from filtered)
  );
$$;

revoke all on function public.search_games_catalog(text, text, text, text, integer, integer) from public;
grant execute on function public.search_games_catalog(text, text, text, text, integer, integer) to anon, authenticated;
