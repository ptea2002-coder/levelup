-- P2: allow abuse reports for game reviews and game comments.
alter table public.content_reports
  add column if not exists target_review_id uuid references public.reviews(id) on delete cascade,
  add column if not exists target_game_comment_id uuid references public.comments(id) on delete cascade;

alter table public.content_reports
  drop constraint if exists content_reports_target_type_check;
alter table public.content_reports
  add constraint content_reports_target_type_check
  check (target_type in ('post', 'comment', 'profile', 'review', 'game_comment'));

alter table public.content_reports
  drop constraint if exists content_reports_one_target;
alter table public.content_reports
  add constraint content_reports_one_target check (
    (target_type = 'post' and target_post_id is not null and target_comment_id is null and target_profile_id is null and target_review_id is null and target_game_comment_id is null)
    or (target_type = 'comment' and target_post_id is null and target_comment_id is not null and target_profile_id is null and target_review_id is null and target_game_comment_id is null)
    or (target_type = 'profile' and target_post_id is null and target_comment_id is null and target_profile_id is not null and target_review_id is null and target_game_comment_id is null)
    or (target_type = 'review' and target_post_id is null and target_comment_id is null and target_profile_id is null and target_review_id is not null and target_game_comment_id is null)
    or (target_type = 'game_comment' and target_post_id is null and target_comment_id is null and target_profile_id is null and target_review_id is null and target_game_comment_id is not null)
  );

create index if not exists content_reports_target_review_id_idx
  on public.content_reports (target_review_id);
create index if not exists content_reports_target_game_comment_id_idx
  on public.content_reports (target_game_comment_id);

drop policy if exists "Users submit their own content reports" on public.content_reports;
create policy "Users submit their own content reports"
  on public.content_reports for insert to authenticated
  with check (
    reporter_id = (select auth.uid())
    and status = 'open'
    and (target_profile_id is null or target_profile_id <> (select auth.uid()))
    and (
      target_review_id is null
      or not exists (
        select 1 from public.reviews r
        where r.id = target_review_id and r.user_id = (select auth.uid())
      )
    )
    and (
      target_game_comment_id is null
      or not exists (
        select 1 from public.comments c
        where c.id = target_game_comment_id and c.user_id = (select auth.uid())
      )
    )
  );
