-- Run after supabase/schema.sql in the LevelUP Supabase project.
-- Creates a private cron token in Supabase Vault; no secret is committed to GitHub.


-- Cached Steam metrics. The website reads this table instead of calling Steam per visitor.
create table if not exists public.steam_game_metrics (
  game_slug text primary key references public.games(slug) on delete cascade,
  steam_app_id integer not null unique check (steam_app_id > 0),
  current_players integer check (current_players is null or current_players >= 0),
  price_label text,
  price_currency text,
  price_discount_percent smallint not null default 0 check (price_discount_percent between 0 and 100),
  is_free boolean not null default false,
  store_url text not null,
  players_updated_at timestamptz,
  price_updated_at timestamptz,
  synced_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.steam_game_metrics enable row level security;

drop policy if exists "Steam metrics are publicly readable" on public.steam_game_metrics;
create policy "Steam metrics are publicly readable"
  on public.steam_game_metrics for select to anon, authenticated
  using (true);

grant select on public.steam_game_metrics to anon, authenticated;
revoke insert, update, delete on public.steam_game_metrics from anon, authenticated;

insert into public.steam_game_metrics (game_slug, steam_app_id, store_url)
values
  ('counter-strike-2', 730, 'https://store.steampowered.com/app/730/'),
  ('dota-2', 570, 'https://store.steampowered.com/app/570/'),
  ('apex-legends', 1172470, 'https://store.steampowered.com/app/1172470/'),
  ('pubg-battlegrounds', 578080, 'https://store.steampowered.com/app/578080/'),
  ('elden-ring', 1245620, 'https://store.steampowered.com/app/1245620/'),
  ('stardew-valley', 413150, 'https://store.steampowered.com/app/413150/'),
  ('the-witcher-3', 292030, 'https://store.steampowered.com/app/292030/'),
  ('marvel-rivals', 2767030, 'https://store.steampowered.com/app/2767030/'),
  ('helldivers-2', 553850, 'https://store.steampowered.com/app/553850/'),
  ('black-myth-wukong', 2358720, 'https://store.steampowered.com/app/2358720/'),
  ('overwatch-2', 2357570, 'https://store.steampowered.com/app/2357570/')
on conflict (game_slug) do update set
  steam_app_id = excluded.steam_app_id,
  store_url = excluded.store_url,
  updated_at = now();

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'steam_game_metrics'
  ) then
    alter publication supabase_realtime add table public.steam_game_metrics;
  end if;
end;
$$;


create table if not exists public.steam_sync_config (
  id boolean primary key default true check (id),
  cron_token_hash text not null
);

alter table public.steam_sync_config enable row level security;
revoke all on public.steam_sync_config from public, anon, authenticated;
grant select on public.steam_sync_config to service_role;

do $$
begin
  if not exists (
    select 1 from vault.decrypted_secrets where name = 'levelup_steam_sync_token'
  ) then
    perform vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'levelup_steam_sync_token',
      'Private token used only by the LevelUP Steam metrics cron job'
    );
  end if;
end;
$$;

insert into public.steam_sync_config (id, cron_token_hash)
select true, encode(extensions.digest(decrypted_secret, 'sha256'), 'hex')
from vault.decrypted_secrets
where name = 'levelup_steam_sync_token'
on conflict (id) do update set cron_token_hash = excluded.cron_token_hash;
