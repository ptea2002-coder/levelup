# LevelUP 2.0 — Architecture

## Product boundaries

LevelUP is being rebuilt as a gaming discovery and editorial platform first. Community features will be added after authentication, moderation, and data protection are in place.

## Application stack

- Next.js App Router + React + TypeScript.
- Tailwind CSS v4 is installed for the evolving UI system; brand-specific layout tokens live in `src/app/globals.css`.
- Supabase PostgreSQL is the planned source of truth for games, profiles, favorites, reviews, articles, and comments.
- Supabase Auth will handle identities; never implement password storage manually.
- GitHub Actions checks TypeScript and builds the app on pushes to the foundation branch.
- Vercel or another Node-capable host is required for the full Next.js application. GitHub Pages can continue serving the current static site until a production cutover is planned.

## Data ownership

The current UI uses typed starter content in `src/lib/games.ts` and `src/lib/articles.ts`. The database design starter is `supabase/schema.sql`. Neither means a live Supabase project is connected yet.

When the backend is connected:
1. Public game and published article data can be read without a user session.
2. Favorites belong to the authenticated user and are enforced by RLS.
3. Reviews and comments enter a pending state and must be moderated before public display.
4. Admin/editor writes must be protected by server-side authorization and explicit RLS policies.
5. A Supabase service-role key must never be placed in a `NEXT_PUBLIC_*` variable or shipped to the browser.

## Initial route map

- `/` — discovery home
- `/games` — searchable/filterable catalog
- `/games/[slug]` — game profile and official link
- `/news` — editorial guides
- `/news/[slug]` — guide detail
- `/admin/news-intelligence` — private, source-reviewed intake queue for editors/admins
- `/community` — transparent community roadmap

## Production principles

- Prefer a modular monolith over microservices until scale proves otherwise.
- Use server rendering for indexable content and client components only for real interaction.
- Keep the app accessible by keyboard and respect `prefers-reduced-motion`.
- Add tests, error monitoring, analytics, backup/recovery, and rate limits before opening community submissions.
- Do not scrape copyrighted game artwork or republish news without rights and source attribution.
- News intake is disabled by default per source, stores only reviewed metadata, and creates drafts rather than auto-publishing. Do not schedule ingestion until source terms and staging behavior have been reviewed.
