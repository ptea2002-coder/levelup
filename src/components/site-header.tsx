"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CommunityNavStatus } from "@/components/community-nav-status";

const navigation = [
  { href: "/community", label: "Bảng tin" },
  { href: "/games", label: "Khám phá game" },
  { href: "/discover", label: "Gợi ý game" },
  { href: "/build-lab", label: "PC Lab" },
  { href: "/squads", label: "Tìm đồng đội" },
  { href: "/news", label: "Tin & hướng dẫn" },
  { href: "/locker", label: "Game Locker" },
  { href: "/login", label: "Tài khoản" },
];

function isActiveRoute(pathname: string, href: string) {
  if (href === "/login") {
    return pathname === "/login" || pathname.startsWith("/profile") || pathname.startsWith("/notifications");
  }
  return pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
}

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="site-header">
      <div className="container nav-shell">
        <Link href="/" className="brand" aria-label="LevelUP trang chủ">
          <span className="brand-mark">L</span>
          <span className="brand-word">LEVEL<span>UP</span></span>
        </Link>
        <nav className="nav-links" aria-label="Điều hướng chính">
          {navigation.map((item) => {
            const active = isActiveRoute(pathname, item.href);
            return <Link key={item.href} href={item.href} className={active ? "is-active" : undefined} aria-current={active ? "page" : undefined}>{item.label}</Link>;
          })}
        </nav>
        <div className="nav-actions">
          <CommunityNavStatus />
          <Link href="/community" className="nav-cta">Vào cộng đồng <span aria-hidden="true">↗</span></Link>
          <details className="mobile-nav">
            <summary aria-label="Mở menu điều hướng"><span className="mobile-menu-icon" aria-hidden="true">☰</span><span>MENU</span></summary>
            <nav aria-label="Điều hướng di động">
              {navigation.map((item) => {
                const active = isActiveRoute(pathname, item.href);
                return <Link key={item.href} href={item.href} className={active ? "is-active" : undefined} aria-current={active ? "page" : undefined}>{item.label}</Link>;
              })}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
