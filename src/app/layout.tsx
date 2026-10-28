import type { Metadata, Viewport } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "LevelUP — Play hard. Level up.",
    template: "%s | LevelUP",
  },
  description: "Khám phá game, đọc hướng dẫn và tìm cộng đồng chơi game theo cách của bạn.",
  applicationName: "LevelUP",
  openGraph: {
    type: "website",
    title: "LevelUP — Play hard. Level up.",
    description: "Khám phá game, đọc hướng dẫn và tìm cộng đồng chơi game theo cách của bạn.",
    siteName: "LevelUP",
    locale: "vi_VN",
  },
};

export const viewport: Viewport = {
  themeColor: "#090a12",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>
        <div className="site-shell">
          <SiteHeader />
          {children}
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
