import { games as starterGames, type Game } from "@/lib/games";
import { comparePositiveReviews, compareRecommendedGames } from "@/lib/game-ranking";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type GameRow = {
  id?: string;
  slug: string;
  title: string;
  category: string;
  release_year: number;
  mark: string;
  description: string;
  genres: string[] | null;
  platforms: string[] | null;
  developer: string;
  official_url: string;
  art_primary: string;
  art_secondary: string;
  source_provider?: string | null;
  source_id?: string | null;
  cover_url?: string | null;
  background_url?: string | null;
  short_description?: string | null;
  positive_reviews?: number | null;
  negative_reviews?: number | null;
  concurrent_players?: number | null;
  owners_estimate?: string | null;
  source_synced_at?: string | null;
  igdb_id?: number | null;
  igdb_synced_at?: string | null;
  source_metadata?: Record<string, unknown> | null;
};

const gameFields = [
  "id", "slug", "title", "category", "release_year", "mark", "description",
  "genres", "platforms", "developer", "official_url", "art_primary", "art_secondary",
  "source_provider", "source_id", "cover_url", "background_url", "short_description",
  "positive_reviews", "negative_reviews", "concurrent_players", "owners_estimate", "source_synced_at",
  "igdb_id", "igdb_synced_at",
].join(",");

export type GameCatalogPage = {
  items: Game[];
  total: number;
  available: boolean;
};

export type GameCatalogFacets = {
  categories: string[];
  platforms: string[];
  available: boolean;
};

export type GameCatalogQuery = {
  query?: string;
  category?: string;
  categories?: string[];
  platform?: string;
  mode?: "all" | "competitive" | "coop" | "story" | "chill";
  sort?: "popular" | "recommended" | "name" | "newest" | "positive";
  page?: number;
  pageSize?: number;
};

const catalogModeTerms: Record<Exclude<NonNullable<GameCatalogQuery["mode"]>, "all">, string[]> = {
  competitive: ["fps", "moba", "battle royale", "tactical", "competitive", "hero shooter", "fighting", "sports", "pvp", "shooter", "counter-strike", "valorant", "dota", "league of legends", "apex legends", "overwatch", "warzone", "rainbow six", "team fortress", "rocket league"],
  coop: ["co-op", "coop", "multiplayer", "survival", "party", "team-based", "pve", "squad", "raid", "left 4 dead", "helldivers", "deep rock", "it takes two", "monster hunter", "valheim", "terraria", "minecraft", "rust"],
  story: ["rpg", "role-playing", "story", "adventure", "narrative", "open world", "soulslike", "single-player", "fantasy", "campaign", "quest", "baldur", "witcher", "elden ring", "final fantasy", "cyberpunk", "mass effect", "red dead", "assassin", "persona", "horizon", "god of war", "black myth"],
  chill: ["simulation", "casual", "farming", "sandbox", "puzzle", "creative", "cozy", "relaxing", "building", "city builder", "life sim", "management", "crafting", "stardew", "animal crossing", "powerwash", "unpacking", "house flipper", "the sims", "planet zoo", "cities: skylines", "palia", "dorfromantik", "balatro"],
};

function matchesCatalogMode(game: Game, mode: GameCatalogQuery["mode"] = "all"): boolean {
  if (!mode || mode === "all") return true;
  const searchable = [
    game.title, game.category, game.developer, game.description, game.shortDescription ?? "",
    ...game.genres, ...game.platforms,
  ].join(" ").toLocaleLowerCase("vi");
  return catalogModeTerms[mode].some((term) => searchable.includes(term));
}

function fromRow(row: GameRow): Game {
  return {
    slug: row.slug,
    title: row.title,
    category: row.category,
    genres: row.genres ?? [],
    platforms: row.platforms ?? [],
    developer: row.developer ?? "",
    releaseYear: row.release_year ?? 0,
    description: row.description ?? "",
    officialUrl: row.official_url ?? "",
    mark: row.mark ?? "GAME",
    artPrimary: row.art_primary ?? "#7465ff",
    artSecondary: row.art_secondary ?? "#111522",
    sourceProvider: row.source_provider ?? null,
    sourceId: row.source_id ?? null,
    coverUrl: row.cover_url ?? null,
    backgroundUrl: row.background_url ?? null,
    shortDescription: row.short_description ?? null,
    positiveReviews: Number(row.positive_reviews ?? 0),
    negativeReviews: Number(row.negative_reviews ?? 0),
    concurrentPlayers: Number(row.concurrent_players ?? 0),
    ownersEstimate: row.owners_estimate ?? null,
    sourceSyncedAt: row.source_synced_at ?? null,
    igdbId: row.igdb_id == null ? null : Number(row.igdb_id),
    igdbSyncedAt: row.igdb_synced_at ?? null,
  };
}

