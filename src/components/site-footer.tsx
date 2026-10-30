import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-main">
        <Link href="/" className="brand" aria-label="LevelUP trang chủ">
          <span className="brand-mark">L</span>
          <span className="brand-word">LEVEL<span>UP</span></span>
        </Link>
        <p>Nơi game thủ khám phá thế giới mới, xây dựng hồ sơ gaming và tìm đúng cộng đồng của mình.</p>
        <nav aria-label="Liên kết cuối trang">
          <Link href="/community">Bảng tin</Link>
          <Link href="/squads">Tìm đồng đội</Link>
          <Link href="/games">Khám phá game</Link>
          <Link href="/news">Tin & hướng dẫn</Link>
          <Link href="/locker">Game Locker</Link>
        </nav>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} LEVELUP</span>
        <span>Được xây dựng cho game thủ.</span>
      </div>
    </footer>
  );
}
