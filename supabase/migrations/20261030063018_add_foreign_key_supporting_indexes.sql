-- Add covering indexes for foreign-key columns identified by the staging
-- Supabase Performance Advisor. These indexes are additive and do not change
-- row-level security or application-visible data.
create index if not exists comments_parent_id_idx
  on public.comments (parent_id);

create index if not exists comments_user_id_idx
  on public.comments (user_id);

create index if not exists favorites_game_id_idx
  on public.favorites (game_id);

create index if not exists news_ingest_items_reviewed_by_idx
  on public.news_ingest_items (reviewed_by);

create index if not exists news_ingest_runs_source_id_idx
  on public.news_ingest_runs (source_id);

create index if not exists news_ingest_runs_started_by_idx
  on public.news_ingest_runs (started_by);

create index if not exists news_sources_created_by_idx
  on public.news_sources (created_by);

create index if not exists news_sources_license_reviewed_by_idx
  on public.news_sources (license_reviewed_by);

create index if not exists reviews_user_id_idx
  on public.reviews (user_id);
