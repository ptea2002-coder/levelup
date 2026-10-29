import { games as starterGames, type Game } from "@/lib/games";
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
};

const gameFields = [
  "id", "slug", "title", "category", "release_year", "mark", "description",
  "genres", "platforms", "developer", "official_url", "art_primary", "art_secondary",
  "source_provider", "source_id", "cover_url", "background_url", "short_description",
  "positive_reviews", "negative_reviews", "concurrent_players", "owners_estimate", "source_synced_at",
].join(",");

export type GameCatalogPage = {
  items: Game[];
  total: number;
  available: boolean;
};

export type GameCatalogQuery = {
  query?: string;
  category?: string;
  platform?: string;
  sort?: "popular" | "recommended" | "name" | "newest" | "positive";
  page?: number;
  pageSize?: number;
};

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
  };
}

function localSearch(params: GameCatalogQuery): GameCatalogPage {
  const query = (params.query ?? "").trim().toLocaleLowerCase("vi");
  const category = params.category?.trim();
  const platform = params.platform?.trim();
  let results = starterGames.filter((game) => {
    const searchable = [game.title, game.category, game.developer, ...game.genres, ...game.platforms]
      .join(" ").toLocaleLowerCase("vi");
    return (!query || searchable.includes(query))
      && (!category || game.category === category || game.genres.includes(category))
      && (!platform || game.platforms.includes(platform));
  });
  if (params.sort === "name") results = [...results].sort((a, b) => a.title.localeCompare(b.title, "vi"));
  if (params.sort === "newest") results = [...results].sort((a, b) => b.releaseYear - a.releaseYear);
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
  const { data, error } = await supabase.rpc("search_games_catalog", {
    p_query: params.query?.trim() || null,
    p_category: params.category?.trim() || null,
    p_platform: params.platform?.trim() || null,
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

export async function getRelatedGames(game: Game, limit = 3): Promise<Game[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return process.env.NODE_ENV === "development"
      ? starterGames.filter((candidate) => candidate.slug !== game.slug && candidate.category === game.category).slice(0, limit)
      : [];
  }

  let query = supabase.from("games").select(gameFields).eq("is_catalog_visible", true).neq("slug", game.slug);
  if (game.genres.length > 0) query = query.overlaps("genres", game.genres);
  else query = query.eq("category", game.category);

  const { data, error } = await query
    .order("concurrent_players", { ascending: false, nullsFirst: false })
    .order("title", { ascending: true })
    .limit(Math.max(1, Math.min(limit, 12)));

  if (error) {
    if (process.env.NODE_ENV === "development") console.warn("LevelUP: related games query failed.", error.message);
    return [];
  }
  return ((data ?? []) as unknown as GameRow[]).map(fromRow);
}

export async function getSitemapGames(limit = 5000): Promise<Game[]> {
  return getGames(limit);
}
