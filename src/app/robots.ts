import type { MetadataRoute } from "next";
import { isPublicProduction, siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  if (!isPublicProduction) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
    };
  }

  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
    host: siteUrl.origin,
  };
}
