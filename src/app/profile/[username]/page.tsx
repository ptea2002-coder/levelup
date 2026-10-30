import type { Metadata } from "next";
import { PublicProfile } from "@/components/public-profile";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type ProfilePageProps = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  const supabase = getSupabaseServerClient();
  if (!supabase) return { title: "Hồ sơ game thủ" };

  const { data } = await supabase
    .from("profiles")
    .select("username,display_name,bio")
    .eq("username", username)
    .maybeSingle();

  const title = data?.display_name || data?.username || "Hồ sơ game thủ";
  const description = data?.bio || "Khám phá hồ sơ, bài đăng và hoạt động của game thủ trên LevelUP.";
  return {
    title,
    description,
    alternates: { canonical: "/profile/" + encodeURIComponent(username) },
    openGraph: { type: "profile", title: title + " | LevelUP", description },
    twitter: { card: "summary", title: title + " | LevelUP", description },
  };
}

export default async function PublicProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  return <main className="page-main"><PublicProfile username={username} /></main>;
}
