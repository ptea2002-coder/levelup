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

- Supabase has not been connected to a hosted project.
- Login, profiles, cloud favorites, reviews, comments, and admin/editor tools are not active.
- The catalog and guide content currently come from typed files in `src/lib/`.
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

## Configure Supabase later

1. Create a Supabase project.
2. Review `supabase/schema.sql` in a development project before applying it.
3. Copy `.env.example` to `.env.local`.
4. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
5. Never expose a Supabase service-role key to client-side code. Add and test server-side admin authorization before building CMS features.

## Deployment plan

Use a Node-capable host such as Vercel for the Next.js app. Keep the current GitHub Pages site available until the new branch builds successfully and its environment configuration has been tested. See [docs/ROADMAP.md](docs/ROADMAP.md) and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Current site

The existing static site on `main` is still at https://ptea2002-coder.github.io/levelup/ until the new app is ready for cutover.
