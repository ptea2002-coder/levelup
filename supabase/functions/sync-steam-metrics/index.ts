import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

type TrackedGame = {
  slug: string;
  appId: number;
};

type StoreData = {
  is_free?: boolean;
  price_overview?: {
    currency?: string;
    final_formatted?: string;
    discount_percent?: number;
  };
};

const trackedGames: TrackedGame[] = [
  { slug: "counter-strike-2", appId: 730 },
  { slug: "dota-2", appId: 570 },
  { slug: "apex-legends", appId: 1172470 },
  { slug: "pubg-battlegrounds", appId: 578080 },
  { slug: "elden-ring", appId: 1245620 },
  { slug: "stardew-valley", appId: 413150 },
  { slug: "the-witcher-3", appId: 292030 },
  { slug: "marvel-rivals", appId: 2767030 },
  { slug: "helldivers-2", appId: 553850 },
  { slug: "black-myth-wukong", appId: 2358720 },
  { slug: "overwatch-2", appId: 2357570 },
];

const corsHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

async function sha256Hex(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function getJson(url: string) {
  const response = await fetch(url, {
    headers: { "User-Agent": "LevelUP/2.0 Steam metrics sync" },
    signal: AbortSignal.timeout(9000),
  });
  if (!response.ok) throw new Error(`Upstream returned HTTP ${response.status}`);
  return await response.json();
}

async function getCurrentPlayers(appId: number): Promise<number | null> {
  try {
    const payload = await getJson(
      `https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${appId}`,
    );
    const response = payload?.response;
    if (response?.result !== 1 || !Number.isInteger(response?.player_count)) return null;
    return response.player_count as number;
  } catch {
    return null;
  }
}

async function getStoreData(appId: number): Promise<{
  ok: boolean;
  priceLabel: string | null;
  currency: string | null;
  discountPercent: number;
  isFree: boolean;
}> {
  try {
    const payload = await getJson(
      `https://store.steampowered.com/api/appdetails?appids=${appId}&cc=vn&l=vietnamese`,
    );
    const app = payload?.[String(appId)];
    if (!app?.success || !app?.data) {
      return { ok: false, priceLabel: null, currency: null, discountPercent: 0, isFree: false };
    }

    const data = app.data as StoreData;
    const price = data.price_overview;
    return {
      ok: true,
      priceLabel: data.is_free ? "Miễn phí" : price?.final_formatted ?? null,
      currency: price?.currency ?? "VND",
      discountPercent: Math.max(0, Math.min(100, Number(price?.discount_percent ?? 0))),
      isFree: Boolean(data.is_free),
    };
  } catch {
    return { ok: false, priceLabel: null, currency: null, discountPercent: 0, isFree: false };
  }
}

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: "Supabase server environment is not configured" }, 500);
  }

  let body: { token?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Expected JSON body" }, 400);
  }

  if (typeof body.token !== "string" || body.token.length < 32) {
    return json({ error: "Unauthorized" }, 401);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: config, error: configError } = await admin
    .from("steam_sync_config")
    .select("cron_token_hash")
    .eq("id", true)
    .maybeSingle();

  if (configError || !config?.cron_token_hash) {
    return json({ error: "Steam sync is not configured" }, 503);
  }

  const suppliedHash = await sha256Hex(body.token);
  if (suppliedHash !== config.cron_token_hash) {
    return json({ error: "Unauthorized" }, 401);
  }

  const { data: latestMetric } = await admin
    .from("steam_game_metrics")
    .select("synced_at")
    .not("synced_at", "is", null)
    .order("synced_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestMetric?.synced_at) {
    const ageMs = Date.now() - new Date(latestMetric.synced_at).getTime();
    if (ageMs >= 0 && ageMs < 4 * 60 * 1000) {
      return json({ ok: true, skipped: true, reason: "Metrics were synced recently" });
    }
  }

  const { data: existingRows, error: rowsError } = await admin
    .from("steam_game_metrics")
    .select("game_slug,steam_app_id,current_players,price_label,price_currency,price_discount_percent,is_free,store_url,players_updated_at,price_updated_at,synced_at");

  if (rowsError) return json({ error: "Could not read existing Steam metrics" }, 500);

  const existingBySlug = new Map(
    (existingRows ?? []).map((row) => [row.game_slug as string, row] as const),
  );
  const now = new Date().toISOString();
  const results = await Promise.all(
    trackedGames.map(async (game) => {
      const existing = existingBySlug.get(game.slug);
      const [players, store] = await Promise.all([
        getCurrentPlayers(game.appId),
        getStoreData(game.appId),
      ]);

      return {
        game_slug: game.slug,
        steam_app_id: game.appId,
        current_players: players ?? existing?.current_players ?? null,
        price_label: store.ok ? store.priceLabel : existing?.price_label ?? null,
        price_currency: store.ok ? store.currency : existing?.price_currency ?? null,
        price_discount_percent: store.ok
          ? store.discountPercent
          : Number(existing?.price_discount_percent ?? 0),
        is_free: store.ok ? store.isFree : Boolean(existing?.is_free ?? false),
        store_url: `https://store.steampowered.com/app/${game.appId}/`,
        players_updated_at: players !== null ? now : existing?.players_updated_at ?? null,
        price_updated_at: store.ok ? now : existing?.price_updated_at ?? null,
        synced_at: now,
        updated_at: now,
      };
    }),
  );

  const { error: upsertError } = await admin
    .from("steam_game_metrics")
    .upsert(results, { onConflict: "game_slug" });

  if (upsertError) {
    return json({ error: "Could not save Steam metrics", detail: upsertError.message }, 500);
  }

  return json({
    ok: true,
    games: results.length,
    playerCountsUpdated: results.filter((row) => row.players_updated_at === now).length,
    pricesUpdated: results.filter((row) => row.price_updated_at === now).length,
    syncedAt: now,
  });
});
