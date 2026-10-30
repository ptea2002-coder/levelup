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

1. Review and apply `supabase/migrations/20261030100000_p6_news_intelligence.sql` after the existing P3 editorial CMS migration.
2. Deploy `supabase/functions/ingest-news-feeds/index.ts` as the Edge Function `ingest-news-feeds`. Supabase project URL and service-role key are read only inside the server-side function; never copy them into a `NEXT_PUBLIC_*` variable.
3. Confirm a trusted admin is assigned `app_metadata.role = admin` in Supabase Auth. Editors may review queue items but cannot manage source approvals.
4. Open `/admin/news-intelligence`, register an official RSS/Atom/JSON Feed source, then review the source's own terms and metadata-reuse permissions. Until that review is recorded, the source remains disabled and the ingest function will ignore it.
5. Trigger **Quét nguồn đã duyệt** manually. Inspect run logs, deduplication counts, canonical URLs, and source policy before converting any item to a draft.
6. In the Editorial CMS, rewrite and verify the draft. No fetched article body is copied into the public article.

## Not done by this migration

- No live database was changed by this feature branch.
- No feed sources are pre-approved or preloaded.
- No cron schedule is enabled.
- Source licensing, feed quality, and authenticated browser behavior still require a human staging review before automation or production launch.
