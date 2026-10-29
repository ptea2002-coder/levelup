import type { MetadataRoute } from "next";
import { articles } from "@/lib/articles";
import { getSitemapGames } from "@/lib/game-repository";
import { siteUrl } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const absoluteUrl = (path: string) => new URL(path, siteUrl).toString();
  const games = await getSitemapGames(5000);

  return [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/games"), changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/news"), changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/community"), changeFrequency: "monthly", priority: 0.5 },
    ...games.map((game) => ({
      url: absoluteUrl(`/games/${game.slug}`),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...articles.map((article) => ({
      url: absoluteUrl(`/news/${article.slug}`),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
