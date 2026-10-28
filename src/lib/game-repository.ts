import { games as starterGames, type Game } from "@/lib/games";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type GameRow = {
  slug: string;
  title: string;
  category: string;
  release_year: number;
  mark: string;
  description: string;
  genres: string[];
  platforms: string[];
  developer: string;
  official_url: string;
  art_primary: string;
  art_secondary: string;
};

function fromRow(row: GameRow): Game {
  return {
    slug: row.slug,
    title: row.title,
    category: row.category,
    releaseYear: row.release_year,
    mark: row.mark,
    description: row.description,
    genres: row.genres ?? [],
    platforms: row.platforms ?? [],
    developer: row.developer,
    officialUrl: row.official_url,
    artPrimary: row.art_primary,
    artSecondary: row.art_secondary,
  };
}

/**
 * The starter catalog keeps the site usable before the SQL schema is applied.
 * Once Supabase is configured and public.games is available, the database is
 * the source of truth for the catalog.
 */
export async function getGames(): Promise<Game[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return starterGames;

  try {
    const { data, error } = await supabase
      .from("games")
      .select(
        "slug,title,category,release_year,mark,description,genres,platforms,developer,official_url,art_primary,art_secondary",
      )
      .order("title", { ascending: true });

    if (error || !data?.length) {
      if (error && process.env.NODE_ENV === "development") {
        console.warn("LevelUP: using starter game catalog because Supabase is not ready.", error.message);
      }
      return starterGames;
    }

    return (data as unknown as GameRow[]).map(fromRow);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("LevelUP: Supabase catalog request failed; using starter data.", error);
    }
    return starterGames;
  }
}

export async function getGameBySlug(slug: string): Promise<Game | undefined> {
  const catalog = await getGames();
  return catalog.find((game) => game.slug === slug);
}
