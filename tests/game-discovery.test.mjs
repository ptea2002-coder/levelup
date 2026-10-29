import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const component = readFileSync(new URL("../src/components/game-discovery-studio.tsx", import.meta.url), "utf8");
const page = readFileSync(new URL("../src/app/discover/page.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../src/app/discovery.css", import.meta.url), "utf8");
const header = readFileSync(new URL("../src/components/site-header.tsx", import.meta.url), "utf8");
const api = readFileSync(new URL("../src/app/api/games/route.ts", import.meta.url), "utf8");

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
  assert.match(component, /Khớp gu đã chọn/);
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
