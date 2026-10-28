"use client";

import { useMemo, useState } from "react";
import { GameCard } from "@/components/game-card";
import type { Game } from "@/lib/games";

const categoryOrder = ["FPS", "MOBA", "Battle Royale", "Action RPG", "Hero Shooter", "Sandbox", "Turn-based RPG", "Simulation", "Sports", "MMORPG", "Co-op Shooter"];

type GameExplorerProps = {
  games: Game[];
};

export function GameExplorer({ games }: GameExplorerProps) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Tất cả");
  const categories = useMemo(() => {
    const available = new Set(games.map((game) => game.category));
    const ordered = categoryOrder.filter((category) => available.has(category));
    const remaining = Array.from(available)
      .filter((category) => !categoryOrder.includes(category))
      .sort((a, b) => a.localeCompare(b, "vi"));
    return ["Tất cả", ...ordered, ...remaining];
  }, [games]);

  const filteredGames = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("vi");
    return games.filter((game) => {
      const matchesCategory =
        activeCategory === "Tất cả" ||
        game.category === activeCategory ||
        game.genres.includes(activeCategory);
      const searchable = [
        game.title,
        game.category,
        game.developer,
        ...game.genres,
        ...game.platforms,
      ].join(" ").toLocaleLowerCase("vi");
      return matchesCategory && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [activeCategory, games, query]);

  return (
    <div className="game-explorer">
      <div className="game-tools">
        <div className="filters" aria-label="Lọc theo thể loại">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={`filter-btn${activeCategory === category ? " active" : ""}`}
              aria-pressed={activeCategory === category}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
        <label className="search-box">
          <span aria-hidden="true">⌕</span>
          <span className="sr-only">Tìm game</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm game, thể loại, studio..."
          />
          <kbd>/</kbd>
        </label>
      </div>

      <p className="results-count" role="status">
        {filteredGames.length} tựa game phù hợp
      </p>

      <div className="game-grid">
        {filteredGames.map((game) => (
          <GameCard key={game.slug} game={game} index={games.findIndex((item) => item.slug === game.slug)} />
        ))}
        {filteredGames.length === 0 && (
          <div className="empty-state">
            <span className="eyebrow">KHÔNG CÓ KẾT QUẢ</span>
            <h3>Thử một từ khóa khác</h3>
            <p>Thư viện hiện tại là bộ sưu tập khởi đầu; dữ liệu sẽ được mở rộng trong các giai đoạn tiếp theo.</p>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => { setQuery(""); setActiveCategory("Tất cả"); }}
            >
              Xóa bộ lọc
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
