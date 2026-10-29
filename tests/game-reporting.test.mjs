import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const reportButton = readFileSync(new URL("../src/components/game-content-report-button.tsx", import.meta.url), "utf8");
const community = readFileSync(new URL("../src/components/game-community-section.tsx", import.meta.url), "utf8");
const moderation = readFileSync(new URL("../src/components/moderation-console.tsx", import.meta.url), "utf8");
const migration = readFileSync(new URL("../supabase/migrations/20261029164500_game_content_reports.sql", import.meta.url), "utf8");

test("players can report published reviews and game comments with a reason", () => {
  assert.ok(reportButton.includes('target_type: "review"'));
  assert.ok(reportButton.includes('target_type: "game_comment"'));
  assert.ok(reportButton.includes("reason"));
  assert.ok(community.includes('targetType="review"'));
  assert.ok(community.includes('targetType="game_comment"'));
});

test("abuse reports support exactly one target and prevent self-reporting", () => {
  assert.ok(migration.includes("target_review_id"));
  assert.ok(migration.includes("target_game_comment_id"));
  assert.ok(migration.includes("content_reports_one_target"));
  assert.ok(migration.includes("r.user_id = (select auth.uid())"));
  assert.ok(migration.includes("c.user_id = (select auth.uid())"));
});

test("moderators can act on reports for reviews and game comments", () => {
  assert.ok(moderation.includes('report.target_type === "review"'));
  assert.ok(moderation.includes('report.target_type === "game_comment"'));
  assert.ok(moderation.includes('update({ status: "rejected" })'));
});
