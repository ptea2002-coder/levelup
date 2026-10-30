import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(new URL("../supabase/migrations/20261030041422_p6_news_intelligence.sql", import.meta.url), "utf8");
const edge = readFileSync(new URL("../supabase/functions/ingest-news-feeds/index.ts", import.meta.url), "utf8");
const component = readFileSync(new URL("../src/components/news-intelligence.tsx", import.meta.url), "utf8");
const page = readFileSync(new URL("../src/app/admin/news-intelligence/page.tsx", import.meta.url), "utf8");
const editorialCms = readFileSync(new URL("../src/components/editorial-cms.tsx", import.meta.url), "utf8");
const editorialPage = readFileSync(new URL("../src/app/admin/editorial/page.tsx", import.meta.url), "utf8");

test("news sources are disabled by default and require explicit licensing review before enablement", () => {
  assert.match(migration, /is_enabled boolean not null default false/);
  assert.match(migration, /license_status <> 'approved'/);
  assert.match(migration, /license_reviewed_at is not null/);
  assert.match(migration, /license_review_url is not null/);
  assert.match(migration, /Admins update news sources/);
  assert.match(component, /Tôi đã tự kiểm tra điều khoản nguồn/);
});

test("intake deduplicates canonical URLs, source IDs, and title/date fingerprints", () => {
  assert.match(migration, /unique \(source_id, external_id\)/);
  assert.match(migration, /canonical_url text not null[^\n]*unique/);
  assert.match(migration, /fingerprint text not null[^\n]*unique/);
  assert.match(migration, /on conflict do nothing/);
  assert.match(edge, /normalizedTitle/);
  assert.match(edge, /MAX_ITEMS_PER_SOURCE = 25/);
});

test("ingestion validates an editor session and only reads approved enabled HTTPS sources", () => {
  assert.match(edge, /auth\.getUser\(token\)/);
  assert.match(edge, /role !== "admin" && role !== "editor"/);
  assert.match(edge, /safeHttpsUrl/);
  assert.match(edge, /Cross-host feed redirects are blocked/);
  assert.match(edge, /MAX_FEED_BYTES/);
  assert.match(edge, /\.eq\("is_enabled", true\)/);
  assert.match(edge, /\.eq\("license_status", "approved"\)/);
});

test("every queue action requires a human and draft promotion never auto-publishes", () => {
  assert.match(migration, /create_article_draft_from_news_item/);
  assert.match(migration, /'draft'/);
  assert.match(migration, /status = 'converted'/);
  assert.match(migration, /dismiss_news_ingest_item/);
  assert.match(migration, /create or replace function public\.prevent_unedited_news_intake_publish\(\)[\s\S]*?as \$\$/);
  assert.match(editorialCms, /Bản nháp News Intelligence vẫn còn nội dung giữ chỗ/);
  assert.match(component, /Tạo bản nháp trong CMS/);
  assert.match(component, /Bỏ qua/);
  assert.match(component, /pipeline không tự xuất bản/);
  assert.match(editorialCms, /Xuất bản/);
});

test("News Intelligence is private and integrated with the existing editorial workspace", () => {
  assert.match(page, /robots: \{ index: false, follow: false \}/);
  assert.match(page, /NewsIntelligence/);
  assert.match(editorialPage, /admin\/news-intelligence/);
});
