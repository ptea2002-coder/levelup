import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedArticleBySlug } from "@/lib/article-repository";

type ArticlePageProps = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);
  if (!article) return { title: "Không tìm thấy bài viết", robots: { index: false, follow: false } };
  const canonical = article.canonicalUrl || `/news/${article.slug}`;
  return {
    title: article.seoTitle || article.title,
    description: article.seoDescription || article.excerpt,
    alternates: { canonical },
    openGraph: {
      type: "article",
      url: canonical,
      title: `${article.seoTitle || article.title} | LevelUP`,
      description: article.seoDescription || article.excerpt,
      publishedTime: article.publishedAt || undefined,
      modifiedTime: article.updatedAt || undefined,
      images: article.coverImageUrl ? [{ url: article.coverImageUrl, alt: article.title }] : [{ url: "/opengraph-image", width: 1200, height: 630, alt: "LevelUP — Play hard. Level up." }],
    },
    twitter: { card: "summary_large_image", title: article.seoTitle || article.title, description: article.seoDescription || article.excerpt, images: [article.coverImageUrl || "/opengraph-image"] },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);
  if (!article) notFound();
  const publishedDate = article.publishedAt ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "long" }).format(new Date(article.publishedAt)) : null;

  return (
    <main className="page-main">
      <article className="article-page container">
        <Link href="/news" className="back-link">← Quay lại tin & hướng dẫn</Link>
        <header className="article-header">
          <p className="eyebrow">{article.category} / {article.readingTime}</p>
          <h1>{article.title}<span>.</span></h1>
          <p className="article-lead">{article.excerpt}</p>
          <div className="editorial-public-meta">
            {publishedDate ? <time dateTime={article.publishedAt || undefined}>Xuất bản {publishedDate}</time> : null}
            {article.updatedAt && article.publishedAt && article.updatedAt > article.publishedAt ? <span>Đã cập nhật</span> : null}
          </div>
        </header>
        {article.coverImageUrl ? <img className="editorial-article-cover" src={article.coverImageUrl} alt={article.title} fetchPriority="high" /> : null}
        <div className="article-content">
          {article.sections.map((section, index) => (
            <section key={section.heading + index}>
              {section.heading !== "Nội dung" ? <h2>{section.heading}</h2> : null}
              {section.paragraphs.map((paragraph, paragraphIndex) => <p key={paragraphIndex}>{paragraph}</p>)}
            </section>
          ))}
          {article.sourceUrl ? <aside className="editorial-source-note"><strong>NGUỒN THAM CHIẾU</strong><p>{article.sourceName || "Nguồn bên ngoài"} · <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer">Mở nguồn gốc ↗</a></p></aside> : null}
          {article.correctionNote ? <aside className="editorial-correction-note"><strong>CẬP NHẬT / ĐÍNH CHÍNH</strong><p>{article.correctionNote}</p></aside> : null}
          <div className="editorial-note"><strong>LEVELUP NOTE</strong><p>Nội dung được biên tập để cung cấp bối cảnh và hướng dẫn. Với thông tin thay đổi theo phiên bản, giá hoặc điều khoản, hãy kiểm tra nguồn chính thức được dẫn trong bài.</p></div>
        </div>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: article.title,
          description: article.excerpt,
          datePublished: article.publishedAt || undefined,
          dateModified: article.updatedAt || article.publishedAt || undefined,
          image: article.coverImageUrl ? [article.coverImageUrl] : undefined,
          mainEntityOfPage: article.canonicalUrl || undefined,
          author: { "@type": "Organization", name: article.sourceName ? "LevelUP Editorial" : "LevelUP" },
          publisher: { "@type": "Organization", name: "LevelUP" },
        }).replace(/</g, "\\u003c") }} />
      </article>
    </main>
  );
}
