"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { GameArtwork } from "@/components/game-artwork";
import { HeroAtmosphere } from "@/components/hero-atmosphere";
import type { Game } from "@/lib/games";

const FEATURED_ORDER = [
  "valorant",
  "league-of-legends",
  "counter-strike-2",
  "apex-legends",
  "genshin-impact",
  "elden-ring",
];

function KineticLine({
  text,
  className = "",
  lineIndex,
}: {
  text: string;
  className?: string;
  lineIndex: number;
}) {
  return (
    <span className={`hero-title-line cinematic-title-line ${className}`} aria-hidden="true">
      {Array.from(text).map((character, index) => (
        <span
          className="hero-title-char"
          key={`${index}-${character}`}
          style={{
            "--char-index": index,
            "--line-delay": `${lineIndex * 135}ms`,
          } as CSSProperties}
        >
          {character === " " ? "\u00a0" : character}
        </span>
      ))}
    </span>
  );
}

type HeroExperienceProps = {
  games: Game[];
  articleCount: number;
  gameCount?: number;
};

export function HeroExperience({ games, articleCount, gameCount = games.length }: HeroExperienceProps) {
  const curatedGames = useMemo(() => {
    const curated = games
      .filter((game) => FEATURED_ORDER.includes(game.slug))
      .sort((a, b) => FEATURED_ORDER.indexOf(a.slug) - FEATURED_ORDER.indexOf(b.slug));
    return curated.length ? curated : games.slice(0, 6);
  }, [games]);

  const [activeSlug, setActiveSlug] = useState(
    () => games.find((game) => game.slug === "elden-ring")?.slug ?? games[0]?.slug ?? "",
  );
  const activeGame = curatedGames.find((game) => game.slug === activeSlug) ?? curatedGames[0];

  useEffect(() => {
    let frame = 0;

    const updateProgress = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
        document.documentElement.style.setProperty("--page-progress", String(Math.min(1, Math.max(0, progress))));
      });
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress, { passive: true });
    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
      if (frame) window.cancelAnimationFrame(frame);
      document.documentElement.style.removeProperty("--page-progress");
    };
  }, []);

  const handleHeroPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    event.currentTarget.style.setProperty("--hero-pointer-x", `${(x * 100).toFixed(1)}%`);
    event.currentTarget.style.setProperty("--hero-pointer-y", `${(y * 100).toFixed(1)}%`);
    event.currentTarget.classList.add("is-pointer-active");
  };

  const resetHeroPointer = (event: ReactPointerEvent<HTMLElement>) => {
    event.currentTarget.classList.remove("is-pointer-active");
  };

  const handleStagePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    event.currentTarget.style.setProperty("--stage-spot-x", `${(x * 100).toFixed(1)}%`);
    event.currentTarget.style.setProperty("--stage-spot-y", `${(y * 100).toFixed(1)}%`);
    event.currentTarget.style.setProperty("--stage-rotate-x", `${((0.5 - y) * 3.2).toFixed(2)}deg`);
    event.currentTarget.style.setProperty("--stage-rotate-y", `${((x - 0.5) * 4.2).toFixed(2)}deg`);
    event.currentTarget.style.setProperty("--stage-image-x", `${((0.5 - x) * 8).toFixed(2)}px`);
    event.currentTarget.style.setProperty("--stage-image-y", `${((0.5 - y) * 8).toFixed(2)}px`);
    event.currentTarget.classList.add("is-live");
  };

  const resetStagePointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.style.setProperty("--stage-rotate-x", "0deg");
    event.currentTarget.style.setProperty("--stage-rotate-y", "0deg");
    event.currentTarget.style.setProperty("--stage-image-x", "0px");
    event.currentTarget.style.setProperty("--stage-image-y", "0px");
    event.currentTarget.classList.remove("is-live");
  };

  if (!activeGame) return null;

  const terminalLines = [
    { text: "$ levelup --boot --mode=discovery", tone: "command" },
    { text: "[OK] discovery.core loaded", tone: "result" },
    { text: `[OK] featured-set: ${String(curatedGames.length).padStart(2, "0")}`, tone: "result" },
    { text: `[LIVE] target: ${activeGame.slug}`, tone: "live" },
  ];

  return (
    <>
      <div className="levelup-scroll-progress" aria-hidden="true"><span /></div>
      <section className="hero hero-cinematic" aria-labelledby="levelup-hero-title" onPointerMove={handleHeroPointerMove} onPointerLeave={resetHeroPointer}>
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-cinematic-cursor-glow" aria-hidden="true" />
        <div className="hero-cinematic-noise" aria-hidden="true" />
        <div className="container hero-cinematic-layout">
          <div className="hero-cinematic-copy">
            <p className="hero-cinematic-kicker">
              <span className="hero-cinematic-live-dot" />
              LEVELUP / GAMING INTELLIGENCE
              <span className="hero-cinematic-kicker-id">BUILD_02.0</span>
            </p>
            <h1 id="levelup-hero-title" className="hero-cinematic-title" aria-label="PLAY HARD. LEVEL UP.">
              <KineticLine text="PLAY" lineIndex={0} />
              <KineticLine text="HARD." className="cinematic-outline" lineIndex={1} />
              <KineticLine text="LEVEL UP." className="cinematic-accent" lineIndex={2} />
            </h1>
            <p className="hero-cinematic-description">
              Không chỉ tìm một tựa game. Tìm <strong>thế giới tiếp theo</strong> khiến bạn muốn ở lại —
              từ lựa chọn đúng gu, dữ liệu thực tế đến những người đồng đội cùng tần số.
            </p>
            <div className="hero-cinematic-actions">
              <Link className="hero-launch-button" href={`/games/${activeGame.slug}`}>
                <span className="hero-launch-icon" aria-hidden="true">↗</span>
                <span><small>YOUR NEXT MAIN</small><strong>Khám phá {activeGame.title}</strong></span>
              </Link>
              <Link className="hero-index-link" href="/games">
                <span className="hero-index-link-icon" aria-hidden="true">⌘</span>
                Mở toàn bộ thư viện
              </Link>
              <Link className="hero-index-link hero-community-link" href="/community">
                <span className="hero-index-link-icon" aria-hidden="true">⌁</span>
                Vào cộng đồng
              </Link>
            </div>
            <div className="hero-cinematic-stats" aria-label="Tổng quan LevelUP">
              <div className="hero-cinematic-stat">
                <span className="hero-stat-label">GAME DATABASE</span>
                <strong>{gameCount > 0 ? gameCount.toLocaleString("vi-VN") : "—"}</strong>
                <span className="hero-stat-foot">Tựa game trong kho dữ liệu</span>
              </div>
              <div className="hero-cinematic-stat">
                <span className="hero-stat-label">FIELD NOTES</span>
                <strong>{String(articleCount).padStart(2, "0")}</strong>
                <span className="hero-stat-foot">Guide & góc nhìn</span>
              </div>
              <div className="hero-cinematic-stat">
                <span className="hero-stat-label">SYSTEM</span>
                <strong className="hero-stat-ready">ONLINE<span>_</span></strong>
                <span className="hero-stat-foot">Feed / Squad / Player ID</span>
              </div>
            </div>
            <div className="hero-cinematic-scroll-hint">
              <span className="hero-scroll-line" aria-hidden="true" />
              <span>SCROLL TO EXPLORE</span>
              <span className="hero-scroll-coordinates">VIETNAM / UTC+7</span>
            </div>
          </div>

          <div className="hero-cinematic-visual">
            <div className="hero-cinematic-aura aura-lime" aria-hidden="true" />
            <div className="hero-cinematic-aura aura-violet" aria-hidden="true" />
            <div
              className="hero-cinematic-stage"
              onPointerMove={handleStagePointerMove}
              onPointerLeave={resetStagePointer}
              style={{
                "--stage-spot-x": "50%",
                "--stage-spot-y": "50%",
                "--stage-rotate-x": "0deg",
                "--stage-rotate-y": "0deg",
                "--stage-image-x": "0px",
                "--stage-image-y": "0px",
              } as CSSProperties}
            >
              <div className="hero-cinematic-art" key={activeGame.slug}>
                <GameArtwork
                  slug={activeGame.slug}
                  mark={activeGame.mark}
                  category={activeGame.category}
                  releaseYear={activeGame.releaseYear}
                  artPrimary={activeGame.artPrimary}
                  artSecondary={activeGame.artSecondary}
                  variant="cinematic"
                />
              </div>
              <div className="hero-cinematic-vignette" aria-hidden="true" />
              <div className="hero-cinematic-grain" aria-hidden="true" />
              <div className="hero-stage-spotlight" aria-hidden="true" />
              <HeroAtmosphere />
              <div className="hero-stage-topbar">
                <span><i /> FEATURED SIGNAL / 00{Math.max(1, curatedGames.findIndex((game) => game.slug === activeGame.slug) + 1)}</span>
                <span className="hero-stage-live">LIVE SELECT</span>
              </div>
              <div className="hero-code-terminal" key={`terminal-${activeGame.slug}`} aria-hidden="true">
                <div className="hero-code-terminal-head">
                  <span className="hero-code-terminal-lights"><i /><i /><i /></span>
                  <span className="hero-code-terminal-title">LVLUP:// TERMINAL</span>
                  <span className="hero-code-terminal-mode">TRACE_02</span>
                </div>
                <div className="hero-code-terminal-lines">
                  {terminalLines.map((line, index) => {
                    const terminalLength = line.text.length + (line.tone === "live" ? 1 : 0);
                    return (
                      <span
                        className={`hero-code-line hero-code-line-${line.tone}`}
                        key={line.text}
                        style={{
                          "--terminal-delay": `${260 + index * 205}ms`,
                          "--terminal-width": `${terminalLength}ch`,
                          "--terminal-steps": terminalLength,
                        } as CSSProperties}
                      >
                        {line.text}
                      </span>
                    );
                  })}
                </div>
                <div className="hero-code-terminal-footer">
                  <span>SELECTION / SYNCED</span>
                  <span>REGION <b>VN · UTC+7</b></span>
                </div>
              </div>
              <div className="hero-stage-crosshair" aria-hidden="true"><i /><i /><i /><i /></div>
              <div className="hero-stage-copy" key={`${activeGame.slug}-copy`}>
                <span className="hero-stage-eyebrow">{activeGame.category} <i /> {activeGame.releaseYear}</span>
                <h2>{activeGame.title}</h2>
                <p>{activeGame.description}</p>
                <Link href={`/games/${activeGame.slug}`} className="hero-stage-explore">
                  OPEN GAME DOSSIER <span aria-hidden="true">↗</span>
                </Link>
              </div>
              <div className="hero-stage-sidecode" aria-hidden="true">
                <span>LVLUP</span><span>DISCOVERY ENGINE</span><span>001 / {activeGame.slug.toUpperCase()}</span>
              </div>
              <div className="hero-stage-bottomline">
                <span>ARTIFACT / {activeGame.mark}</span>
                <span>RENDER STATUS <b>STABLE</b></span>
                <span>↗</span>
              </div>
            </div>

            <div className="hero-game-dock">
              <div className="hero-game-dock-heading">
                <span><i /> CHOOSE YOUR NEXT WORLD</span>
                <span>{String(curatedGames.length).padStart(2, "0")} AVAILABLE</span>
              </div>
              <div className="hero-game-dock-grid" role="group" aria-label="Chọn game nổi bật">
                {curatedGames.slice(0, 6).map((game, index) => (
                  <button
                    className={`hero-game-selector${game.slug === activeGame.slug ? " is-active" : ""}`}
                    type="button"
                    key={game.slug}
                    onClick={() => setActiveSlug(game.slug)}
                    aria-pressed={game.slug === activeGame.slug}
                    aria-label={`Chọn ${game.title}, thể loại ${game.category}`}
                    style={{
                      "--selector-accent": game.artPrimary,
                      "--selector-shadow": game.artSecondary,
                    } as CSSProperties}
                  >
                    <span className="hero-selector-index">{String(index + 1).padStart(2, "0")}</span>
                    <span className="hero-selector-mark">{game.mark}</span>
                    <span className="hero-selector-name">{game.title}</span>
                    <span className="hero-selector-category">{game.category}</span>
                    <span className="hero-selector-indicator" aria-hidden="true">↗</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="hero-visual-footnote"><span>FIG.01</span> THE NEXT LEVEL STARTS HERE <span>EST. PLAYER EXPERIENCE</span></div>
          </div>
        </div>
      </section>
    </>
  );
}
