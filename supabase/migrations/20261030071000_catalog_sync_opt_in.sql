-- Keep SteamSpy catalog refresh opt-in until the upstream endpoint is reachable.
-- Production observed HTTP 403 from SteamSpy; importing a known-good public catalog
-- snapshot is safer than retrying a failing endpoint every minute.

create schema if not exists levelup_private;
revoke all on schema levelup_private from public, anon, authenticated;

create table if not exists levelup_private.runtime_config (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default pg_catalog.now()
);
alter table levelup_private.runtime_config enable row level security;
revoke all on levelup_private.runtime_config from public, anon, authenticated;

insert into levelup_private.runtime_config(key, value, updated_at)
values ('catalog_sync_enabled', 'false', pg_catalog.now())
on conflict (key) do nothing;

do $$
declare
  v_sync_enabled boolean := false;
  v_job_id bigint;
begin
  select coalesce(bool_or(value = 'true'), false)
    into v_sync_enabled
    from levelup_private.runtime_config
    where key = 'catalog_sync_enabled';

  if not v_sync_enabled then
    for v_job_id in
      select jobid
      from cron.job
      where jobname = 'levelup-steamspy-catalog-sync'
    loop
      perform cron.unschedule(v_job_id);
    end loop;
  end if;
end
$$;
