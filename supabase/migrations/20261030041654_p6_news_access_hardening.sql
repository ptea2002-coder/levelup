-- P6.1 hardening: private intake metadata must not be reachable by anon.
revoke all on table public.news_sources, public.news_ingest_items, public.news_ingest_runs from anon;

-- Keep the intended explicit grants for the editor UI and trusted ingestion function.
grant select, insert, update, delete on public.news_sources to authenticated;
grant select on public.news_ingest_items, public.news_ingest_runs to authenticated;
grant all on public.news_sources, public.news_ingest_items, public.news_ingest_runs to service_role;

-- Keep privileged ingestion internal to the server-side service role.
revoke all on function public.ingest_news_items(jsonb) from public, anon, authenticated;
grant execute on function public.ingest_news_items(jsonb) to service_role;

-- Draft conversion and dismissal are intentionally available only to authenticated
-- callers, and each function checks auth.uid() plus public.is_levelup_editor().
revoke all on function public.create_article_draft_from_news_item(uuid) from public, anon;
grant execute on function public.create_article_draft_from_news_item(uuid) to authenticated;
revoke all on function public.dismiss_news_ingest_item(uuid, text) from public, anon;
grant execute on function public.dismiss_news_ingest_item(uuid, text) to authenticated;
