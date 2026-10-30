import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const artwork = readFileSync(new URL("../src/lib/game-art.ts", import.meta.url), "utf8");
const nextConfig = readFileSync(new URL("../next.config.ts", import.meta.url), "utf8");

function artworkSection(slug) {
  const start = artwork.indexOf('"' + slug + '": {');
  const end = artwork.indexOf("\n  },", start);
  assert.notEqual(start, -1, "artwork entry exists for " + slug);
  assert.notEqual(end, -1, "artwork entry is closed for " + slug);
  return artwork.slice(start, end);
}

test("Zenless Zone Zero uses current Steam shared artwork assets", () => {
  const section = artworkSection("zenless-zone-zero");
  assert.match(section, /shared\.akamai\.steamstatic\.com\/store_item_assets\/steam\/apps\/4162040\/[^"]+\/header_alt_assets_2\.jpg/);
  assert.match(section, /shared\.akamai\.steamstatic\.com\/store_item_assets\/steam\/apps\/4162040\/[^"]+\/page_bg_raw\.jpg/);
});

test("EA SPORTS FC 26 uses current Steam shared artwork assets", () => {
  const section = artworkSection("ea-sports-fc-26");
  assert.match(section, /shared\.akamai\.steamstatic\.com\/store_item_assets\/steam\/apps\/3405690\/[^"]+\/header\.jpg/);
  assert.match(section, /shared\.akamai\.steamstatic\.com\/store_item_assets\/steam\/apps\/3405690\/[^"]+\/page_bg_raw\.jpg/);
});

test("Next Image allows Steam's current shared asset host", () => {
  assert.match(nextConfig, /hostname: "shared\.akamai\.steamstatic\.com", pathname: "\/store_item_assets\/steam\/apps\/\*\*"/);
});
