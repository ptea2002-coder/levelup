"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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

  const savedGames = useMemo(
    () => games
      .filter((game) => Boolean(library[game.slug]))
      .sort((a, b) => (library[b.slug]?.updatedAt ?? 0) - (library[a.slug]?.updatedAt ?? 0)),
    [games, library],
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
            <p className="eyebrow">YOUR INVENTORY / {ready ? String(savedGames.length).padStart(2, "0") : "--"} SAVED</p>
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
              {option.label} <span className="locker-filter-count">{ready ? countByFilter(option.value) : "—"}</span>
            </button>
          ))}
        </div>

        {!ready ? (
          <div className="empty-state" role="status">
            <p className="eyebrow">PLAYER INVENTORY / LOADING</p>
            <h3>Đang mở tủ game…</h3>
            <p>LevelUP đang đọc bộ sưu tập được lưu trên thiết bị này.</p>
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
                <GameCard key={game.slug} game={game} index={games.findIndex((item) => item.slug === game.slug)} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
