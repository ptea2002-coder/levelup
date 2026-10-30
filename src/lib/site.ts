const defaultSiteUrl = "https://levelup-nine-flame.vercel.app";

function resolveSiteUrl(): URL {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configured) return new URL(defaultSiteUrl);

  try {
    const candidate = new URL(configured);
    if (candidate.protocol === "https:" || candidate.hostname === "localhost") return candidate;
  } catch {
    // Fall through to the stable production URL for malformed environment values.
  }

  return new URL(defaultSiteUrl);
}

export const siteUrl = resolveSiteUrl();

export const isPublicProduction = process.env.VERCEL_ENV
  ? process.env.VERCEL_ENV === "production"
  : process.env.NODE_ENV === "production";
