import type { Metadata } from "next";
import { GameExplorer } from "@/components/game-explorer";
import { games } from "@/lib/games";

export const metadata: Metadata = {
  title: "Khám phá game",
  description: "Tìm game theo tên, studio, thể loại và nền tảng trên LevelUP.",
};

export default function GamesPage() {
  return (
    <main className="page-main">
      <section className="page-hero">
        <div className="container">
          <p className="eyebrow">DATABASE / 001</p>
          <h1>GAME<br /><span>LIBRARY.</span></h1>
          <p>Thư viện khởi đầu của LevelUP. Dữ liệu hiện được quản lý trong source code; kết nối database sẽ là bước tiếp theo.</p>
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
