import type { Metadata } from "next";
import Link from "next/link";
import { HeroExperience } from "@/components/hero-experience";
import { GameExplorer } from "@/components/game-explorer";
import { GamerCommandCenter } from "@/components/gamer-command-center";
import { SteamLiveMetrics } from "@/components/steam-live-metrics";
import { articles } from "@/lib/articles";
import { getGames, getGamesBySlugs } from "@/lib/game-repository";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const featuredSlugs = ["valorant", "league-of-legends", "counter-strike-2", "apex-legends", "genshin-impact", "elden-ring"];
  const [games, featuredGames] = await Promise.all([getGames(48), getGamesBySlugs(featuredSlugs)]);

  return (
    <main>
      <HeroExperience games={games} articleCount={articles.length} />

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
          <GameExplorer games={featuredGames} remote={false} />
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

      <GamerCommandCenter games={games} />

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
            <p className="eyebrow">04 / PLAYER SOCIAL HUB</p>
            <h2>GAME TỐT HƠN<br />KHI CHƠI <span>CÙNG NHAU.</span></h2>
            <p>LevelUP là điểm hẹn của game thủ: theo dõi người cùng gu, chia sẻ khoảnh khắc, thảo luận chiến thuật và lập squad phù hợp để vào trận nhanh hơn.</p>
            <div className="community-actions">
              <Link className="btn btn-primary" href="/community">Mở bảng tin <span aria-hidden="true">↗</span></Link>
              <Link className="btn btn-secondary" href="/squads">Tìm đồng đội <span aria-hidden="true">⌁</span></Link>
            </div>
          </div>
          <div className="community-status">
            <Link href="/community" className="status-line"><i /> PLAYER FEED / BẢNG TIN</Link>
            <Link href="/login" className="status-line"><i /> PLAYER ID / HỒ SƠ</Link>
            <Link href="/squads" className="status-line"><i /> SQUAD SYSTEM / TÌM ĐỘI</Link>
            <Link href="/notifications" className="status-line"><i /> NOTIFICATIONS / THÔNG BÁO</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
