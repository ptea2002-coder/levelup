import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LevelUP — Play hard. Level up.",
    short_name: "LevelUP",
    description: "Khám phá game, đọc hướng dẫn và kết nối cùng cộng đồng game thủ.",
    start_url: "/",
    display: "standalone",
    background_color: "#090a12",
    theme_color: "#090a12",
    lang: "vi-VN",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
