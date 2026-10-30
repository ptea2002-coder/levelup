create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- Do not schedule the Edge Function from this migration: each Supabase project
-- has its own URL. The environment-safe migration at 20261030070000 reads the
-- project-specific URL from levelup_private.runtime_config and schedules the job.
