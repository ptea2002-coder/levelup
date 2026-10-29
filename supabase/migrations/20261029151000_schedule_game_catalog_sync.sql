create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'levelup-steamspy-catalog-sync',
  '* * * * *',
  $job$
    select net.http_post(
      url := 'https://ztzcpnyxgwhcdktpbxdq.supabase.co/functions/v1/sync-game-catalog',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-catalog-sync-secret', (select sync_secret from public.game_catalog_sync_state where id = 1)
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 60000
    )
    from public.game_catalog_sync_state
    where id = 1
      and status <> 'complete'
      and (last_attempt_at is null or last_attempt_at < now() - interval '55 seconds');
  $job$
);
