import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { articles } from "@/lib/articles";

type ArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = articles.find((item) => item.slug === slug);
  if (!article) return { title: "Không tìm thấy bài viết" };
  return { title: article.title, description: article.excerpt };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = articles.find((item) => item.slug === slug);
  if (!article) notFound();

  return (
    <main className="page-main">
      <article className="article-page container">
        <Link href="/news" className="back-link">← Quay lại hướng dẫn</Link>
        <header className="article-header">
          <p className="eyebrow">{article.category} / {article.readingTime}</p>
          <h1>{article.title}<span>.</span></h1>
          <p className="article-lead">{article.excerpt}</p>
        </header>
        <div className="article-content">
          {article.sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </section>
          ))}
          <div className="editorial-note">
            <strong>LEVELUP NOTE</strong>
            <p>Nội dung mang tính hướng dẫn chung. Với thông tin về phiên bản, cấu hình hoặc điều khoản, hãy kiểm tra nguồn chính thức tương ứng.</p>
          </div>
        </div>
      </article>
    </main>
  );
}
