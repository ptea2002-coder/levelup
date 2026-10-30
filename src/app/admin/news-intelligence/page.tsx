import type { Metadata } from "next";
import Link from "next/link";
import { NewsIntelligence } from "@/components/news-intelligence";

export const metadata: Metadata = {
  title: "News Intelligence",
  description: "Hàng chờ tiếp nhận tin từ nguồn đã rà soát, phát hiện trùng lặp và chuyển thành bản nháp biên tập.",
  robots: { index: false, follow: false },
};

export default function NewsIntelligencePage() {
  return (
    <main className="page-main">
      <section className="page-hero">
        <div className="container">
          <p className="eyebrow">LEVELUP STUDIO / SOURCE GOVERNANCE</p>
          <h1>NEWS<br /><span>INTELLIGENCE.</span></h1>
          <p>RSS/API chỉ là đầu vào tham khảo. Nguồn phải được admin rà soát trước khi bật; biên tập viên quyết định mọi bản nháp và không có cơ chế tự đăng.</p>
          <p><Link href="/admin/editorial" className="text-link">← Quay lại Editorial CMS</Link></p>
        </div>
      </section>
      <NewsIntelligence />
    </main>
  );
}
