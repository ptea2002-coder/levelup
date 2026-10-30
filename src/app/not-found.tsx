import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found container">
      <p className="eyebrow">ERROR / 404</p>
      <h1>LOST<br /><span>IN THE GAME.</span></h1>
      <p>Trang bạn tìm không tồn tại hoặc đã được chuyển đi.</p>
      <Link className="btn btn-primary" href="/">Quay về LevelUP <span aria-hidden="true">↗</span></Link>
    </main>
  );
}
