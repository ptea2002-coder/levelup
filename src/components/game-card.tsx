import Link from "next/link";
import type { CSSProperties } from "react";
import type { Game } from "@/lib/games";

type GameCardProps = {
  game: Game;
  index?: number;
};

export function GameCard({ game, index }: GameCardProps) {
  const artStyle = {
    "--art-primary": game.artPrimary,
    "--art-secondary": game.artSecondary,
  } as CSSProperties;

  return (
    <article className="game-card">
      <Link href={`/games/${game.slug}`} className="game-card-link" aria-label={`Xem thông tin ${game.title}`}>
        <div className="game-art" style={artStyle}>
          <span className="game-art-kicker">LEVELUP / SELECTED</span>
          <span className="game-art-index">{String((index ?? 0) + 1).padStart(2, "0")}</span>
          <span className="game-art-mark" aria-hidden="true">{game.mark}</span>
          <span className="game-art-bottom">{game.category}</span>
        </div>
        <div className="game-body">
          <div className="game-title-row">
            <h3>{game.title}</h3>
            <span className="game-symbol" aria-hidden="true">↗</span>
          </div>
          <p>{game.description}</p>
          <div className="card-foot">
            <span>{game.platforms[0]}{game.platforms.length > 1 ? ` +${game.platforms.length - 1}` : ""}</span>
            <span className="card-link">Chi tiết <span aria-hidden="true">→</span></span>
          </div>
        </div>
      </Link>
    </article>
  );
}
