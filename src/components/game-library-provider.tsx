"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  GAME_LIBRARY_EVENT,
  GAME_LIBRARY_STORAGE_KEY,
  getGameLibraryClaimedKey,
  getGameLibraryStorageKey,
  gameLibraryStatuses,
  mergeGameLibraries,
  persistGameLibrary,
  readGameLibrary,
  type GameLibrary,
  type GameLibraryStatus,
} from "@/lib/game-library";

type CloudLibraryRow = {
  game_slug: string;
  status: string | null;
  is_favorite: boolean;
  updated_at: string;
};

type LibrarySyncStatus = "local" | "syncing" | "synced" | "error";

type GameLibraryContextValue = {
  library: GameLibrary;
  ready: boolean;
  storageAvailable: boolean;
  signedIn: boolean;
  syncStatus: LibrarySyncStatus;
  setGameStatus: (slug: string, status: GameLibraryStatus | null) => boolean;
  setFavorite: (slug: string, favorite: boolean) => boolean;
};

const GameLibraryContext = createContext<GameLibraryContextValue | null>(null);

function isStatus(value: unknown): value is GameLibraryStatus {
  return typeof value === "string" && (gameLibraryStatuses as readonly string[]).includes(value);
}

async function loadCloudLibrary(supabase: SupabaseClient, userId: string): Promise<GameLibrary> {
  const rows: CloudLibraryRow[] = [];
  const pageSize = 500;

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from("user_game_library")
      .select("game_slug, status, is_favorite, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) throw error;
    const page = (data ?? []) as CloudLibraryRow[];
    rows.push(...page);
    if (page.length < pageSize) break;
  }

  const result: GameLibrary = {};
  for (const row of rows) {
    if (!/^[a-z0-9-]{1,100}$/.test(row.game_slug)) continue;
    const timestamp = Date.parse(row.updated_at);
    result[row.game_slug] = {
      status: row.status === null ? null : isStatus(row.status) ? row.status : null,
      isFavorite: Boolean(row.is_favorite),
      updatedAt: Number.isFinite(timestamp) ? timestamp : 0,
    };
  }
  return result;
}

async function writeCloudLibrary(supabase: SupabaseClient, userId: string, library: GameLibrary): Promise<GameLibrary> {
  // Re-read before each push so a stale tab cannot overwrite a newer change made on another device.
  const cloudLibrary = await loadCloudLibrary(supabase, userId);
  const mergedLibrary = mergeGameLibraries(library, cloudLibrary);
  const entries = Object.entries(mergedLibrary).filter(([slug, entry]) => {
    const cloudEntry = cloudLibrary[slug];
    return !cloudEntry || entry.updatedAt > cloudEntry.updatedAt;
  });
  const pageSize = 100;

  for (let offset = 0; offset < entries.length; offset += pageSize) {
    const page = entries.slice(offset, offset + pageSize);
    const rows = page.map(([gameSlug, entry]) => ({
      user_id: userId,
      game_slug: gameSlug,
      status: entry.status,
      is_favorite: entry.isFavorite,
      updated_at: new Date(Math.max(entry.updatedAt, 1)).toISOString(),
    }));

    const { error } = await supabase
      .from("user_game_library")
      .upsert(rows, { onConflict: "user_id,game_slug" });

    if (error) throw error;
  }

  return mergedLibrary;
}

function canAccessStorage(storageKey: string): boolean {
  try {
    window.localStorage.getItem(storageKey);
    return true;
  } catch {
    return false;
  }
}

