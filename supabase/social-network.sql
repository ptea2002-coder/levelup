-- LevelUP social network core. Run after supabase/schema.sql.
-- Additive migration; existing catalog, reviews, favorites, articles and game/article comments remain intact.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  game_id uuid references public.games(id) on delete set null,
  body text not null check (char_length(body) between 1 and 1200),
  status text not null default 'published' check (status in ('published', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1200),
  status text not null default 'published' check (status in ('published', 'hidden')),
  created_at timestamptz not null default now()
);
create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_no_self_follow check (follower_id <> following_id)
);
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('follow', 'like', 'comment')),
  post_id uuid references public.posts(id) on delete set null,
  comment_id uuid references public.post_comments(id) on delete set null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('post', 'comment', 'profile')),
  target_post_id uuid references public.posts(id) on delete cascade,
  target_comment_id uuid references public.post_comments(id) on delete cascade,
  target_profile_id uuid references public.profiles(id) on delete cascade,
  reason text not null check (reason in ('spam', 'harassment', 'hate', 'scam', 'other')),
  details text not null default '' check (char_length(details) <= 500),
  status text not null default 'open' check (status in ('open', 'reviewed', 'actioned', 'dismissed')),
  created_at timestamptz not null default now(),
  constraint content_reports_one_target check (
    (target_type = 'post' and target_post_id is not null and target_comment_id is null and target_profile_id is null)
    or (target_type = 'comment' and target_post_id is null and target_comment_id is not null and target_profile_id is null)
    or (target_type = 'profile' and target_post_id is null and target_comment_id is null and target_profile_id is not null)
  )
);

create index if not exists posts_feed_idx on public.posts (status, created_at desc);
create index if not exists posts_author_idx on public.posts (author_id, created_at desc);
create index if not exists post_comments_feed_idx on public.post_comments (post_id, created_at asc);
create index if not exists post_comments_author_idx on public.post_comments (author_id, created_at desc);
create index if not exists post_likes_user_idx on public.post_likes (user_id, post_id);
create index if not exists follows_following_idx on public.follows (following_id, follower_id);
create index if not exists notifications_recipient_feed_idx on public.notifications (recipient_id, created_at desc);
create index if not exists content_reports_status_idx on public.content_reports (status, created_at asc);
create index if not exists posts_game_id_idx on public.posts (game_id);
create index if not exists notifications_actor_id_idx on public.notifications (actor_id);
create index if not exists notifications_post_id_idx on public.notifications (post_id);
create index if not exists notifications_comment_id_idx on public.notifications (comment_id);
create index if not exists content_reports_reporter_id_idx on public.content_reports (reporter_id);
create index if not exists content_reports_target_post_id_idx on public.content_reports (target_post_id);
create index if not exists content_reports_target_comment_id_idx on public.content_reports (target_comment_id);
create index if not exists content_reports_target_profile_id_idx on public.content_reports (target_profile_id);

alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.post_comments enable row level security;
alter table public.follows enable row level security;
alter table public.notifications enable row level security;
alter table public.content_reports enable row level security;

drop policy if exists "Published posts are public" on public.posts;
create policy "Published posts are public" on public.posts for select to anon, authenticated
using (status = 'published' or author_id = (select auth.uid()) or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists "Authenticated users create their own posts" on public.posts;
create policy "Authenticated users create their own posts" on public.posts for insert to authenticated
with check (author_id = (select auth.uid()) and status = 'published');
drop policy if exists "Admins moderate posts" on public.posts;
drop policy if exists "Authors edit their published posts" on public.posts;
drop policy if exists "Authors and admins update posts" on public.posts;
create policy "Authors and admins update posts" on public.posts for update to authenticated
using (
  (author_id = (select auth.uid()) and status = 'published')
  or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
)
with check (
  (author_id = (select auth.uid()) and status = 'published')
  or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
);

drop policy if exists "Admins delete posts" on public.posts;
drop policy if exists "Authors delete their posts" on public.posts;
drop policy if exists "Authors and admins delete posts" on public.posts;
create policy "Authors and admins delete posts" on public.posts for delete to authenticated
using (
  author_id = (select auth.uid())
  or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
);

drop policy if exists "Likes on public posts are readable" on public.post_likes;
create policy "Likes on public posts are readable" on public.post_likes for select to anon, authenticated
using (
  exists (
    select 1 from public.posts p
    where p.id = post_likes.post_id and (
      p.status = 'published'
      or p.author_id = (select auth.uid())
      or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
    )
  )
);
drop policy if exists "Users like posts as themselves" on public.post_likes;
create policy "Users like posts as themselves" on public.post_likes for insert to authenticated
with check (user_id = (select auth.uid()) and exists (select 1 from public.posts p where p.id = post_likes.post_id and p.status = 'published'));
drop policy if exists "Users remove their own likes" on public.post_likes;
create policy "Users remove their own likes" on public.post_likes for delete to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Comments on visible posts are readable" on public.post_comments;
create policy "Comments on visible posts are readable" on public.post_comments for select to anon, authenticated
using (author_id = (select auth.uid()) or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  or (status = 'published' and exists (select 1 from public.posts p where p.id = post_comments.post_id and p.status = 'published')));
drop policy if exists "Users comment as themselves on published posts" on public.post_comments;
create policy "Users comment as themselves on published posts" on public.post_comments for insert to authenticated
with check (author_id = (select auth.uid()) and status = 'published'
  and exists (select 1 from public.posts p where p.id = post_comments.post_id and p.status = 'published'));
drop policy if exists "Authors delete their comments" on public.post_comments;
create policy "Authors delete their comments" on public.post_comments for delete to authenticated
using (author_id = (select auth.uid()));
drop policy if exists "Admins moderate comments" on public.post_comments;
create policy "Admins moderate comments" on public.post_comments for update to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Follows are publicly readable" on public.follows;
create policy "Follows are publicly readable" on public.follows for select to anon, authenticated using (true);
drop policy if exists "Users follow others as themselves" on public.follows;
create policy "Users follow others as themselves" on public.follows for insert to authenticated
with check (follower_id = (select auth.uid()) and follower_id <> following_id);
drop policy if exists "Users unfollow as themselves" on public.follows;
create policy "Users unfollow as themselves" on public.follows for delete to authenticated
using (follower_id = (select auth.uid()));

drop policy if exists "Users read their own notifications" on public.notifications;
create policy "Users read their own notifications" on public.notifications for select to authenticated
using (recipient_id = (select auth.uid()));
drop policy if exists "Users mark their own notifications read" on public.notifications;
create policy "Users mark their own notifications read" on public.notifications for update to authenticated
using (recipient_id = (select auth.uid())) with check (recipient_id = (select auth.uid()));

drop policy if exists "Users submit their own content reports" on public.content_reports;
create policy "Users submit their own content reports" on public.content_reports for insert to authenticated
with check (reporter_id = (select auth.uid()) and status = 'open' and (target_profile_id is null or target_profile_id <> (select auth.uid())));
drop policy if exists "Users read own reports and admins read all" on public.content_reports;
create policy "Users read own reports and admins read all" on public.content_reports for select to authenticated
using (reporter_id = (select auth.uid()) or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists "Admins review content reports" on public.content_reports;
create policy "Admins review content reports" on public.content_reports for update to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare base_username text;
begin
  base_username := left(regexp_replace(lower(split_part(coalesce(new.email, ''), '@', 1)), '[^a-z0-9_]', '', 'g'), 12);
  if char_length(base_username) < 3 then base_username := 'gamer'; end if;
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    base_username || '_' || substr(replace(new.id::text, '-', ''), 1, 8),
    left(coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), nullif(new.raw_user_meta_data ->> 'full_name', ''), base_username), 80)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function private.handle_new_user() from public, anon, authenticated;
