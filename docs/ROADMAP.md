# LevelUP 2.0 — Roadmap

## Phase 0 — Foundation

- [x] Create a separate `v2-foundation` branch so the existing GitHub Pages site is not overwritten.
- [x] Add Next.js App Router, React, TypeScript, Tailwind CSS v4, and responsive brand styles.
- [x] Create typed catalog, search/filter UI, game detail routes, and authored evergreen guides.
- [x] Add the initial Supabase schema and seed data.
- [x] Add a GitHub Actions type-check/build workflow; CI passes on the current P2 implementation.
- [x] Commit `package-lock.json` and use locked dependency installation in CI.

## Phase 1 — Connect the backend

- [x] Create and connect the Supabase project.
- [x] Apply versioned schema migrations for the catalog, social features, and personal game library.
- [x] Configure the deployed app with browser-safe Supabase URL/anon-key settings; secrets stay server-side.
- [x] Add Supabase client/server utilities and migrate catalog reads to PostgreSQL.
- [x] Add signup, login, logout, session handling, and profile creation.
- [x] Add a staging-only integration test harness for anonymous, owner, and cross-user access; execution against two dedicated staging accounts remains a P7 release gate.

## Phase 2 — User features

- [x] Cloud-synced favorites and personal game lists (local-first Game Locker, per-account sync, removal tombstones, and owner-only RLS).
- [x] Reviews with ratings, pending moderation, and abuse reporting for published game reviews.
- [x] Game comments with server-side rate limits, pending moderation, and owner-only withdrawal of pending/rejected content.
- [x] Profile editing and basic account controls (display name, bio, follow/unfollow, authentication/session state).
- [x] P2 accessibility/responsive regression guards for ARIA states, live feedback, reduced motion, and mobile layouts.


## Phase 3 — Editorial CMS

- [x] Admin/editor roles validated from Supabase Auth `app_metadata` and enforced by PostgreSQL RLS.
- [x] Draft, preview, publish, and archive workflow at `/admin/editorial`.
- [x] Public editorial image bucket with editor-only upload/delete policies and 5 MB image limit.
- [x] Dynamic published-article pages, SEO metadata, sitemap entries, canonical URLs, and Article structured data.
- [x] Editorial source links and correction/update notes.
- [ ] Add a reviewed RSS/news-source ingestion pipeline and validate source licensing before enabling automated ingestion.

## Phase 4 — Game Discovery Engine

- [x] Add Game Discovery Lab at `/discover` with server-backed catalog paging.
- [x] Let players combine category, platform, keyword, and play-mood filters.
- [x] Rank candidates using saved Game Locker genres/favorites and explain visible match reasons.
- [x] Keep the scoring transparent as heuristic metadata matching; do not claim FPS/hardware fit.
- [x] Add automated browser journeys for the CI-seeded catalog, guest Game Locker isolation/persistence, Discovery filters/search, and an opt-in guarded staging-account cloud-sync path (live account execution still requires staging secrets).
- [ ] Expand candidate retrieval beyond the current catalog pages and validate recommendation quality with user feedback.

## Phase 5 — PC Build & Performance Lab

- [x] Add a PC build profile for CPU, GPU, RAM, VRAM, free storage, storage type, OS, resolution, and target FPS.
- [x] Compare RAM, VRAM, storage, and SSD requirements against a curated, source-linked set of eight PC games.
- [x] Show minimum/recommended requirement tiers, per-component checks, source links, and clear warnings instead of inventing FPS estimates.
- [x] Keep guest and signed-in PC profiles isolated in local browser storage; do not send hardware data to the server.
- [x] Expand the official-source-linked PC requirements catalog from 8 to 11 games, record checked dates/caveats, and represent unpublished storage requirements as unknown.
- [ ] Add a sourced CPU/GPU benchmark index before automatic model-to-model performance scoring.

## Phase 6 — News Intelligence

- [x] Add a private source registry for RSS, Atom, and JSON Feed with admin-only licensing/reuse review.
- [x] Keep every source disabled by default; require a reviewed HTTPS policy URL, reviewer identity, timestamp, and written notes before enabling ingestion.
- [x] Add a manually triggered Edge Function with editor authentication, HTTPS/redirect/size limits, and bounded feed parsing.
- [x] Deduplicate by source/external ID, canonical URL, and normalized title/date fingerprint with database-enforced idempotency.
- [x] Add an editor-only queue with run history, dismiss action, and atomic conversion into a CMS draft; publishing remains a separate human action.
- [x] Apply the schema migration to `levelup-dev` staging and deploy `ingest-news-feeds` with JWT verification enabled; verify table/RLS/grant/trigger presence.
- [ ] Assign a designated staging test account the trusted `app_metadata.role` of `admin` or `editor`, then verify authenticated UI actions and run a reviewed feed end to end.
- [ ] Review real source terms and feed quality, then decide whether any recurring schedule is appropriate.

## Phase 7 — Production readiness

- [x] Add low-information liveness and Supabase readiness endpoints at `/api/health` and `/api/health/ready`.
- [x] Add an RLS integration test for anonymous, owner, and cross-user Game Locker access; guard write probes to the `levelup-dev` staging project only.
- [x] Add a manually dispatched staging RLS workflow that requires two dedicated test accounts and never uses a service-role key.
- [x] Add a Playwright Chromium smoke workflow for key routes at mobile, tablet, and desktop widths, including horizontal overflow, runtime errors, guest Game Locker persistence, and Discovery interactions.
- [x] Document backup/restore verification, application rollback, database recovery, and production release gates.
- [ ] Configure the staging test-account secrets and pass the live RLS integration workflow; record its run URL and commit SHA.
- [x] Pass Playwright browser smoke on the current PR head for eight routes at 390px, 768px, and 1440px.
- [ ] Complete manual keyboard, accessibility, authenticated, and real-device checks.
- [ ] Verify the active Supabase backup plan/retention and complete a restore drill in an isolated recovery project.
- [ ] Configure external uptime monitoring and alert routing for the readiness endpoint.
- [ ] Rehearse Vercel rollback and database recovery/forward-fix procedures, then record evidence before cutover.

## Phase 8 — Community and growth

- Community posts, groups, and finding teammates.
- XP and badges only after abuse prevention and moderation are working.
- Search service/cache only when PostgreSQL search and performance metrics justify it.
- Analytics, error monitoring, backups, and a documented incident process.

## Release gates

Before production cutover:
- [x] CI passes on the exact P2 preview commit.
- [x] Supabase environment configuration is present for the preview app.
- [ ] Staging RLS integration passes with anonymous, owner, and cross-user checks on the exact release commit.
- [x] Browser and Mobile Smoke passes on the current PR head (eight routes across three viewport sizes).
- [ ] Manual accessibility, keyboard, authenticated flows, and real-device checks are reviewed.
- [ ] Backup/restore and application/database rollback rehearsals are recorded; uptime alerts have a named owner.
- [ ] Secrets, service-role keys, and private credentials are audited across Git history.
- [ ] Domain, redirects, privacy policy, community rules, and contact path are ready.

## Current limitations

The branch is a feature-complete preview foundation, not a production launch. Supabase auth and catalog reads are connected; the Game Locker syncs per-account statuses/favorites, and reviews/comments have rate limits, moderation, and abuse reporting. IGDB catalog sync remains intentionally disabled until credentials are configured. The editorial CMS is implemented in P3. Automated live-news/RSS ingestion remains intentionally gated until sources and reuse permissions are reviewed. P7 now provides RLS and browser-smoke harnesses plus a backup/rollback runbook, but live staging execution, backup restore evidence, uptime alert configuration, and the full manual release audit remain open gates.
