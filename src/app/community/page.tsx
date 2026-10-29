import type { Metadata } from "next";
import { CommunityFeed } from "@/components/community-feed";
import { getGames } from "@/lib/game-repository";

export const metadata: Metadata = {
  title: "Bảng tin cộng đồng",
  description: "Mạng xã hội gaming Việt Nam: chia sẻ khoảnh khắc, theo dõi game thủ, thảo luận và tìm đồng đội trên LevelUP.",
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
          <p className="eyebrow"><span className="status-dot" /> LEVELUP SOCIAL / PLAYER NETWORK</p>
          <h1>CỘNG ĐỒNG<br /><span>CHƠI CÙNG NHAU.</span></h1>
          <p>Một nơi dành riêng cho game thủ: chia sẻ khoảnh khắc, theo dõi người cùng gu, bàn chiến thuật và lập đội trước khi vào trận.</p>
          <div className="community-hero-actions">
            <a className="btn btn-primary" href="#community-feed">Mở bảng tin <span aria-hidden="true">↓</span></a>
            <a className="btn btn-secondary" href="/squads">Tìm đồng đội <span aria-hidden="true">↗</span></a>
          </div>
          <div className="community-hero-stats">
            <span><i aria-hidden="true" /> PLAYER FEED / LIKE / COMMENT</span>
            <span>PROFILE · FOLLOW · SQUAD</span>
          </div>
        </div>
      </section>
      <div id="community-feed"><CommunityFeed games={games} /></div>
    </main>
  );
}
