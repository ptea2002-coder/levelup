import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cộng đồng",
  description: "Theo dõi lộ trình xây dựng cộng đồng game thủ LevelUP.",
};

const roadmapItems = [
  { number: "01", title: "Hồ sơ game thủ", description: "Tên hiển thị, avatar, game yêu thích và hồ sơ có thể tùy chỉnh.", state: "ĐANG THIẾT KẾ", active: true },
  { number: "02", title: "Review & đánh giá", description: "Đánh giá có cấu trúc, chống spam và công khai nguyên tắc cộng đồng.", state: "TIẾP THEO", active: false },
  { number: "03", title: "Thảo luận & bình luận", description: "Trao đổi theo từng game và bài viết, có báo cáo và kiểm duyệt nội dung.", state: "TRONG LỘ TRÌNH", active: false },
  { number: "04", title: "Tìm đồng đội", description: "Tìm người chơi theo game, nền tảng, khu vực và lịch chơi.", state: "TƯƠNG LAI", active: false },
];

export default function CommunityPage() {
  return (
    <main className="page-main">
      <section className="page-hero">
        <div className="container">
          <p className="eyebrow">COMMUNITY / ROADMAP</p>
          <h1>PLAY<br /><span>TOGETHER.</span></h1>
          <p>Cộng đồng là một phần quan trọng của LevelUP, nhưng chỉ mở khi tài khoản, database, bảo mật và công cụ kiểm duyệt đã sẵn sàng.</p>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="community-intro">
            <div>
              <p className="eyebrow">BUILDING IN PUBLIC</p>
              <h2>Không giả lập tính năng.<br /><span>Xây đúng nền móng.</span></h2>
            </div>
            <p>Hiện tại trang này công khai lộ trình phát triển. Chưa có tài khoản, bài đăng hoặc dữ liệu cộng đồng trực tiếp; các tính năng đó sẽ được triển khai sau khi kết nối backend và kiểm tra bảo mật.</p>
          </div>
          <div className="roadmap-list">
            {roadmapItems.map((item) => (
              <article className="roadmap-item" key={item.number}>
                <span className="roadmap-number">{item.number}</span>
                <div className="roadmap-copy"><h3>{item.title}</h3><p>{item.description}</p></div>
                <span className={`roadmap-state${item.active ? " is-active" : ""}`}>{item.state}</span>
              </article>
            ))}
          </div>
          <div className="inline-cta">
            <div><span className="eyebrow">START HERE</span><h2>Khám phá thư viện trước.</h2></div>
            <Link className="btn btn-primary" href="/games">Mở game library <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
      </section>
    </main>
  );
}