function localSearch(params: GameCatalogQuery): GameCatalogPage {
  const query = (params.query ?? "").trim().toLocaleLowerCase("vi");
  const categories = (params.categories?.length ? params.categories : params.category ? [params.category] : [])
    .map((category) => category.trim()).filter(Boolean);
  const platform = params.platform?.trim();
  let results = starterGames.filter((game) => {
    const searchable = [
      game.title, game.category, game.developer, game.description, game.shortDescription ?? "",
      ...game.genres, ...game.platforms,
    ].join(" ").toLocaleLowerCase("vi");
    return (!query || searchable.includes(query))
      && (categories.length === 0 || categories.some((category) => game.category === category || game.genres.includes(category)))
      && (!platform || game.platforms.includes(platform))
      && matchesCatalogMode(game, params.mode);
  });
  if (params.sort === "name") results = [...results].sort((a, b) => a.title.localeCompare(b.title, "vi"));
  if (params.sort === "newest") results = [...results].sort((a, b) => b.releaseYear - a.releaseYear);
  if (params.sort === "positive") results = [...results].sort(comparePositiveReviews);
  if (params.sort === "recommended") results = [...results].sort(compareRecommendedGames);
  const pageSize = Math.max(1, Math.min(params.pageSize ?? 24, 48));
  const page = Math.max(1, params.page ?? 1);
  const total = results.length;
  return { items: results.slice((page - 1) * pageSize, page * pageSize), total, available: true };
}

/**
 * Fetches a small set for UI controls, homepage modules and social game channels.
 * Never pulls the whole catalog into the application server or browser.
 */
export async function getGames(limit = 48): Promise<Game[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return process.env.NODE_ENV === "development" ? starterGames.slice(0, limit) : [];

  try {
    const { data, error } = await supabase
      .from("games")
      .select(gameFields)
      .eq("is_catalog_visible", true)
      .order("concurrent_players", { ascending: false, nullsFirst: false })
      .order("title", { ascending: true })
      .limit(Math.max(1, Math.min(limit, 5000)));

    if (error) throw error;
    return ((data ?? []) as unknown as GameRow[]).map(fromRow);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("LevelUP: catalog query failed.", error);
      return starterGames.slice(0, limit);
    }
    return [];
  }
}

export async function getGamesBySlugs(slugs: string[]): Promise<Game[]> {
  if (slugs.length === 0) return [];
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return process.env.NODE_ENV === "development"
      ? slugs.map((slug) => starterGames.find((game) => game.slug === slug)).filter((game): game is Game => Boolean(game))
      : [];
  }

  const { data, error } = await supabase.from("games").select(gameFields)
    .eq("is_catalog_visible", true).in("slug", slugs);
  if (error) {
    if (process.env.NODE_ENV === "development") console.warn("LevelUP: featured catalog query failed.", error.message);
    return [];
  }
  const bySlug = new Map(((data ?? []) as unknown as GameRow[]).map((row) => [row.slug, fromRow(row)]));
  return slugs.map((slug) => bySlug.get(slug)).filter((game): game is Game => Boolean(game));
}

export async function getGamesPage(params: GameCatalogQuery = {}): Promise<GameCatalogPage> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return process.env.NODE_ENV === "development"
      ? localSearch(params)
      : { items: [], total: 0, available: false };
  }

  const pageSize = Math.max(1, Math.min(params.pageSize ?? 24, 48));
  const page = Math.max(1, params.page ?? 1);
  const { data, error } = await supabase.rpc("search_games_catalog_v2", {
    p_query: params.query?.trim() || null,
    p_categories: params.categories?.length
      ? params.categories
      : params.category?.trim() ? [params.category.trim()] : null,
    p_platform: params.platform?.trim() || null,
    p_mode: params.mode ?? "all",
    p_sort: params.sort ?? "popular",
    p_limit: pageSize,
    p_offset: (page - 1) * pageSize,
  });

  if (error) {
    if (process.env.NODE_ENV === "development") console.warn("LevelUP: game catalog search failed.", error.message);
    return process.env.NODE_ENV === "development"
      ? localSearch(params)
      : { items: [], total: 0, available: false };
  }

  const result = data as { items?: GameRow[]; total?: number } | null;
  return {
    items: (result?.items ?? []).map(fromRow),
    total: Number(result?.total ?? 0),
    available: true,
  };
}

export async function getGameCatalogFacets(): Promise<GameCatalogFacets> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    if (process.env.NODE_ENV !== "development") {
      return { categories: [], platforms: [], available: false };
    }
    return {
      categories: [...new Set(starterGames.map((game) => game.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, "vi")),
      platforms: [...new Set(starterGames.flatMap((game) => game.platforms).filter(Boolean))].sort((a, b) => a.localeCompare(b, "vi")),
      available: true,
    };
  }

  const { data, error } = await supabase.rpc("get_game_catalog_facets");
  if (error) {
    if (process.env.NODE_ENV === "development") console.warn("LevelUP: catalog facets query failed.", error.message);
    return { categories: [], platforms: [], available: false };
  }

  const result = data as { categories?: unknown; platforms?: unknown } | null;
  const normalize = (value: unknown) => Array.isArray(value)
    ? [...new Set(value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean))]
    : [];

  return {
    categories: normalize(result?.categories),
    platforms: normalize(result?.platforms),
    available: true,
  };
}

