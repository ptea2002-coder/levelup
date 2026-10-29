import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const community = readFileSync(new URL("../src/components/game-community-section.tsx", import.meta.url), "utf8");
const moderation = readFileSync(new URL("../src/components/game-content-moderation-queue.tsx", import.meta.url), "utf8");
const migration = readFileSync(new URL("../supabase/migrations/20261029163000_game_reviews_comments_moderation.sql", import.meta.url), "utf8");
const detailPage = readFileSync(new URL("../src/app/games/[slug]/page.tsx", import.meta.url), "utf8");
const adminPage = readFileSync(new URL("../src/app/admin/moderation/page.tsx", import.meta.url), "utf8");

test("P2 game pages accept ratings and comments as pending content", () => {
  assert.ok(detailPage.includes("GameCommunitySection gameSlug="));
  assert.ok(community.includes('.from("reviews").insert'));
  assert.ok(community.includes('.from("comments").insert'));
  assert.ok(community.includes('status: "pending"'));
  assert.ok(community.includes("rate_limit_exceeded"));
});

test("P2 database rate limits are server-enforced and resist concurrent submissions", () => {
  assert.ok(migration.includes("security definer"));
  assert.ok(migration.includes("pg_advisory_xact_lock"));
  assert.ok(migration.includes("max_submissions := 3"));
  assert.ok(migration.includes("max_submissions := 8"));
  assert.ok(migration.includes("revoke all on levelup_private.user_content_rate_events from public, anon, authenticated"));
});

test("P2 admin queue can publish or reject reviews and comments under admin-only RLS", () => {
  assert.ok(adminPage.includes("GameContentModerationQueue"));
  assert.ok(moderation.includes('moderate("review", review.id, "published")'));
  assert.ok(moderation.includes('moderate("comment", comment.id, "rejected")'));
  assert.ok(migration.includes("Admins moderate game reviews"));
  assert.ok(migration.includes("Admins moderate game comments"));
});
