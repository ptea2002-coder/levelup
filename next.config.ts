import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 7,
    remotePatterns: [
      { protocol: "https", hostname: "cdn.akamai.steamstatic.com", pathname: "/steam/apps/**" },
      { protocol: "https", hostname: "tuta.com", pathname: "/assets/**" },
      { protocol: "https", hostname: "miro.medium.com", pathname: "/**" },
      { protocol: "https", hostname: "images.squarespace-cdn.com", pathname: "/**" },
      { protocol: "https", hostname: "citybrawl.com", pathname: "/data/image/**" },
      { protocol: "https", hostname: "prod.assets.earlygamecdn.com", pathname: "/images/**" },
      { protocol: "https", hostname: "www.windowscentral.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;
