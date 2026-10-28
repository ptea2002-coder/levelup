"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useMemo } from "react";
import { GameLibraryControl } from "@/components/game-library-control";
import { useGameLibrary } from "@/components/game-library-provider";
import type { Game } from "@/lib/games";
import type { GameLibraryStatus } from "@/lib/game-library";

const statusLabels: Record<GameLibraryStatus, string> = {
  wishlist: "Muốn chơi",
  playing: "Đang chơi",
  completed: "Đã hoàn thành",
};

type GamerCommandCenterProps = {
  games: Game[];
};

export function GamerCommandCenter({ games }: GamerCommandCenterProps) {
  const { library, ready, storageAvailable } = useGameLibrary();
  const savedGames = useMemo(
    () => games
      .filter((game) => Boolean(library[game.slug]))
      .sort((a, b) => (library[b.slug]?.updatedAt ?? 0) - (library[a.slug]?.updatedAt ?? 0)),
    [games, library],
  );

  const countByStatus = (status: GameLibraryStatus) =>
    savedGames.filter((game) => library[game.slug]?.status === status).length;

  return (
    <section className="section gamer-command-section" aria-labelledby="gamer-command-title">
      <div className="container">
        <div className="gamer-command-shell">
          <div className="gamer-command-top">
            <div>
              <p className="eyebrow">PLAYER HUB / YOUR LOCAL SAVE</p>
              <h2 id="gamer-command-title">YOUR <span>LOADOUT.</span></h2>
              <p className="gamer-command-intro">
                Tủ game cá nhân của bạn — lưu mục tiêu chơi, theo dõi game đang cày và đánh dấu những hành trình đã hoàn thành.
              </p>
            </div>
            <Link className="gamer-command-open" href="/locker">Mở Game Locker <span aria-hidden="true">↗</span></Link>
          </div>

          <div className="gamer-command-stats" aria-label="Thống kê Game Locker">
            <div className="gamer-stat">
              <span>MUỐN CHƠI</span>
              <strong>{ready ? String(countByStatus("wishlist")).padStart(2, "0") : "—"}</strong>
            </div>
            <div className="gamer-stat">
              <span>ĐANG CÀY</span>
              <strong>{ready ? String(countByStatus("playing")).padStart(2, "0") : "—"}</strong>
            </div>
            <div className="gamer-stat">
              <span>ĐÃ CLEAR</span>
              <strong>{ready ? String(countByStatus("completed")).padStart(2, "0") : "—"}</strong>
            </div>
          </div>

          {!ready ? (
            <div className="gamer-command-empty" role="status">Đang đồng bộ Game Locker trên thiết bị này…</div>
          ) : savedGames.length === 0 ? (
            <div className="gamer-command-empty">
              <span className="eyebrow">LOADOUT EMPTY / READY FOR YOUR NEXT MAIN</span>
              <h3>Mọi bộ sưu tập đều bắt đầu từ một game.</h3>
              <p>Lưu game từ bất kỳ thẻ nào. Trạng thái được lưu trong trình duyệt này, không cần đăng nhập.</p>
              <Link className="btn btn-primary" href="/games">Chọn game đầu tiên <span aria-hidden="true">↗</span></Link>
            </div>
          ) : (
            <div className="gamer-mini-grid">
              {savedGames.slice(0, 3).map((game) => {
                const entry = library[game.slug];
                return (
                  <article className="gamer-mini-card" key={game.slug}>
                    <div
                      className="gamer-mini-art"
                      style={{ "--game-accent": game.artPrimary, "--game-accent-dark": game.artSecondary } as CSSProperties}
                      aria-hidden="true"
                    >
                      <span>{game.mark}</span>
                      <small>{String(game.releaseYear)}</small>
                    </div>
                    <div className="gamer-mini-copy">
                      <p className="gamer-mini-meta">{game.category} / {statusLabels[entry.status]}</p>
                      <Link href={`/games/${game.slug}`}><h3>{game.title}</h3></Link>
                      <span className="gamer-mini-updated">
                        Đã thêm {entry.updatedAt ? new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "short" }).format(new Date(entry.updatedAt)) : "trước đó"}
                      </span>
                    </div>
                    <GameLibraryControl gameSlug={game.slug} gameTitle={game.title} variant="compact" />
                  </article>
                );
              })}
            </div>
          )}

          <div className="gamer-command-foot">
            <span><i aria-hidden="true" /> {storageAvailable ? "LOCAL SAVE / ĐỒNG BỘ TRÊN TRÌNH DUYỆT" : "SESSION SAVE / BỘ NHỚ TRÌNH DUYỆT BỊ HẠN CHẾ"}</span>
            <span>{savedGames.length} / {games.length} game trong Locker</span>
          </div>
        </div>
      </div>
    </section>
  );
}
