import type { Metadata } from "next";
import Link from "next/link";
import { EditorialCms } from "@/components/editorial-cms";

export const metadata: Metadata = {
  title: "Editorial CMS",
  description: "Soạn thảo, xem trước và xuất bản bài viết LevelUP.",
  robots: { index: false, follow: false },
};

export default function EditorialAdminPage() {
  return (
    <main className="page-main">
      <section className="page-hero">
        <div className="container">
          <p className="eyebrow">LEVELUP STUDIO / PRIVATE WORKSPACE</p>
          <h1>EDITORIAL<br /><span>CONTROL.</span></h1>
          <p>Không gian biên tập có phân quyền. Bản nháp chỉ hiển thị với editor/admin; nội dung công khai phải được xuất bản có chủ đích.</p>
          <p><Link href="/admin/moderation" className="text-link">← Quay lại kiểm duyệt cộng đồng</Link></p>
        </div>
      </section>
      <EditorialCms />
    </main>
  );
}
