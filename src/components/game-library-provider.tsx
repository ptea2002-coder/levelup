"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  GAME_LIBRARY_EVENT,
  GAME_LIBRARY_STORAGE_KEY,
  persistGameLibrary,
  readGameLibrary,
  type GameLibrary,
  type GameLibraryStatus,
} from "@/lib/game-library";

type GameLibraryContextValue = {
  library: GameLibrary;
  ready: boolean;
  storageAvailable: boolean;
  setGameStatus: (slug: string, status: GameLibraryStatus | null) => boolean;
};

const GameLibraryContext = createContext<GameLibraryContextValue | null>(null);

export function GameLibraryProvider({ children }: { children: ReactNode }) {
  const [library, setLibrary] = useState<GameLibrary>({});
  const [ready, setReady] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);

  useEffect(() => {
    const syncFromStorage = () => {
      try {
        window.localStorage.getItem(GAME_LIBRARY_STORAGE_KEY);
        setLibrary(readGameLibrary());
        setStorageAvailable(true);
      } catch {
        setStorageAvailable(false);
      }
      setReady(true);
    };

    syncFromStorage();
    window.addEventListener("storage", syncFromStorage);
    window.addEventListener(GAME_LIBRARY_EVENT, syncFromStorage);
    return () => {
      window.removeEventListener("storage", syncFromStorage);
      window.removeEventListener(GAME_LIBRARY_EVENT, syncFromStorage);
    };
  }, []);

  const setGameStatus = useCallback((slug: string, status: GameLibraryStatus | null) => {
    const next = { ...library };
    if (status) {
      next[slug] = { status, updatedAt: Date.now() };
    } else {
      delete next[slug];
    }

    setLibrary(next);
    const persisted = persistGameLibrary(next);
    setStorageAvailable(persisted);
    return persisted;
  }, [library]);

  const value = useMemo(
    () => ({ library, ready, storageAvailable, setGameStatus }),
    [library, ready, storageAvailable, setGameStatus],
  );

  return <GameLibraryContext.Provider value={value}>{children}</GameLibraryContext.Provider>;
}

export function useGameLibrary() {
  const context = useContext(GameLibraryContext);
  if (!context) throw new Error("useGameLibrary must be used within GameLibraryProvider");
  return context;
}
