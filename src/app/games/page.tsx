import type { Metadata } from "next";
import { GameExplorer } from "@/components/game-explorer";
import { getGames } from "@/lib/game-repository";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Khám phá game",
  description: "Tìm và khám phá game theo thể loại, nhà phát triển và nền tảng trên LevelUP.",
  alternates: { canonical: "/games" },
  openGraph: {
    type: "website",
    url: "/games",
    title: "Khám phá game | LevelUP",
    description: "Tìm và khám phá game theo thể loại, nhà phát triển và nền tảng trên LevelUP.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Khám phá game | LevelUP",
    description: "Tìm và khám phá game theo thể loại, nhà phát triển và nền tảng trên LevelUP.",
    images: ["/opengraph-image"],
  },
};

export default async function GamesPage() {
  const games = await getGames();

  return (
    <main className="page-main">
      <section className="page-hero">
        <div className="container">
          <p className="eyebrow">DATABASE / 001</p>
          <h1>GAME<br /><span>LIBRARY.</span></h1>
          <p>Khám phá game theo thể loại, studio và nền tảng. Dữ liệu được tải từ Supabase khi backend sẵn sàng, kèm bộ dữ liệu dự phòng để trang luôn hoạt động.</p>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <GameExplorer games={games} />
        </div>
      </section>
    </main>
  );
}
