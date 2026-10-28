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

## Deployment plan

Use a Node-capable host such as Vercel for the Next.js app. Keep the current GitHub Pages site available until the new branch builds successfully and its environment configuration has been tested. See [docs/ROADMAP.md](docs/ROADMAP.md) and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Current site

The existing static site on `main` is still at https://ptea2002-coder.github.io/levelup/ until the new app is ready for cutover.
