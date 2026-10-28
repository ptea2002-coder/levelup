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
  category text not null default 'Other',
  release_year smallint not null default 0,
  mark text not null default '',
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

-- Keep the schema compatible when this file is re-applied to a project created from an
-- earlier draft of the LevelUP schema.
alter table public.games add column if not exists category text not null default 'Other';
alter table public.games add column if not exists release_year smallint not null default 0;
alter table public.games add column if not exists mark text not null default '';

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
  (slug, title, category, release_year, mark, description, genres, platforms, developer, official_url, art_primary, art_secondary)
values
  ('valorant', 'VALORANT', 'FPS', 2020, 'V', 'Tactical shooter 5v5 đặt nặng kỹ năng bắn, phối hợp đội hình và cách sử dụng đặc vụ.', array['FPS', 'Tactical'], array['PC', 'PlayStation 5', 'Xbox Series X|S'], 'Riot Games', 'https://playvalorant.com/vi-vn/', '#f04f66', '#22172f'),
  ('league-of-legends', 'LEAGUE OF LEGENDS', 'MOBA', 2009, 'LoL', 'MOBA 5v5 với hệ thống tướng đa dạng, chiến thuật bản đồ và giao tranh đồng đội.', array['MOBA', 'Strategy'], array['PC'], 'Riot Games', 'https://www.leagueoflegends.com/vi-vn/', '#c39b56', '#152e4a'),
  ('counter-strike-2', 'COUNTER-STRIKE 2', 'FPS', 2023, 'CS2', 'FPS chiến thuật xoay quanh kỹ năng ngắm bắn, utility, quản lý kinh tế và phối hợp.', array['FPS', 'Tactical'], array['PC'], 'Valve', 'https://www.counter-strike.net/cs2', '#e7a24b', '#242c3c'),
  ('apex-legends', 'APEX LEGENDS', 'Battle Royale', 2019, 'APEX', 'Battle royale nhịp độ cao với movement linh hoạt, kỹ năng nhân vật và chiến thuật theo squad.', array['Battle Royale', 'FPS'], array['PC', 'PlayStation', 'Xbox'], 'Respawn Entertainment', 'https://www.ea.com/games/apex-legends', '#e65a4f', '#30203a'),
  ('genshin-impact', 'GENSHIN IMPACT', 'Action RPG', 2020, 'G', 'Action RPG thế giới mở tập trung vào khám phá, phản ứng nguyên tố và câu chuyện nhân vật.', array['Action RPG', 'Open World'], array['PC', 'PlayStation', 'Mobile'], 'HoYoverse', 'https://genshin.hoyoverse.com/', '#63b9b1', '#29305d'),
  ('elden-ring', 'ELDEN RING', 'Action RPG', 2022, 'ER', 'Action RPG thử thách với thế giới mở rộng lớn, chiến đấu có chiều sâu và nhiều bí mật để khám phá.', array['Action RPG', 'Soulslike'], array['PC', 'PlayStation', 'Xbox'], 'FromSoftware', 'https://en.bandainamcoent.eu/elden-ring/elden-ring', '#d2ad63', '#253b37'),
  ('pubg-battlegrounds', 'PUBG: BATTLEGROUNDS', 'Battle Royale', 2017, 'PUBG', 'Battle royale sinh tồn với nhịp độ căng thẳng, chiến thuật vị trí và những pha giao tranh quyết định.', array['Battle Royale', 'Shooter'], array['PC', 'PlayStation', 'Xbox'], 'KRAFTON', 'https://pubg.com/', '#d6a64d', '#262a30'),
  ('fortnite', 'FORTNITE', 'Battle Royale', 2017, 'FORTNITE', 'Battle royale đầy màu sắc kết hợp xây dựng, chiến đấu và các sự kiện cộng đồng liên tục thay đổi.', array['Battle Royale', 'Building', 'Shooter'], array['PC', 'PlayStation', 'Xbox', 'Nintendo Switch'], 'Epic Games', 'https://www.fortnite.com/', '#6a74ed', '#242044'),
  ('dota-2', 'DOTA 2', 'MOBA', 2013, 'DOTA 2', 'MOBA cạnh tranh với hệ thống tướng sâu, chiến thuật draft và những trận đấu đòi hỏi phối hợp đội hình.', array['MOBA', 'Strategy'], array['PC'], 'Valve', 'https://www.dota2.com/', '#c84d3f', '#2b1b1d'),
  ('overwatch-2', 'OVERWATCH 2', 'Hero Shooter', 2022, 'OW2', 'Hero shooter theo đội với dàn anh hùng đa dạng, kỹ năng phối hợp và nhịp giao tranh nhanh.', array['Hero Shooter', 'FPS', 'Team-based'], array['PC', 'PlayStation', 'Xbox', 'Nintendo Switch'], 'Blizzard Entertainment', 'https://overwatch.blizzard.com/', '#f0a84b', '#243b5a'),
  ('call-of-duty-warzone', 'CALL OF DUTY: WARZONE', 'Battle Royale', 2020, 'WARZONE', 'Trải nghiệm battle royale quân sự với đấu súng tốc độ cao, trang bị tùy chỉnh và phối hợp tổ đội.', array['Battle Royale', 'FPS'], array['PC', 'PlayStation', 'Xbox'], 'Activision', 'https://www.callofduty.com/warzone', '#91a56a', '#242b28'),
  ('minecraft', 'MINECRAFT', 'Sandbox', 2011, 'MINECRAFT', 'Thế giới khối mở cho phép khám phá, chế tạo, xây dựng và sinh tồn theo cách của riêng bạn.', array['Sandbox', 'Survival', 'Creative'], array['PC', 'PlayStation', 'Xbox', 'Nintendo Switch', 'Mobile'], 'Mojang Studios', 'https://www.minecraft.net/', '#6da85d', '#263d35'),
  ('roblox', 'ROBLOX', 'Sandbox', 2006, 'ROBLOX', 'Nền tảng trải nghiệm do cộng đồng tạo ra, từ mini-game vui nhộn đến thế giới nhập vai nhiều người chơi.', array['Sandbox', 'Social', 'UGC'], array['PC', 'Mobile', 'Xbox', 'PlayStation'], 'Roblox Corporation', 'https://www.roblox.com/', '#d9dce4', '#242833'),
  ('honkai-star-rail', 'HONKAI: STAR RAIL', 'Turn-based RPG', 2023, 'HSR', 'RPG theo lượt trong chuyến du hành vũ trụ, nổi bật với chiến thuật tổ đội và câu chuyện khoa học viễn tưởng.', array['Turn-based RPG', 'Sci-Fi', 'RPG'], array['PC', 'PlayStation 5', 'Mobile'], 'HoYoverse', 'https://hsr.hoyoverse.com/', '#b28bf4', '#25234b'),
  ('zenless-zone-zero', 'ZENLESS ZONE ZERO', 'Action RPG', 2024, 'ZZZ', 'Action RPG đô thị với chiến đấu nhịp nhanh, chuyển nhân vật linh hoạt và phong cách hình ảnh đậm chất anime.', array['Action RPG', 'Action', 'Urban Fantasy'], array['PC', 'PlayStation 5', 'Mobile'], 'HoYoverse', 'https://zenless.hoyoverse.com/', '#e7c65a', '#3a2a26'),
  ('black-myth-wukong', 'BLACK MYTH: WUKONG', 'Action RPG', 2024, 'WUKONG', 'Action RPG lấy cảm hứng từ Tây Du Ký, kết hợp các trận đấu boss thử thách và thế giới thần thoại.', array['Action RPG', 'Soulslike', 'Mythology'], array['PC', 'PlayStation 5', 'Xbox Series X|S'], 'Game Science', 'https://www.heishenhua.com/', '#d69b47', '#34241d'),
  ('stardew-valley', 'STARDEW VALLEY', 'Simulation', 2016, 'STARDEW', 'Mô phỏng cuộc sống nông trại thư giãn với trồng trọt, câu cá, khám phá hầm mỏ và xây dựng quan hệ.', array['Simulation', 'Farming', 'RPG'], array['PC', 'PlayStation', 'Xbox', 'Nintendo Switch', 'Mobile'], 'ConcernedApe', 'https://www.stardewvalley.net/', '#8dc56d', '#324d3c'),
  ('ea-sports-fc-26', 'EA SPORTS FC 26', 'Sports', 2025, 'FC 26', 'Bóng đá mô phỏng với các chế độ thi đấu đa dạng, xây dựng đội hình và chơi cùng bạn bè.', array['Sports', 'Football', 'Multiplayer'], array['PC', 'PlayStation', 'Xbox', 'Nintendo Switch'], 'EA Sports', 'https://www.ea.com/games/ea-sports-fc/fc-26', '#83c85a', '#173a2d'),
  ('the-witcher-3', 'THE WITCHER 3: WILD HUNT', 'Action RPG', 2015, 'W3', 'RPG thế giới mở theo chân Geralt trong hành trình săn quái, điều tra nhiệm vụ và lựa chọn ảnh hưởng cốt truyện.', array['Action RPG', 'Open World', 'Fantasy'], array['PC', 'PlayStation', 'Xbox', 'Nintendo Switch'], 'CD Projekt Red', 'https://www.thewitcher.com/us/en/witcher3', '#b8a17a', '#29333a'),
  ('final-fantasy-xiv', 'FINAL FANTASY XIV', 'MMORPG', 2013, 'FFXIV', 'MMORPG giàu cốt truyện với dungeon, raid, nghề chế tạo và một cộng đồng phiêu lưu rộng lớn.', array['MMORPG', 'Fantasy', 'Co-op'], array['PC', 'PlayStation', 'Xbox Series X|S'], 'Square Enix', 'https://na.finalfantasyxiv.com/', '#6ba6d9', '#202c46'),
  ('marvel-rivals', 'MARVEL RIVALS', 'Hero Shooter', 2024, 'RIVALS', 'Hero shooter PvP theo đội, nơi các nhân vật Marvel phối hợp kỹ năng và tận dụng môi trường phá hủy.', array['Hero Shooter', 'PvP', 'Action'], array['PC', 'PlayStation 5', 'Xbox Series X|S'], 'NetEase Games', 'https://www.marvelrivals.com/', '#df5a4d', '#29233f'),
  ('helldivers-2', 'HELLDIVERS 2', 'Co-op Shooter', 2024, 'HELLDIVERS', 'Co-op shooter góc nhìn thứ ba đề cao phối hợp đồng đội, hỏa lực áp đảo và những tình huống hỗn loạn.', array['Co-op Shooter', 'PvE', 'Action'], array['PC', 'PlayStation 5', 'Xbox Series X|S'], 'Arrowhead Game Studios', 'https://www.playstation.com/games/helldivers-2/', '#d9b96c', '#30343a')
on conflict (slug) do update set
  title = excluded.title,
  category = excluded.category,
  release_year = excluded.release_year,
  mark = excluded.mark,
  description = excluded.description,
  genres = excluded.genres,
  platforms = excluded.platforms,
  developer = excluded.developer,
  official_url = excluded.official_url,
  art_primary = excluded.art_primary,
  art_secondary = excluded.art_secondary,
  updated_at = now();

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


-- Important: no admin/editor write policy is included yet. Do not expose a service-role key
-- to the browser. Add server-side role checks and reviewed RLS policies before launching CMS features.
