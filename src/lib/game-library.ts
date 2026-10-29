export const GAME_LIBRARY_STORAGE_KEY = "levelup:game-library:v1";
export const GAME_LIBRARY_USER_STORAGE_PREFIX = "levelup:game-library:user:v1:";
export const GAME_LIBRARY_CLAIMED_STORAGE_PREFIX = "levelup:game-library:claimed:v1:";
export const GAME_LIBRARY_EVENT = "levelup:game-library-change";

export const gameLibraryStatuses = ["wishlist", "playing", "completed"] as const;
export type GameLibraryStatus = (typeof gameLibraryStatuses)[number];

export type GameLibraryEntry = {
  status: GameLibraryStatus | null;
  isFavorite: boolean;
  updatedAt: number;
};

export type GameLibrary = Record<string, GameLibraryEntry>;

const validStatuses = new Set<string>(gameLibraryStatuses);

export function getGameLibraryStorageKey(userId?: string | null): string {
  return userId ? GAME_LIBRARY_USER_STORAGE_PREFIX + userId : GAME_LIBRARY_STORAGE_KEY;
}

export function getGameLibraryClaimedKey(userId: string): string {
  return GAME_LIBRARY_CLAIMED_STORAGE_PREFIX + userId;
}

export function isGameLibraryEntryActive(entry: GameLibraryEntry | undefined): boolean {
  return Boolean(entry && (entry.status !== null || entry.isFavorite));
}

/** Incoming records win timestamp ties so callers can deliberately choose merge precedence. */
export function mergeGameLibraries(base: GameLibrary, incoming: GameLibrary): GameLibrary {
  const merged: GameLibrary = { ...base };
  for (const [slug, entry] of Object.entries(incoming)) {
    const current = merged[slug];
    if (!current || entry.updatedAt >= current.updatedAt) merged[slug] = entry;
  }
  return merged;
}

export function readGameLibrary(storageKey = GAME_LIBRARY_STORAGE_KEY): GameLibrary {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return {};

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

    const result: GameLibrary = {};
    for (const [slug, value] of Object.entries(parsed).slice(0, 2000)) {
      if (!/^[a-z0-9-]{1,100}$/.test(slug) || !value || typeof value !== "object") continue;

      const entry = value as Partial<GameLibraryEntry>;
      const status = entry.status;
      if (status !== null && (typeof status !== "string" || !validStatuses.has(status))) continue;

      result[slug] = {
        status: status as GameLibraryStatus | null,
        isFavorite: typeof entry.isFavorite === "boolean" ? entry.isFavorite : false,
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

export function persistGameLibrary(library: GameLibrary, storageKey = GAME_LIBRARY_STORAGE_KEY): boolean {
  if (typeof window === "undefined") return false;

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(library));
    window.dispatchEvent(new Event(GAME_LIBRARY_EVENT));
    return true;
  } catch {
    return false;
  }
}
