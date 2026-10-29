import type { Metadata } from "next";
import { GameExplorer } from "@/components/game-explorer";
import { getGameCatalogFacets, getGamesPage } from "@/lib/game-repository";

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
  const [catalog, facets] = await Promise.all([
    getGamesPage({ page: 1, pageSize: 24, sort: "popular" }),
    getGameCatalogFacets(),
  ]);

  return (
    <main className="page-main">
      <section className="page-hero">
        <div className="container">
          <p className="eyebrow">DATABASE / 001</p>
          <h1>GAME<br /><span>LIBRARY.</span></h1>
          <p>Tra cứu kho game được đồng bộ từ nguồn dữ liệu thực. Tìm kiếm và lọc trực tiếp trên máy chủ; trình duyệt chỉ tải từng trang nhỏ để luôn nhanh kể cả khi kho có hàng trăm nghìn tựa game.</p>
          <p className="catalog-meta">{catalog.available ? catalog.total.toLocaleString("vi-VN") + " tựa game trong kho dữ liệu" : "Kho dữ liệu đang kết nối"}</p>
          <p className="catalog-source-note">Nguồn đang hoạt động: SteamSpy / Steam (PC). Bộ đồng bộ IGDB đa nền tảng đã được chuẩn bị nhưng chỉ chạy sau khi cấu hình IGDB_CLIENT_ID và IGDB_CLIENT_SECRET trong Supabase Secrets. Chỉ số SteamSpy là ước tính, không phải dữ liệu live.</p>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <GameExplorer
            games={catalog.items}
            remote
            initialTotal={catalog.total}
            catalogReady={catalog.available}
            availableCategories={facets.available ? facets.categories : undefined}
            availablePlatforms={facets.available ? facets.platforms : undefined}
          />
        </div>
      </section>
    </main>
  );
}
