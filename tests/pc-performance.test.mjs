import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../src/app/build-lab/page.tsx", import.meta.url), "utf8");
const component = readFileSync(new URL("../src/components/pc-performance-lab.tsx", import.meta.url), "utf8");
const requirements = readFileSync(new URL("../src/lib/pc-performance.ts", import.meta.url), "utf8");
const header = readFileSync(new URL("../src/components/site-header.tsx", import.meta.url), "utf8");
const sitemap = readFileSync(new URL("../src/app/sitemap.ts", import.meta.url), "utf8");
const styles = readFileSync(new URL("../src/app/pc-performance.css", import.meta.url), "utf8");
const roadmap = readFileSync(new URL("../docs/ROADMAP.md", import.meta.url), "utf8");

test("P5 PC Build Lab has an indexable route and navigation entry", () => {
  assert.match(page, /PCPerformanceLab/);
  assert.match(page, /canonical: "\/build-lab"/);
  assert.match(header, /href: "\/build-lab", label: "PC Lab"/);
  assert.match(sitemap, /absoluteUrl\("\/build-lab"\)/);
});

test("requirements use source-linked records and never infer an FPS result", () => {
  assert.match(requirements, /sourceLabel:/);
  assert.match(requirements, /sourceUrl:/);
  assert.match(requirements, /checkedAt: "2026-10-30"/);
  assert.match(requirements, /officialPerformanceNote/);
  assert.match(component, /NO FAKE FPS/);
  assert.match(component, /CHƯA DỰ BÁO/);
  assert.match(component, /LevelUP không suy đoán từ tên linh kiện/);
  assert.doesNotMatch(component, /Math\.random\(\)/);
});

test("published numeric requirements are compared conservatively", () => {
  assert.match(requirements, /function metricStatus/);
  assert.match(requirements, /if \(actual < minimum\) return "below-minimum"/);
  assert.match(requirements, /requiresSsd/);
  assert.match(requirements, /function hardwareStatus/);
  assert.match(requirements, /"not-published"/);
  assert.match(requirements, /function evaluatePCBuild/);
});

test("PC profiles keep guest and signed-in local storage isolated", () => {
  assert.match(requirements, /PC_BUILD_GUEST_STORAGE_KEY/);
  assert.match(requirements, /PC_BUILD_USER_STORAGE_PREFIX/);
  assert.match(component, /window\.localStorage\.getItem\(activeStorageKey\)/);
  assert.match(component, /window\.localStorage\.setItem\(storageKey/);
  assert.match(component, /Chưa đồng bộ lên cloud hoặc thiết bị khác/);
});

test("the PC Lab includes responsive and reduced-motion safeguards", () => {
  assert.match(styles, /@media \(max-width: 1040px\)/);
  assert.match(styles, /@media \(max-width: 640px\)/);
  assert.match(styles, /prefers-reduced-motion: reduce/);
  assert.match(component, /aria-live="polite"/);
  assert.match(component, /pc-os-note/);
  assert.match(component, /aria-labelledby="pc-build-heading"/);
  assert.match(roadmap, /## Phase 5 — PC Build & Performance Lab/);
  assert.match(roadmap, /Expand the verified requirements catalog/);
});
