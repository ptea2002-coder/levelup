import type { Metadata } from "next";
import { LfgBoard } from "@/components/lfg-board";
import { getGames } from "@/lib/game-repository";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Tìm đồng đội & Squad",
  description: "Tìm game thủ cùng game, rank, nền tảng và khung giờ. Tạo squad và duyệt thành viên trên LevelUP.",
  alternates: { canonical: "/squads" },
  openGraph: { type: "website", url: "/squads", title: "Tìm đồng đội & Squad | LevelUP", description: "Tìm game thủ cùng game, rank, nền tảng và khung giờ trên LevelUP." },
  twitter: { card: "summary_large_image", title: "Tìm đồng đội & Squad | LevelUP", description: "Tạo đội và tìm game thủ phù hợp trên LevelUP.", images: ["/opengraph-image"] },
};
export default async function SquadsPage() {
  const games = await getGames();
  return <main className="page-main squads-page"><section className="page-hero lfg-hero"><div className="container">
    <p className="eyebrow">LEVELUP LFG / PLAYER MATCHMAKING</p><h1>FIND YOUR<br/><span>FIRETEAM.</span></h1>
    <p>Tìm đúng người, đúng rank, đúng giờ. Tạo squad, duyệt thành viên và hẹn nhau vào trận — miễn phí.</p>
    <div className="community-hero-stats"><span><i aria-hidden="true"/> SQUAD SYSTEM</span><span>RLS · CAPACITY CHECKS · PLAYER FIRST</span></div>
  </div></section><LfgBoard games={games}/></main>;
}
