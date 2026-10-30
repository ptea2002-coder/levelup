-- Keep atomic editor operations behind a non-exposed schema.
-- Public RPC names remain SECURITY INVOKER wrappers for supabase-js compatibility.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

create or replace function private.create_article_draft_from_news_item(p_item_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  intake public.news_ingest_items%rowtype;
  source_record public.news_sources%rowtype;
  v_article_id uuid;
  slug_base text;
  article_slug text;
  article_body text;
begin
  if (select auth.uid()) is null or not (select public.is_levelup_editor()) then
    raise exception 'Editor access required' using errcode = '42501';
  end if;

  select * into intake
    from public.news_ingest_items
    where id = p_item_id
    for update;

  if not found then
    raise exception 'News intake item not found' using errcode = 'P0002';
  end if;
  if intake.status <> 'pending' then
    raise exception 'News intake item has already been reviewed' using errcode = '55000';
  end if;

  select * into source_record
    from public.news_sources
    where id = intake.source_id
      and license_status = 'approved'
      and license_reviewed_at is not null;

  if not found then
    raise exception 'Source licensing review is no longer approved' using errcode = '42501';
  end if;

  slug_base := pg_catalog.btrim(pg_catalog.regexp_replace(pg_catalog.lower(intake.title), '[^a-z0-9]+', '-', 'g'), '-');
  if char_length(slug_base) < 3 then
    slug_base := 'news-item';
  end if;
  article_slug := pg_catalog.left(slug_base, 70) || '-' || pg_catalog.substr(pg_catalog.replace(intake.id::text, '-', ''), 1, 8);

  article_body :=
    '## Ghi chú biên tập' || E'\n\n' ||
    'Đây là đầu mối tin tức từ nguồn bên ngoài, không phải bài viết đã được xác minh. Hãy kiểm tra thông tin với nguồn độc lập, bổ sung bối cảnh và viết lại bằng lời của LevelUP trước khi xuất bản.' || E'\n\n' ||
    '## Nguồn tham khảo' || E'\n\n' ||
    '- ' || source_record.name || ': ' || intake.canonical_url || E'\n\n' ||
    '## Bản tin LevelUP' || E'\n\n' ||
    '[Viết nội dung nguyên bản sau khi xác minh dữ kiện.]';

  insert into public.articles
    (slug, title, excerpt, body_md, status, author_id, category, source_url, source_name, published_at)
  values
    (
      article_slug,
      pg_catalog.left(intake.title, 180),
      'Tin tham khảo từ ' || source_record.name || '. Biên tập viên cần xác minh dữ kiện và viết tóm tắt nguyên bản trước khi xuất bản.',
      article_body,
      'draft',
      (select auth.uid()),
      'NEWS INTELLIGENCE',
      intake.canonical_url,
      source_record.name,
      null
    )
  returning id into v_article_id;

  update public.news_ingest_items
    set status = 'converted',
        article_id = v_article_id,
        reviewed_by = (select auth.uid()),
        reviewed_at = pg_catalog.now(),
        review_notes = 'Converted to an editorial draft; human verification required.'
    where id = p_item_id;

  return v_article_id;
end;
$$;

revoke all on function private.create_article_draft_from_news_item(uuid) from public, anon, authenticated;
grant execute on function private.create_article_draft_from_news_item(uuid) to authenticated;

create or replace function public.create_article_draft_from_news_item(p_item_id uuid)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.create_article_draft_from_news_item(p_item_id);
$$;
revoke all on function public.create_article_draft_from_news_item(uuid) from public, anon;
grant execute on function public.create_article_draft_from_news_item(uuid) to authenticated;

create or replace function private.dismiss_news_ingest_item(p_item_id uuid, p_notes text default null)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not (select public.is_levelup_editor()) then
    raise exception 'Editor access required' using errcode = '42501';
  end if;

  update public.news_ingest_items
    set status = 'dismissed',
        reviewed_by = (select auth.uid()),
        reviewed_at = pg_catalog.now(),
        review_notes = pg_catalog.left(pg_catalog.btrim(coalesce(p_notes, '')), 1000)
    where id = p_item_id
      and status = 'pending';

  if not found then
    raise exception 'News intake item not found or already reviewed' using errcode = '55000';
  end if;

  return true;
end;
$$;

revoke all on function private.dismiss_news_ingest_item(uuid, text) from public, anon, authenticated;
grant execute on function private.dismiss_news_ingest_item(uuid, text) to authenticated;

create or replace function public.dismiss_news_ingest_item(p_item_id uuid, p_notes text default null)
returns boolean
language sql
security invoker
set search_path = ''
as $$
  select private.dismiss_news_ingest_item(p_item_id, p_notes);
$$;
revoke all on function public.dismiss_news_ingest_item(uuid, text) from public, anon;
grant execute on function public.dismiss_news_ingest_item(uuid, text) to authenticated;
