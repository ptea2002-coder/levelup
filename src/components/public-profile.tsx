"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { ContentReportButton } from "@/components/content-report-button";
import { PlayerAvatar } from "@/components/player-avatar";
import { firstRelation, formatSocialDate, type SocialPost, type SocialProfile } from "@/lib/social-types";

type PublicProfileProps = { username: string };
type ProfileStats = { posts: number; followers: number; following: number };

export function PublicProfile({ username }: PublicProfileProps) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profile, setProfile] = useState<SocialProfile | null>(null);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [stats, setStats] = useState<ProfileStats>({ posts: 0, followers: 0, following: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setAuthReady(true);
      setLoading(false);
      setError("Chưa kết nối dịch vụ hồ sơ.");
      return;
    }
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthReady(true);
    });
    void supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setAuthReady(true);
    }).catch(() => setAuthReady(true));
    return () => listener.subscription.unsubscribe();
  }, []);

  const loadProfile = useCallback(async () => {
    if (!authReady) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setLoading(false);
      setError("Chưa kết nối dịch vụ hồ sơ.");
      return;
    }
    setLoading(true);
    setError("");
    setNotFound(false);
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id,username,display_name,avatar_url,bio,created_at")
        .eq("username", username)
        .maybeSingle();
      if (profileError) throw profileError;
      if (!profileData) {
        setNotFound(true);
        setProfile(null);
        setPosts([]);
        return;
      }

      const currentProfile = profileData as SocialProfile;
      const [postResult, postCount, followerCount, followingCount, followResult] = await Promise.all([
        supabase.from("posts")
          .select("id,author_id,game_id,body,status,created_at,updated_at,profiles!posts_author_id_fkey(id,username,display_name,avatar_url,bio),games!posts_game_id_fkey(slug,title)")
          .eq("author_id", currentProfile.id)
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .limit(30),
        supabase.from("posts").select("id", { count: "exact", head: true }).eq("author_id", currentProfile.id).eq("status", "published"),
        supabase.from("follows").select("follower_id", { count: "exact", head: true }).eq("following_id", currentProfile.id),
        supabase.from("follows").select("following_id", { count: "exact", head: true }).eq("follower_id", currentProfile.id),
        user && user.id !== currentProfile.id
          ? supabase.from("follows").select("following_id").eq("follower_id", user.id).eq("following_id", currentProfile.id).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ]);
      if (postResult.error || postCount.error || followerCount.error || followingCount.error || followResult.error) {
        throw new Error("Không tải được dữ liệu hồ sơ.");
      }
      setProfile(currentProfile);
      setDisplayName(currentProfile.display_name || "");
      setBio(currentProfile.bio || "");
      setPosts((postResult.data ?? []) as unknown as SocialPost[]);
      setStats({
        posts: postCount.count ?? 0,
        followers: followerCount.count ?? 0,
        following: followingCount.count ?? 0,
      });
      setIsFollowing(Boolean(followResult.data));
    } catch {
      setError("Không thể tải hồ sơ lúc này. Hãy thử lại sau.");
    } finally {
      setLoading(false);
    }
  }, [authReady, user, username]);

  useEffect(() => { void loadProfile(); }, [loadProfile]);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !profile || user.id !== profile.id) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const cleanName = displayName.trim();
    const cleanBio = bio.trim();
    if (cleanName.length > 80 || cleanBio.length > 240) {
      setMessage("Tên hiển thị tối đa 80 ký tự, giới thiệu tối đa 240 ký tự.");
      return;
    }
    setSaving(true);
    setMessage("");
    const { error: updateError } = await supabase.from("profiles").update({
      display_name: cleanName,
      bio: cleanBio,
    }).eq("id", user.id);
    setSaving(false);
    if (updateError) {
      setMessage("Chưa lưu được hồ sơ. Hãy thử lại.");
      return;
    }
    setMessage("Hồ sơ đã được lưu.");
    await loadProfile();
  }

  async function toggleFollow() {
    if (!user || !profile || user.id === profile.id) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setSaving(true);
    const result = isFollowing
      ? await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", profile.id)
      : await supabase.from("follows").insert({ follower_id: user.id, following_id: profile.id });
    setSaving(false);
    if (result.error) {
      setMessage("Chưa cập nhật được trạng thái theo dõi.");
      return;
    }
    await loadProfile();
  }

  const isOwnProfile = Boolean(user && profile && user.id === profile.id);

  return (
    <>
      <section className="page-hero profile-hero">
        <div className="container">
          <p className="eyebrow">PLAYER ID / PUBLIC PROFILE</p>
          <h1>PLAYER<br /><span>PROFILE.</span></h1>
          <p>Danh tính gaming, hành trình và những cuộc trò chuyện của một thành viên LevelUP.</p>
        </div>
      </section>
      <section className="section profile-section">
        <div className="container">
          {loading ? <div className="social-loading-state" role="status"><span className="social-loader" /> Đang tải hồ sơ…</div> : null}
          {error ? <div className="social-error-state" role="alert"><p>{error}</p><button className="btn btn-secondary" type="button" onClick={() => void loadProfile()}>Thử lại</button></div> : null}
          {!loading && !error && notFound ? (
            <div className="social-empty-state"><p className="eyebrow">PLAYER NOT FOUND / 404</p><h2>Không tìm thấy game thủ này.</h2><p>Username có thể đã thay đổi hoặc hồ sơ không còn tồn tại.</p><Link href="/community" className="btn btn-primary">Về bảng tin ↗</Link></div>
          ) : null}
          {!loading && !error && profile ? (
            <div className="public-profile-layout">
              <aside className="public-profile-card">
                <div className="profile-cover-art" aria-hidden="true"><span>LEVELUP / PLAYER</span></div>
                <div className="profile-card-main">
                  <PlayerAvatar profile={profile} size="large" />
                  <div className="profile-identity">
                    <h2>{profile.display_name || profile.username}</h2>
                    <p>@{profile.username}</p>
                  </div>
                  <p className="profile-bio">{profile.bio || "Game thủ LevelUP — sẵn sàng cho trận tiếp theo."}</p>
                  <div className="profile-stats">
                    <div><strong>{stats.posts}</strong><span>Bài viết</span></div>
                    <div><strong>{stats.followers}</strong><span>Follower</span></div>
                    <div><strong>{stats.following}</strong><span>Đang theo dõi</span></div>
                  </div>
                  {isOwnProfile ? (
                    <form className="profile-edit-form" onSubmit={saveProfile}>
                      <p className="eyebrow">EDIT YOUR PLAYER CARD</p>
                      <label><span>Tên hiển thị</span><input value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={80} placeholder="Tên game thủ" /></label>
                      <label><span>Giới thiệu</span><textarea value={bio} onChange={(event) => setBio(event.target.value)} maxLength={240} rows={3} placeholder="Game main, rank, server hoặc gu chơi..." /></label>
                      <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? "ĐANG LƯU…" : "Lưu hồ sơ"}</button>
                      {message ? <p className="social-inline-message" role="status">{message}</p> : null}
                    </form>
                  ) : (
                    <div className="profile-follow-actions">
                      {user ? (
                        <button type="button" className="btn btn-primary" onClick={() => void toggleFollow()} disabled={saving}>{saving ? "Đang cập nhật…" : isFollowing ? "Đang theo dõi ✓" : "＋ Theo dõi"}</button>
                      ) : <Link className="btn btn-primary" href="/login">Đăng nhập để theo dõi</Link>}
                      {user && user.id !== profile.id ? <ContentReportButton targetType="profile" targetId={profile.id} user={user} /> : null}
                    </div>
                  )}
                  {profile.created_at ? <p className="profile-joined">Thành viên từ {new Intl.DateTimeFormat("vi-VN", { month: "long", year: "numeric" }).format(new Date(profile.created_at))}</p> : null}
                </div>
              </aside>

              <div className="profile-posts-column">
                <div className="profile-posts-heading"><div><p className="eyebrow">PLAYER LOG / PUBLIC POSTS</p><h2>HÀNH TRÌNH <span>GAMING.</span></h2></div><Link href="/community" className="social-text-action">Bảng tin ↗</Link></div>
                {posts.length === 0 ? <div className="social-empty-state"><h3>Chưa có bài đăng công khai.</h3><p>Khi game thủ chia sẻ lên bảng tin, các bài viết sẽ xuất hiện ở đây.</p></div> : (
                  <div className="profile-post-list">
                    {posts.map((post) => {
                      const game = firstRelation(post.games);
                      return (
                        <article className="profile-post-card" key={post.id}>
                          <p className="profile-post-date">{formatSocialDate(post.created_at)}</p>
                          <p>{post.body}</p>
                          {game ? <Link href={"/games/" + game.slug} className="social-game-tag">⌁ {game.title}</Link> : null}
                          <Link href={"/community#post-" + post.id} className="profile-post-open">Mở thảo luận ↗</Link>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
