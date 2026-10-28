import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Tài khoản game thủ",
  description: "Đăng nhập hoặc tạo tài khoản LevelUP bằng Supabase Auth.",
  alternates: { canonical: "/login" },
  robots: { index: false, follow: true },
  openGraph: {
    type: "website",
    url: "/login",
    title: "Tài khoản game thủ | LevelUP",
    description: "Đăng nhập hoặc tạo tài khoản LevelUP bằng Supabase Auth.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tài khoản game thủ | LevelUP",
    description: "Đăng nhập hoặc tạo tài khoản LevelUP bằng Supabase Auth.",
    images: ["/opengraph-image"],
  },
};

export default function LoginPage() {
  return (
    <main className="page-main">
      <section className="page-hero">
        <div className="container">
          <p className="eyebrow">PLAYER ID / AUTHENTICATION</p>
          <h1>YOUR<br /><span>LEVEL.</span></h1>
          <p>Tài khoản là bước đầu để cá nhân hóa trải nghiệm game. Hãy đăng nhập hoặc tạo tài khoản LevelUP.</p>
        </div>
      </section>
      <section className="section auth-section">
        <div className="container auth-layout">
          <div className="auth-aside">
            <p className="eyebrow">LEVELUP / ACCOUNT SYSTEM</p>
            <h2>Mỗi người chơi.<br /><span>Một hành trình.</span></h2>
            <p>Đăng nhập bằng Supabase Auth để tham gia bảng tin, đăng bài, theo dõi game thủ, bình luận, nhận thông báo và quản lý Game Locker của bạn.</p>
            <div className="auth-checklist">
              <span><i /> Đăng ký bằng email</span>
              <span><i /> Đăng nhập an toàn qua Supabase</span>
              <span><i /> Không cần cung cấp khóa bí mật</span>
              <span><i /> Bài đăng, theo dõi và thông báo dùng dữ liệu thật</span>
            </div>
          </div>
          <AuthForm />
        </div>
      </section>
    </main>
  );
}
