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
  assert.match(roadmap, /official-source-linked PC requirements catalog from 8 to 11 games/);
});

test("P5 includes additional source-verified AAA requirements and never invents unpublished storage values", () => {
  assert.ok(requirements.includes('slug: "fortnite"'));
  assert.ok(requirements.includes('slug: "black-myth-wukong"'));
  assert.ok(requirements.includes('slug: "monster-hunter-wilds"'));
  assert.ok(requirements.includes("storageGb?: number"));
  assert.ok(requirements.includes("https://www.epicgames.com/help/c-34254770/c-5719357839387/a16548002"));
  assert.ok(requirements.includes("https://store.steampowered.com/app/2358720/Black_Myth_Wukong/"));
  assert.ok(requirements.includes("https://store.steampowered.com/app/2246340/Monster_Hunter_Wilds/"));
  assert.ok(component.includes('tier.storageGb === undefined ? "Không được công bố"'));
});

test("P5 benchmark index shows dated, sourced CPU/GPU aggregate scores without converting them to FPS", () => {
  assert.ok(requirements.includes("export const pcBenchmarkReferences"));
  assert.ok(requirements.includes('metricLabel: "CPU Mark"'));
  assert.ok(requirements.includes('metricLabel: "G3D Mark"'));
  assert.ok(requirements.includes("sampleCount"));
  assert.ok(requirements.includes('checkedAt: "2026-10-30"'));
  assert.ok(requirements.includes("https://www.cpubenchmark.net/compare/3098vs4681vs4811/Intel-i7-8700K-vs-Intel-i5-12400F-vs-AMD-Ryzen-5-5600"));
  assert.ok(requirements.includes("https://www.videocardbenchmark.net/compare/4037vs4117vs4465vs4444vs4345/GeForce-RTX-2060-vs-GeForce-RTX-2060-SUPER-vs-Radeon-RX-6600-vs-Radeon-RX-6600-XT-vs-GeForce-RTX-3060-12GB"));
  assert.ok(component.includes("pcBenchmarkReferences.filter"));
  assert.ok(component.includes("Không chuyển điểm benchmark thành FPS"));
  assert.ok(styles.includes(".pc-benchmark-list"));
});
