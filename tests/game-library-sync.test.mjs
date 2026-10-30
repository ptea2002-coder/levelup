import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const library = readFileSync(new URL("../src/lib/game-library.ts", import.meta.url), "utf8");
const provider = readFileSync(new URL("../src/components/game-library-provider.tsx", import.meta.url), "utf8");
const control = readFileSync(new URL("../src/components/game-library-control.tsx", import.meta.url), "utf8");
const locker = readFileSync(new URL("../src/components/game-locker.tsx", import.meta.url), "utf8");
const migration = readFileSync(new URL("../supabase/migrations/20261029160000_user_game_library_cloud_sync.sql", import.meta.url), "utf8");
const schema = readFileSync(new URL("../supabase/schema.sql", import.meta.url), "utf8");

test("P2 library keeps per-account browser storage separate from guest saves", () => {
  assert.match(library, /GAME_LIBRARY_USER_STORAGE_PREFIX/);
  assert.match(library, /getGameLibraryStorageKey/);
  assert.match(provider, /getGameLibraryClaimedKey\(userId\)/);
  assert.match(provider, /hasClaimedGuestLibrary/);
});

test("P2 library syncs statuses, favorites, and removal tombstones to the signed-in account", () => {
  assert.match(library, /status: GameLibraryStatus \| null/);
  assert.match(library, /isFavorite: boolean/);
  assert.match(library, /mergeGameLibraries/);
  assert.match(provider, /\.from\("user_game_library"\)/);
  assert.match(provider, /\.upsert\(rows, \{ onConflict: "user_id,game_slug" \}\)/);
  assert.match(control, /setFavorite\(gameSlug, nextFavorite\)/);
  assert.match(control, /library-favorite-btn/);
});

test("P2 cloud library is protected by owner-only row-level security", () => {
  assert.match(migration, /enable row level security/i);
  assert.match(migration, /user_id = \(select auth\.uid\(\)\)/);
  assert.match(migration, /with check \(user_id = \(select auth\.uid\(\)\)\)/);
  assert.match(migration, /revoke all on public\.user_game_library from anon/i);
  assert.match(schema, /create table if not exists public\.user_game_library/i);
});

test("P2 Game Locker exposes a dedicated favorites filter", () => {
  assert.match(locker, /value: "favorites", label: "Yêu thích"/);
  assert.match(locker, /activeFilter === "favorites" \? Boolean\(library\[game\.slug\]\?\.isFavorite\)/);
});

test("P2 UI exposes sync state and preserves a local-first guest experience", () => {
  assert.match(provider, /type LibrarySyncStatus = "local" \| "syncing" \| "synced" \| "error"/);
  assert.match(control, /Đăng nhập để đồng bộ giữa các thiết bị/);
  assert.match(control, /Dữ liệu cục bộ vẫn được giữ/);
});


test("initial anonymous auth state cannot leave guest library controls disabled", () => {
  assert.ok(provider.includes("const userIdRef = useRef<string | null>(null);"));
  assert.ok(!provider.includes("useRef<string | null | undefined>(undefined)"));
});

test("legacy guest library entries without status are preserved", () => {
  assert.match(library, /const status = entry\.status \?\? null/);
  assert.match(library, /status: status as GameLibraryStatus \| null/);
});

test("Game Locker avoids duplicate lookups and exposes a retry for unresolved saved games", () => {
  assert.match(locker, /activeSlugSignature/);
  assert.match(locker, /attemptedSlugsRef/);
  assert.match(locker, /lookupRetryKey/);
  assert.match(locker, /unresolvedSlugs/);
  assert.match(locker, /Thử tải lại/);
});
