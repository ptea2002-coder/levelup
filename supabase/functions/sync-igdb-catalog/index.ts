import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type IGDBImage = { url?: string };
type IGDBExternalSource = { name?: string };
type IGDBExternalGame = { uid?: string; external_game_source?: IGDBExternalSource };
type IGDBGame = {
  id: number;
  name: string;
  slug?: string;
  summary?: string;
  storyline?: string;
  first_release_date?: number;
  total_rating_count?: number;
  follows?: number;
  genres?: Array<{ name?: string }>;
  themes?: Array<{ name?: string }>;
  platforms?: Array<{ name?: string }>;
  involved_companies?: Array<{ developer?: boolean; company?: { name?: string } }>;
  cover?: IGDBImage;
  artworks?: IGDBImage[];
  websites?: Array<{ url?: string; type?: { type?: string } }>;
  external_games?: IGDBExternalGame[];
};

type ExistingGame = Record<string, unknown> & {
  slug: string;
  source_provider?: string | null;
  source_id?: string | null;
  igdb_id?: number | null;
};

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const clientId = Deno.env.get("IGDB_CLIENT_ID");
const clientSecret = Deno.env.get("IGDB_CLIENT_SECRET");
const supabase = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
  : null;

const existingFields = [
  "slug", "title", "source_provider", "source_id", "source_metadata", "source_synced_at",
  "igdb_id", "igdb_synced_at", "category", "genres", "platforms", "developer", "release_year",
  "description", "official_url", "mark", "art_primary", "art_secondary", "cover_url",
  "background_url", "short_description", "positive_reviews", "negative_reviews",
  "concurrent_players", "owners_estimate", "is_catalog_visible",
].join(",");

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

function uniqueStrings(values: unknown[]): string[] {
  return [...new Set(values.filter((value): value is string => typeof value === "string")
    .map((value) => value.trim()).filter(Boolean))];
}

function slugify(value: string): string {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90) || "game";
}

function makeMark(title: string): string {
  const words = title.replace(/[^a-zA-Z0-9\s]/g, " ").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "GAME";
  if (words.length === 1) return words[0].slice(0, 5).toUpperCase();
  return words.slice(0, 3).map((word) => word[0]).join("").toUpperCase();
}

function normalizePlatform(name: string): string {
  const value = name.trim();
  const lower = value.toLowerCase();
  if (/pc|windows|linux|macos|macintosh/.test(lower)) return "PC";
  if (/playstation 5/.test(lower)) return "PlayStation 5";
  if (/playstation 4/.test(lower)) return "PlayStation 4";
  if (/playstation 3/.test(lower)) return "PlayStation 3";
  if (/playstation vita/.test(lower)) return "PlayStation Vita";
  if (/playstation portable|psp/.test(lower)) return "PSP";
  if (/playstation/.test(lower)) return "PlayStation";
  if (/xbox series x|xbox series s/.test(lower)) return "Xbox Series X|S";
  if (/xbox one/.test(lower)) return "Xbox One";
  if (/xbox 360/.test(lower)) return "Xbox 360";
  if (/xbox/.test(lower)) return "Xbox";
  if (/nintendo switch 2/.test(lower)) return "Nintendo Switch 2";
  if (/nintendo switch/.test(lower)) return "Nintendo Switch";
  if (/wii u/.test(lower)) return "Wii U";
  if (/wii/.test(lower)) return "Wii";
  if (/nintendo 3ds/.test(lower)) return "Nintendo 3DS";
  if (/nintendo ds/.test(lower)) return "Nintendo DS";
  if (/android/.test(lower)) return "Android";
  if (/ios|iphone|ipad/.test(lower)) return "iOS";
  if (/web browser|browser/.test(lower)) return "Web";
  return value;
}

function categoryFromGenres(genres: string[], themes: string[]): string {
  const labels = [...genres, ...themes].map((label) => label.toLowerCase());
  if (labels.some((label) => label.includes("moba"))) return "MOBA";
  if (labels.some((label) => label.includes("battle royale"))) return "Battle Royale";
  if (labels.some((label) => label.includes("shooter") || label === "fps")) return "FPS";
  if (labels.some((label) => label.includes("fighting"))) return "Fighting";
  if (labels.some((label) => label.includes("racing"))) return "Racing";
  if (labels.some((label) => label.includes("sport"))) return "Sports";
  if (labels.some((label) => label.includes("simulator") || label.includes("simulation"))) return "Simulation";
  if (labels.some((label) => label.includes("strategy"))) return "Strategy";
  const isRpg = labels.some((label) => label.includes("role-playing") || label === "rpg");
  if (isRpg && labels.some((label) => label.includes("action"))) return "Action RPG";
  if (isRpg) return "RPG";
  if (labels.some((label) => label.includes("platform"))) return "Platformer";
  if (labels.some((label) => label.includes("puzzle"))) return "Puzzle";
  if (labels.some((label) => label.includes("adventure"))) return "Adventure";
  if (labels.some((label) => label.includes("arcade"))) return "Arcade";
  return "Game";
}

