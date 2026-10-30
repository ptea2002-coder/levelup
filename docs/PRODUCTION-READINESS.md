# P7 — Production Readiness Runbook

## Scope and safety boundary

P7 adds low-information health endpoints, a staging-only RLS integration test, a manually dispatched staging workflow, and a Chromium route/responsive smoke test. It does **not** cut over the production domain, change the production Supabase project, enable News Intelligence feeds, or create a backup/monitoring subscription on the user's behalf.

The release is not production-ready until every release gate below has an owner and recorded evidence. A green build alone is not a release approval.

## Health and monitoring

- `GET /api/health` is a liveness probe. It confirms the Next.js runtime is responding and returns no configuration or dependency details.
- `GET /api/health/ready` is a readiness probe. It performs a minimal read of `public.games` using the public Supabase key. It returns HTTP 503 when public Supabase configuration is missing or the database check fails; the response does not include upstream error details.
- Use the readiness endpoint for an uptime check and the liveness endpoint for basic process availability.
- Vercel deployment/runtime logs and Supabase Auth, Postgres, and Edge Function logs are the initial diagnostic sources. They are not a substitute for configured alerts.
- Before cutover, configure an external uptime check against `/api/health/ready`, alert routing to an actively monitored destination, and documented response ownership. Keep alert credentials outside the repository.
- Do not put a service-role key into a health route or any `NEXT_PUBLIC_*` variable.

## RLS integration test

The integration test creates one uniquely named temporary `user_game_library` row using two dedicated staging accounts. It verifies that the owner can read the row, anonymous callers cannot see it, a second signed-in user cannot read it, cross-user insert/update attempts do not succeed, and the owner's row remains unchanged. The test attempts to remove its temporary rows and signs out its test sessions.

### Required GitHub Actions secrets

Configure these secrets for the repository before manually running **Actions → Staging RLS Integration → Run workflow**:

- `LEVELUP_STAGING_SUPABASE_URL` — must be exactly `https://ztzcpnyxgwhcdktpbxdq.supabase.co` (the `levelup-dev` staging project).
- `LEVELUP_STAGING_SUPABASE_ANON_KEY` — publishable/anon key for that same staging project; never use a service-role key.
- `LEVELUP_STAGING_RLS_OWNER_EMAIL` and `LEVELUP_STAGING_RLS_OWNER_PASSWORD` — a dedicated test account.
- `LEVELUP_STAGING_RLS_OTHER_EMAIL` and `LEVELUP_STAGING_RLS_OTHER_PASSWORD` — a second, distinct dedicated test account.

Use non-production accounts and credentials with no personal data. Ensure both accounts can sign in and have their normal profile rows provisioned. Do not use an administrator's everyday account. The workflow requires the explicit `levelup-dev` target and the test code refuses any other project origin. It never uses a service-role credential.

Local execution is also staging-only:

```bash
node --test tests/rls-integration.test.mjs
```

The test is skipped when no integration variables are provided, but fails closed if only some variables are set or the URL is not the expected staging origin. A skipped test is not evidence that RLS has passed.

## Browser and mobile regression

The **Browser and Mobile Smoke** workflow builds the production app, starts it locally, and checks these public routes at 390px, 768px, and 1440px widths:

- `/`
- `/games`
- `/discover`
- `/build-lab`
- `/news`
- `/community`
- `/locker`
- `/login`

It checks for HTTP errors, browser runtime exceptions, and horizontal page overflow while emulating reduced motion. It also runs interactive journeys against a CI-only seeded catalog when no Supabase environment is configured: guest save/favorite/filter/reload persistence, isolation between browser contexts, and Game Discovery mood/genre/platform/reset/search behavior. The fixture fallback is opt-in through `LEVELUP_TEST_CATALOG=1` plus the GitHub CI environment; if any Supabase environment value is present, fixtures are disabled, and a configured-but-failing database never silently falls back to sample data.

When the dedicated `levelup-dev` URL, publishable key, and owner test-account credentials are configured, the same workflow additionally signs in through the actual UI, verifies cloud Game Locker status/favorite persistence across reloads, restores the account's original values, and signs out. The workflow rejects any configured Supabase origin other than `https://ztzcpnyxgwhcdktpbxdq.supabase.co`. If owner-account credentials are absent, the authenticated journey is explicitly skipped and is not evidence of cloud-sync validation.

This smoke test is not a substitute for manual interaction, keyboard, screen-reader, or real-device testing. The authenticated P6 News Intelligence flow still needs a designated staging editor/admin and a human-reviewed source before end-to-end testing.

## Supabase advisor follow-up

The staging Supabase Performance Advisor reported nine foreign-key columns without covering indexes. Migration `20261030063018_add_foreign_key_supporting_indexes.sql` adds those indexes without changing data or RLS policy behavior. It has been applied to `levelup-dev`; re-run the advisor after this migration is included in the release branch and again after meaningful production traffic exists.

