import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const liveness = readFileSync(new URL("../src/app/api/health/route.ts", import.meta.url), "utf8");
const readiness = readFileSync(new URL("../src/app/api/health/ready/route.ts", import.meta.url), "utf8");
const rlsTest = readFileSync(new URL("./rls-integration.test.mjs", import.meta.url), "utf8");
const rlsWorkflow = readFileSync(new URL("../.github/workflows/staging-rls.yml", import.meta.url), "utf8");
const browserWorkflow = readFileSync(new URL("../.github/workflows/browser-smoke.yml", import.meta.url), "utf8");
const browserScript = readFileSync(new URL("../scripts/browser-smoke.mjs", import.meta.url), "utf8");
const runbook = readFileSync(new URL("../docs/PRODUCTION-READINESS.md", import.meta.url), "utf8");
const roadmap = readFileSync(new URL("../docs/ROADMAP.md", import.meta.url), "utf8");

test("health endpoints separate liveness from database readiness without leaking details", () => {
  assert.match(liveness, /status: "ok"/);
  assert.match(liveness, /Cache-Control/);
  assert.match(readiness, /from\("games"\)\.select\("slug"\)\.limit\(1\)/);
  assert.match(readiness, /status: "not_ready"/);
  assert.match(readiness, /status: 503/);
  assert.doesNotMatch(readiness, /service_role|SUPABASE_SERVICE_ROLE_KEY/i);
  assert.doesNotMatch(readiness, /error\.message/);
});

test("RLS integration probes are fail-closed to the known staging project and never use service-role keys", () => {
  assert.match(rlsTest, /https:\/\/ztzcpnyxgwhcdktpbxdq\.supabase\.co/);
  assert.match(rlsTest, /new URL\(baseUrl\)\.origin/);
  assert.match(rlsTest, /user_game_library/);
  assert.match(rlsTest, /crossUserInsert/);
  assert.match(rlsTest, /crossUserUpdate/);
  assert.doesNotMatch(rlsTest, /SERVICE_ROLE|service_role/i);
  assert.match(rlsWorkflow, /workflow_dispatch/);
  assert.match(rlsWorkflow, /levelup-dev/);
  assert.match(rlsWorkflow, /LEVELUP_STAGING_RLS_OWNER_EMAIL/);
  assert.match(rlsWorkflow, /LEVELUP_STAGING_RLS_OTHER_EMAIL/);
});

test("browser smoke workflow checks mobile, tablet, and desktop layouts", () => {
  assert.match(browserWorkflow, /playwright@1\.56\.1/);
  assert.match(browserWorkflow, /playwright install --with-deps chromium/);
  assert.match(browserScript, /width: 390/);
  assert.match(browserScript, /width: 768/);
  assert.match(browserScript, /width: 1440/);
  assert.match(browserScript, /prefers|reducedMotion/);
  assert.match(browserScript, /scrollWidth > window\.innerWidth/);
  assert.match(runbook, /Backup and recovery/);
  assert.match(runbook, /Rollback rehearsal/);
  assert.match(roadmap, /## Phase 7 — Production readiness/);
});

test("P7 browser smoke covers guest discovery and optional staging-authenticated library journeys", () => {
  assert.match(browserWorkflow, /LEVELUP_TEST_CATALOG: 1/);
  assert.match(browserWorkflow, /STAGING_URL/);
  assert.ok(browserWorkflow.includes("https://ztzcpnyxgwhcdktpbxdq.supabase.co"));
  assert.match(browserWorkflow, /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
  assert.match(browserScript, /guestLibraryJourney/);
  assert.match(browserScript, /discoveryJourney/);
  assert.match(browserScript, /authenticatedLibraryJourney/);
  assert.match(browserScript, /expectedStagingOrigin/);
  assert.match(browserScript, /original status/);
});

test("staging foreign-key indexes are tracked in a repeatable migration", () => {
  const migration = readFileSync(new URL("../supabase/migrations/20261030063018_add_foreign_key_supporting_indexes.sql", import.meta.url), "utf8");
  assert.match(migration, /comments_parent_id_idx/);
  assert.match(migration, /news_sources_license_reviewed_by_idx/);
  assert.match(migration, /reviews_user_id_idx/);
});

test("admin RLS policies use initplan-wrapped JWT evaluation without broadening the role predicate", () => {
  const migration = readFileSync(new URL("../supabase/migrations/20261030064422_optimize_admin_rls_jwt_initplans.sql", import.meta.url), "utf8");
  assert.equal(migration.split("(select auth.jwt())").length - 1, 9);
  assert.ok(migration.includes("'app_metadata'::text ->> 'role'::text) = 'admin'::text"));
  assert.ok(migration.includes('Admins moderate game comments'));
  assert.ok(migration.includes('Admins update news sources'));
});
