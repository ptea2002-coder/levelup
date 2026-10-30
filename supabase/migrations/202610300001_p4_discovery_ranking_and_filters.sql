create or replace function public.search_games_catalog_v2(
  p_query text default null,
  p_categories text[] default null,
  p_platform text default null,
  p_mode text default 'all',
  p_sort text default 'popular',
  p_limit integer default 24,
  p_offset integer default 0
)
returns jsonb
language sql
stable
set search_path = ''
as $function$
  with prepared as materialized (
    select
      g.id, g.slug, g.title, g.category, g.genres, g.platforms, g.developer,
      g.release_year, g.description, g.official_url, g.mark, g.art_primary,
      g.art_secondary, g.source_provider, g.source_id, g.cover_url,
      g.background_url, g.short_description, g.positive_reviews,
      g.negative_reviews, g.concurrent_players, g.owners_estimate,
      g.source_synced_at, g.igdb_id, g.igdb_synced_at,
      lower(concat_ws(
        ' ',
        g.title, g.category, g.developer, g.description, g.short_description,
        array_to_string(coalesce(g.genres, '{}'::text[]), ' '),
        array_to_string(coalesce(g.platforms, '{}'::text[]), ' ')
      )) as search_text,
      coalesce(g.positive_reviews, 0)::numeric as positive_count,
      coalesce(g.negative_reviews, 0)::numeric as negative_count,
      coalesce(g.concurrent_players, 0)::numeric as player_count
    from public.games g
    where g.is_catalog_visible = true
  ),
  filtered as materialized (
    select p.*
    from prepared p
    where (
        coalesce(trim(p_query), '') = ''
        or p.search_text like '%' || lower(trim(p_query)) || '%'
      )
      and (
        coalesce(cardinality(p_categories), 0) = 0
        or p.category = any(p_categories)
        or exists (
          select 1
          from unnest(coalesce(p.genres, '{}'::text[])) as genre
          where genre = any(p_categories)
        )
      )
      and (
        coalesce(trim(p_platform), '') = ''
        or trim(p_platform) = any(coalesce(p.platforms, '{}'::text[]))
      )
      and (
        coalesce(p_mode, 'all') = 'all'
        or (
          p_mode = 'competitive'
          and p.search_text like any (array[
            '%fps%', '%moba%', '%battle royale%', '%tactical%', '%competitive%',
            '%hero shooter%', '%fighting%', '%sports%', '%pvp%', '%shooter%',
            '%counter-strike%', '%valorant%', '%dota%', '%league of legends%',
            '%apex legends%', '%overwatch%', '%warzone%', '%rainbow six%',
            '%team fortress%', '%rocket league%'
          ])
        )
        or (
          p_mode = 'coop'
          and p.search_text like any (array[
            '%co-op%', '%coop%', '%multiplayer%', '%survival%', '%party%',
            '%team-based%', '%pve%', '%squad%', '%raid%', '%left 4 dead%',
            '%helldivers%', '%deep rock%', '%it takes two%', '%monster hunter%',
            '%valheim%', '%terraria%', '%minecraft%', '%rust%'
          ])
        )
        or (
          p_mode = 'story'
          and p.search_text like any (array[
            '%rpg%', '%role-playing%', '%story%', '%adventure%', '%narrative%',
            '%open world%', '%soulslike%', '%single-player%', '%fantasy%',
            '%campaign%', '%quest%', '%baldur%', '%witcher%', '%elden ring%',
            '%final fantasy%', '%cyberpunk%', '%mass effect%', '%red dead%',
            '%assassin%', '%persona%', '%horizon%', '%god of war%', '%black myth%'
          ])
        )
        or (
          p_mode = 'chill'
          and p.search_text like any (array[
            '%simulation%', '%casual%', '%farming%', '%sandbox%', '%puzzle%',
            '%creative%', '%cozy%', '%relaxing%', '%building%', '%city builder%',
            '%life sim%', '%management%', '%crafting%', '%stardew%',
            '%animal crossing%', '%powerwash%', '%unpacking%', '%house flipper%',
            '%the sims%', '%planet zoo%', '%cities: skylines%', '%palia%',
            '%dorfromantik%', '%balatro%'
          ])
        )
      )
  ),
  ranked as (
    select f.*,
      row_number() over (
        order by
          case when p_sort = 'newest' then nullif(f.release_year, 0) end desc nulls last,
          case when p_sort in ('positive', 'recommended') then
            (f.positive_count + 5000 * 0.75)
            / nullif(f.positive_count + f.negative_count + 5000, 0)
          end desc nulls last,
          case when p_sort in ('positive', 'recommended')
            then f.positive_count + f.negative_count
          end desc nulls last,
          case when p_sort in ('popular', 'recommended') then f.player_count end desc nulls last,
          case when p_sort <> 'name' then f.positive_count end desc nulls last,
          f.title asc
      ) as row_rank
    from filtered f
  ),
  page as (
    select *
    from ranked
    order by row_rank
    limit greatest(1, least(coalesce(p_limit, 24), 48))
    offset greatest(0, least(coalesce(p_offset, 0), 1000000))
  )
  select jsonb_build_object(
    'items',
    coalesce(
      (select jsonb_agg(to_jsonb(page) - 'row_rank' - 'search_text' - 'positive_count' - 'negative_count' - 'player_count' order by page.row_rank) from page),
      '[]'::jsonb
    ),
    'total', (select count(*) from filtered)
  );
$function$;

revoke execute on function public.search_games_catalog_v2(text, text[], text, text, text, integer, integer) from public;
grant execute on function public.search_games_catalog_v2(text, text[], text, text, text, integer, integer) to anon, authenticated, service_role;