function imageUrl(image: IGDBImage | undefined, size: "cover_big" | "1080p"): string | null {
  const value = image?.url?.trim();
  if (!value) return null;
  const absolute = value.startsWith("//") ? "https:" + value : value;
  return absolute.replace(/\/t_[^/]+\//, "/t_" + size + "/");
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? uniqueStrings(value) : [];
}

async function getAccessToken(): Promise<string> {
  if (!clientId || !clientSecret) throw new Error("IGDB_CLIENT_ID and IGDB_CLIENT_SECRET are not configured");
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "client_credentials",
  });
  const response = await fetch("https://id.twitch.tv/oauth2/token?" + params.toString(), {
    method: "POST",
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error("Twitch token request failed with HTTP " + response.status);
  const payload = await response.json() as { access_token?: string };
  if (!payload.access_token) throw new Error("Twitch token response did not contain an access token");
  return payload.access_token;
}

async function queryIGDB<T>(token: string, query: string): Promise<T[]> {
  const response = await fetch("https://api.igdb.com/v4/games", {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Client-ID": clientId!,
      "Authorization": "Bearer " + token,
      "Content-Type": "text/plain; charset=utf-8",
    },
    body: query,
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) {
    const body = (await response.text()).slice(0, 500);
    throw new Error("IGDB games request failed with HTTP " + response.status + ": " + body);
  }
  return await response.json() as T[];
}

function getSteamAppId(game: IGDBGame): string | null {
  const external = (game.external_games ?? []).find((item) =>
    item.external_game_source?.name?.toLowerCase() === "steam" && /^\d+$/.test(item.uid ?? ""),
  );
  return external?.uid ?? null;
}

async function fetchExistingRows(field: "igdb_id" | "source_id" | "slug", values: Array<string | number>, provider?: string): Promise<ExistingGame[]> {
  const rows: ExistingGame[] = [];
  for (let index = 0; index < values.length; index += 200) {
    let query = supabase!.from("games").select(existingFields);
    if (field === "source_id") query = query.eq("source_provider", provider ?? "steamspy");
    const result = await query.in(field, values.slice(index, index + 200) as never[]);
    if (result.error) throw new Error("Could not load existing catalog rows: " + result.error.message);
    rows.push(...((result.data ?? []) as unknown as ExistingGame[]));
  }
  return rows;
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function makeCatalogRow(game: IGDBGame, existing: ExistingGame | undefined, syncedAt: string, steamAppId: string | null): Record<string, unknown> {
  const isSteamMatch = existing?.source_provider === "steamspy";
  const igdbGenres = uniqueStrings((game.genres ?? []).map((genre) => genre.name ?? ""));
  const igdbThemes = uniqueStrings((game.themes ?? []).map((theme) => theme.name ?? ""));
  const igdbPlatforms = uniqueStrings((game.platforms ?? []).map((platform) => platform.name ?? "").map(normalizePlatform));
  const genres = uniqueStrings([...stringArray(existing?.genres), ...igdbGenres]);
  const platforms = uniqueStrings([
    ...stringArray(existing?.platforms),
    ...igdbPlatforms,
    ...(isSteamMatch ? ["PC", "Steam"] : []),
  ]);
  const currentCategory = String(existing?.category ?? "");
  const category = currentCategory && currentCategory !== "PC Game" && currentCategory !== "Game"
    ? currentCategory
    : categoryFromGenres(igdbGenres, igdbThemes);
  const involved = game.involved_companies ?? [];
  const igdbDeveloper = involved.find((item) => item.developer && item.company?.name)?.company?.name
    ?? involved.find((item) => item.company?.name)?.company?.name
    ?? "";
  const currentDeveloper = String(existing?.developer ?? "");
  const developer = currentDeveloper && currentDeveloper !== "Chưa cập nhật" ? currentDeveloper : igdbDeveloper || "Chưa cập nhật";
  const releaseYear = Number(existing?.release_year ?? 0) || (game.first_release_date ? new Date(game.first_release_date * 1000).getUTCFullYear() : 0);
  const summary = game.summary?.trim() ?? "";
  const storyline = game.storyline?.trim() ?? "";
  const description = String(existing?.description ?? "").trim() || storyline || summary;
  const officialWebsite = game.websites?.find((site) => site.type?.type?.toLowerCase() === "official" && site.url)?.url;
  const existingUrl = String(existing?.official_url ?? "");
  const officialUrl = isSteamMatch
    ? existingUrl || (steamAppId ? "https://store.steampowered.com/app/" + steamAppId + "/" : "https://www.igdb.com/games/" + slugify(game.slug || game.name))
    : officialWebsite || existingUrl || "https://www.igdb.com/games/" + slugify(game.slug || game.name);
  const artUrl = imageUrl(game.artworks?.[0], "1080p");
  const coverUrl = imageUrl(game.cover, "cover_big");
  const sourceMetadata = {
    ...objectValue(existing?.source_metadata),
    igdb: {
      id: game.id,
      slug: game.slug ?? null,
      total_rating_count: game.total_rating_count ?? 0,
      steam_app_id: steamAppId,
    },
  };
  const slug = String(existing?.slug ?? slugify(game.slug || game.name));
  const palette = ["#7465ff", "#e15b86", "#3a9c91", "#d6a64d", "#4f88d8", "#a76ad8"];
  const currentProvider = String(existing?.source_provider ?? "");
  return {
    slug,
    title: String(existing?.title ?? game.name),
    category,
    release_year: releaseYear,
    mark: String(existing?.mark ?? makeMark(game.name)),
    description,
    genres,
    platforms,
    developer,
    official_url: officialUrl,
    art_primary: String(existing?.art_primary ?? palette[game.id % palette.length]),
    art_secondary: String(existing?.art_secondary ?? "#111522"),
    source_provider: isSteamMatch ? "steamspy" : (currentProvider || "igdb"),
    source_id: isSteamMatch ? String(existing?.source_id ?? steamAppId) : String(existing?.source_id ?? game.id),
    igdb_id: game.id,
    igdb_synced_at: syncedAt,
    cover_url: String(existing?.cover_url ?? artUrl ?? coverUrl ?? ""),
    background_url: String(existing?.background_url ?? artUrl ?? coverUrl ?? ""),
    short_description: String(existing?.short_description ?? summary),
    positive_reviews: Number(existing?.positive_reviews ?? 0),
    negative_reviews: Number(existing?.negative_reviews ?? 0),
    concurrent_players: Number(existing?.concurrent_players ?? 0),
    owners_estimate: existing?.owners_estimate ?? null,
    source_synced_at: isSteamMatch ? (existing?.source_synced_at ?? null) : syncedAt,
    source_metadata: sourceMetadata,
    is_catalog_visible: true,
  };
}

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!supabase) return json({ error: "Supabase server environment is missing" }, 503);

  const { data: syncConfig, error: syncConfigError } = await supabase
    .from("game_catalog_sync_state")
    .select("sync_secret")
    .eq("id", 1)
    .single();
  if (syncConfigError || !syncConfig?.sync_secret) return json({ error: "Catalog sync secret is not configured" }, 503);

  const suppliedSecret = request.headers.get("x-catalog-sync-secret") ?? "";
  const expectedSecret = String(syncConfig.sync_secret);
  if (!suppliedSecret || suppliedSecret.length !== expectedSecret.length || suppliedSecret !== expectedSecret) {
    return json({ error: "Unauthorized" }, 401);
  }

  const { data: state, error: stateError } = await supabase
    .from("game_igdb_sync_state")
    .select("enabled,next_offset,status,total_synced,last_attempt_at")
    .eq("id", 1)
    .single();
  if (stateError || !state) return json({ error: "IGDB sync state is not configured" }, 503);
  if (!state.enabled) return json({ status: "disabled", message: "IGDB sync is gated until credentials are configured" }, 409);
  if (!clientId || !clientSecret) return json({ error: "Set IGDB_CLIENT_ID and IGDB_CLIENT_SECRET in Supabase Edge Function Secrets" }, 503);
  if (state.status === "complete") return json({ status: "complete", totalSynced: state.total_synced, nextOffset: state.next_offset });
  if (state.last_attempt_at && Date.now() - new Date(state.last_attempt_at).getTime() < 55_000) {
    return json({ status: "rate-limited", retryAfterSeconds: 55 }, 429);
  }

  const attemptedAt = new Date().toISOString();
  await supabase.from("game_igdb_sync_state").update({
    status: "running", last_attempt_at: attemptedAt, last_error: null, updated_at: attemptedAt,
  }).eq("id", 1);

  try {
    const token = await getAccessToken();
    let nextOffset = Number(state.next_offset ?? 0);
    let processed = 0;
    let completed = false;
    let matchedSteam = 0;
    let created = 0;

    for (let pageIndex = 0; pageIndex < 4; pageIndex += 1) {
      if (pageIndex > 0) await new Promise((resolve) => setTimeout(resolve, 300));
      const query = "fields id,name,slug,summary,storyline,first_release_date,total_rating_count,genres.name,themes.name,platforms.name,involved_companies.developer,involved_companies.company.name,cover.url,artworks.url,websites.url,websites.type.type,external_games.uid,external_games.external_game_source.name; "
        + "where version_parent = null & follows > 0; sort follows desc; limit 500; offset " + nextOffset + ";";
      const games = await queryIGDB<IGDBGame>(token, query);
      if (games.length === 0) {
        completed = true;
        break;
      }

      const igdbIds = games.map((game) => Number(game.id)).filter((id) => Number.isInteger(id) && id > 0);
      const steamIds = uniqueStrings(games.map((game) => getSteamAppId(game) ?? ""));
      const candidateSlugs = uniqueStrings(games.map((game) => slugify(game.slug || game.name)));
      const [igdbRows, steamRows, slugRows] = await Promise.all([
        igdbIds.length ? fetchExistingRows("igdb_id", igdbIds) : Promise.resolve([]),
        steamIds.length ? fetchExistingRows("source_id", steamIds, "steamspy") : Promise.resolve([]),
        candidateSlugs.length ? fetchExistingRows("slug", candidateSlugs) : Promise.resolve([]),
      ]);
      const byIgdbId = new Map(igdbRows.map((row) => [Number(row.igdb_id), row]));
      const bySteamId = new Map(steamRows.map((row) => [String(row.source_id), row]));
      const usedSlugs = new Set(slugRows.map((row) => row.slug));
      const seen = new Set<string>();
      const syncedAt = new Date().toISOString();
      const rows = games.map((game) => {
        const steamAppId = getSteamAppId(game);
        const existingIgdb = byIgdbId.get(Number(game.id));
        let existingSteam = steamAppId ? bySteamId.get(steamAppId) : undefined;
        if (existingSteam?.igdb_id && Number(existingSteam.igdb_id) !== Number(game.id)) existingSteam = undefined;
        const existing = existingIgdb ?? existingSteam;
        const baseSlug = slugify(game.slug || game.name);
        let slug = String(existing?.slug ?? baseSlug);
        if (!existing && (usedSlugs.has(baseSlug) || seen.has(baseSlug))) slug = baseSlug + "-igdb-" + game.id;
        if (seen.has(slug)) slug = baseSlug + "-igdb-" + game.id;
        seen.add(slug);
        usedSlugs.add(slug);
        if (existingSteam) matchedSteam += 1;
        else if (!existingIgdb) created += 1;
        return { ...makeCatalogRow(game, existing ? { ...existing, slug } : undefined, syncedAt, steamAppId), slug };
      });

      for (let index = 0; index < rows.length; index += 150) {
        const result = await supabase.from("games").upsert(rows.slice(index, index + 150), { onConflict: "slug" });
        if (result.error) throw new Error("IGDB catalog upsert failed: " + result.error.message);
      }

      processed += rows.length;
      nextOffset += games.length;
      if (games.length < 500) {
        completed = true;
        break;
      }
    }

    const finishedAt = new Date().toISOString();
    const totalSynced = Number(state.total_synced ?? 0) + processed;
    const update = await supabase.from("game_igdb_sync_state").update({
      next_offset: nextOffset,
      status: completed ? "complete" : "running",
      total_synced: totalSynced,
      last_success_at: completed ? finishedAt : undefined,
      last_error: null,
      updated_at: finishedAt,
    }).eq("id", 1);
    if (update.error) throw new Error("Could not update IGDB sync state: " + update.error.message);
    return json({ status: completed ? "complete" : "running", processed, totalSynced, nextOffset, matchedSteam, created });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown IGDB sync error";
    const failedAt = new Date().toISOString();
    await supabase.from("game_igdb_sync_state").update({
      status: "retrying", last_error: message.slice(0, 1000), updated_at: failedAt,
    }).eq("id", 1);
    return json({ status: "retrying", error: message }, 502);
  }
});
