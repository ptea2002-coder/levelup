"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GameCard } from "@/components/game-card";
import { useGameLibrary } from "@/components/game-library-provider";
import { isGameLibraryEntryActive } from "@/lib/game-library";
import type { Game } from "@/lib/games";

type DiscoveryMode = "all" | "competitive" | "coop" | "story" | "chill";

type Props = {
  initialGames: Game[];
  initialTotal: number;
  categories: string[];
  platforms: string[];
  catalogReady: boolean;
};

type CatalogResponse = {
  items?: Game[];
  total?: number;
  error?: string;
};

const modes: { id: DiscoveryMode; label: string; description: string }[] = [
  { id: "all", label: "Mở mọi cánh cửa", description: "Cân bằng theo gu và thư viện của bạn" },
  { id: "competitive", label: "Competitive", description: "Đấu hạng, kỹ năng và chiến thuật" },
  { id: "coop", label: "Co-op cùng hội", description: "Chơi cùng bạn bè, phối hợp và sinh tồn" },
  { id: "story", label: "Cốt truyện & khám phá", description: "Thế giới mở, nhập vai và phiêu lưu" },
  { id: "chill", label: "Chill mode", description: "Nhịp chậm, sáng tạo và thư giãn" },
];

export function GameDiscoveryStudio({ initialGames, initialTotal, categories, platforms, catalogReady }: Props) {
  const { library, ready } = useGameLibrary();
  const [query, setQuery] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [platform, setPlatform] = useState("");
  const [mode, setMode] = useState<DiscoveryMode>("all");
  const [games, setGames] = useState(initialGames);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [savedProfileGames, setSavedProfileGames] = useState<Game[]>([]);
  const requestedProfileSlugs = useRef(new Set<string>());
  const [retry, setRetry] = useState(0);

  const activeSavedSlugs = useMemo(
    () => Object.entries(library)
      .filter(([, entry]) => isGameLibraryEntryActive(entry))
      .map(([slug]) => slug),
    [library],
  );

  useEffect(() => {
    if (!ready || activeSavedSlugs.length === 0) {
      setSavedProfileGames([]);
      return;
    }

    let cancelled = false;
    const loadSavedProfile = async () => {
      const knownSlugs = new Set([...games, ...savedProfileGames].map((game) => game.slug));
      const missing = activeSavedSlugs.filter((slug) => !knownSlugs.has(slug) && !requestedProfileSlugs.current.has(slug));
      const chunks: string[][] = [];
      for (let index = 0; index < missing.length; index += 48) chunks.push(missing.slice(index, index + 48));
      if (chunks.length === 0) return;
      for (const slug of missing) requestedProfileSlugs.current.add(slug);

      try {
        const responses = await Promise.all(chunks.map(async (chunk) => {
          const response = await fetch("/api/games?slugs=" + encodeURIComponent(chunk.join(",")), { cache: "no-store" });
          if (!response.ok) throw new Error("Không tải được hồ sơ thư viện");
          const payload = await response.json() as CatalogResponse;
          return payload.items ?? [];
        }));
        if (!cancelled) {
          setSavedProfileGames((current) => {
            const bySlug = new Map(current.map((game) => [game.slug, game] as const));
            for (const game of responses.flat()) bySlug.set(game.slug, game);
            return [...bySlug.values()];
          });
        }
      } catch {
        for (const slug of missing) requestedProfileSlugs.current.delete(slug);
        if (!cancelled) setSavedProfileGames([]);
      }
    };

    void loadSavedProfile();
    return () => { cancelled = true; };
  }, [activeSavedSlugs, games, ready, savedProfileGames]);

  const buildParams = useCallback((nextPage: number) => {
    const params = new URLSearchParams({
      page: String(nextPage),
      limit: "48",
      sort: "recommended",
    });
    const normalizedQuery = query.trim().slice(0, 100);
    if (normalizedQuery) params.set("query", normalizedQuery);
    if (selectedGenres.length > 0) params.set("categories", selectedGenres.join(","));
    if (platform) params.set("platform", platform);
    if (mode !== "all") params.set("mode", mode);
    return params;
  }, [mode, platform, query, selectedGenres]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/games?" + buildParams(1).toString(), {
          signal: controller.signal,
          cache: "no-store",
        });
        const payload = await response.json() as CatalogResponse;
        if (!response.ok) throw new Error(payload.error || "Không thể tải kho game.");
        setGames(payload.items ?? []);
        setTotal(Number(payload.total ?? 0));
        setPage(1);
      } catch (cause) {
        if (cause instanceof Error && cause.name === "AbortError") return;
        setError(cause instanceof Error ? cause.message : "Không thể tải kho game.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, query.trim() ? 250 : 0);

    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [buildParams, retry]);

  const savedProfile = useMemo(() => {
    const bySlug = new Map<string, Game>();
    for (const game of [...games, ...savedProfileGames]) {
      if (activeSavedSlugs.includes(game.slug)) bySlug.set(game.slug, game);
    }
    return [...bySlug.values()];
  }, [activeSavedSlugs, games, savedProfileGames]);

  const preferredGenreWeights = useMemo(() => {
    const weights = new Map<string, number>();
    for (const game of savedProfile) {
      const entry = library[game.slug];
      const weight = entry?.isFavorite ? 3 : entry?.status === "playing" ? 2 : 1;
      for (const genre of new Set([game.category, ...game.genres].filter(Boolean))) {
        weights.set(genre, (weights.get(genre) ?? 0) + weight);
      }
    }
    return weights;
  }, [library, savedProfile]);

  const preferredGenres = useMemo(
    () => [...preferredGenreWeights.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([genre]) => genre),
    [preferredGenreWeights],
  );

  const recommendations = useMemo(() => {
    const activeMode = modes.find((item) => item.id === mode) ?? modes[0];
    return games
      .filter((game) => !activeSavedSlugs.includes(game.slug))
      .map((game) => {
        const gameGenres = new Set([game.category, ...game.genres]);
        const shared = preferredGenres.filter((genre) => gameGenres.has(genre));
        const explicitMatches = selectedGenres.filter((genre) => gameGenres.has(genre));
        const platformMatch = Boolean(platform && game.platforms.includes(platform));
        const positive = game.positiveReviews ?? 0;
        const reviewTotal = positive + (game.negativeReviews ?? 0);
        // A 5,000-review prior prevents tiny perfect samples from dominating mature titles.
        const bayesianReview = (positive + 5000 * 0.75) / (reviewTotal + 5000);
        const score = shared.reduce((sum, genre) => sum + (preferredGenreWeights.get(genre) ?? 1), 0)
          + explicitMatches.length * 12
          + (platformMatch ? 3 : 0)
          + (mode !== "all" ? 8 : 0)
          // Keep the smoothed review signal dominant so client-side personalization
          // cannot undo the database's safer ranking for low-volume games.
          + bayesianReview * 100
          + Math.log10(reviewTotal + 1) * 0.01
          + Math.log10((game.concurrentPlayers ?? 0) + 1) * 0.005;
        const reasons: string[] = [];
        if (explicitMatches.length) reasons.push("Khớp thể loại đã chọn");
        if (shared.length) reasons.push("Gần với game bạn lưu");
        if (platformMatch) reasons.push("Đúng nền tảng");
        if (mode !== "all") reasons.push(activeMode.label);
        if (reasons.length === 0) reasons.push("Khám phá thêm một phong cách mới");
        return { game, score, reasons: reasons.slice(0, 3) };
      })
      .sort((a, b) => b.score - a.score || a.game.title.localeCompare(b.game.title, "vi"));
  }, [activeSavedSlugs, games, library, mode, platform, preferredGenreWeights, preferredGenres, selectedGenres]);

  const loadMore = async () => {
    if (loadingMore || loading || games.length >= total) return;
    setLoadingMore(true);
    setError("");
    try {
      const response = await fetch("/api/games?" + buildParams(page + 1).toString(), { cache: "no-store" });
      const payload = await response.json() as CatalogResponse;
      if (!response.ok) throw new Error(payload.error || "Không thể tải thêm game.");
      const incoming = payload.items ?? [];
      setGames((current) => {
        const bySlug = new Map(current.map((game) => [game.slug, game] as const));
        for (const game of incoming) bySlug.set(game.slug, game);
        return [...bySlug.values()];
      });
      setPage((current) => current + 1);
      setTotal(Number(payload.total ?? total));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể tải thêm game.");
    } finally {
      setLoadingMore(false);
    }
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres((current) => current.includes(genre) ? current.filter((item) => item !== genre) : [...current, genre]);
  };

  const reset = () => {
    setQuery("");
    setSelectedGenres([]);
    setPlatform("");
    setMode("all");
    setRetry((value) => value + 1);
  };

  const activeMode = modes.find((item) => item.id === mode) ?? modes[0];

  return (
    <div className="discovery-studio">
      <section className="discovery-control-panel" aria-labelledby="discovery-controls-title">
        <div className="discovery-panel-head">
          <div>
            <p className="eyebrow">PLAYER SIGNALS / 01</p>
            <h2 id="discovery-controls-title">BẬT RADAR.<br /><span>TÌM GAME HỢP GU.</span></h2>
          </div>
          <span className="discovery-live-tag"><i aria-hidden="true" /> {ready ? "ĐÃ ĐỌC GAME LOCKER" : "ĐANG KẾT NỐI THƯ VIỆN"}</span>
        </div>
        <label className="discovery-search">
          <span>01 / TÌM THEO TÊN, STUDIO HOẶC TỪ KHÓA</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ví dụ: soulslike, HoYoverse, open world..." maxLength={100} />
          <kbd>/</kbd>
        </label>
        <div className="discovery-control-group">
          <div className="discovery-label-row"><span>02 / THỂ LOẠI ƯU TIÊN</span><small>{selectedGenres.length ? selectedGenres.length + " đã chọn" : "Chọn một hoặc nhiều"}</small></div>
          <div className="discovery-chip-list">
            {categories.map((category) => (
              <button type="button" key={category} className={selectedGenres.includes(category) ? "discovery-chip is-selected" : "discovery-chip"} aria-pressed={selectedGenres.includes(category)} onClick={() => toggleGenre(category)}>{category}</button>
            ))}
          </div>
        </div>
        <div className="discovery-control-group">
          <label className="discovery-label-row" htmlFor="discovery-platform"><span>03 / NỀN TẢNG</span></label>
          <select id="discovery-platform" value={platform} onChange={(event) => setPlatform(event.target.value)}>
            <option value="">Tất cả nền tảng</option>
            {platforms.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
        <div className="discovery-mode-group">
          <div className="discovery-label-row"><span>04 / CHỌN TÂM TRẠNG</span><small>Không cần tài khoản</small></div>
          <div className="discovery-mode-grid">
            {modes.map((item) => (
              <button type="button" key={item.id} className={mode === item.id ? "discovery-mode is-selected" : "discovery-mode"} aria-pressed={mode === item.id} onClick={() => setMode(item.id)}>
                <span>{item.label}</span><small>{item.description}</small>
              </button>
            ))}
          </div>
        </div>
        <div className="discovery-panel-footer">
          <p>Gợi ý dựa trên thể loại, nền tảng và Game Locker trên thiết bị/tài khoản này. Không dùng dữ liệu phần cứng hay suy đoán FPS.</p>
          <button className="btn btn-secondary" type="button" onClick={reset}>Đặt lại radar ↺</button>
        </div>
      </section>

      <section className="discovery-results" aria-labelledby="discovery-results-title">
        <div className="discovery-results-head">
          <div>
            <p className="eyebrow">SIGNAL LOCK / 02</p>
            <h2 id="discovery-results-title">CÁC TÍN HIỆU<br /><span>ĐÁNG THEO ĐUỔI.</span></h2>
            <p>{activeMode.description}{preferredGenres.length ? " · Hồ sơ gu đã nhận diện: " + preferredGenres.slice(0, 3).join(", ") + "." : " · Lưu vài game để gợi ý cá nhân hóa hơn."}</p>
          </div>
          <div className="discovery-result-counter"><strong>{loading ? "…" : recommendations.length}</strong><span>GỢI Ý ĐANG KHỚP</span></div>
        </div>
        {loading ? <p className="discovery-status" role="status">Đang quét kho game và tính điểm phù hợp…</p> : null}
        {error ? <div className="empty-state" role="status"><h3>Radar bị gián đoạn.</h3><p>{error}</p><button className="btn btn-secondary" type="button" onClick={() => setRetry((value) => value + 1)}>Thử lại</button></div> : null}
        {!catalogReady && !loading && !error ? <div className="empty-state" role="status"><h3>Kho game chưa sẵn sàng.</h3><p>LevelUP không thay dữ liệu catalog thực bằng danh sách mẫu.</p></div> : null}
        {!loading && !error && recommendations.length === 0 ? <div className="empty-state"><h3>Chưa bắt được tín hiệu phù hợp.</h3><p>Thử bỏ bớt thể loại hoặc chọn tâm trạng khác để mở rộng kết quả.</p><button className="btn btn-secondary" type="button" onClick={reset}>Mở rộng tìm kiếm</button></div> : null}
        {!loading && !error ? (
          <div className="discovery-result-grid">
            {recommendations.slice(0, 12).map(({ game, reasons }, index) => (
              <div className="discovery-recommendation" key={game.slug}>
                <div className="discovery-reason-row"><span>FIT / {String(index + 1).padStart(2, "0")}</span><div>{reasons.map((reason) => <span key={reason}>{reason}</span>)}</div></div>
                <GameCard game={game} index={index} />
              </div>
            ))}
          </div>
        ) : null}
        {!loading && !error && games.length < total ? (
          <div className="catalog-load-more"><button className="btn btn-secondary" type="button" onClick={loadMore} disabled={loadingMore}>{loadingMore ? "Đang quét thêm..." : "Quét thêm 48 game · " + Math.min(total - games.length, 48).toLocaleString("vi-VN")}</button></div>
        ) : null}
        <p className="discovery-footnote">Điểm phù hợp là gợi ý heuristic dựa trên metadata hiện có, không phải đánh giá chất lượng tuyệt đối. Các chỉ số SteamSpy là ước tính được đồng bộ định kỳ.</p>
      </section>
    </div>
  );
}
