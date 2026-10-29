"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { GameCard } from "@/components/game-card";
import { useGameLibrary } from "@/components/game-library-provider";
import type { Game } from "@/lib/games";
import type { GameLibraryStatus } from "@/lib/game-library";

type LockerFilter = "all" | GameLibraryStatus;

const filterOptions: { value: LockerFilter; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "playing", label: "Đang chơi" },
  { value: "wishlist", label: "Muốn chơi" },
  { value: "completed", label: "Đã hoàn thành" },
];

type GameLockerProps = {
  games: Game[];
};

export function GameLocker({ games }: GameLockerProps) {
  const { library, ready, storageAvailable } = useGameLibrary();
  const [activeFilter, setActiveFilter] = useState<LockerFilter>("all");
  const [additionalGames, setAdditionalGames] = useState<Game[]>([]);
  const [lookupState, setLookupState] = useState<"idle" | "loading" | "error">("idle");

  useEffect(() => {
    if (!ready) return;
    const knownSlugs = new Set(games.map((game) => game.slug));
    const missingSlugs = Object.keys(library).filter((slug) => !knownSlugs.has(slug));

    if (missingSlugs.length === 0) {
      setAdditionalGames([]);
      setLookupState("idle");
      return;
    }

    let cancelled = false;
    setLookupState("loading");

    const loadMissingGames = async () => {
      try {
        const chunks: string[][] = [];
        for (let index = 0; index < missingSlugs.length; index += 48) {
          chunks.push(missingSlugs.slice(index, index + 48));
        }

        const results = await Promise.all(chunks.map(async (chunk) => {
          const response = await fetch(`/api/games?slugs=${encodeURIComponent(chunk.join(","))}`, { cache: "no-store" });
          if (!response.ok) throw new Error("Could not resolve saved games");
          const payload = await response.json() as { items?: Game[] };
          return payload.items ?? [];
        }));

        if (!cancelled) {
          setAdditionalGames(results.flat());
          setLookupState("idle");
        }
      } catch {
        if (!cancelled) {
          setAdditionalGames([]);
          setLookupState("error");
        }
      }
    };

    void loadMissingGames();
    return () => {
      cancelled = true;
    };
  }, [games, library, ready]);

  const allGames = useMemo(() => {
    const bySlug = new Map(games.map((game) => [game.slug, game] as const));
    for (const game of additionalGames) bySlug.set(game.slug, game);
    return [...bySlug.values()];
  }, [additionalGames, games]);

  const savedGames = useMemo(
    () => allGames
      .filter((game) => Boolean(library[game.slug]))
      .sort((a, b) => (library[b.slug]?.updatedAt ?? 0) - (library[a.slug]?.updatedAt ?? 0)),
    [allGames, library],
  );

  const visibleGames = savedGames.filter((game) =>
    activeFilter === "all" || library[game.slug]?.status === activeFilter
  );
  const countByFilter = (filter: LockerFilter) => filter === "all"
    ? savedGames.length
    : savedGames.filter((game) => library[game.slug]?.status === filter).length;

  return (
    <section className="section game-locker-section">
      <div className="container">
        <div className="locker-summary">
          <div>
            <p className="eyebrow">YOUR INVENTORY / {ready && lookupState !== "loading" ? String(savedGames.length).padStart(2, "0") : "--"} SAVED</p>
            <h2>THE <span>ROSTER.</span></h2>
            <p>Ba trạng thái để quản lý backlog cá nhân. Thay đổi của bạn được lưu trên trình duyệt hiện tại.</p>
          </div>
          <div className={`locker-storage-note${storageAvailable ? "" : " is-limited"}`}>
            <i aria-hidden="true" />
            {storageAvailable ? "Lưu cục bộ đang bật" : "Không thể lưu bền vững trên trình duyệt này"}
          </div>
        </div>

        <div className="locker-toolbar" role="group" aria-label="Lọc Game Locker">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`filter-btn${activeFilter === option.value ? " active" : ""}`}
              aria-pressed={activeFilter === option.value}
              onClick={() => setActiveFilter(option.value)}
            >
              {option.label} <span className="locker-filter-count">{ready && lookupState !== "loading" ? countByFilter(option.value) : "—"}</span>
            </button>
          ))}
        </div>

        {!ready ? (
          <div className="empty-state" role="status">
            <p className="eyebrow">PLAYER INVENTORY / LOADING</p>
            <h3>Đang mở tủ game…</h3>
            <p>LevelUP đang đọc bộ sưu tập được lưu trên thiết bị này.</p>
          </div>
        ) : savedGames.length === 0 && lookupState === "loading" ? (
          <div className="empty-state" role="status">
            <p className="eyebrow">PLAYER INVENTORY / SYNC</p>
            <h3>Đang tìm game đã lưu trong toàn bộ catalog…</h3>
            <p>Đang đối chiếu các mục đã lưu với thư viện game.</p>
          </div>
        ) : savedGames.length === 0 && lookupState === "error" ? (
          <div className="empty-state locker-empty-state" role="status">
            <p className="eyebrow">CATALOG / CONNECTION</p>
            <h3>Chưa tải được các game đã lưu.</h3>
            <p>Bộ sưu tập trên trình duyệt vẫn được giữ nguyên. Hãy thử tải lại trang khi kết nối ổn định.</p>
          </div>
        ) : savedGames.length === 0 && Object.keys(library).length > 0 ? (
          <div className="empty-state locker-empty-state">
            <p className="eyebrow">SAVED ITEMS / NOT IN CATALOG</p>
            <h3>Có {Object.keys(library).length} mục đã lưu chưa khớp với catalog hiện tại.</h3>
            <p>Những game này có thể đã bị ẩn hoặc không còn trong nguồn dữ liệu. Dữ liệu lưu trên trình duyệt vẫn được giữ nguyên.</p>
          </div>
        ) : savedGames.length === 0 ? (
          <div className="empty-state locker-empty-state">
            <p className="eyebrow">NO SAVED GAMES / YET</p>
            <h3>Tủ game đang chờ tựa game đầu tiên.</h3>
            <p>Mở thư viện, lưu game bạn muốn thử rồi chọn trạng thái để quản lý backlog của mình.</p>
            <Link className="btn btn-primary" href="/games">Khám phá game <span aria-hidden="true">↗</span></Link>
          </div>
        ) : visibleGames.length === 0 ? (
          <div className="empty-state locker-empty-state">
            <p className="eyebrow">FILTER EMPTY / NO MATCH</p>
            <h3>Chưa có game ở trạng thái này.</h3>
            <p>Đổi trạng thái trong chi tiết game hoặc chọn một bộ lọc khác.</p>
            <button className="btn btn-secondary" type="button" onClick={() => setActiveFilter("all")}>Xem toàn bộ Locker</button>
          </div>
        ) : (
          <>
            <p className="results-count" role="status">{visibleGames.length} game trong danh sách này</p>
            <div className="game-grid">
              {visibleGames.map((game) => (
                <GameCard key={game.slug} game={game} index={allGames.findIndex((item) => item.slug === game.slug)} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
