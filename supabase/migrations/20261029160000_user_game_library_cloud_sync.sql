-- P2: local-first, account-synced game library.
-- Rows with a null status and is_favorite=false are tombstones. Keeping them
-- allows a removal made offline to win over stale rows on another device.
create table if not exists public.user_game_library (
  user_id uuid not null references public.profiles(id) on delete cascade,
  game_slug text not null check (game_slug ~ '^[a-z0-9-]{1,100}$'),
  status text check (status is null or status in ('wishlist', 'playing', 'completed')),
  is_favorite boolean not null default false,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (user_id, game_slug)
);

create index if not exists user_game_library_user_updated_idx
  on public.user_game_library (user_id, updated_at desc);

alter table public.user_game_library enable row level security;

drop policy if exists "Users read their own game library" on public.user_game_library;
create policy "Users read their own game library"
  on public.user_game_library for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Users insert their own game library" on public.user_game_library;
create policy "Users insert their own game library"
  on public.user_game_library for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "Users update their own game library" on public.user_game_library;
create policy "Users update their own game library"
  on public.user_game_library for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select, insert, update on public.user_game_library to authenticated;
revoke all on public.user_game_library from anon;
