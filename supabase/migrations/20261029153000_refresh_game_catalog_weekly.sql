DO $$
DECLARE
  existing_job_id bigint;
BEGIN
  SELECT jobid INTO existing_job_id
  FROM cron.job
  WHERE jobname = 'levelup-steamspy-catalog-sync';

  IF existing_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(existing_job_id);
  END IF;

  PERFORM cron.schedule(
    'levelup-steamspy-catalog-sync',
    '* * * * *',
    $job$
      WITH reset_completed AS (
        UPDATE public.game_catalog_sync_state
        SET status = 'idle',
            next_page = 0,
            total_synced = 0,
            last_attempt_at = NULL,
            last_error = NULL,
            updated_at = now()
        WHERE id = 1
          AND status = 'complete'
          AND last_success_at < now() - interval '7 days'
        RETURNING id
      )
      SELECT net.http_post(
        url := 'https://ztzcpnyxgwhcdktpbxdq.supabase.co/functions/v1/sync-game-catalog',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-catalog-sync-secret', (SELECT sync_secret FROM public.game_catalog_sync_state WHERE id = 1)
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 60000
      )
      FROM public.game_catalog_sync_state
      WHERE id = 1
        AND status <> 'complete'
        AND (last_attempt_at IS NULL OR last_attempt_at < now() - interval '55 seconds');
    $job$
  );
END
$$;