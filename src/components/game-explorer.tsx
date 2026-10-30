"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { GameCard } from "@/components/game-card";
import type { Game } from "@/lib/games";

const categoryOrder = [
  "FPS", "MOBA", "Battle Royale", "Action RPG", "Hero Shooter", "Sandbox",
  "Turn-based RPG", "Simulation", "Sports", "MMORPG", "Co-op Shooter", "PC Game",
];

type GameExplorerProps = {
  games: Game[];
  remote?: boolean;
  initialTotal?: number;
  catalogReady?: boolean;
  availableCategories?: string[];
  availablePlatforms?: string[];
};

type CatalogResponse = {
  items: Game[];
  total: number;
  error?: string;
};

export function GameExplorer({
  games,
  remote = false,
  initialTotal,
  catalogReady = true,
  availableCategories,
  availablePlatforms,
}: GameExplorerProps) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Tất cả");
  const [activePlatform, setActivePlatform] = useState("Tất cả nền tảng");
  const [sortBy, setSortBy] = useState<"popular" | "recommended" | "name" | "newest" | "positive">("popular");
  const [remoteItems, setRemoteItems] = useState(games);
  const [total, setTotal] = useState(initialTotal ?? games.length);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState(remote && !catalogReady);
  const [retryKey, setRetryKey] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const firstRequest = useRef(true);

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

  useEffect(() => {
    if (!remote) return;
    if (firstRequest.current) {
      firstRequest.current = false;
      if (catalogReady) return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setLoadError(false);
      const params = new URLSearchParams({ page: "1", limit: "24", sort: sortBy });
      if (query.trim()) params.set("query", query.trim());
      if (activeCategory !== "Tất cả") params.set("category", activeCategory);
      if (activePlatform !== "Tất cả nền tảng") params.set("platform", activePlatform);

      try {
        const response = await fetch("/api/games?" + params.toString(), { signal: controller.signal });
        const payload = await response.json() as CatalogResponse;
        if (!response.ok) throw new Error(payload.error || "Không thể tải kho game.");
        setRemoteItems(payload.items ?? []);
        setTotal(Number(payload.total ?? 0));
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        setLoadError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, query.trim() ? 250 : 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [remote, catalogReady, query, activeCategory, activePlatform, sortBy, retryKey]);

  const categories = useMemo(() => {
    const sourceCategories = remote && availableCategories?.length
      ? availableCategories
      : games.map((game) => game.category);
    const available = new Set(sourceCategories.filter(Boolean));
    const ordered = categoryOrder.filter((category) => available.has(category));
    const remaining = Array.from(available)
      .filter((category) => !categoryOrder.includes(category))
      .sort((a, b) => a.localeCompare(b, "vi"));
    return ["Tất cả", ...ordered, ...remaining];
  }, [availableCategories, games, remote]);

  const platforms = useMemo(() => {
    const sourcePlatforms = remote && availablePlatforms?.length
      ? availablePlatforms
      : games.flatMap((game) => game.platforms);
    return [...new Set(sourcePlatforms.filter(Boolean))].sort((a, b) => a.localeCompare(b, "vi"));
  }, [availablePlatforms, games, remote]);

  const filteredGames = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("vi");
    return games.filter((game) => {
      const matchesCategory = activeCategory === "Tất cả"
        || game.category === activeCategory
        || game.genres.includes(activeCategory);
      const matchesPlatform = activePlatform === "Tất cả nền tảng" || game.platforms.includes(activePlatform);
      const searchable = [game.title, game.category, game.developer, ...game.genres, ...game.platforms]
        .join(" ").toLocaleLowerCase("vi");
      return matchesCategory && matchesPlatform && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [activeCategory, activePlatform, games, query]);

  const sortedLocalGames = useMemo(() => {
    if (sortBy === "name") return [...filteredGames].sort((a, b) => a.title.localeCompare(b.title, "vi"));
    if (sortBy === "newest") return [...filteredGames].sort((a, b) => b.releaseYear - a.releaseYear);
    if (sortBy === "positive") return [...filteredGames].sort((a, b) => {
      const totalA = (a.positiveReviews ?? 0) + (a.negativeReviews ?? 0);
      const totalB = (b.positiveReviews ?? 0) + (b.negativeReviews ?? 0);
      const rateA = totalA > 0 ? (a.positiveReviews ?? 0) / totalA : -1;
      const rateB = totalB > 0 ? (b.positiveReviews ?? 0) / totalB : -1;
      return rateB - rateA || totalB - totalA || (b.positiveReviews ?? 0) - (a.positiveReviews ?? 0);
    });
    if (sortBy === "recommended") return [...filteredGames].sort((a, b) => {
      const score = (game: Game) => {
        const total = (game.positiveReviews ?? 0) + (game.negativeReviews ?? 0);
        const ratio = total > 0 ? (game.positiveReviews ?? 0) / total : 0;
        return ratio * 100 + Math.log10(total + 1) * 5 + Math.log10((game.concurrentPlayers ?? 0) + 1) * 0.5;
      };
      return score(b) - score(a) || a.title.localeCompare(b.title, "vi");
    });
    return filteredGames;
  }, [filteredGames, sortBy]);

  const displayedGames = remote ? remoteItems : sortedLocalGames;
  const resultTotal = remote ? total : sortedLocalGames.length;
  const hasMore = remote && remoteItems.length < total;

  const loadMore = async () => {
    if (!remote || loadingMore || !hasMore) return;
    setLoadingMore(true);
    setLoadError(false);
    const nextPage = Math.floor(remoteItems.length / 24) + 1;
    const params = new URLSearchParams({ page: String(nextPage), limit: "24", sort: sortBy });
    if (query.trim()) params.set("query", query.trim());
    if (activeCategory !== "Tất cả") params.set("category", activeCategory);
    if (activePlatform !== "Tất cả nền tảng") params.set("platform", activePlatform);

    try {
      const response = await fetch("/api/games?" + params.toString());
      const payload = await response.json() as CatalogResponse;
      if (!response.ok) throw new Error(payload.error || "Không thể tải thêm game.");
      setRemoteItems((current) => [...current, ...(payload.items ?? [])]);
      setTotal(Number(payload.total ?? 0));
    } catch {
      setLoadError(true);
    } finally {
      setLoadingMore(false);
    }
  };

  const resetFilters = () => {
    setQuery("");
    setActiveCategory("Tất cả");
    setActivePlatform("Tất cả nền tảng");
    setSortBy("popular");
  };

  return (
    <div className="game-explorer">
      <div className="game-tools">
        <div className="filters" role="group" aria-label="Lọc theo thể loại">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={"filter-btn" + (activeCategory === category ? " active" : "")}
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
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value as "popular" | "recommended" | "name" | "newest" | "positive")} aria-label="Sắp xếp game">
            <option value="popular">{remote ? "Phổ biến (SteamSpy)" : "Nổi bật"}</option>
            <option value="recommended">Đề xuất cộng đồng</option>
            <option value="positive">Tỉ lệ đánh giá tích cực</option>
            <option value="newest">Mới phát hành</option>
            <option value="name">Tên A–Z</option>
          </select>
        </label>
        <button className="discovery-reset" type="button" disabled={!query && activeCategory === "Tất cả" && activePlatform === "Tất cả nền tảng" && sortBy === "popular"} onClick={resetFilters}>
          Đặt lại bộ lọc
        </button>
      </div>

      <p className="results-count" role="status">
        {loading ? "Đang tìm trong kho game..." : "Hiển thị " + displayedGames.length.toLocaleString("vi-VN") + " / " + resultTotal.toLocaleString("vi-VN") + " tựa game"}
      </p>

      {loadError ? (
        <div className="empty-state" role="status">
          <span className="eyebrow">CATALOG / CONNECTION</span>
          <h3>Chưa kết nối được kho game</h3>
          <p>LevelUP không thay dữ liệu thật bằng danh sách mẫu. Hãy thử tải lại sau khi kết nối dữ liệu được khôi phục.</p>
          {remote ? <button className="btn btn-secondary" type="button" onClick={() => { resetFilters(); setRetryKey((value) => value + 1); }}>Thử lại</button> : null}
        </div>
      ) : (
        <>
          <div className="game-grid">
            {displayedGames.map((game, index) => <GameCard key={game.slug} game={game} index={index} />)}
            {!loading && displayedGames.length === 0 ? (
              <div className="empty-state">
                <span className="eyebrow">KHÔNG CÓ KẾT QUẢ</span>
                <h3>Thử một từ khóa khác</h3>
                <p>Không có game phù hợp với điều kiện tìm kiếm hiện tại.</p>
                <button className="btn btn-secondary" type="button" onClick={resetFilters}>Xóa bộ lọc</button>
              </div>
            ) : null}
          </div>
          {hasMore ? (
            <div className="catalog-load-more">
              <button className="btn btn-secondary" type="button" onClick={loadMore} disabled={loadingMore || loading}>
                {loadingMore ? "Đang tải..." : "Tải thêm 24 game"}
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
