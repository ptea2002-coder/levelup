-- Preserve the existing admin-only role semantics while evaluating auth.jwt()
-- once as an initplan instead of once per candidate row.
alter policy "Admins read all game comments" on public.comments
  using (((select auth.jwt()) -> 'app_metadata'::text ->> 'role'::text) = 'admin'::text);

alter policy "Admins moderate game comments" on public.comments
  using (((select auth.jwt()) -> 'app_metadata'::text ->> 'role'::text) = 'admin'::text)
  with check (((select auth.jwt()) -> 'app_metadata'::text ->> 'role'::text) = 'admin'::text);

alter policy "Admins read all game reviews" on public.reviews
  using (((select auth.jwt()) -> 'app_metadata'::text ->> 'role'::text) = 'admin'::text);

alter policy "Admins moderate game reviews" on public.reviews
  using (((select auth.jwt()) -> 'app_metadata'::text ->> 'role'::text) = 'admin'::text)
  with check (((select auth.jwt()) -> 'app_metadata'::text ->> 'role'::text) = 'admin'::text);

alter policy "Admins create news sources" on public.news_sources
  with check (((select auth.jwt()) -> 'app_metadata'::text ->> 'role'::text) = 'admin'::text);

alter policy "Admins update news sources" on public.news_sources
  using (((select auth.jwt()) -> 'app_metadata'::text ->> 'role'::text) = 'admin'::text)
  with check (((select auth.jwt()) -> 'app_metadata'::text ->> 'role'::text) = 'admin'::text);

alter policy "Admins delete news sources" on public.news_sources
  using (((select auth.jwt()) -> 'app_metadata'::text ->> 'role'::text) = 'admin'::text);
