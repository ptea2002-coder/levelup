export type SocialProfile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio?: string | null;
  created_at?: string;
};

export type GameLink = {
  slug: string;
  title: string;
};

export type SocialPost = {
  id: string;
  author_id: string;
  game_id: string | null;
  body: string;
  status: "published" | "hidden";
  created_at: string;
  updated_at: string;
  profiles: SocialProfile | SocialProfile[] | null;
  games: GameLink | GameLink[] | null;
};

export type SocialLike = {
  post_id: string;
  user_id: string;
};

export type SocialComment = {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  status: "published" | "hidden";
  created_at: string;
  profiles: SocialProfile | SocialProfile[] | null;
};

export function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return (value[0] as T | undefined) ?? null;
  return (value as T | null | undefined) ?? null;
}

export function formatSocialDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Vừa đây";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
