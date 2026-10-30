import type { Metadata } from "next";
import { GameLocker } from "@/components/game-locker";
import { getGames } from "@/lib/game-repository";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Game Locker",
  description: "Quản lý game muốn chơi, đang chơi và đã hoàn thành trong bộ sưu tập LevelUP cá nhân.",
  alternates: { canonical: "/locker" },
  robots: { index: false, follow: false },
};

export default async function GameLockerPage() {
  const games = await getGames();

  return (
    <main className="page-main">
      <section className="page-hero">
        <div className="container">
          <p className="eyebrow">PLAYER INVENTORY / PERSONAL GAME TRACKER</p>
          <h1>GAME<br /><span>LOCKER.</span></h1>
          <p>Lập roster riêng của bạn. Đánh dấu game muốn chơi, game đang cày và những hành trình đã clear — không cần đăng nhập.</p>
        </div>
      </section>
      <GameLocker games={games} />
    </main>
  );
}
