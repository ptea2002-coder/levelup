import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const component = readFileSync(new URL("../src/components/game-discovery-studio.tsx", import.meta.url), "utf8");
const page = readFileSync(new URL("../src/app/discover/page.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../src/app/discovery.css", import.meta.url), "utf8");
const header = readFileSync(new URL("../src/components/site-header.tsx", import.meta.url), "utf8");
const api = readFileSync(new URL("../src/app/api/games/route.ts", import.meta.url), "utf8");
const ranking = readFileSync(new URL("../src/lib/game-ranking.ts", import.meta.url), "utf8");
const provider = readFileSync(new URL("../src/components/game-library-provider.tsx", import.meta.url), "utf8");
const browserScript = readFileSync(new URL("../scripts/browser-smoke.mjs", import.meta.url), "utf8");

test("P4 Game Discovery Lab is a real route with server-backed catalog paging and SEO", () => {
  assert.match(page, /GameDiscoveryStudio/);
  assert.match(page, /getGamesPage\(\{ page: 1, pageSize: 48, sort: "recommended" \}\)/);
  assert.match(page, /alternates: \{ canonical: "\/discover" \}/);
  assert.match(api, /getGamesPage\(/);
});

test("discovery combines keyword, category, platform, and player mood", () => {
  assert.match(component, /setQuery/);
  assert.match(component, /selectedGenres/);
  assert.match(component, /setPlatform/);
  assert.match(component, /competitive/);
  assert.match(component, /coop/);
  assert.match(component, /story/);
  assert.match(component, /chill/);
});

test("personalization uses saved library signals and exposes recommendation reasons", () => {
  assert.match(component, /useGameLibrary/);
  assert.match(component, /preferredGenres/);
  assert.match(component, /isFavorite/);
  assert.match(component, /Khớp thể loại đã chọn/);
  assert.match(component, /bayesianReview \* 100/);
  assert.match(component, /Gần với game bạn lưu/);
  assert.match(component, /không phải đánh giá chất lượng tuyệt đối/);
});

test("discovery supports bounded catalog pagination and a clear reset path", () => {
  assert.match(component, /limit: "48"/);
  assert.match(component, /Quét thêm 48 game/);
  assert.match(component, /Đặt lại radar/);
  assert.match(component, /AbortController/);
});

test("P4 navigation and styling support responsive and reduced-motion experiences", () => {
  assert.match(header, /href: "\/discover", label: "Gợi ý game"/);
  assert.match(styles, /@media \(max-width: 680px\)/);
  assert.match(styles, /prefers-reduced-motion: reduce/);
  assert.match(styles, /discovery-result-grid/);
});


test("multi-category and mood filters are sent to the server catalog query", () => {
  assert.match(component, /params\.set\("categories", selectedGenres\.join\(","\)\)/);
  assert.match(component, /params\.set\("mode", mode\)/);
  assert.match(api, /categoriesParam/);
  assert.match(api, /safeMode/);
  assert.match(api, /categories,/);
  assert.match(api, /mode: safeMode/);
});

test("catalog ranking uses Bayesian review smoothing and server-side mood filtering", () => {
  const repository = readFileSync(new URL("../src/lib/game-repository.ts", import.meta.url), "utf8");
  const migration = readFileSync(new URL("../supabase/migrations/20261029172810_p4_discovery_ranking_and_filters.sql", import.meta.url), "utf8");
  assert.match(repository, /search_games_catalog_v2/);
  assert.match(repository, /p_categories:/);
  assert.match(repository, /p_mode:/);
  assert.match(ranking, /REVIEW_PRIOR_WEIGHT = 5000/);
  assert.match(ranking, /REVIEW_PRIOR_MEAN = 0\.75/);
  assert.match(ranking, /Bayesian rating keeps tiny review samples/);
  assert.match(migration, /search_games_catalog_v2/);
  assert.match(migration, /p_mode = 'competitive'/);
  assert.match(migration, /p_mode = 'coop'/);
  assert.match(migration, /p_mode = 'story'/);
  assert.match(migration, /p_mode = 'chill'/);
  assert.match(migration, /positive_count \+ 5000 \* 0\.75/);
});

test("recommendation feedback stays local and is isolated between guest and signed-in accounts", () => {
  assert.match(component, /levelup:discovery-feedback:user:/);
  assert.match(component, /levelup:discovery-feedback:guest:v1/);
  assert.match(component, /window\.localStorage\.setItem\(feedbackStorageKey/);
  assert.match(component, /không gửi lên máy chủ/);
  assert.ok(provider.includes("userId: string | null"));
  assert.match(styles, /discovery-feedback/);
  assert.match(browserScript, /levelup:discovery-feedback:guest:v1/);
});
