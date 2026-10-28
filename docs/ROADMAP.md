# LevelUP 2.0 — Roadmap

## Phase 0 — Foundation (current branch)

- [x] Create a separate `v2-foundation` branch so the existing GitHub Pages site is not overwritten.
- [x] Add Next.js App Router, React, TypeScript, Tailwind CSS v4, and responsive brand styles.
- [x] Create typed starter catalog, search/filter UI, game detail routes, and authored evergreen guides.
- [x] Add an initial Supabase schema with row-level security policies and seed game data.
- [x] Add a GitHub Actions type-check/build workflow.
- [ ] Confirm the CI workflow passes and fix any build issues.
- [ ] Generate and commit `package-lock.json` after the first dependency install.

## Phase 1 — Connect the backend

1. Create a Supabase project on the appropriate free tier.
2. Review and apply `supabase/schema.sql` in a non-production project first.
3. Configure `.env.local` from `.env.example`; only public URL and anon key belong in browser-visible variables.
4. Add the Supabase client/server utilities and migrate catalog reads from static data to PostgreSQL.
5. Add signup, login, logout, session handling, and profile creation.
6. Add tests for RLS and unauthorized access before shipping user data.

## Phase 2 — User features

- Cloud-synced favorites and personal game lists.
- Reviews with ratings, pending moderation, and abuse reporting.
- Comments with rate limits and moderation tools.
- Profile editing and basic account controls.
- Accessibility and mobile regression checks.

## Phase 3 — Editorial CMS

- Admin/editor roles with server-side authorization.
- Draft, preview, publish, and archive workflow.
- Image storage with file validation and upload limits.
- SEO metadata, sitemap, canonical URLs, and structured data.
- Editorial source links and correction/update policy.

## Phase 4 — Community and growth

- Community posts, groups, and finding teammates.
- XP and badges only after abuse prevention and moderation are working.
- Search service/cache only when PostgreSQL search and performance metrics justify it.
- Analytics, error monitoring, backups, and a documented incident process.

## Release gates

Before production cutover:
- CI passes on the exact commit to deploy.
- Environment variables are configured in the hosting provider.
- RLS policies are reviewed with both anonymous and authenticated test users.
- All navigation routes and mobile breakpoints are checked.
- No secrets, service-role keys, or private credentials exist in Git history.
- Domain, redirects, privacy policy, community rules, and contact path are ready.

## Current limitations

The branch is a working foundation, not a launched full-stack service. Supabase is not connected, login is not active, favorites are not cloud-synced, and no live news feed or admin CMS exists yet.
