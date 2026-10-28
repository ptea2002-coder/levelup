"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { GameCard } from "@/components/game-card";
import type { Game } from "@/lib/games";

const categoryOrder = ["FPS", "MOBA", "Battle Royale", "Action RPG", "Hero Shooter", "Sandbox", "Turn-based RPG", "Simulation", "Sports", "MMORPG", "Co-op Shooter"];

type GameExplorerProps = {
  games: Game[];
};

export function GameExplorer({ games }: GameExplorerProps) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Tất cả");
  const [activePlatform, setActivePlatform] = useState("Tất cả nền tảng");
  const [sortBy, setSortBy] = useState<"recommended" | "name" | "newest">("recommended");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const target = event.target;
      const isTyping = target instanceof HTMLElement && (
        target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
      );

      if (event.key === "/" && !event.altKey && !event.ctrlKey && !event.metaKey && !isTyping) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }

      if (event.key === "Escape" && document.activeElement === searchInputRef.current) {
        setQuery("");
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  const categories = useMemo(() => {
    const available = new Set(games.map((game) => game.category));
    const ordered = categoryOrder.filter((category) => available.has(category));
    const remaining = Array.from(available)
      .filter((category) => !categoryOrder.includes(category))
      .sort((a, b) => a.localeCompare(b, "vi"));
    return ["Tất cả", ...ordered, ...remaining];
  }, [games]);

  const platforms = useMemo(
    () => Array.from(new Set(games.flatMap((game) => game.platforms))).sort((a, b) => a.localeCompare(b, "vi")),
    [games],
  );

  const filteredGames = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("vi");
    return games.filter((game) => {
      const matchesCategory =
        activeCategory === "Tất cả" ||
        game.category === activeCategory ||
        game.genres.includes(activeCategory);
      const matchesPlatform = activePlatform === "Tất cả nền tảng" || game.platforms.includes(activePlatform);
      const searchable = [
        game.title,
        game.category,
        game.developer,
        ...game.genres,
        ...game.platforms,
      ].join(" ").toLocaleLowerCase("vi");
      return matchesCategory && matchesPlatform && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [activeCategory, activePlatform, games, query]);

  const sortedGames = useMemo(() => {
    if (sortBy === "name") return [...filteredGames].sort((a, b) => a.title.localeCompare(b.title, "vi"));
    if (sortBy === "newest") {
      return [...filteredGames].sort((a, b) => b.releaseYear - a.releaseYear || a.title.localeCompare(b.title, "vi"));
    }
    return filteredGames;
  }, [filteredGames, sortBy]);

  return (
    <div className="game-explorer">
      <div className="game-tools">
        <div className="filters" role="group" aria-label="Lọc theo thể loại">
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
            ref={searchInputRef}
            type="search"
            aria-keyshortcuts="/"
            autoComplete="off"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm game, thể loại, studio..."
          />
          <kbd aria-hidden="true">/</kbd>
        </label>
      </div>

      <div className="discovery-extra-filters">
        <label className="discovery-select">
          <span>Nền tảng</span>
          <select value={activePlatform} onChange={(event) => setActivePlatform(event.target.value)} aria-label="Lọc theo nền tảng">
            <option value="Tất cả nền tảng">Tất cả nền tảng</option>
            {platforms.map((platform) => <option key={platform} value={platform}>{platform}</option>)}
          </select>
        </label>
        <label className="discovery-select">
          <span>Sắp xếp</span>
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value as "recommended" | "name" | "newest")} aria-label="Sắp xếp game">
            <option value="recommended">Thứ tự gợi ý</option>
            <option value="newest">Mới phát hành</option>
            <option value="name">Tên A–Z</option>
          </select>
        </label>
        <button
          className="discovery-reset"
          type="button"
          disabled={!query && activeCategory === "Tất cả" && activePlatform === "Tất cả nền tảng" && sortBy === "recommended"}
          onClick={() => { setQuery(""); setActiveCategory("Tất cả"); setActivePlatform("Tất cả nền tảng"); setSortBy("recommended"); }}
        >
          Đặt lại bộ lọc
        </button>
      </div>

      <p className="results-count" role="status">
        {sortedGames.length} tựa game phù hợp
      </p>

      <div className="game-grid">
        {sortedGames.map((game) => (
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
              onClick={() => { setQuery(""); setActiveCategory("Tất cả"); setActivePlatform("Tất cả nền tảng"); setSortBy("recommended"); }}
            >
              Xóa bộ lọc
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
