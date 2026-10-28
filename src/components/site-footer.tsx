import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-main">
        <Link href="/" className="brand" aria-label="LevelUP trang chủ">
          <span className="brand-mark">L</span>
          <span className="brand-word">LEVEL<span>UP</span></span>
        </Link>
        <p>Nơi khám phá game, học cách chơi tốt hơn và kết nối cùng cộng đồng.</p>
        <nav aria-label="Liên kết cuối trang">
          <Link href="/games">Game library</Link>
          <Link href="/news">Guides</Link>
          <Link href="/community">Community</Link>
        </nav>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} LEVELUP</span>
        <span>Được xây dựng cho game thủ.</span>
      </div>
    </footer>
  );
}
