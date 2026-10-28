-- LevelUP database foundation for Supabase PostgreSQL.
-- Review this file before running it in a real project. It does not create admin/editor access.
-- Apply from the Supabase SQL Editor only after creating a project and reviewing the policies.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (char_length(username) between 3 and 24),
  display_name text not null default '',
  avatar_url text,
  bio text not null default '' check (char_length(bio) <= 240),
  created_at timestamptz not null default now()
);

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text not null default '',
  genres text[] not null default '{}',
  platforms text[] not null default '{}',
  developer text not null default '',
  official_url text not null,
  art_primary text not null default '#a78bfa',
  art_secondary text not null default '#111321',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  game_id uuid not null references public.games(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, game_id)
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating smallint not null check (rating between 1 and 10),
  title text not null check (char_length(title) between 3 and 100),
  body text not null check (char_length(body) between 20 and 5000),
  status text not null default 'pending' check (status in ('pending', 'published', 'rejected')),
  created_at timestamptz not null default now(),
  unique (game_id, user_id)
);

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  excerpt text not null default '',
  body_md text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  author_id uuid references public.profiles(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  game_id uuid references public.games(id) on delete cascade,
  article_id uuid references public.articles(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 3000),
  status text not null default 'pending' check (status in ('pending', 'published', 'rejected')),
  created_at timestamptz not null default now(),
  constraint comments_one_target check (
    (case when game_id is not null then 1 else 0 end) +
    (case when article_id is not null then 1 else 0 end) = 1
  )
);

create index if not exists games_title_idx on public.games using btree (title);
create index if not exists reviews_game_status_idx on public.reviews (game_id, status);
create index if not exists comments_game_status_idx on public.comments (game_id, status);
create index if not exists comments_article_status_idx on public.comments (article_id, status);
create index if not exists articles_status_published_idx on public.articles (status, published_at desc);

alter table public.profiles enable row level security;
alter table public.games enable row level security;
alter table public.favorites enable row level security;
alter table public.reviews enable row level security;
alter table public.articles enable row level security;
alter table public.comments enable row level security;

drop policy if exists "Public profiles are readable" on public.profiles;
create policy "Public profiles are readable"
  on public.profiles for select using (true);

drop policy if exists "Users create their own profile" on public.profiles;
create policy "Users create their own profile"
  on public.profiles for insert to authenticated
  with check (id = (select auth.uid()));

drop policy if exists "Users update their own profile" on public.profiles;
create policy "Users update their own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

drop policy if exists "Games are publicly readable" on public.games;
create policy "Games are publicly readable"
  on public.games for select using (true);

drop policy if exists "Users read their own favorites" on public.favorites;
create policy "Users read their own favorites"
  on public.favorites for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Users save their own favorites" on public.favorites;
create policy "Users save their own favorites"
  on public.favorites for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "Users remove their own favorites" on public.favorites;
create policy "Users remove their own favorites"
  on public.favorites for delete to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Published reviews and own reviews are readable" on public.reviews;
create policy "Published reviews and own reviews are readable"
  on public.reviews for select
  using (status = 'published' or user_id = (select auth.uid()));

drop policy if exists "Authenticated users submit their own reviews" on public.reviews;
create policy "Authenticated users submit their own reviews"
  on public.reviews for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'pending');

drop policy if exists "Users delete their own pending reviews" on public.reviews;
create policy "Users delete their own pending reviews"
  on public.reviews for delete to authenticated
  using (user_id = (select auth.uid()) and status = 'pending');

drop policy if exists "Published articles are readable" on public.articles;
create policy "Published articles are readable"
  on public.articles for select
  using (status = 'published');

drop policy if exists "Published comments and own comments are readable" on public.comments;
create policy "Published comments and own comments are readable"
  on public.comments for select
  using (status = 'published' or user_id = (select auth.uid()));

drop policy if exists "Authenticated users submit pending comments" on public.comments;
create policy "Authenticated users submit pending comments"
  on public.comments for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'pending');

drop policy if exists "Users delete their own pending comments" on public.comments;
create policy "Users delete their own pending comments"
  on public.comments for delete to authenticated
  using (user_id = (select auth.uid()) and status = 'pending');

grant select on public.games, public.profiles, public.articles to anon, authenticated;
grant insert, update on public.profiles to authenticated;
grant select, insert, delete on public.favorites to authenticated;
grant select, insert, delete on public.reviews to authenticated;
grant select, insert, delete on public.comments to authenticated;

insert into public.games
  (slug, title, description, genres, platforms, developer, official_url, art_primary, art_secondary)
values
  ('valorant', 'VALORANT', 'Tactical shooter 5v5 đặt nặng kỹ năng bắn, phối hợp đội hình và cách sử dụng đặc vụ.', array['FPS', 'Tactical'], array['PC', 'PlayStation 5', 'Xbox Series X|S'], 'Riot Games', 'https://playvalorant.com/vi-vn/', '#f04f66', '#22172f'),
  ('league-of-legends', 'LEAGUE OF LEGENDS', 'MOBA 5v5 với hệ thống tướng đa dạng, chiến thuật bản đồ và giao tranh đồng đội.', array['MOBA', 'Strategy'], array['PC'], 'Riot Games', 'https://www.leagueoflegends.com/vi-vn/', '#c39b56', '#152e4a'),
  ('counter-strike-2', 'COUNTER-STRIKE 2', 'FPS chiến thuật xoay quanh kỹ năng ngắm bắn, utility, quản lý kinh tế và phối hợp.', array['FPS', 'Tactical'], array['PC'], 'Valve', 'https://www.counter-strike.net/cs2', '#e7a24b', '#242c3c'),
  ('apex-legends', 'APEX LEGENDS', 'Battle royale nhịp độ cao với movement linh hoạt, kỹ năng nhân vật và chiến thuật theo squad.', array['Battle Royale', 'FPS'], array['PC', 'PlayStation', 'Xbox'], 'Respawn Entertainment', 'https://www.ea.com/games/apex-legends', '#e65a4f', '#30203a'),
  ('genshin-impact', 'GENSHIN IMPACT', 'Action RPG thế giới mở tập trung vào khám phá, phản ứng nguyên tố và câu chuyện nhân vật.', array['Action RPG', 'Open World'], array['PC', 'PlayStation', 'Mobile'], 'HoYoverse', 'https://genshin.hoyoverse.com/', '#63b9b1', '#29305d'),
  ('elden-ring', 'ELDEN RING', 'Action RPG thử thách với thế giới mở rộng lớn, chiến đấu có chiều sâu và nhiều bí mật để khám phá.', array['Action RPG', 'Soulslike'], array['PC', 'PlayStation', 'Xbox'], 'FromSoftware', 'https://en.bandainamcoent.eu/elden-ring/elden-ring', '#d2ad63', '#253b37')
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  genres = excluded.genres,
  platforms = excluded.platforms,
  developer = excluded.developer,
  official_url = excluded.official_url,
  art_primary = excluded.art_primary,
  art_secondary = excluded.art_secondary,
  updated_at = now();

-- Important: no admin/editor write policy is included yet. Do not expose a service-role key
-- to the browser. Add server-side role checks and reviewed RLS policies before launching CMS features.
