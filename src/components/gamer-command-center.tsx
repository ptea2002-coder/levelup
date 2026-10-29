"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useMemo } from "react";
import { GameLibraryControl } from "@/components/game-library-control";
import { useGameLibrary } from "@/components/game-library-provider";
import type { Game } from "@/lib/games";
import { isGameLibraryEntryActive, type GameLibraryStatus } from "@/lib/game-library";

const statusLabels: Record<GameLibraryStatus, string> = {
  wishlist: "Muốn chơi",
  playing: "Đang chơi",
  completed: "Đã hoàn thành",
};

type GamerCommandCenterProps = {
  games: Game[];
};

export function GamerCommandCenter({ games }: GamerCommandCenterProps) {
  const { library, ready, storageAvailable, signedIn, syncStatus } = useGameLibrary();
  const savedGames = useMemo(
    () => games
      .filter((game) => isGameLibraryEntryActive(library[game.slug]))
      .sort((a, b) => (library[b.slug]?.updatedAt ?? 0) - (library[a.slug]?.updatedAt ?? 0)),
    [games, library],
  );

  const savedCount = Object.values(library).filter((entry) => isGameLibraryEntryActive(entry)).length;
  const countByStatus = (status: GameLibraryStatus) =>
    Object.values(library).filter((entry) => entry.status === status).length;

  return (
    <section className="section gamer-command-section" aria-labelledby="gamer-command-title">
      <div className="container">
        <div className="gamer-command-shell">
          <div className="gamer-command-top">
            <div>
              <p className="eyebrow">PLAYER HUB / YOUR LOCAL SAVE</p>
              <h2 id="gamer-command-title">YOUR <span>LOADOUT.</span></h2>
              <p className="gamer-command-intro">
                Tủ game cá nhân của bạn — lưu mục tiêu chơi, đánh dấu yêu thích và đồng bộ bộ sưu tập qua tài khoản LevelUP.
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
          ) : savedCount === 0 ? (
            <div className="gamer-command-empty">
              <span className="eyebrow">LOADOUT EMPTY / READY FOR YOUR NEXT MAIN</span>
              <h3>Mọi bộ sưu tập đều bắt đầu từ một game.</h3>
              <p>Lưu game từ bất kỳ thẻ nào. Bạn có thể dùng cục bộ hoặc đăng nhập để đồng bộ thư viện trên các thiết bị.</p>
              <Link className="btn btn-primary" href="/games">Chọn game đầu tiên <span aria-hidden="true">↗</span></Link>
            </div>
          ) : savedGames.length === 0 ? (
            <div className="gamer-command-empty">
              <span className="eyebrow">SAVED GAMES / OPEN LOCKER</span>
              <h3>Bạn đã lưu {savedCount} game.</h3>
              <p>Trang chủ chỉ hiển thị nhóm game nổi bật. Mở Game Locker để xem toàn bộ bộ sưu tập đã lưu.</p>
              <Link className="btn btn-primary" href="/locker">Mở Game Locker <span aria-hidden="true">↗</span></Link>
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
                      <p className="gamer-mini-meta">{game.category} / {entry.status ? statusLabels[entry.status] : "Yêu thích"}</p>
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
            <span><i aria-hidden="true" /> {signedIn ? syncStatus === "syncing" ? "ACCOUNT SYNC / ĐANG ĐỒNG BỘ" : syncStatus === "error" ? "ACCOUNT SYNC / CẦN THỬ LẠI" : "ACCOUNT SYNC / ĐÃ ĐỒNG BỘ" : storageAvailable ? "LOCAL SAVE / ĐĂNG NHẬP ĐỂ ĐỒNG BỘ" : "SESSION SAVE / BỘ NHỚ TRÌNH DUYỆT BỊ HẠN CHẾ"}</span>
            <span>{savedCount} game đã lưu · hiển thị tối đa 3 game nổi bật</span>
            {!signedIn ? <Link href="/login">Đăng nhập để đồng bộ ↗</Link> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
