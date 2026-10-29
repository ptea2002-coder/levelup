import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type SteamSpyGame = {
  appid: number;
  name: string;
  developer?: string;
  publisher?: string;
  positive?: number;
  negative?: number;
  owners?: string;
  ccu?: number;
};

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const supabase = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
  : null;

const curatedSlugByAppId: Record<number, string> = {
  730: "counter-strike-2",
  570: "dota-2",
  1172470: "apex-legends",
  578080: "pubg-battlegrounds",
  1245620: "elden-ring",
  2357570: "overwatch-2",
  2358720: "black-myth-wukong",
  413150: "stardew-valley",
  3405690: "ea-sports-fc-26",
  292030: "the-witcher-3",
  39210: "final-fantasy-xiv",
  2767030: "marvel-rivals",
  553850: "helldivers-2",
  4162040: "zenless-zone-zero",
  1962663: "call-of-duty-warzone",
};

function slugify(value: string): string {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90) || "steam-game";
}

function makeMark(title: string): string {
  const words = title.replace(/[^a-zA-Z0-9\s]/g, " ").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "GAME";
  if (words.length === 1) return words[0].slice(0, 5).toUpperCase();
  return words.slice(0, 3).map((word) => word[0]).join("").toUpperCase();
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!supabase) return json({ error: "Supabase server environment is missing" }, 503);

  const { data: state, error: stateError } = await supabase
    .from("game_catalog_sync_state")
    .select("sync_secret,next_page,status,total_synced,last_attempt_at")
    .eq("id", 1).single();
  if (stateError || !state) return json({ error: "Catalog sync state is not configured" }, 503);

  const suppliedSecret = request.headers.get("x-catalog-sync-secret") ?? "";
  if (!suppliedSecret || suppliedSecret.length !== state.sync_secret.length || suppliedSecret !== state.sync_secret) {
    return json({ error: "Unauthorized" }, 401);
  }
  if (state.status === "complete") {
    return json({ status: "complete", totalSynced: state.total_synced, nextPage: state.next_page });
  }
  if (state.last_attempt_at && Date.now() - new Date(state.last_attempt_at).getTime() < 55_000) {
    return json({ status: "rate-limited", retryAfterSeconds: 55 }, 429);
  }

  const attemptedAt = new Date().toISOString();
  await supabase.from("game_catalog_sync_state").update({
    status: "running", last_attempt_at: attemptedAt, last_error: null, updated_at: attemptedAt,
  }).eq("id", 1);

  const page = Number(state.next_page ?? 0);
  try {
    const upstream = await fetch("https://steamspy.com/api.php?request=all&page=" + page, {
      headers: { "Accept": "application/json", "User-Agent": "LevelUP-GameCatalog/1.0" },
      signal: AbortSignal.timeout(25_000),
    });
    if (!upstream.ok) throw new Error("SteamSpy returned HTTP " + upstream.status);
    const payload = await upstream.json();
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("SteamSpy returned an invalid catalog response");

    const apps = Object.values(payload as Record<string, SteamSpyGame>)
      .filter((app) => Number.isInteger(Number(app?.appid)) && Number(app.appid) > 0 && typeof app.name === "string" && app.name.trim().length > 0);

    if (apps.length === 0) {
      if (Object.keys(payload as object).length > 0) throw new Error("SteamSpy returned an unexpected non-game payload");
      const completedAt = new Date().toISOString();
      await supabase.from("game_catalog_sync_state").update({
        status: "complete", last_success_at: completedAt, last_error: null, updated_at: completedAt,
      }).eq("id", 1);
      return json({ status: "complete", page, totalSynced: state.total_synced });
    }

    const ids = apps.map((app) => String(app.appid));
    const existingBySourceId = new Map<string, { slug: string }>();
    for (let index = 0; index < ids.length; index += 200) {
      const result = await supabase.from("games").select("slug,source_id")
        .eq("source_provider", "steamspy").in("source_id", ids.slice(index, index + 200));
      if (result.error) throw new Error("Could not load existing source IDs: " + result.error.message);
      for (const row of result.data ?? []) existingBySourceId.set(String(row.source_id), { slug: row.slug });
    }

    const baseSlugs = apps.map((app) => curatedSlugByAppId[Number(app.appid)] ?? slugify(app.name));
    const uniqueCandidates = [...new Set(baseSlugs)];
    const existingBySlug = new Map<string, Record<string, unknown>>();
    for (let index = 0; index < uniqueCandidates.length; index += 200) {
      const result = await supabase.from("games").select(
        "slug,title,category,genres,platforms,developer,release_year,description,official_url,mark,art_primary,art_secondary,source_provider",
      ).in("slug", uniqueCandidates.slice(index, index + 200));
      if (result.error) throw new Error("Could not load existing slugs: " + result.error.message);
      for (const row of result.data ?? []) existingBySlug.set(String(row.slug), row as Record<string, unknown>);
    }

    const usedSlugs = new Set(existingBySlug.keys());
    const seenThisPage = new Set<string>();
    const syncedAt = new Date().toISOString();
    const rows = apps.map((app) => {
      const appId = Number(app.appid);
      const baseSlug = curatedSlugByAppId[appId] ?? slugify(app.name);
      const existingSource = existingBySourceId.get(String(appId));
      const curated = existingBySlug.get(baseSlug);
      const isCurated = Boolean(curated && (!curated.source_provider || curated.slug === curatedSlugByAppId[appId]));
      let slug = existingSource?.slug ?? baseSlug;
      if (!existingSource && !isCurated && (usedSlugs.has(baseSlug) || seenThisPage.has(baseSlug))) slug = baseSlug + "-steam-" + appId;
      if (seenThisPage.has(slug)) slug = baseSlug + "-steam-" + appId;
      seenThisPage.add(slug);
      usedSlugs.add(slug);

      const coverUrl = "https://cdn.akamai.steamstatic.com/steam/apps/" + appId + "/header.jpg";
      const backgroundUrl = "https://cdn.akamai.steamstatic.com/steam/apps/" + appId + "/library_hero.jpg";
      return {
        ...(isCurated ? curated : {}),
        slug,
        title: isCurated ? String(curated?.title ?? app.name) : app.name.trim(),
        category: isCurated ? String(curated?.category ?? "PC Game") : "PC Game",
        release_year: isCurated ? Number(curated?.release_year ?? 0) : 0,
        mark: isCurated ? String(curated?.mark ?? makeMark(app.name)) : makeMark(app.name),
        description: isCurated ? String(curated?.description ?? "") : "",
        genres: isCurated ? (curated?.genres ?? []) : [],
        platforms: isCurated ? (curated?.platforms ?? ["PC", "Steam"]) : ["PC", "Steam"],
        developer: isCurated ? String(curated?.developer || app.developer || app.publisher || "Chưa cập nhật") : (app.developer || app.publisher || "Chưa cập nhật"),
        official_url: isCurated ? String(curated?.official_url || "https://store.steampowered.com/app/" + appId + "/") : "https://store.steampowered.com/app/" + appId + "/",
        art_primary: isCurated ? String(curated?.art_primary ?? "#7465ff") : "#7465ff",
        art_secondary: isCurated ? String(curated?.art_secondary ?? "#111522") : "#111522",
        source_provider: "steamspy",
        source_id: String(appId),
        cover_url: coverUrl,
        background_url: backgroundUrl,
        short_description: null,
        positive_reviews: Number(app.positive ?? 0),
        negative_reviews: Number(app.negative ?? 0),
        concurrent_players: Number(app.ccu ?? 0),
        owners_estimate: typeof app.owners === "string" ? app.owners : null,
        source_synced_at: syncedAt,
        source_metadata: app,
        is_catalog_visible: true,
      };
    });

    for (let index = 0; index < rows.length; index += 150) {
      const result = await supabase.from("games").upsert(rows.slice(index, index + 150), { onConflict: "slug" });
      if (result.error) throw new Error("Catalog upsert failed: " + result.error.message);
    }

    const nextPage = page + 1;
    const nextStatus = apps.length < 1000 ? "complete" : "running";
    const completedAt = new Date().toISOString();
    const totalSynced = Number(state.total_synced ?? 0) + rows.length;
    const update = await supabase.from("game_catalog_sync_state").update({
      next_page: nextPage, status: nextStatus, total_synced: totalSynced,
      last_success_at: completedAt, last_error: null, updated_at: completedAt,
    }).eq("id", 1);
    if (update.error) throw new Error("Could not update sync state: " + update.error.message);
    return json({ status: nextStatus, page, processed: rows.length, totalSynced, nextPage });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown catalog sync error";
    const failedAt = new Date().toISOString();
    await supabase.from("game_catalog_sync_state").update({
      status: "retrying", last_error: message.slice(0, 1000), updated_at: failedAt,
    }).eq("id", 1);
    return json({ status: "retrying", page, error: message }, 502);
  }
});
