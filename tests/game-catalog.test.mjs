import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const repository = readFileSync(new URL("../src/lib/game-repository.ts", import.meta.url), "utf8");
const explorer = readFileSync(new URL("../src/components/game-explorer.tsx", import.meta.url), "utf8");
const api = readFileSync(new URL("../src/app/api/games/route.ts", import.meta.url), "utf8");
const migration = readFileSync(new URL("../supabase/migrations/20261029150000_expand_game_catalog.sql", import.meta.url), "utf8");
const sync = readFileSync(new URL("../supabase/functions/sync-game-catalog/index.ts", import.meta.url), "utf8");
const cron = readFileSync(new URL("../supabase/migrations/20261029151000_schedule_game_catalog_sync.sql", import.meta.url), "utf8");

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
  assert.match(sync, /source_metadata: app/);
  assert.match(sync, /seenThisPage\.has\(slug\)/);
  assert.match(sync, /upsert\(rows\.slice/);
});

test("catalog import continues in the background with the upstream request rate respected", () => {
  assert.match(sync, /< 55_000/);
  assert.match(cron, /'\* \* \* \* \*'/);
  assert.match(cron, /status <> 'complete'/);
});
