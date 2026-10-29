# P3.1 — Editorial CMS operations and release checklist

This checklist is for the **Supabase development project** and the `p3-1-editorial-hardening` preview. Do not grant a role until the account has been identified and approved by the project owner.

## Assign a role safely

The CMS reads roles only from Supabase Auth `app_metadata.role`. Do not put privileges in `user_metadata`; users can edit their own user metadata.

Use a trusted one-off Node script or a protected server-side admin environment with the Supabase **service-role key**. Never expose that key in a browser bundle, client environment variable, committed file, or chat.

```ts
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const userId = process.env.LEVELUP_EDITOR_USER_ID!;
if (!userId) throw new Error("Set LEVELUP_EDITOR_USER_ID to the approved Auth user UUID.");

const { data, error: lookupError } = await admin.auth.admin.getUserById(userId);
if (lookupError || !data.user) throw lookupError ?? new Error("Auth user not found.");

const role = process.env.LEVELUP_EDITOR_ROLE;
if (role !== "admin" && role !== "editor") {
  throw new Error("LEVELUP_EDITOR_ROLE must be admin or editor.");
}

const { error } = await admin.auth.admin.updateUserById(userId, {
  app_metadata: { ...data.user.app_metadata, role },
});
if (error) throw error;
console.log("Editorial role updated. Ask the user to sign out and sign in again.");
```

Set the environment variables only in the trusted environment running this script. Verify the target UUID against the approved account before running. Keep the script outside the repository and remove the service-role secret from the environment when finished.

## Manual smoke test

- [ ] Unauthenticated visitor sees the login prompt at `/admin/editorial`.
- [ ] Authenticated user with no role sees the access-denied state.
- [ ] `editor` can create a draft, preview it, publish it, edit an existing article, and archive an article.
- [ ] An editor cannot change an existing article's `author_id`; the database preserves the original author.
- [ ] `admin` can manage articles and reassign authors when needed.
- [ ] Anonymous readers can read published articles but cannot read drafts or archived articles.
- [ ] Image upload accepts JPG/PNG/WebP/AVIF up to 5 MB and rejects unsupported types or oversized files.
- [ ] Archive failures caused by RLS/network errors are shown as errors, not success messages.
- [ ] Published articles have working canonical/OG metadata and appear in `/sitemap.xml`; drafts do not.
- [ ] After changing app metadata, sign out and sign back in before checking role-dependent behavior.

## Database migration note

P3 policies and functions were found in the live development database, but the Supabase migration-history endpoint did not list the original P3 migration. The P3.1 hardening migration is additive and versioned in this repository. Before production cutover, reconcile the original P3 migration history so the checked-in migration ledger accurately represents the deployed schema; do not blindly replay an old migration over production.

## Still required before release

- Automated RLS integration tests using anonymous, editor, admin, and two distinct user identities.
- Browser regression on desktop and mobile.
- Security and credential audit, backup/restore drill, and rollback rehearsal.
