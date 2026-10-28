export const GAME_LIBRARY_STORAGE_KEY = "levelup:game-library:v1";
export const GAME_LIBRARY_EVENT = "levelup:game-library-change";

export const gameLibraryStatuses = ["wishlist", "playing", "completed"] as const;
export type GameLibraryStatus = (typeof gameLibraryStatuses)[number];

export type GameLibraryEntry = {
  status: GameLibraryStatus;
  updatedAt: number;
};

export type GameLibrary = Record<string, GameLibraryEntry>;

const validStatuses = new Set<string>(gameLibraryStatuses);

export function readGameLibrary(): GameLibrary {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(GAME_LIBRARY_STORAGE_KEY);
    if (!raw) return {};

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

    const result: GameLibrary = {};
    for (const [slug, value] of Object.entries(parsed).slice(0, 200)) {
      if (!/^[a-z0-9-]{1,100}$/.test(slug) || !value || typeof value !== "object") continue;

      const entry = value as Partial<GameLibraryEntry>;
      if (typeof entry.status !== "string" || !validStatuses.has(entry.status)) continue;

      result[slug] = {
        status: entry.status as GameLibraryStatus,
        updatedAt: typeof entry.updatedAt === "number" && Number.isFinite(entry.updatedAt) && entry.updatedAt >= 0
          ? entry.updatedAt
          : 0,
      };
    }
    return result;
  } catch {
    return {};
  }
}

export function persistGameLibrary(library: GameLibrary): boolean {
  if (typeof window === "undefined") return false;

  try {
    window.localStorage.setItem(GAME_LIBRARY_STORAGE_KEY, JSON.stringify(library));
    window.dispatchEvent(new Event(GAME_LIBRARY_EVENT));
    return true;
  } catch {
    return false;
  }
}
