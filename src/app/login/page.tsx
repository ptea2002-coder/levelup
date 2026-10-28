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
            <p>Đăng nhập hiện hỗ trợ email và mật khẩu qua Supabase Auth. Hồ sơ công khai, đồng bộ game yêu thích và các tính năng cộng đồng sẽ được bật ở các bước tiếp theo.</p>
            <div className="auth-checklist">
              <span><i /> Đăng ký bằng email</span>
              <span><i /> Đăng nhập an toàn qua Supabase</span>
              <span><i /> Không cần cung cấp khóa bí mật</span>
            </div>
          </div>
          <AuthForm />
        </div>
      </section>
    </main>
  );
}
