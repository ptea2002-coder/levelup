-- Keep scheduled Edge Function calls scoped to the current Supabase project.
-- Set levelup_private.runtime_config.supabase_url to this project's URL before applying.
-- IGDB remains intentionally unscheduled until that integration is resumed.

create schema if not exists levelup_private;
revoke all on schema levelup_private from public, anon, authenticated;

create table if not exists levelup_private.runtime_config (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default pg_catalog.now()
);
alter table levelup_private.runtime_config enable row level security;
revoke all on levelup_private.runtime_config from public, anon, authenticated;

do $$
declare
  v_supabase_url text;
  v_job_id bigint;
  v_sync_enabled boolean := false;
begin
  select value
    into v_supabase_url
    from levelup_private.runtime_config
    where key = 'supabase_url';

  if v_supabase_url is null
     or v_supabase_url !~ '^https://[a-z0-9]{20}\.supabase\.co$' then
    raise exception
      'Set levelup_private.runtime_config.supabase_url to this project URL before scheduling catalog sync';
  end if;

  select coalesce(bool_or(value = 'true'), false)
    into v_sync_enabled
    from levelup_private.runtime_config
    where key = 'catalog_sync_enabled';

  for v_job_id in
    select jobid
    from cron.job
    where jobname in ('levelup-steamspy-catalog-sync', 'levelup-igdb-catalog-sync')
  loop
    perform cron.unschedule(v_job_id);
  end loop;

  if v_sync_enabled then
    perform cron.schedule(
    'levelup-steamspy-catalog-sync',
    '* * * * *',
    format($job$
      with reset_completed as (
        update public.game_catalog_sync_state
        set status = 'idle',
            next_page = 0,
            total_synced = 0,
            last_attempt_at = null,
            last_error = null,
            updated_at = pg_catalog.now()
        where id = 1
          and status = 'complete'
          and last_success_at < pg_catalog.now() - interval '7 days'
        returning id
      )
      select net.http_post(
        url := %L || '/functions/v1/sync-game-catalog',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-catalog-sync-secret',
          (select sync_secret from public.game_catalog_sync_state where id = 1)
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 60000
      )
      from public.game_catalog_sync_state
      where id = 1
        and status <> 'complete'
        and (
          last_attempt_at is null
          or last_attempt_at < pg_catalog.now() - interval '55 seconds'
        );
    $job$, v_supabase_url)
    );
  end if;
end
$;
