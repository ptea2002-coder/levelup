import type { Metadata } from "next";
import { NotificationsInbox } from "@/components/notifications-inbox";

export const metadata: Metadata = {
  title: "Thông báo",
  description: "Theo dõi lượt thích, bình luận và người theo dõi mới trên LevelUP.",
  alternates: { canonical: "/notifications" },
  robots: { index: false, follow: false },
};

export default function NotificationsPage() {
  return (
    <main className="page-main">
      <section className="page-hero">
        <div className="container">
          <p className="eyebrow">PLAYER ALERTS / ACTIVITY CENTER</p>
          <h1>YOUR<br /><span>INBOX.</span></h1>
          <p>Mọi lượt thích, bình luận và người theo dõi mới — tập trung tại một nơi.</p>
        </div>
      </section>
      <NotificationsInbox />
    </main>
  );
}
