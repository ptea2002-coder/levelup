import type { Metadata } from "next";
import { CommunityFeed } from "@/components/community-feed";
import { getGames } from "@/lib/game-repository";

export const metadata: Metadata = {
  title: "Bảng tin cộng đồng",
  description: "Chia sẻ khoảnh khắc, tìm người cùng chơi và kết nối với cộng đồng game thủ LevelUP.",
  alternates: { canonical: "/community" },
  openGraph: {
    type: "website",
    url: "/community",
    title: "Bảng tin cộng đồng | LevelUP",
    description: "Chia sẻ khoảnh khắc, tìm người cùng chơi và kết nối với cộng đồng game thủ LevelUP.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bảng tin cộng đồng | LevelUP",
    description: "Chia sẻ khoảnh khắc, tìm người cùng chơi và kết nối với cộng đồng game thủ LevelUP.",
    images: ["/opengraph-image"],
  },
};

export default async function CommunityPage() {
  const games = await getGames();

  return (
    <main className="page-main community-page">
      <section className="page-hero community-hero">
        <div className="container">
          <p className="eyebrow">LEVELUP SOCIAL / PLAYER NETWORK</p>
          <h1>FIND YOUR<br /><span>PLAYER TWO.</span></h1>
          <p>Nơi game thủ chia sẻ hành trình, bàn chiến thuật, tìm đồng đội và xây dựng danh tính gaming của riêng mình.</p>
          <div className="community-hero-stats">
            <span><i aria-hidden="true" /> BẢNG TIN CỘNG ĐỒNG THẬT</span>
            <span>POWERED BY SUPABASE + RLS</span>
          </div>
        </div>
      </section>
      <CommunityFeed games={games} />
    </main>
  );
}
