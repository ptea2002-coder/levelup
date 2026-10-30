-- P2: protect user-generated game reviews and comments.
create schema if not exists levelup_private;
revoke all on schema levelup_private from public, anon, authenticated;

create table if not exists levelup_private.user_content_rate_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null check (action in ('review', 'comment')),
  created_at timestamptz not null default now()
);

create index if not exists user_content_rate_events_user_action_time_idx
  on levelup_private.user_content_rate_events (user_id, action, created_at desc);

revoke all on levelup_private.user_content_rate_events from public, anon, authenticated;

create or replace function public.enforce_content_submission_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  actor_id uuid := auth.uid();
  action_name text;
  window_interval interval;
  max_submissions integer;
  recent_count integer;
begin
  if actor_id is null or new.user_id is distinct from actor_id then
    raise exception using errcode = '42501', message = 'content_submission_user_mismatch';
  end if;

  if tg_table_name = 'reviews' then
    action_name := 'review';
    window_interval := interval '1 hour';
    max_submissions := 3;
  elsif tg_table_name = 'comments' then
    action_name := 'comment';
    window_interval := interval '10 minutes';
    max_submissions := 8;
  else
    raise exception using errcode = '22023', message = 'unsupported_content_table';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(actor_id::text || ':' || action_name, 0)
  );

  delete from levelup_private.user_content_rate_events
  where user_id = actor_id
    and created_at < pg_catalog.now() - interval '1 day';

  select count(*) into recent_count
  from levelup_private.user_content_rate_events
  where user_id = actor_id
    and action = action_name
    and created_at >= pg_catalog.now() - window_interval;

  if recent_count >= max_submissions then
    raise exception using errcode = 'P0001', message = 'rate_limit_exceeded';
  end if;

  insert into levelup_private.user_content_rate_events (user_id, action)
  values (actor_id, action_name);

  return new;
end;
$function$;

revoke all on function public.enforce_content_submission_rate_limit() from public, anon, authenticated;

drop trigger if exists enforce_review_submission_rate_limit on public.reviews;
create trigger enforce_review_submission_rate_limit
  before insert on public.reviews
  for each row execute function public.enforce_content_submission_rate_limit();

drop trigger if exists enforce_comment_submission_rate_limit on public.comments;
create trigger enforce_comment_submission_rate_limit
  before insert on public.comments
  for each row execute function public.enforce_content_submission_rate_limit();

drop policy if exists "Users delete their own pending reviews" on public.reviews;
drop policy if exists "Users delete their own pending or rejected reviews" on public.reviews;
create policy "Users delete their own pending or rejected reviews"
  on public.reviews for delete to authenticated
  using (user_id = (select auth.uid()) and status in ('pending', 'rejected'));

drop policy if exists "Users delete their own pending comments" on public.comments;
drop policy if exists "Users delete their own pending or rejected comments" on public.comments;
create policy "Users delete their own pending or rejected comments"
  on public.comments for delete to authenticated
  using (user_id = (select auth.uid()) and status in ('pending', 'rejected'));

drop policy if exists "Admins read all game reviews" on public.reviews;
create policy "Admins read all game reviews"
  on public.reviews for select to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins moderate game reviews" on public.reviews;
create policy "Admins moderate game reviews"
  on public.reviews for update to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check (
    (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    and status in ('pending', 'published', 'rejected')
  );

drop policy if exists "Admins read all game comments" on public.comments;
create policy "Admins read all game comments"
  on public.comments for select to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins moderate game comments" on public.comments;
create policy "Admins moderate game comments"
  on public.comments for update to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check (
    (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    and status in ('pending', 'published', 'rejected')
  );

grant update (status) on public.reviews to authenticated;
grant update (status) on public.comments to authenticated;