export function GameLibraryProvider({ children }: { children: ReactNode }) {
  const [library, setLibrary] = useState<GameLibrary>({});
  const [ready, setReady] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [cloudReady, setCloudReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<LibrarySyncStatus>("local");
  const userIdRef = useRef<string | null | undefined>(undefined);
  const storageKey = useMemo(() => getGameLibraryStorageKey(userId), [userId]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      userIdRef.current = null;
      setUserId(null);
      return;
    }

    const applyUserId = (nextUserId: string | null) => {
      if (userIdRef.current === nextUserId) return;
      userIdRef.current = nextUserId;
      setReady(false);
      setCloudReady(false);
      setSyncStatus(nextUserId ? "syncing" : "local");
      setUserId(nextUserId);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      applyUserId(session?.user.id ?? null);
    });

    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        setSyncStatus("error");
        setReady(true);
        return;
      }
      applyUserId(data.session?.user.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const localLibrary = readGameLibrary(storageKey);
      setLibrary(localLibrary);
      setStorageAvailable(canAccessStorage(storageKey));

      if (!userId) {
        setCloudReady(false);
        setSyncStatus("local");
        setReady(true);
        return;
      }

      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setCloudReady(false);
        setSyncStatus("error");
        setReady(true);
        return;
      }

      let seedLibrary = localLibrary;
      let hasClaimedGuestLibrary = false;
      try {
        hasClaimedGuestLibrary = window.localStorage.getItem(getGameLibraryClaimedKey(userId)) === "1";
      } catch {
        // Continue with the account-local library if storage is blocked.
      }

      if (!hasClaimedGuestLibrary) {
        seedLibrary = mergeGameLibraries(readGameLibrary(GAME_LIBRARY_STORAGE_KEY), localLibrary);
      }

      setLibrary(seedLibrary);
      setSyncStatus("syncing");

      try {
        const syncedLibrary = await writeCloudLibrary(supabase, userId, seedLibrary);
        if (cancelled) return;

        setLibrary(syncedLibrary);
        setStorageAvailable(persistGameLibrary(syncedLibrary, storageKey));

        try {
          window.localStorage.setItem(getGameLibraryClaimedKey(userId), "1");
        } catch {
          // Cloud sync is still successful if the browser blocks the claim marker.
        }

        setCloudReady(true);
        setSyncStatus("synced");
        setReady(true);
      } catch {
        if (cancelled) return;
        setCloudReady(false);
        setSyncStatus("error");
        setReady(true);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [storageKey, userId]);

  useEffect(() => {
    const syncFromStorage = (event: Event) => {
      const storageEvent = event as StorageEvent;
      if (storageEvent.key && storageEvent.key !== storageKey) return;
      setLibrary(readGameLibrary(storageKey));
      setStorageAvailable(canAccessStorage(storageKey));
    };

    window.addEventListener("storage", syncFromStorage);
    window.addEventListener(GAME_LIBRARY_EVENT, syncFromStorage);
    return () => {
      window.removeEventListener("storage", syncFromStorage);
      window.removeEventListener(GAME_LIBRARY_EVENT, syncFromStorage);
    };
  }, [storageKey]);

  useEffect(() => {
    if (!ready || !userId || !cloudReady) return;
    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setSyncStatus("error");
        return;
      }

      setSyncStatus("syncing");
      try {
        const syncedLibrary = await writeCloudLibrary(supabase, userId, library);
        if (!cancelled) {
          if (JSON.stringify(syncedLibrary) !== JSON.stringify(library)) {
            setLibrary(syncedLibrary);
            setStorageAvailable(persistGameLibrary(syncedLibrary, storageKey));
          }
          setSyncStatus("synced");
        }
      } catch {
        if (!cancelled) setSyncStatus("error");
      }
    }, 450);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [cloudReady, library, ready, storageKey, userId]);

  const setGameStatus = useCallback((slug: string, status: GameLibraryStatus | null) => {
    if (!/^[a-z0-9-]{1,100}$/.test(slug)) return false;
    const previous = library[slug];
    const next: GameLibrary = {
      ...library,
      [slug]: {
        status,
        isFavorite: previous?.isFavorite ?? false,
        updatedAt: Math.max(Date.now(), (previous?.updatedAt ?? 0) + 1),
      },
    };
    setLibrary(next);
    const persisted = persistGameLibrary(next, storageKey);
    setStorageAvailable(persisted);
    if (userId && cloudReady) setSyncStatus("syncing");
    return persisted;
  }, [cloudReady, library, storageKey, userId]);

  const setFavorite = useCallback((slug: string, favorite: boolean) => {
    if (!/^[a-z0-9-]{1,100}$/.test(slug)) return false;
    const previous = library[slug];
    const next: GameLibrary = {
      ...library,
      [slug]: {
        status: previous?.status ?? null,
        isFavorite: favorite,
        updatedAt: Math.max(Date.now(), (previous?.updatedAt ?? 0) + 1),
      },
    };
    setLibrary(next);
    const persisted = persistGameLibrary(next, storageKey);
    setStorageAvailable(persisted);
    if (userId && cloudReady) setSyncStatus("syncing");
    return persisted;
  }, [cloudReady, library, storageKey, userId]);

  const value = useMemo(
    () => ({
      library,
      ready,
      storageAvailable,
      signedIn: Boolean(userId),
      syncStatus,
      setGameStatus,
      setFavorite,
    }),
    [library, ready, storageAvailable, userId, syncStatus, setGameStatus, setFavorite],
  );

  return <GameLibraryContext.Provider value={value}>{children}</GameLibraryContext.Provider>;
}

export function useGameLibrary() {
  const context = useContext(GameLibraryContext);
  if (!context) throw new Error("useGameLibrary must be used within GameLibraryProvider");
  return context;
}
