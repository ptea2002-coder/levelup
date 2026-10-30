import type { Metadata } from "next";
import { PCPerformanceLab } from "@/components/pc-performance-lab";

export const metadata: Metadata = {
  title: "PC Build & Performance Lab",
  description: "Đối chiếu cấu hình PC với yêu cầu hệ thống có dẫn nguồn, kiểm tra RAM, VRAM, SSD và nhận hướng dẫn hiệu năng không bịa FPS trên LevelUP.",
  alternates: { canonical: "/build-lab" },
  openGraph: {
    type: "website",
    url: "/build-lab",
    title: "PC Build & Performance Lab | LevelUP",
    description: "Khai báo phần cứng, đối chiếu yêu cầu game và xem các tiêu chí còn cần xác minh.",
  },
  twitter: {
    card: "summary_large_image",
    title: "PC Build & Performance Lab | LevelUP",
    description: "Đối chiếu cấu hình PC với yêu cầu game có nguồn tham chiếu.",
    images: ["/opengraph-image"],
  },
};

export default function PCBuildLabPage() {
  return (
    <main className="page-main pc-lab-page">
      <section className="page-hero pc-lab-hero">
        <div className="container">
          <p className="eyebrow">LEVELUP / HARDWARE INTELLIGENCE MODULE 005</p>
          <h1>PC BUILD<br /><span>PERFORMANCE LAB.</span></h1>
          <p>Đưa cấu hình của bạn vào bàn phân tích. Đối chiếu thông số thực với yêu cầu hệ thống được dẫn nguồn, tìm điểm nghẽn có thể xác minh và hiểu rõ phần nào vẫn cần kiểm tra thủ công.</p>
          <div className="pc-lab-hero-stats">
            <span><b>01</b> BUILD PROFILE</span>
            <span><b>02</b> REQUIREMENT SCAN</span>
            <span><b>03</b> HONEST PERFORMANCE GUIDANCE</span>
          </div>
          <p className="pc-lab-hero-note">NO FAKE FPS · NO UNSOURCED BENCHMARKS · SOURCE-LINKED REQUIREMENTS</p>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <PCPerformanceLab />
        </div>
      </section>
    </main>
  );
}
