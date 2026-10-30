import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

const baseUrl = (process.env.LEVELUP_RLS_TEST_URL ?? "").replace(/\/$/, "");
const publicKey = process.env.LEVELUP_RLS_TEST_ANON_KEY ?? "";
const ownerEmail = process.env.LEVELUP_RLS_OWNER_EMAIL ?? "";
const ownerPassword = process.env.LEVELUP_RLS_OWNER_PASSWORD ?? "";
const otherEmail = process.env.LEVELUP_RLS_OTHER_EMAIL ?? "";
const otherPassword = process.env.LEVELUP_RLS_OTHER_PASSWORD ?? "";
const configValues = [baseUrl, publicKey, ownerEmail, ownerPassword, otherEmail, otherPassword];
const anyConfigProvided = configValues.some(Boolean);
const allConfigProvided = configValues.every(Boolean);
const expectedStagingOrigin = "https://ztzcpnyxgwhcdktpbxdq.supabase.co";

function headers(token, extra = {}) {
  return {
    apikey: publicKey,
    Accept: "application/json",
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function signIn(email, password) {
  const response = await fetch(`${baseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: headers(null, { "Content-Type": "application/json" }),
    body: JSON.stringify({ email, password }),
  });

  assert.equal(
    response.status,
    200,
    `Staging test-account sign-in failed (HTTP ${response.status}); check the dedicated test-account secrets.`,
  );
  const payload = await response.json();
  assert.ok(payload.access_token && payload.user?.id, "Auth response did not include a user session.");
  return { accessToken: payload.access_token, userId: payload.user.id };
}

async function rest(path, token, options = {}) {
  return fetch(`${baseUrl}/rest/v1/${path}`, {
    ...options,
    headers: headers(token, {
      ...(options.headers ?? {}),
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    }),
  });
}

async function readJson(response) {
  const body = await response.text();
  return body ? JSON.parse(body) : null;
}

async function signOut(token) {
  try {
    await fetch(`${baseUrl}/auth/v1/logout`, {
      method: "POST",
      headers: headers(token),
    });
  } catch {
    // The access token expires normally if the Auth endpoint is unavailable.
  }
}

test(
  "staging RLS isolates private Game Locker rows between anonymous, owner, and other user",
  { skip: !anyConfigProvided },
  async () => {
    assert.ok(allConfigProvided, "All six LEVELUP_RLS_* variables must be configured together.");
    assert.equal(
      new URL(baseUrl).origin,
      expectedStagingOrigin,
      "Refusing to run write probes anywhere except the levelup-dev staging project.",
    );
    assert.notEqual(ownerEmail.toLowerCase(), otherEmail.toLowerCase(), "Use two distinct staging test accounts.");

    const ownerSlug = `p7-rls-probe-${randomUUID().replaceAll("-", "")}`;
    const foreignSlug = `${ownerSlug}-foreign`;
    let ownerSession = null;
    let otherSession = null;
    let ownerId = null;

    try {
      ownerSession = await signIn(ownerEmail, ownerPassword);
      otherSession = await signIn(otherEmail, otherPassword);
      ownerId = ownerSession.userId;
      assert.notEqual(ownerSession.userId, otherSession.userId, "The two staging accounts must be different users.");

      const insertResponse = await rest("user_game_library", ownerSession.accessToken, {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          user_id: ownerSession.userId,
          game_slug: ownerSlug,
          status: "wishlist",
          is_favorite: false,
        }),
      });
      assert.ok(insertResponse.ok, `Owner could not create a private probe row (HTTP ${insertResponse.status}).`);
      const insertedRows = await readJson(insertResponse);
      assert.ok(Array.isArray(insertedRows) && insertedRows.some((row) => row.game_slug === ownerSlug));

      const anonymousRead = await rest(
        `user_game_library?select=user_id,game_slug&user_id=eq.${ownerId}&game_slug=eq.${ownerSlug}`,
        null,
      );
      if (anonymousRead.status === 200) {
        assert.deepEqual(await readJson(anonymousRead), [], "Anonymous callers must not see private Game Locker rows.");
      } else {
        assert.ok(
          [401, 403].includes(anonymousRead.status),
          `Unexpected anonymous read status: HTTP ${anonymousRead.status}.`,
        );
      }

      const otherRead = await rest(
        `user_game_library?select=user_id,game_slug&user_id=eq.${ownerId}&game_slug=eq.${ownerSlug}`,
        otherSession.accessToken,
      );
      assert.equal(otherRead.status, 200, `Other-user read returned HTTP ${otherRead.status}.`);
      assert.deepEqual(await readJson(otherRead), [], "Another signed-in user must not read the owner's row.");

      const crossUserInsert = await rest("user_game_library", otherSession.accessToken, {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          user_id: ownerSession.userId,
          game_slug: foreignSlug,
          status: "wishlist",
          is_favorite: false,
        }),
      });
      assert.ok(!crossUserInsert.ok, "RLS must reject an attempt to insert a row for another user.");

      const crossUserUpdate = await rest(
        `user_game_library?user_id=eq.${ownerId}&game_slug=eq.${ownerSlug}`,
        otherSession.accessToken,
        {
          method: "PATCH",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify({ status: "completed" }),
        },
      );
      if (crossUserUpdate.ok) {
        assert.deepEqual(await readJson(crossUserUpdate), [], "Another user must not update the owner's row.");
      } else {
        assert.ok(
          [401, 403].includes(crossUserUpdate.status),
          `Unexpected cross-user update status: HTTP ${crossUserUpdate.status}.`,
        );
      }

      const ownerRead = await rest(
        `user_game_library?select=user_id,game_slug,status&user_id=eq.${ownerId}&game_slug=eq.${ownerSlug}`,
        ownerSession.accessToken,
      );
      assert.equal(ownerRead.status, 200, `Owner read returned HTTP ${ownerRead.status}.`);
      const ownerRows = await readJson(ownerRead);
      assert.equal(ownerRows.length, 1, "Owner should still see exactly one probe row.");
      assert.equal(ownerRows[0].status, "wishlist", "Cross-user update must not mutate the owner's row.");
    } finally {
      if (ownerSession && ownerId) {
        for (const slug of [ownerSlug, foreignSlug]) {
          try {
            await rest(
              `user_game_library?user_id=eq.${ownerId}&game_slug=eq.${slug}`,
              ownerSession.accessToken,
              { method: "DELETE" },
            );
          } catch {
            // Cleanup is best-effort; the row is a non-sensitive, uniquely named staging probe.
          }
        }
      }
      if (otherSession) await signOut(otherSession.accessToken);
      if (ownerSession) await signOut(ownerSession.accessToken);
    }
  },
);
