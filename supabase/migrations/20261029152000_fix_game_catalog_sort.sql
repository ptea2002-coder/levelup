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
          case when p_sort <> 'name' then positive_reviews end desc nulls last,
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
