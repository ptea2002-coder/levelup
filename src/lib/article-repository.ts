import { articles as staticArticles, type Article } from "@/lib/articles";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type PublishedArticle = Article & {
  id?: string;
  coverImageUrl?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  sourceUrl?: string | null;
  sourceName?: string | null;
  correctionNote?: string | null;
  canonicalUrl?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
};

type ArticleRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body_md: string;
  category: string;
  cover_image_url: string | null;
  published_at: string | null;
  updated_at: string;
  source_url: string | null;
  source_name: string | null;
  correction_note: string | null;
  canonical_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
};

function markdownSections(markdown: string): Article["sections"] {
  const blocks = markdown.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
  const sections: Article["sections"] = [];
  let heading = "Nội dung";
  let paragraphs: string[] = [];
  const flush = () => {
    if (paragraphs.length) sections.push({ heading, paragraphs });
    paragraphs = [];
  };

  for (const block of blocks) {
    const headingMatch = block.match(/^#{1,3}\s+(.+)$/);
    if (headingMatch) {
      flush();
      heading = headingMatch[1].trim();
    } else {
      paragraphs.push(block.replace(/^[-*]\s+/gm, "• ").replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1"));
    }
  }
  flush();
  return sections;
}

function mapRow(row: ArticleRow): PublishedArticle {
  const words = row.body_md.trim().split(/\s+/).filter(Boolean).length;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category || "LEVELUP EDITORIAL",
    excerpt: row.excerpt,
    readingTime: Math.max(1, Math.ceil(words / 220)) + " phút",
    sections: markdownSections(row.body_md),
    coverImageUrl: row.cover_image_url,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    sourceUrl: row.source_url,
    sourceName: row.source_name,
    correctionNote: row.correction_note,
    canonicalUrl: row.canonical_url,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
  };
}

function staticAsPublished(article: Article): PublishedArticle {
  return {
    ...article,
    sections: article.sections,
    publishedAt: null,
    updatedAt: null,
    coverImageUrl: null,
    sourceUrl: null,
    sourceName: null,
    correctionNote: null,
    canonicalUrl: null,
    seoTitle: null,
    seoDescription: null,
  };
}

export async function getPublishedArticles(): Promise<PublishedArticle[]> {
  const supabase = getSupabaseServerClient();
  let databaseArticles: PublishedArticle[] = [];
  if (supabase) {
    const { data } = await supabase
      .from("articles")
      .select("id,slug,title,excerpt,body_md,category,cover_image_url,published_at,updated_at,source_url,source_name,correction_note,canonical_url,seo_title,seo_description")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(100);
    databaseArticles = ((data ?? []) as ArticleRow[]).map(mapRow);
  }

  const databaseSlugs = new Set(databaseArticles.map((article) => article.slug));
  return [...databaseArticles, ...staticArticles.filter((article) => !databaseSlugs.has(article.slug)).map(staticAsPublished)];
}

export async function getPublishedArticleBySlug(slug: string): Promise<PublishedArticle | null> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { data } = await supabase
      .from("articles")
      .select("id,slug,title,excerpt,body_md,category,cover_image_url,published_at,updated_at,source_url,source_name,correction_note,canonical_url,seo_title,seo_description")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (data) return mapRow(data as ArticleRow);
  }

  const fallback = staticArticles.find((article) => article.slug === slug);
  return fallback ? staticAsPublished(fallback) : null;
}