Two sync-state tables, `public.game_catalog_sync_state` and `public.game_igdb_sync_state`, have RLS enabled and intentionally have no client-facing policies. They hold internal synchronization state and should remain inaccessible to `anon` and `authenticated` roles. Do **not** add a permissive policy just to silence the informational advisor finding; verify that only trusted backend/service-role paths use them.

The staging Auth advisor also reports leaked-password protection disabled. Before production cutover, the project owner should enable Supabase Auth's leaked-password protection in the Auth password-security settings and verify the desired password policy. This is a dashboard-level project setting, not something a repository migration can safely change.

Migration `20261030064422_optimize_admin_rls_jwt_initplans.sql` rewrites seven admin policy expressions to evaluate `(select auth.jwt())` as an initplan without changing the `app_metadata.role = admin` condition. After applying it to `levelup-dev`, the Performance Advisor no longer reports unindexed foreign keys or `auth_rls_initplan` warnings. Remaining performance findings are five `multiple_permissive_policies` warnings and 39 unused-index notices; consolidate policies only with access-control regression tests, and do not drop indexes based only on "unused" notices from a new staging project with little traffic.

## Backup and recovery

Backup coverage is a **release gate to verify**, not something this repository can enable by itself.

1. In the Supabase project dashboard, verify the active plan's database backup schedule, retention period, and most recent successful backup. Confirm whether point-in-time recovery is included or separately enabled; do not assume it is.
2. Record the recovery point objective (maximum acceptable data loss) and recovery time objective (maximum acceptable outage) with the product owner.
3. Before a production schema migration or other high-risk change, create a protected pre-change backup/export using the approved Supabase procedure. Store it only in an encrypted, access-controlled location outside Git, build artifacts, and public storage.
4. Record the backup timestamp, project reference, schema/migration version, operator, and storage location in the change record. Never paste database passwords, access tokens, or dump contents into an issue or chat.
5. Perform a restore drill into an isolated recovery project. Verify schema, row counts for critical tables, RLS policies, Auth/storage dependencies, and application connectivity before declaring the backup usable.
6. Re-run the restore drill after major schema changes and on a documented recurring cadence. A successful backup job without a tested restore is insufficient.

A schema-only SQL dump may not include Auth users, Storage objects, secrets, or all provider-managed configuration. Document those dependencies separately and follow the current Supabase backup/restore procedure for the selected plan.

## Rollback rehearsal

### Application rollback

1. Identify and record the last known-good Vercel deployment before the release.
2. Deploy and smoke-test the candidate on Preview first; confirm `/api/health`, `/api/health/ready`, and the critical routes.
3. In the Vercel project, use the documented rollback/promote-previous-deployment procedure to return to the last known-good deployment. Do not delete the known-good deployment.
4. Confirm the previous deployment serves the expected release and that the health endpoint and critical public routes respond.
5. Record the operator, timestamps, deployment IDs, result, and any follow-up action. Rehearse on Preview before attempting a production rollback.

### Database rollback

- Prefer forward-compatible, additive migrations and a tested forward-fix over manually editing an already-applied migration.
- Do not assume reverting application code reverses a database migration.
- For destructive or incompatible schema changes, require a reviewed recovery plan and a verified backup/restore path before execution.
- Never test destructive restore or rollback steps against the production project. First rehearse them in an isolated staging/recovery project.

## Release checklist

- [ ] CI unit/static tests, type-check, and production build pass for the exact release commit.
- [ ] Browser and Mobile Smoke passes on the exact preview commit.
- [ ] Staging RLS integration passes with two dedicated staging users; record the run URL and commit SHA.
- [ ] Manual keyboard, accessibility, login/logout, Game Locker, discovery, PC Lab, editorial CMS, and mobile checks are complete.
- [ ] P6 News Intelligence signed-in checks pass with a designated staging editor/admin; source terms and reuse permissions are reviewed before any source is enabled.
- [ ] Supabase backup schedule/retention are confirmed and a restore drill has succeeded in an isolated project.
- [ ] Vercel application rollback and database recovery/forward-fix plans are rehearsed and recorded.
- [ ] Uptime monitoring and alert routing are configured and assigned to an owner.
- [ ] Secret scanning, environment separation, privacy policy, community rules, contact path, canonical domain, and redirects are reviewed.
- [ ] Production cutover is explicitly approved by the product owner.

## Current P7 status

Automated validation on the current PR head: CI passed with 63 tests passing, 0 failures, and 1 skipped test; the skipped case is the live RLS integration test because dedicated staging-account secrets are not configured. Browser smoke passed for eight routes across 390px, 768px, and 1440px viewports. Re-run both workflows after any code-changing commit before merge.

Implemented in code: health endpoints, staging-only RLS test harness, manually dispatched RLS workflow, browser smoke workflow, and this runbook.

Not yet verified/configured: dedicated staging account secrets and a passing live RLS integration run, backup/restore evidence, external uptime alerts, manual authenticated/accessibility/real-device QA (including P6 end-to-end), and production cutover approval.
