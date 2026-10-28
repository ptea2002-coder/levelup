import Link from "next/link";
import type { Game } from "@/lib/games";
import { GameArtwork } from "@/components/game-artwork";

type GameCardProps = {
  game: Game;
  index?: number;
};

export function GameCard({ game, index }: GameCardProps) {
  return (
    <article className="game-card">
      <Link href={`/games/${game.slug}`} className="game-card-link" aria-label={`Xem thông tin ${game.title}`}>
        <GameArtwork
          slug={game.slug}
          mark={game.mark}
          category={game.category}
          releaseYear={game.releaseYear}
          artPrimary={game.artPrimary}
          artSecondary={game.artSecondary}
          index={index}
        />
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
