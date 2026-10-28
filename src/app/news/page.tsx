import type { Metadata } from "next";
import Link from "next/link";
import { articles } from "@/lib/articles";

export const metadata: Metadata = {
  title: "Tin tức & hướng dẫn",
  description: "Hướng dẫn chọn game, tối ưu trải nghiệm và đánh giá game hữu ích từ LevelUP.",
  alternates: { canonical: "/news" },
  openGraph: {
    type: "website",
    url: "/news",
    title: "Tin tức & hướng dẫn | LevelUP",
    description: "Hướng dẫn chọn game, tối ưu trải nghiệm và đánh giá game hữu ích từ LevelUP.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tin tức & hướng dẫn | LevelUP",
    description: "Hướng dẫn chọn game, tối ưu trải nghiệm và đánh giá game hữu ích từ LevelUP.",
    images: ["/opengraph-image"],
  },
};

export default function NewsPage() {
  return (
    <main className="page-main">
      <section className="page-hero">
        <div className="container">
          <p className="eyebrow">EDITORIAL / 002</p>
          <h1>PLAY<br /><span>SMARTER.</span></h1>
          <p>Hướng dẫn và bài viết nền tảng do LevelUP biên soạn. Tin tức theo thời gian thực sẽ được bổ sung khi có nguồn dữ liệu và quy trình biên tập.</p>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="article-grid">
            {articles.map((article, index) => (
              <Link className="article-card" href={`/news/${article.slug}`} key={article.slug}>
                <div className={`article-art article-art-${index + 1}`}>
                  <span className="article-number">0{index + 1}</span>
                  <span className="article-art-word">{index === 0 ? "BUILD" : index === 1 ? "BOOST" : "REVIEW"}</span>
                  <span className="article-open" aria-hidden="true">↗</span>
                </div>
                <div className="article-card-body">
                  <div className="article-meta"><span>{article.category}</span><span>{article.readingTime}</span></div>
                  <h3>{article.title}</h3>
                  <p>{article.excerpt}</p>
                  <span className="text-link">Đọc bài <span aria-hidden="true">→</span></span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
