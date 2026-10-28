import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getGameBySlug } from "@/lib/game-repository";

type GamePageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: GamePageProps): Promise<Metadata> {
  const { slug } = await params;
  const game = await getGameBySlug(slug);
  if (!game) return { title: "Không tìm thấy game" };
  return {
    title: game.title,
    description: game.description,
    openGraph: { title: `${game.title} | LevelUP`, description: game.description },
  };
}

export default async function GameDetailPage({ params }: GamePageProps) {
  const { slug } = await params;
  const game = games.find((item) => item.slug === slug);
  if (!game) notFound();

  const artStyle = {
    "--art-primary": game.artPrimary,
    "--art-secondary": game.artSecondary,
  } as CSSProperties;

  return (
    <main className="page-main">
      <section className="section game-detail-section">
        <div className="container">
          <Link href="/games" className="back-link">← Quay lại thư viện</Link>
          <div className="game-detail-layout">
            <div className="detail-art" style={artStyle}>
              <span className="game-art-kicker">LEVELUP / GAME PROFILE</span>
              <span className="detail-mark" aria-hidden="true">{game.mark}</span>
              <span className="detail-art-caption">{game.category} / RELEASE {game.releaseYear}</span>
            </div>
            <div className="detail-copy">
              <p className="eyebrow">GAME PROFILE / {game.category.toUpperCase()}</p>
              <h1>{game.title}<span>.</span></h1>
              <p className="detail-description">{game.description}</p>
              <div className="detail-tags">
                {game.genres.map((genre) => <span key={genre}>{genre}</span>)}
              </div>
              <dl className="detail-facts">
                <div><dt>Nhà phát triển</dt><dd>{game.developer}</dd></div>
                <div><dt>Năm phát hành</dt><dd>{game.releaseYear}</dd></div>
                <div><dt>Nền tảng</dt><dd>{game.platforms.join(" · ")}</dd></div>
              </dl>
              <a className="btn btn-primary" href={game.officialUrl} target="_blank" rel="noreferrer">
                Trang chính thức <span aria-hidden="true">↗</span>
              </a>
              <p className="data-note">Thông tin được cung cấp để khám phá; hãy kiểm tra trang chính thức để xem chi tiết mới nhất.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
