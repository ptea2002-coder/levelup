import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(new URL("../supabase/migrations/20261029230000_editorial_cms.sql", import.meta.url), "utf8");
const cms = readFileSync(new URL("../src/components/editorial-cms.tsx", import.meta.url), "utf8");
const repository = readFileSync(new URL("../src/lib/article-repository.ts", import.meta.url), "utf8");
const page = readFileSync(new URL("../src/app/admin/editorial/page.tsx", import.meta.url), "utf8");

test("editorial access is gated by immutable app_metadata roles and RLS", () => {
  assert.ok(migration.includes("auth.jwt() -> 'app_metadata' ->> 'role'"));
  assert.ok(migration.includes("('admin', 'editor')"));
  assert.ok(migration.includes('create policy "Editors update articles"'));
  assert.ok(migration.includes('create policy "Editors upload editorial media"'));
  assert.ok(cms.includes('user?.app_metadata?.role'));
  assert.ok(cms.includes("app_metadata"));
});

test("CMS supports drafts, preview, publish, archive and bounded image uploads", () => {
  for (const phrase of ['"draft" | "published" | "archived"', "Xem trước", "Xuất bản", "Lưu trữ", "5 * 1024 * 1024", "editorial-media"]) {
    assert.ok(cms.includes(phrase), `missing ${phrase}`);
  }
});

test("public editorial pages can combine database articles with evergreen guides", () => {
  assert.ok(repository.includes('.eq("status", "published")'));
  assert.ok(repository.includes("staticArticles.filter"));
  assert.ok(repository.includes("canonicalUrl"));
  assert.ok(page.includes("EditorialCms"));
});

test("P3.1 lets editors collaborate without allowing author reassignment", () => {
  const hardening = readFileSync(new URL("../supabase/migrations/20261029164550_editorial_hardening.sql", import.meta.url), "utf8");
  assert.ok(hardening.includes("create trigger articles_guard_author_id"));
  assert.ok(hardening.includes("new.author_id := old.author_id"));
  assert.ok(hardening.includes("drop policy if exists \"Editors update articles\""));
  assert.ok(hardening.includes("(select public.is_levelup_editor())"));
  assert.ok(hardening.includes("articles_published_by_idx"));
});

test("archive operation requires a returned row before showing success", () => {
  assert.ok(cms.includes('.select("id")'));
  assert.ok(cms.includes('.maybeSingle()'));
  assert.ok(cms.includes("Có lỗi kết nối khi lưu trữ bài viết. Hãy thử lại."));
});
