import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedArticles } from "@/lib/article-repository";

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

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const articles = await getPublishedArticles();
  return (
    <main className="page-main">
      <section className="page-hero">
        <div className="container">
          <p className="eyebrow">EDITORIAL / 002</p>
          <h1>PLAY<br /><span>SMARTER.</span></h1>
          <p>Góc biên tập LevelUP: tin game, hướng dẫn thực chiến và phân tích có nguồn tham chiếu. Bài mới được xuất bản qua quy trình biên tập và kiểm tra nguồn.</p>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="article-grid">
            {articles.map((article, index) => (
              <Link className="article-card" href={`/news/${article.slug}`} key={article.slug}>
                {article.coverImageUrl ? <div className="article-art"><img src={article.coverImageUrl} alt="" loading="lazy" /><span className="article-open" aria-hidden="true">↗</span></div> : <div className={`article-art article-art-${index + 1}`}><span className="article-number">{String(index + 1).padStart(2, "0")}</span><span className="article-art-word">{article.category.slice(0, 12)}</span><span className="article-open" aria-hidden="true">↗</span></div>}
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
