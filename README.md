# LevelUP 2.0 — Play hard. Level up.

LevelUP is being rebuilt from a single-file static website into a modern gaming discovery and editorial platform.

> **Current status:** foundation code lives on the `v2-foundation` branch. The existing `main` branch and its GitHub Pages site are intentionally left unchanged until the new app has passed checks and a production host is configured.

## What's in this foundation

- Next.js App Router, React, and TypeScript.
- Responsive dark/neon UI with custom design tokens and Tailwind CSS v4 installed.
- Search and genre filtering across the starter game catalog.
- Dedicated game profile routes with links to official publisher pages.
- Three authored evergreen guides with individual article pages.
- Community roadmap page that clearly labels future features instead of pretending they already work.
- Supabase SQL starter for games, profiles, favorites, reviews, articles, and comments, including initial RLS policies and seed games.
- GitHub Actions workflow for type-checking and building the app.

## Not live yet

- Supabase browser/server clients and an email/password login/register screen are wired into the app, but they need environment variables and the SQL schema before live use.
- The game catalog reads from `public.games` when available and falls back to starter data if Supabase is not configured or the schema is not ready.
- Cloud favorites, profile editing, reviews, comments, and admin/editor tools are not active yet.
- Guide content currently comes from typed files in `src/lib/`.
- News is not automatically synced from external feeds.
- This branch has not replaced the current GitHub Pages deployment.

## Requirements

- Node.js 22.12 or newer.
- npm.
- A Supabase project only when starting backend integration.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

To run the same checks as CI:

```bash
npm run typecheck
npm run build
```

## Configure Supabase

1. Create a Supabase project.
2. In the Supabase SQL Editor, review and run `supabase/schema.sql` in the development project. This creates the starter tables and Row Level Security policies.
3. Copy `.env.example` to `.env.local`.
4. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. For older projects, the app also accepts `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
5. Restart the Next.js dev server after editing `.env.local`.
6. In Supabase **Authentication → URL Configuration**, add the local URL (for example `http://localhost:3000/login`) to the allowed redirect URLs. Configure the production URL when a production host is selected.
7. Do not expose service-role or secret keys in browser code. Keep RLS enabled and add server-side role checks before building CMS features.

## SEO and performance

- Metadata includes canonical URLs, Open Graph and Twitter cards, plus a generated 1200×630 share image and SVG app icon.
- `/sitemap.xml` lists the homepage, game profiles and editorial guides; it refreshes hourly. `/robots.txt` blocks indexing on preview and development deployments.
- Set `NEXT_PUBLIC_SITE_URL` to the canonical public origin when configuring a production domain. The default is `https://levelup-nine-flame.vercel.app`.
- Game artwork uses Next.js Image optimization with AVIF/WebP support, responsive `sizes`, an allowlist of known image hosts and a seven-day optimization cache.

## Gamer Game Locker

- The homepage includes a player command center for a personal game backlog and favorites.
- Save a game as `wishlist`, `playing`, or `completed`, or add it to favorites. Changes are stored locally first for a responsive experience.
- Guests keep a device-local library; signed-in players sync their game statuses and favorites to `public.user_game_library` across devices.
- On the first successful sign-in, the guest library is merged into that account. Separate local storage keys keep one account's library from leaking into another account on a shared browser.
- Removal tombstones synchronize too, so an offline removal is not silently restored by an older cloud copy. Row Level Security restricts library records to their owner.
- The `/locker` page lets players filter their saved roster. It is intentionally excluded from search indexing and the sitemap.

## LevelUP Social Network

The community now uses Supabase-backed data rather than demo posts:

- `/community`: public feed, signed-in post creation, game tags, likes, comments, follow/unfollow and user reports.
- `/profile/[username]`: public gamer profile, editable display name/bio, public post history and follower/following counts.
- `/notifications`: database-generated follow/like/comment notifications and read state.
- `/admin/moderation`: report queue, available only to accounts whose trusted Supabase Auth `app_metadata.role` is set to `admin`.
- `posts`, `post_likes`, `post_comments`, `follows`, `notifications` and `content_reports` use Row Level Security. A private-schema auth trigger creates a public profile for new accounts.
- Apply `supabase/schema.sql` first, then `supabase/social-network.sql`. The social migration has already been applied to the connected Supabase project for branch `v2-foundation`.
- Admin roles must be assigned by a trusted administrator in Supabase Auth app metadata, never through user-editable metadata. Do not expose service-role/secret keys in client code.

## Steam live data

- `public.steam_game_metrics` caches Steam player counts and Vietnam-region store prices for supported Steam games.
- The homepage and supported game profiles subscribe to Supabase Realtime, so open pages update after a successful sync without reloading.
- `supabase/functions/sync-steam-metrics/index.ts` syncs data server-side; the Supabase Cron job runs every five minutes.
- Player counts use Steam's documented `GetNumberOfCurrentPlayers` Web API. Store prices use Steam Store app details as best-effort data; availability and refresh cadence are controlled by Steam.
- Never scrape SteamDB. Do not put service-role keys or the cron token in Git. The cron token is generated and stored in Supabase Vault.

For an existing project, run `supabase/steam-metrics.sql`, deploy the Edge Function, then run `supabase/steam-cron.sql` after replacing `__SUPABASE_PUBLISHABLE_KEY__` with the project's publishable key. These steps are already applied to the connected LevelUP Supabase project when deployment succeeds.

## Deployment plan

Use a Node-capable host such as Vercel for the Next.js app. Keep the current GitHub Pages site available until the new branch builds successfully and its environment configuration has been tested. See [docs/ROADMAP.md](docs/ROADMAP.md) and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Current site

The existing static site on `main` is still at https://ptea2002-coder.github.io/levelup/ until the new app is ready for cutover.
