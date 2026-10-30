import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, IBM_Plex_Mono } from "next/font/google";
import { isPublicProduction, siteUrl } from "@/lib/site";
import { MotionEffects } from "@/components/motion-effects";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { GameLibraryProvider } from "@/components/game-library-provider";
import "./globals.css";
import "./aaa-motion.css";
import "./social-network.css";
import "./game-library.css";
import "./game-community.css";
import "./editorial-cms.css";

const vietnameseFont = Be_Vietnam_Pro({
  variable: "--font-vietnam",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const codeFont = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "LevelUP — Play hard. Level up.",
    template: "%s | LevelUP",
  },
  description: "Khám phá game, kết nối game thủ, chia sẻ chiến thuật và tìm đồng đội trên mạng xã hội gaming LevelUP.",
  applicationName: "LevelUP",
  keywords: ["game", "game PC", "hướng dẫn game", "cộng đồng game thủ", "LevelUP Việt Nam"],
  authors: [{ name: "LevelUP" }],
  openGraph: {
    type: "website",
    url: siteUrl.toString(),
    title: "LevelUP — Play hard. Level up.",
    description: "Khám phá game, đọc hướng dẫn và tìm cộng đồng chơi game theo cách của bạn.",
    siteName: "LevelUP",
    locale: "vi_VN",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "LevelUP — Play hard. Level up." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "LevelUP — Play hard. Level up.",
    description: "Khám phá game, đọc hướng dẫn và tìm cộng đồng chơi game theo cách của bạn.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: isPublicProduction,
    follow: isPublicProduction,
    googleBot: {
      index: isPublicProduction,
      follow: isPublicProduction,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#090a12",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className={`${vietnameseFont.variable} ${codeFont.variable}`}>
      <body>
        <div className="site-shell">
          <a className="skip-link" href="#main-content">Bỏ qua điều hướng, đến nội dung chính</a>
          <SiteHeader />
          <div id="main-content" tabIndex={-1}><GameLibraryProvider>{children}</GameLibraryProvider></div>
          <SiteFooter />
          <MotionEffects />
        </div>
      </body>
    </html>
  );
}
