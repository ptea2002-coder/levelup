import type { Metadata } from "next";
import { GameDiscoveryStudio } from "@/components/game-discovery-studio";
import { getGameCatalogFacets, getGamesPage } from "@/lib/game-repository";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Game Discovery Lab",
  description: "Tìm game hợp gu theo thể loại, nền tảng, tâm trạng chơi và thư viện game cá nhân trên LevelUP.",
  alternates: { canonical: "/discover" },
  openGraph: {
    type: "website",
    url: "/discover",
    title: "Game Discovery Lab | LevelUP",
    description: "Bật radar và khám phá game phù hợp với gu của bạn.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Game Discovery Lab | LevelUP",
    description: "Bật radar và khám phá game phù hợp với gu của bạn.",
    images: ["/opengraph-image"],
  },
};

export default async function GameDiscoveryPage() {
  const [catalog, facets] = await Promise.all([
    getGamesPage({ page: 1, pageSize: 48, sort: "recommended" }),
    getGameCatalogFacets(),
  ]);

  return (
    <main className="page-main discovery-page">
      <section className="page-hero discovery-hero">
        <div className="container">
          <p className="eyebrow">LEVELUP / INTELLIGENCE MODULE 004</p>
          <h1>GAME<br /><span>DISCOVERY LAB.</span></h1>
          <p>Không phải một bảng xếp hạng chung cho tất cả. Hãy đưa ra tín hiệu về thể loại, nền tảng và tâm trạng; LevelUP sẽ xếp hạng các tựa game theo metadata và những gì bạn đã lưu trong Game Locker.</p>
          <div className="discovery-hero-stats">
            <span><b>{catalog.available ? catalog.total.toLocaleString("vi-VN") : "—"}</b> GAME TRONG CATALOG</span>
            <span><b>{facets.available ? facets.categories.length : "—"}</b> NHÓM THỂ LOẠI</span>
            <span><b>{facets.available ? facets.platforms.length : "—"}</b> NỀN TẢNG</span>
          </div>
          <p className="catalog-source-note">Gợi ý heuristic, không phải phán quyết chất lượng hoặc dự báo FPS. IGDB vẫn được để hoãn; dữ liệu đa nền tảng chỉ hiển thị khi có nguồn xác thực.</p>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <GameDiscoveryStudio
            initialGames={catalog.items}
            initialTotal={catalog.total}
            categories={facets.available ? facets.categories : []}
            platforms={facets.available ? facets.platforms : []}
            catalogReady={catalog.available && facets.available}
          />
        </div>
      </section>
    </main>
  );
}
