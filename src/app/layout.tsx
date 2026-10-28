import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, IBM_Plex_Mono, Orbitron } from "next/font/google";
import { MotionEffects } from "@/components/motion-effects";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const vietnameseFont = Be_Vietnam_Pro({
  variable: "--font-vietnam",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const gamingFont = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
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
    <html lang="vi" className={`${vietnameseFont.variable} ${gamingFont.variable} ${codeFont.variable}`}>
      <body>
        <div className="site-shell">
          <SiteHeader />
          {children}
          <SiteFooter />
          <MotionEffects />
        </div>
      </body>
    </html>
  );
}
