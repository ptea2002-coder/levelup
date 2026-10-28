import type { Metadata } from "next";
import { ModerationConsole } from "@/components/moderation-console";

export const metadata: Metadata = {
  title: "Kiểm duyệt cộng đồng",
  description: "Công cụ xử lý báo cáo nội dung cho quản trị viên LevelUP.",
  robots: { index: false, follow: false },
};

export default function ModerationPage() {
  return (
    <main className="page-main">
      <section className="page-hero">
        <div className="container">
          <p className="eyebrow">TRUST & SAFETY / ADMIN ONLY</p>
          <h1>COMMUNITY<br /><span>MODERATION.</span></h1>
          <p>Các báo cáo nội dung được lưu trong database và chỉ quản trị viên có quyền xử lý.</p>
        </div>
      </section>
      <ModerationConsole />
    </main>
  );
}
