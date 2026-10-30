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
- [ ] Add automated integration tests proving anonymous access is denied and one user cannot read or write another user's private rows.

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

### P3.1 — Editorial operational hardening

- [x] Fix archive feedback so an RLS-filtered/no-row update cannot be reported as successful.
- [x] Allow editors to collaborate on existing articles while preserving author ownership; admins alone may reassign authors.
- [x] Add a published-by index and editorial regression guards.
- [x] Document safe role provisioning and the manual CMS smoke-test checklist.
- [ ] Assign an approved Auth account's `app_metadata.role` and run the smoke tests.
- [ ] Add automated RLS integration tests using anonymous, editor, admin, and cross-user identities.
- [ ] Reconcile the live P3 schema with Supabase migration history before production cutover.

## Phase 4 — Community and growth

- Community posts, groups, and finding teammates.
- XP and badges only after abuse prevention and moderation are working.
- Search service/cache only when PostgreSQL search and performance metrics justify it.
- Analytics, error monitoring, backups, and a documented incident process.

## Release gates

Before production cutover:
- [x] CI passes on the exact P2 preview commit.
- [x] Supabase environment configuration is present for the preview app.
- [ ] RLS policies are verified with automated anonymous, owner, and cross-user integration tests.
- [ ] All navigation routes and mobile breakpoints receive a full browser regression pass.
- [ ] Secrets, service-role keys, and private credentials are audited across Git history.
- [ ] Domain, redirects, privacy policy, community rules, and contact path are ready.

## Current limitations

The branch is a feature-complete preview foundation, not a production launch. Supabase auth and catalog reads are connected; the Game Locker syncs per-account statuses/favorites, and reviews/comments have rate limits, moderation, and abuse reporting. IGDB catalog sync remains intentionally disabled until credentials are configured. The editorial CMS is implemented in P3. Automated live-news/RSS ingestion remains intentionally gated until sources and reuse permissions are reviewed; the RLS integration suite plus full browser/mobile release audit remain open gates.