export async function getGameBySlug(slug: string): Promise<Game | undefined> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return process.env.NODE_ENV === "development" ? starterGames.find((game) => game.slug === slug) : undefined;
  }

  const { data, error } = await supabase.from("games").select(gameFields)
    .eq("is_catalog_visible", true).eq("slug", slug).maybeSingle();
  if (error) {
    if (process.env.NODE_ENV === "development") console.warn("LevelUP: game detail query failed.", error.message);
    return process.env.NODE_ENV === "development" ? starterGames.find((game) => game.slug === slug) : undefined;
  }
  return data ? fromRow(data as unknown as GameRow) : undefined;
}

function scoreRelatedGame(candidate: Game, base: Game): number {
  const sharedGenres = base.genres.filter((genre) => candidate.genres.includes(genre)).length;
  const sharedPlatforms = base.platforms.filter((platform) => platform !== "Steam" && candidate.platforms.includes(platform)).length;
  const sameCategory = candidate.category === base.category ? 1 : 0;
  const reviewCount = (candidate.positiveReviews ?? 0) + (candidate.negativeReviews ?? 0);
  const reviewRate = reviewCount > 0 ? (candidate.positiveReviews ?? 0) / reviewCount : 0;
  const popularity = Math.log10((candidate.concurrentPlayers ?? 0) + 1);
  return sharedGenres * 12 + sameCategory * 7 + sharedPlatforms * 2 + reviewRate * 2 + Math.log10(reviewCount + 1) * 1.5 + popularity * 0.5;
}

export async function getRelatedGames(game: Game, limit = 3): Promise<Game[]> {
  const safeLimit = Math.max(1, Math.min(limit, 12));
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return process.env.NODE_ENV === "development"
      ? starterGames.filter((candidate) => candidate.slug !== game.slug)
        .sort((a, b) => scoreRelatedGame(b, game) - scoreRelatedGame(a, game) || a.title.localeCompare(b.title, "vi"))
        .slice(0, safeLimit)
      : [];
  }
  const categoryQuery = supabase.from("games").select(gameFields)
    .eq("is_catalog_visible", true).neq("slug", game.slug).eq("category", game.category)
    .order("concurrent_players", { ascending: false, nullsFirst: false }).limit(60);
  const genreQuery = game.genres.length > 0
    ? supabase.from("games").select(gameFields)
      .eq("is_catalog_visible", true).neq("slug", game.slug).overlaps("genres", game.genres)
      .order("concurrent_players", { ascending: false, nullsFirst: false }).limit(60)
    : Promise.resolve({ data: [], error: null });
  const [byCategory, byGenre] = await Promise.all([categoryQuery, genreQuery]);
  if (byCategory.error && byGenre.error) {
    if (process.env.NODE_ENV === "development") console.warn("LevelUP: related games query failed.", byCategory.error.message, byGenre.error.message);
    return [];
  }
  const candidates = new Map<string, Game>();
  for (const row of [...(byCategory.data ?? []), ...(byGenre.data ?? [])] as unknown as GameRow[]) {
    if (row.slug && row.slug !== game.slug) candidates.set(row.slug, fromRow(row));
  }
  return [...candidates.values()]
    .sort((a, b) => scoreRelatedGame(b, game) - scoreRelatedGame(a, game) || a.title.localeCompare(b.title, "vi"))
    .slice(0, safeLimit);
}

export async function getSitemapGameSlugs(): Promise<string[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return process.env.NODE_ENV === "development" ? starterGames.map((game) => game.slug) : [];
  }

  const { count, error: countError } = await supabase
    .from("games")
    .select("slug", { count: "exact", head: true })
    .eq("is_catalog_visible", true);

  if (countError) {
    if (process.env.NODE_ENV === "development") console.warn("LevelUP: sitemap count query failed.", countError.message);
    return [];
  }

  const pageSize = 1000;
  const offsets = Array.from({ length: Math.ceil((count ?? 0) / pageSize) }, (_, index) => index * pageSize);
  const pages = await Promise.all(offsets.map(async (offset) => {
    const result = await supabase
      .from("games")
      .select("slug")
      .eq("is_catalog_visible", true)
      .order("slug", { ascending: true })
      .range(offset, offset + pageSize - 1);
    return { offset, ...result };
  }));

  const failedPage = pages.find((page) => page.error);
  if (failedPage) {
    if (process.env.NODE_ENV === "development") {
      console.warn("LevelUP: sitemap page query failed at offset " + failedPage.offset + ".", failedPage.error?.message);
    }
    return [];
  }

  return pages
    .flatMap((page) => page.data ?? [])
    .map((row) => row.slug)
    .filter((slug): slug is string => typeof slug === "string" && slug.length > 0);
}
