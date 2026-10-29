import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const repository = readFileSync(new URL("../src/lib/game-repository.ts", import.meta.url), "utf8");
const explorer = readFileSync(new URL("../src/components/game-explorer.tsx", import.meta.url), "utf8");
const api = readFileSync(new URL("../src/app/api/games/route.ts", import.meta.url), "utf8");
const migration = readFileSync(new URL("../supabase/migrations/20261029150000_expand_game_catalog.sql", import.meta.url), "utf8");
const sync = readFileSync(new URL("../supabase/functions/sync-game-catalog/index.ts", import.meta.url), "utf8");
const cron = readFileSync(new URL("../supabase/migrations/20261029151000_schedule_game_catalog_sync.sql", import.meta.url), "utf8");
const facetsMigration = readFileSync(new URL("../supabase/migrations/20261029154000_catalog_facets.sql", import.meta.url), "utf8");
const igdbMigration = readFileSync(new URL("../supabase/migrations/20261029155000_igdb_multiplatform_catalog.sql", import.meta.url), "utf8");
const igdbSync = readFileSync(new URL("../supabase/functions/sync-igdb-catalog/index.ts", import.meta.url), "utf8");
const sitemap = readFileSync(new URL("../src/app/sitemap.ts", import.meta.url), "utf8");
const gameCard = readFileSync(new URL("../src/components/game-card.tsx", import.meta.url), "utf8");
const gameDetail = readFileSync(new URL("../src/app/games/[slug]/page.tsx", import.meta.url), "utf8");
const detailContent = readFileSync(new URL("../src/components/game-detail-content.tsx", import.meta.url), "utf8");
const home = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8");
const hero = readFileSync(new URL("../src/components/hero-experience.tsx", import.meta.url), "utf8");
const locker = readFileSync(new URL("../src/components/game-locker.tsx", import.meta.url), "utf8");
const commandCenter = readFileSync(new URL("../src/components/gamer-command-center.tsx", import.meta.url), "utf8");

test("game search is server-side and returns a small bounded page", () => {
  assert.match(repository, /\.rpc\("search_games_catalog"/);
  assert.match(migration, /limit greatest\(1, least\(coalesce\(p_limit, 24\), 48\)\)/i);
  assert.match(api, /Math\.min\(Number\(search\.get\("limit"\).*48/);
});

test("production catalog errors do not silently fall back to the starter list", () => {
  assert.match(repository, /process\.env\.NODE_ENV === "development"/);
  assert.match(repository, /\{ items: \[\], total: 0, available: false \}/);
});

test("catalog search and filters are sent to the server instead of filtering the full database in the browser", () => {
  assert.match(explorer, /fetch\("\/api\/games\?"/);
  assert.match(explorer, /Tải thêm 24 game/);
  assert.match(explorer, /AbortController/);
});

test("catalog rows have stable source IDs, image fields and search indexes", () => {
  assert.match(migration, /source_provider text/);
  assert.match(migration, /source_id text/);
  assert.match(migration, /cover_url text/);
  assert.match(migration, /games_source_provider_id_unique/);
  assert.match(migration, /games_title_trgm_idx/);
});

test("real-data sync authenticates, deduplicates by provider ID and stores upstream metadata", () => {
  assert.match(sync, /x-catalog-sync-secret/);
  assert.match(sync, /source_provider: "steamspy"/);
  assert.match(sync, /source_id: String\(appId\)/);
  assert.match(sync, /source_metadata: \{ \.\.\.metadata, steamspy: app \}/);
  assert.match(sync, /seenThisPage\.has\(slug\)/);
  assert.match(sync, /upsert\(rows\.slice/);
});

test("catalog import continues in the background with the upstream request rate respected", () => {
  assert.match(sync, /< 55_000/);
  assert.match(cron, /'\* \* \* \* \*'/);
  assert.match(cron, /status <> 'complete'/);
});

test("discovery facets are sourced from visible catalog records instead of hard-coded options", () => {
  assert.match(facetsMigration, /get_game_catalog_facets/);
  assert.match(facetsMigration, /is_catalog_visible = true/);
  assert.match(repository, /rpc\("get_game_catalog_facets"\)/);
  assert.match(explorer, /availablePlatforms/);
  assert.doesNotMatch(explorer, /commonPlatforms/);
});

test("SteamSpy player counts are clearly labeled as reference metrics rather than live players", () => {
  assert.match(gameCard, /CCU tham khảo/);
  assert.doesNotMatch(gameCard, / đang chơi/);
  assert.match(gameDetail, /không phải feed live/);
});

test("sitemap reads every visible game slug in bounded pages instead of stopping at 5,000", () => {
  assert.match(sitemap, /getSitemapGameSlugs/);
  assert.match(repository, /getSitemapGameSlugs/);
  assert.match(repository, /\.range\(offset, offset \+ pageSize - 1\)/);
  assert.doesNotMatch(sitemap, /getSitemapGames\(5000\)/);
});

test("homepage database count uses the catalog total and locker counts all local saves", () => {
  assert.match(home, /getGamesPage\(\{ page: 1, pageSize: 1/);
  assert.match(hero, /gameCount/);
  assert.match(commandCenter, /Object\.keys\(library\)\.length/);
  assert.match(commandCenter, /hiển thị tối đa 3 game nổi bật/);
});

test("Game Locker resolves saved slugs outside its initial catalog page", () => {
  assert.match(api, /search\.get\("slugs"\)/);
  assert.match(locker, /api\/games\?slugs=/);
  assert.match(locker, /allGames/);
});


test("IGDB catalog enrichment is provider-linked, optional, and scheduled behind an explicit enable flag", () => {
  assert.match(igdbMigration, /igdb_id bigint/);
  assert.match(igdbMigration, /igdb_synced_at timestamptz/);
  assert.match(igdbMigration, /enabled boolean not null default false/);
  assert.match(igdbMigration, /levelup-igdb-catalog-sync/);
  assert.match(igdbSync, /IGDB_CLIENT_ID/);
  assert.match(igdbSync, /IGDB_CLIENT_SECRET/);
  assert.match(igdbSync, /external_game_source\.name/);
  assert.match(igdbSync, /igdb_id: game\.id/);
  assert.match(sync, /Boolean\(existingSource\?\.igdb_id\)/);
  assert.match(sync, /\{ \.\.\.metadata, steamspy: app \}/);
});

test("P1 discovery ranks community sentiment and related games instead of raw review counts alone", () => {
  assert.match(igdbMigration, /positive_reviews::numeric \/ nullif\(positive_reviews \+ negative_reviews, 0\)/);
  assert.match(igdbMigration, /platform_name ilike/);
  assert.match(explorer, /Đề xuất cộng đồng/);
  assert.match(repository, /scoreRelatedGame/);
  assert.match(repository, /sharedGenres \* 12/);
  assert.match(gameDetail, /detail-metrics-strip/);
});


test("game profiles use the catalog's real artwork before falling back to curated imagery", () => {
  assert.match(detailContent, /game\.backgroundUrl/);
  assert.match(detailContent, /game\.coverUrl/);
  assert.match(igdbSync, /microsoft windows\|windows\|linux/);
});
