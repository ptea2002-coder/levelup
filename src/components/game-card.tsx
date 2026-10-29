"use client";

import Link from "next/link";
import type { Game } from "@/lib/games";
import { GameArtwork } from "@/components/game-artwork";
import { GameLibraryControl } from "@/components/game-library-control";

type GameCardProps = {
  game: Game;
  index?: number;
};

export function GameCard({ game, index }: GameCardProps) {
  const activityLabel = game.concurrentPlayers && game.concurrentPlayers > 0
    ? game.concurrentPlayers.toLocaleString("vi-VN") + " đang chơi"
    : (game.platforms[0] ?? "Game");

  return (
    <article className="game-card">
      <Link href={"/games/" + game.slug} className="game-card-link" aria-label={"Xem thông tin " + game.title}>
        <div className="game-card-cover">
          <GameArtwork
            slug={game.slug}
            mark={game.mark}
            category={game.category}
            releaseYear={game.releaseYear}
            artPrimary={game.artPrimary}
            artSecondary={game.artSecondary}
            coverUrl={game.coverUrl}
            backgroundUrl={game.backgroundUrl}
            index={index}
          />
          <div className="game-card-cover-copy">
            <p className="game-card-cover-meta">
              <span>{game.category}</span><i aria-hidden="true" />
              {game.releaseYear > 0 ? game.releaseYear : "Chưa rõ"}
            </p>
            <h3>{game.title}</h3>
          </div>
        </div>
        <div className="game-body">
          <p>{game.shortDescription || game.description || "Thông tin chi tiết đang được đồng bộ từ nguồn dữ liệu game."}</p>
          <div className="card-foot">
            <span>{activityLabel}</span>
            <span className="card-link">Chi tiết <span aria-hidden="true">→</span></span>
          </div>
        </div>
      </Link>
      <div className="game-card-action-row">
        <GameLibraryControl gameSlug={game.slug} gameTitle={game.title} variant="compact" />
      </div>
    </article>
  );
}
