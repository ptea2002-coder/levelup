import Link from "next/link";

const navigation = [
  { href: "/games", label: "Khám phá game" },
  { href: "/news", label: "Tin & hướng dẫn" },
  { href: "/community", label: "Cộng đồng" },
  { href: "/login", label: "Tài khoản" },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container nav-shell">
        <Link href="/" className="brand" aria-label="LevelUP trang chủ">
          <span className="brand-mark">L</span>
          <span className="brand-word">LEVEL<span>UP</span></span>
        </Link>

        <nav className="nav-links" aria-label="Điều hướng chính">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href}>{item.label}</Link>
          ))}
        </nav>

        <div className="nav-actions">
          <Link href="/games" className="nav-cta">
            Khám phá <span aria-hidden="true">↗</span>
          </Link>
          <details className="mobile-nav">
            <summary aria-label="Mở menu điều hướng"><span className="mobile-menu-icon" aria-hidden="true">☰</span><span>MENU</span></summary>
            <nav aria-label="Điều hướng di động">
              {navigation.map((item) => (
                <Link key={item.href} href={item.href}>{item.label}</Link>
              ))}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
