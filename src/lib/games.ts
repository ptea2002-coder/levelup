export type Game = {
  slug: string;
  title: string;
  category: string;
  genres: string[];
  platforms: string[];
  developer: string;
  releaseYear: number;
  description: string;
  officialUrl: string;
  mark: string;
  artPrimary: string;
  artSecondary: string;
};

export const games: Game[] = [
  {
    slug: "valorant",
    title: "VALORANT",
    category: "FPS",
    genres: ["FPS", "Tactical"],
    platforms: ["PC", "PlayStation 5", "Xbox Series X|S"],
    developer: "Riot Games",
    releaseYear: 2020,
    description: "Tactical shooter 5v5 đặt nặng kỹ năng bắn, phối hợp đội hình và cách sử dụng đặc vụ.",
    officialUrl: "https://playvalorant.com/vi-vn/",
    mark: "V",
    artPrimary: "#f04f66",
    artSecondary: "#22172f",
  },
  {
    slug: "league-of-legends",
    title: "LEAGUE OF LEGENDS",
    category: "MOBA",
    genres: ["MOBA", "Strategy"],
    platforms: ["PC"],
    developer: "Riot Games",
    releaseYear: 2009,
    description: "MOBA 5v5 với hệ thống tướng đa dạng, chiến thuật bản đồ và giao tranh đồng đội.",
    officialUrl: "https://www.leagueoflegends.com/vi-vn/",
    mark: "LoL",
    artPrimary: "#c39b56",
    artSecondary: "#152e4a",
  },
  {
    slug: "counter-strike-2",
    title: "COUNTER-STRIKE 2",
    category: "FPS",
    genres: ["FPS", "Tactical"],
    platforms: ["PC"],
    developer: "Valve",
    releaseYear: 2023,
    description: "FPS chiến thuật xoay quanh kỹ năng ngắm bắn, utility, quản lý kinh tế và phối hợp.",
    officialUrl: "https://www.counter-strike.net/cs2",
    mark: "CS2",
    artPrimary: "#e7a24b",
    artSecondary: "#242c3c",
  },
  {
    slug: "apex-legends",
    title: "APEX LEGENDS",
    category: "Battle Royale",
    genres: ["Battle Royale", "FPS"],
    platforms: ["PC", "PlayStation", "Xbox"],
    developer: "Respawn Entertainment",
    releaseYear: 2019,
    description: "Battle royale nhịp độ cao với movement linh hoạt, kỹ năng nhân vật và chiến thuật theo squad.",
    officialUrl: "https://www.ea.com/games/apex-legends",
    mark: "APEX",
    artPrimary: "#e65a4f",
    artSecondary: "#30203a",
  },
  {
    slug: "genshin-impact",
    title: "GENSHIN IMPACT",
    category: "Action RPG",
    genres: ["Action RPG", "Open World"],
    platforms: ["PC", "PlayStation", "Mobile"],
    developer: "HoYoverse",
    releaseYear: 2020,
    description: "Action RPG thế giới mở tập trung vào khám phá, phản ứng nguyên tố và câu chuyện nhân vật.",
    officialUrl: "https://genshin.hoyoverse.com/",
    mark: "G",
    artPrimary: "#63b9b1",
    artSecondary: "#29305d",
  },
  {
    slug: "elden-ring",
    title: "ELDEN RING",
    category: "Action RPG",
    genres: ["Action RPG", "Soulslike"],
    platforms: ["PC", "PlayStation", "Xbox"],
    developer: "FromSoftware",
    releaseYear: 2022,
    description: "Action RPG thử thách với thế giới mở rộng lớn, chiến đấu có chiều sâu và nhiều bí mật để khám phá.",
    officialUrl: "https://en.bandainamcoent.eu/elden-ring/elden-ring",
    mark: "ER",
    artPrimary: "#d2ad63",
    artSecondary: "#253b37",
  },
];
