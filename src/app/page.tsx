import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { GameArtwork } from "@/components/game-artwork";
import { GameExplorer } from "@/components/game-explorer";
import { GamerCommandCenter } from "@/components/gamer-command-center";
import { SteamLiveMetrics } from "@/components/steam-live-metrics";
import { articles } from "@/lib/articles";
import { getGames } from "@/lib/game-repository";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export const dynamic = "force-dynamic";

function KineticTitleLine({ text, className = "" }: { text: string; className?: string }) {
  return (
    <span className={`hero-title-line ${className}`} aria-hidden="true">
      {Array.from(text).map((character, index) => (
        <span
          className="hero-title-char"
          key={`${index}-${character}`}
          style={{ "--char-index": index } as CSSProperties}
        >
          {character === " " ? "\u00a0" : character}
        </span>
      ))}
    </span>
  );
}

export default async function HomePage() {
  const games = await getGames();
  const featuredSlugs = ["valorant", "league-of-legends", "counter-strike-2", "apex-legends", "genshin-impact", "elden-ring"];
  const featuredGames = games
    .filter((game) => featuredSlugs.includes(game.slug))
    .sort((a, b) => featuredSlugs.indexOf(a.slug) - featuredSlugs.indexOf(b.slug));
  const heroGame = games.find((game) => game.slug === "elden-ring") ?? featuredGames[0] ?? games[0];

  return (
    <main>
      <section className="hero">
        <div className="hero-grid" aria-hidden="true" />
        <div className="container hero-layout">
          <div className="hero-copy">
            <p className="eyebrow"><span className="status-dot" /> GAMING CULTURE / VIETNAM</p>
            <h1 aria-label="PLAY HARD. LEVEL UP."><KineticTitleLine text="PLAY" /><KineticTitleLine text="HARD." className="outline" /><KineticTitleLine text="LEVEL UP." className="accent" /></h1>
            <p className="hero-description">
              Không chỉ tìm game để chơi. Tìm tựa game hợp gu, học cách chơi tốt hơn và khám phá thế giới gaming theo cách của bạn.
            </p>
            <div className="hero-actions">
              <Link className="btn btn-primary" href="/games">Khám phá thư viện <span aria-hidden="true">↗</span></Link>
              <Link className="btn btn-secondary" href="/news">Đọc hướng dẫn <span aria-hidden="true">→</span></Link>
            </div>
            <div className="hero-stats">
              <div><strong>{String(games.length).padStart(2, "0")}</strong><span>Game trong thư viện</span></div>
              <div><strong>03</strong><span>Guide biên soạn</span></div>
              <div><strong>V2.0</strong><span>Nền tảng mới</span></div>
            </div>
          </div>

          <div className="hero-visual" aria-label="Minh họa giao diện LevelUP">
            <div className="hero-orbit orbit-one" aria-hidden="true" />
            <div className="hero-orbit orbit-two" aria-hidden="true" />
            <div className="hero-panel">
              <div className="panel-topline"><span>LEVELUP / DISCOVERY SYSTEM</span><span>SYS.ONLINE</span></div>
              <div className="hero-panel-art hero-featured-art">
                {heroGame ? (
                  <GameArtwork
                    slug={heroGame.slug}
                    mark={heroGame.mark}
                    category={heroGame.category}
                    releaseYear={heroGame.releaseYear}
                    artPrimary={heroGame.artPrimary}
                    artSecondary={heroGame.artSecondary}
                    variant="detail"
                  />
                ) : null}
                <div className="hero-art-scrim" aria-hidden="true" />
                <span className="hero-art-grid" aria-hidden="true" />
                <span className="hero-panel-label">LEVELUP / FEATURED PICK</span>
                <div className="hero-featured-title">
                  <span>{heroGame ? `${heroGame.category} / ${heroGame.releaseYear}` : "GAME DISCOVERY"}</span>
                  <strong>{heroGame?.title ?? "YOUR NEXT MAIN"}</strong>
                  <span className="hero-featured-cta">EXPLORE THE GAMEVERSE <i aria-hidden="true">↗</i></span>
                </div>
                <span className="hero-panel-coordinate">LEVELUP / SELECTED 001</span>
                <span className="hero-art-scanline" aria-hidden="true" />
              </div>
              <div className="panel-bottomline">
                <div><span className="tiny-label">MODE</span><strong>DISCOVER</strong></div>
                <div><span className="tiny-label">STATUS</span><strong className="text-lime">READY_</strong></div>
                <span className="panel-arrow" aria-hidden="true">↗</span>
              </div>
            </div>
            <div className="floating-chip chip-top"><span className="chip-dot" /> CURATED GAME LIBRARY <strong>{String(games.length).padStart(2, "0")} TITLES</strong></div>
            <div className="floating-chip chip-bottom"><span className="chip-number">01</span><span>EDITOR’S<br />PICK</span></div>
            <span className="visual-rail">DISCOVERY / CULTURE / COMMUNITY</span>
          </div>
        </div>
      </section>

      <div className="ticker" aria-label="Các chủ đề của LevelUP">
        <div className="ticker-track">
          <div className="ticker-group">
            <span>GAME DISCOVERY <b>✳</b></span>
            <span>PLAYER CULTURE <b>✳</b></span>
            <span>GUIDES & REVIEWS <b>✳</b></span>
            <span>COMMUNITY FIRST <b>✳</b></span>
          </div>
          <div className="ticker-group" aria-hidden="true">
            <span>GAME DISCOVERY <b>✳</b></span>
            <span>PLAYER CULTURE <b>✳</b></span>
            <span>GUIDES & REVIEWS <b>✳</b></span>
            <span>COMMUNITY FIRST <b>✳</b></span>
          </div>
        </div>
      </div>

      <GamerCommandCenter games={games} />

      <section className="section" id="games">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow">01 / GAME LIBRARY</p>
              <h2>TÌM GAME.<br /><span>ĐÚNG GU.</span></h2>
            </div>
            <div className="section-aside">
              <p>Khám phá các tựa game nổi bật. Tìm theo tên, studio hoặc thể loại rồi mở trang riêng của từng game.</p>
              <Link className="text-link" href="/games">Toàn bộ thư viện <span aria-hidden="true">↗</span></Link>
            </div>
          </div>
          <GameExplorer games={featuredGames} />
        </div>
      </section>

      <section className="section steam-live-section" id="steam-live">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow">02 / STEAM LIVE DATA</p>
              <h2>ĐANG CHƠI.<br /><span>NGAY LÚC NÀY.</span></h2>
            </div>
            <div className="section-aside">
              <p>Số người chơi và giá khu vực Việt Nam được cache trên Supabase để tải nhanh, rồi tự cập nhật khi dữ liệu mới về.</p>
              <a className="text-link" href="https://store.steampowered.com/" target="_blank" rel="noopener noreferrer">Nguồn dữ liệu: Steam <span aria-hidden="true">↗</span></a>
            </div>
          </div>
          <SteamLiveMetrics games={games.map((game) => ({ slug: game.slug, title: game.title, category: game.category }))} />
        </div>
      </section>

      <section className="section section-muted" id="guides">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow">03 / KNOW YOUR GAME</p>
              <h2>CHƠI HAY HƠN.<br /><span>HIỂU SÂU HƠN.</span></h2>
            </div>
            <div className="section-aside">
              <p>Hướng dẫn thực tế được biên soạn để giúp game thủ chọn game, cải thiện trải nghiệm và chia sẻ quan điểm có ích.</p>
              <Link className="text-link" href="/news">Xem mọi hướng dẫn <span aria-hidden="true">↗</span></Link>
            </div>
          </div>
          <div className="article-grid">
            {articles.map((article, index) => (
              <Link className="article-card" href={`/news/${article.slug}`} key={article.slug}>
                <div className={`article-art article-art-${index + 1}`}>
                  <span className="article-number">0{index + 1}</span>
                  <span className="article-art-word">{index === 0 ? "BUILD" : index === 1 ? "BOOST" : "REVIEW"}</span>
                  <span className="article-open" aria-hidden="true">↗</span>
                </div>
                <div className="article-card-body">
                  <div className="article-meta"><span>{article.category}</span><span>{article.readingTime}</span></div>
                  <h3>{article.title}</h3>
                  <p>{article.excerpt}</p>
                  <span className="text-link">Đọc bài <span aria-hidden="true">→</span></span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section community-section">
        <div className="container community-panel">
          <div className="community-decoration" aria-hidden="true">LVL<br />UP_</div>
          <div className="community-copy">
            <p className="eyebrow">04 / PLAYER COMMUNITY</p>
            <h2>GAME TỐT HƠN<br />KHI CHƠI <span>CÙNG NHAU.</span></h2>
            <p>Hồ sơ game thủ, bảng tin cộng đồng và tìm đồng đội đã có mặt trên LevelUP. Kết nối với người chơi cùng gu, chia sẻ góc nhìn và lập squad phù hợp để vào game nhanh hơn.</p>
            <Link className="btn btn-primary" href="/squads">Tìm đồng đội <span aria-hidden="true">↗</span></Link>
          </div>
          <div className="community-status">
            <span className="status-line"><i /> PHASE 01 / DISCOVERY</span>
            <span className="status-line"><i /> PHASE 02 / PLAYER PROFILES</span>
            <span className="status-line"><i /> PHASE 03 / SOCIAL FEED + LFG</span>
            <span className="status-line pending"><i /> PHASE 04 / PERSONALIZATION</span>
          </div>
        </div>
      </section>
    </main>
  );
}
