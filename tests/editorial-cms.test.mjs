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
