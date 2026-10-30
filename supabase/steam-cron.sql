-- Replace __SUPABASE_PUBLISHABLE_KEY__ with the project's publishable key before running.
-- The key is stored in Vault rather than embedded in the cron job definition.
create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$
begin
  if not exists (
    select 1 from vault.decrypted_secrets where name = 'levelup_steam_sync_publishable_key'
  ) then
    perform vault.create_secret(
      '__SUPABASE_PUBLISHABLE_KEY__',
      'levelup_steam_sync_publishable_key',
      'Public Supabase API key used by the scheduled Steam metrics request'
    );
  end if;
end;
$$;

select cron.schedule(
  'levelup-steam-metrics-sync',
  '*/5 * * * *',
  $job$
    select net.http_post(
      url := 'https://sdvhrrwuwnnbdfhukmbp.supabase.co/functions/v1/sync-steam-metrics',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'levelup_steam_sync_publishable_key' limit 1)
      ),
      body := jsonb_build_object(
        'token', (select decrypted_secret from vault.decrypted_secrets where name = 'levelup_steam_sync_token' limit 1)
      ),
      timeout_milliseconds := 15000
    );
  $job$
);
