import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GameArtwork } from "@/components/game-artwork";
import { GameCard } from "@/components/game-card";
import { GameDetailContent } from "@/components/game-detail-content";
import { GameLibraryControl } from "@/components/game-library-control";
import { SteamLiveMetrics } from "@/components/steam-live-metrics";
import { steamTrackedGameSlugs } from "@/lib/steam-games";
import { getGameArtworkUrl } from "@/lib/game-art";
import { getGameBySlug, getRelatedGames } from "@/lib/game-repository";

type GamePageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: GamePageProps): Promise<Metadata> {
  const { slug } = await params;
  const game = await getGameBySlug(slug);
  if (!game) return { title: "Không tìm thấy game" };

  const image = game.backgroundUrl || game.coverUrl || getGameArtworkUrl(game.slug, "detail");

  return {
    title: game.title,
    description: game.description,
    alternates: { canonical: `/games/${game.slug}` },
    openGraph: {
      type: "website",
      url: `/games/${game.slug}`,
      title: `${game.title} | LevelUP`,
      description: game.description,
      images: image
        ? [{ url: image, alt: `${game.title} artwork` }]
        : [{ url: "/opengraph-image" }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${game.title} | LevelUP`,
      description: game.description,
      images: image ? [image] : ["/opengraph-image"],
    },
  };
}

export default async function GameDetailPage({ params }: GamePageProps) {
  const { slug } = await params;
  const game = await getGameBySlug(slug);
  if (!game) notFound();

  const relatedGames = await getRelatedGames(game, 3);

  return (
    <main className="page-main">
      <section className="section game-detail-section">
        <div className="container">
          <nav className="detail-breadcrumbs" aria-label="Breadcrumb">
            <Link href="/">Trang chủ</Link>
            <span aria-hidden="true">/</span>
            <Link href="/games">Thư viện game</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{game.title}</span>
          </nav>

          <div className="game-detail-layout">
            <GameArtwork
              slug={game.slug}
              mark={game.mark}
              category={game.category}
              releaseYear={game.releaseYear}
              artPrimary={game.artPrimary}
              artSecondary={game.artSecondary}
              coverUrl={game.coverUrl}
              backgroundUrl={game.backgroundUrl}
              variant="detail"
            />

            <div className="detail-copy">
              <p className="eyebrow">GAME PROFILE / {game.category.toUpperCase()}</p>
              <h1>{game.title}<span>.</span></h1>
              <p className="detail-description">{game.shortDescription || game.description || "Mô tả chi tiết chưa có trong nguồn dữ liệu. Hãy mở trang Steam để xem thông tin do nhà phát hành cung cấp."}</p>

              <div className="detail-tags" aria-label="Thể loại game">
                {game.genres.map((genre) => <span key={genre}>{genre}</span>)}
              </div>

              <dl className="detail-facts">
                <div>
                  <dt>Nhà phát triển</dt>
                  <dd>{game.developer}</dd>
                </div>
                <div>
                  <dt>Năm phát hành</dt>
                  <dd>{game.releaseYear > 0 ? game.releaseYear : "Chưa cập nhật"}</dd>
                </div>
                <div>
                  <dt>Thể loại chính</dt>
                  <dd>{game.category}</dd>
                </div>
                <div>
                  <dt>Nền tảng</dt>
                  <dd className="detail-platforms">
                    {game.platforms.map((platform) => <span key={platform}>{platform}</span>)}
                  </dd>
                </div>
              </dl>

              <div className="detail-actions">
                <a className="btn btn-primary" href={game.officialUrl} target="_blank" rel="noopener noreferrer">
                  {game.sourceProvider === "steamspy" ? "Xem trên Steam" : "Trang chính thức"} <span aria-hidden="true">↗</span>
                </a>
                <Link className="btn btn-secondary" href="/games">
                  Khám phá game khác <span aria-hidden="true">→</span>
                </Link>
              </div>
              <div className="detail-library-panel">
                <p className="eyebrow">PLAYER INVENTORY / YOUR GAME LOCKER</p>
                <GameLibraryControl gameSlug={game.slug} gameTitle={game.title} variant="full" />
              </div>
              <p className="data-note">
                Thông tin giúp bạn khám phá nhanh. Hãy kiểm tra trang chính thức để xem yêu cầu hệ thống và cập nhật mới nhất.
              </p>
            </div>
          </div>
        </div>
      </section>

      {steamTrackedGameSlugs.some((slug) => slug === game.slug) ? (
        <section className="section steam-detail-section">
          <div className="container">
            <SteamLiveMetrics game={{ slug: game.slug, title: game.title, category: game.category }} />
          </div>
        </section>
      ) : null}

      <GameDetailContent game={game} />

      {relatedGames.length > 0 ? (
        <section className="section related-games-section">
          <div className="container">
            <div className="section-head">
              <div>
                <p className="eyebrow">MORE TO EXPLORE / 002</p>
                <h2>GAME CÙNG<br /><span>CHIẾN TUYẾN.</span></h2>
              </div>
              <p className="section-aside">
                Một vài lựa chọn có thể hợp gu bạn, dựa trên thể loại và phong cách chơi tương tự.
              </p>
            </div>
            <div className="game-grid related-game-grid">
              {relatedGames.map((related, index) => (
                <GameCard key={related.slug} game={related} index={index} />
              ))}
            </div>
            <div className="related-footer">
              <Link className="text-link" href="/games">Xem toàn bộ thư viện <span aria-hidden="true">→</span></Link>
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
