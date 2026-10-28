import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, IBM_Plex_Mono, Orbitron } from "next/font/google";
import { isPublicProduction, siteUrl } from "@/lib/site";
import { MotionEffects } from "@/components/motion-effects";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const vietnameseFont = Be_Vietnam_Pro({
  variable: "--font-vietnam",
  subsets: ["latin", "vietnamese"],
  weight: "variable",
  display: "swap",
});

const gamingFont = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
});

const codeFont = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "LevelUP — Play hard. Level up.",
    template: "%s | LevelUP",
  },
  description: "Khám phá game, đọc hướng dẫn và tìm cộng đồng chơi game theo cách của bạn.",
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
    <html lang="vi" className={`${vietnameseFont.variable} ${gamingFont.variable} ${codeFont.variable}`}>
      <body>
        <div className="site-shell">
          <a className="skip-link" href="#main-content">Bỏ qua điều hướng, đến nội dung chính</a>
          <SiteHeader />
          <div id="main-content" tabIndex={-1}>{children}</div>
          <SiteFooter />
          <MotionEffects />
        </div>
      </body>
    </html>
  );
}