drop trigger if exists on_auth_user_created_levelup_profile on auth.users;
create trigger on_auth_user_created_levelup_profile after insert on auth.users
for each row execute function private.handle_new_user();

insert into public.profiles (id, username, display_name)
select u.id,
  left(coalesce(nullif(regexp_replace(lower(split_part(coalesce(u.email, ''), '@', 1)), '[^a-z0-9_]', '', 'g'), ''), 'gamer'), 12)
    || '_' || substr(replace(u.id::text, '-', ''), 1, 8),
  left(coalesce(nullif(u.raw_user_meta_data ->> 'display_name', ''), nullif(u.raw_user_meta_data ->> 'full_name', ''), nullif(split_part(coalesce(u.email, ''), '@', 1), ''), 'Game thủ'), 80)
from auth.users u on conflict (id) do nothing;

create or replace function private.set_updated_at()
returns trigger language plpgsql set search_path = ''
as $$ begin new.updated_at := now(); return new; end; $$;
revoke all on function private.set_updated_at() from public, anon, authenticated;
drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at before update on public.posts for each row execute function private.set_updated_at();

create or replace function private.notify_social_activity()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare actor_user uuid; target_user uuid; related_post uuid; related_comment uuid; notification_kind text;
begin
  if tg_table_name = 'follows' then
    actor_user := new.follower_id; target_user := new.following_id; notification_kind := 'follow';
  elsif tg_table_name = 'post_likes' then
    actor_user := new.user_id; related_post := new.post_id; notification_kind := 'like';
    select p.author_id into target_user from public.posts p where p.id = new.post_id;
  else
    actor_user := new.author_id; related_post := new.post_id; related_comment := new.id; notification_kind := 'comment';
    select p.author_id into target_user from public.posts p where p.id = new.post_id;
  end if;
  if target_user is not null and actor_user is not null and target_user <> actor_user then
    insert into public.notifications (recipient_id, actor_id, kind, post_id, comment_id)
    values (target_user, actor_user, notification_kind, related_post, related_comment);
  end if;
  return new;
end;
$$;
revoke all on function private.notify_social_activity() from public, anon, authenticated;
drop trigger if exists follows_notify_social_activity on public.follows;
create trigger follows_notify_social_activity after insert on public.follows for each row execute function private.notify_social_activity();
drop trigger if exists post_likes_notify_social_activity on public.post_likes;
create trigger post_likes_notify_social_activity after insert on public.post_likes for each row execute function private.notify_social_activity();
drop trigger if exists post_comments_notify_social_activity on public.post_comments;
create trigger post_comments_notify_social_activity after insert on public.post_comments for each row execute function private.notify_social_activity();

grant select on public.posts, public.post_likes, public.post_comments, public.follows to anon, authenticated;
grant insert, delete on public.posts to authenticated;
grant update (body, game_id, status) on public.posts to authenticated;
grant insert, delete on public.post_likes to authenticated;
grant insert, delete on public.post_comments to authenticated;
grant update (status) on public.post_comments to authenticated;
grant insert, delete on public.follows to authenticated;
grant select, update (read_at) on public.notifications to authenticated;
grant select, insert, update (status) on public.content_reports to authenticated;
revoke all on public.notifications from anon;
revoke all on public.content_reports from anon;
