import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const libraryControl = readFileSync(new URL("../src/components/game-library-control.tsx", import.meta.url), "utf8");
const libraryCss = readFileSync(new URL("../src/app/game-library.css", import.meta.url), "utf8");
const community = readFileSync(new URL("../src/components/game-community-section.tsx", import.meta.url), "utf8");
const communityCss = readFileSync(new URL("../src/app/game-community.css", import.meta.url), "utf8");

test("P2 library controls expose pressed state, accessible names, and live feedback", () => {
  assert.ok(libraryControl.includes("aria-pressed="));
  assert.ok(libraryControl.includes("aria-label="));
  assert.ok(libraryControl.includes('role="status"'));
  assert.ok(libraryCss.includes(":focus-visible"));
  assert.ok(libraryCss.includes("@media (prefers-reduced-motion: reduce)"));
});

test("P2 community forms expose labels, live errors, and responsive mobile layouts", () => {
  assert.ok(community.includes("aria-labelledby="));
  assert.ok(community.includes('role="alert"'));
  assert.ok(community.includes('role="status"'));
  assert.ok(communityCss.includes("@media (max-width: 900px)"));
  assert.ok(communityCss.includes("@media (max-width: 560px)"));
  assert.ok(communityCss.includes(":focus-visible"));
});
