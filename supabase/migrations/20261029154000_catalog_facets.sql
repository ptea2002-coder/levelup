create or replace function public.get_game_catalog_facets()
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select jsonb_build_object(
    'categories',
    coalesce(
      (
        select jsonb_agg(category order by category)
        from (
          select distinct btrim(g.category) as category
          from public.games g
          where g.is_catalog_visible = true
            and nullif(btrim(g.category), '') is not null
        ) categories
      ),
      '[]'::jsonb
    ),
    'platforms',
    coalesce(
      (
        select jsonb_agg(platform order by platform)
        from (
          select distinct btrim(p.platform) as platform
          from public.games g
          cross join lateral unnest(coalesce(g.platforms, '{}'::text[])) as p(platform)
          where g.is_catalog_visible = true
            and nullif(btrim(p.platform), '') is not null
        ) platforms
      ),
      '[]'::jsonb
    )
  );
$$;

revoke all on function public.get_game_catalog_facets() from public;
grant execute on function public.get_game_catalog_facets() to anon, authenticated;
