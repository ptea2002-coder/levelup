# P6 — News Intelligence

## Scope

P6 adds a private source registry, a manually triggered RSS/Atom/JSON Feed intake pipeline, deduplication, a private editorial queue, and atomic conversion to a CMS **draft**. It does not auto-publish or schedule feed polling.

## Safety and licensing gate

- The migration creates no pre-approved feed records; every source starts with `is_enabled = false` and `license_status = unreviewed`.
- Only a user whose trusted Supabase Auth `app_metadata.role` is `admin` can register, approve, enable, or disable a source.
- An enabled source requires a public HTTPS feed URL, an HTTPS license/terms reference, a reviewer identity, a review timestamp, and at least 20 characters of review notes. These fields record an admin's review; they do not constitute legal advice or an automatic legal determination.
- The edge function rechecks the caller's user session and role, loads only approved/enabled sources, blocks IP-literal/private-style hostnames and cross-host redirects, limits a feed to 512 KB and 25 items, and times out upstream requests.
- Only the title and canonical HTTPS link are stored by default. A short excerpt (maximum 280 characters) is stored only when the admin explicitly selects the metadata-excerpt policy after review.
- Canonical URL, source/external ID, and normalized title/date fingerprints deduplicate intake. Database unique constraints plus `ON CONFLICT DO NOTHING` make inserts idempotent.
- Queue items are visible only to editors/admins. Converting an item uses a transaction-backed RPC that creates an unpublished article draft and marks the item converted. Editors must verify facts, add original reporting/context, and publish through the existing CMS.
- The first release intentionally has **manual-only ingestion**. Do not configure cron until source terms have been reviewed and staging ingestion/browser checks pass.

## Apply in a development/staging project

1. Review and apply `supabase/migrations/20261030041422_p6_news_intelligence.sql` after all earlier migrations, including P3 editorial CMS and P4 discovery.
2. Deploy `supabase/functions/ingest-news-feeds/index.ts` as the Edge Function `ingest-news-feeds`. Supabase project URL and service-role key are read only inside the server-side function; never copy them into a `NEXT_PUBLIC_*` variable.
3. Confirm a trusted admin is assigned `app_metadata.role = admin` in Supabase Auth. Editors may review queue items but cannot manage source approvals.
4. Open `/admin/news-intelligence`, register an official RSS/Atom/JSON Feed source, then review the source's own terms and metadata-reuse permissions. Until that review is recorded, the source remains disabled and the ingest function will ignore it.
5. Trigger **Quét nguồn đã duyệt** manually. Inspect run logs, deduplication counts, canonical URLs, and source policy before converting any item to a draft.
6. In the Editorial CMS, rewrite and verify the draft. No fetched article body is copied into the public article.

## P6.1 staging deployment status (2026-10-30)

- Applied to the Supabase `levelup-dev` project; recorded migration version: `20261030041422`.
- Deployed Edge Function `ingest-news-feeds` version 1 with `verify_jwt = true`.
- Verified the three tables exist with RLS enabled, expected triggers exist, the authenticated role has only the declared grants, the service role can insert intake records, and `anon` cannot execute the draft-conversion RPC.
- No source records or queue items were created. Production project `levelup` was not modified.
- Full end-to-end signed-in QA is blocked because the staging project currently has no user with trusted `app_metadata.role = admin` or `editor`. No existing account was elevated automatically; designate a test account before testing the UI and feed ingestion.

## Not done by this migration

- No live database was changed by this feature branch.
- No feed sources are pre-approved or preloaded.
- No cron schedule is enabled.
- Source licensing, feed quality, and authenticated browser behavior still require a human staging review before automation or production launch.
