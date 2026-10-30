"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import type { Game } from "@/lib/games";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { ContentReportButton } from "@/components/content-report-button";
import { PlayerAvatar } from "@/components/player-avatar";
import { firstRelation, formatSocialDate, type SocialComment, type SocialLike, type SocialPost, type SocialProfile } from "@/lib/social-types";

type CommunityFeedProps = { games: Game[] };
type FeedMode = "latest" | "following" | "trending";

export function CommunityFeed({ games }: CommunityFeedProps) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<SocialProfile | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [likes, setLikes] = useState<SocialLike[]>([]);
  const [comments, setComments] = useState<SocialComment[]>([]);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [feedMode, setFeedMode] = useState<FeedMode>("latest");
  const [gameFilter, setGameFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [postBody, setPostBody] = useState("");
  const [selectedGame, setSelectedGame] = useState("");
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setAuthReady(true);
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

  const loadFeed = useCallback(async () => {
    if (!authReady) return;
    const request = ++requestId.current;
    const supabase = getSupabaseBrowserClient();
    setLoading(true);
    setLoadError("");

    if (!supabase) {
      setPosts([]);
      setLikes([]);
      setComments([]);
      setLoadError("Chưa kết nối Supabase. Hãy cấu hình môi trường công khai của ứng dụng để mở bảng tin.");
      setLoading(false);
      return;
    }

    if (feedMode === "following" && !user) {
      setPosts([]);
      setLikes([]);
      setComments([]);
      setFollowingIds([]);
      setLoading(false);
      return;
    }

    try {
      let followed: string[] = [];
      if (user) {
        const [profileResult, followResult] = await Promise.all([
          supabase.from("profiles").select("id,username,display_name,avatar_url,bio").eq("id", user.id).maybeSingle(),
          supabase.from("follows").select("following_id").eq("follower_id", user.id),
        ]);
        if (profileResult.error || followResult.error) throw new Error("Không tải được hồ sơ hoặc danh sách theo dõi.");
        setProfile(profileResult.data as SocialProfile | null);
        followed = (followResult.data ?? []).map((row) => row.following_id as string);
      } else {
        setProfile(null);
      }
      if (request !== requestId.current) return;
      setFollowingIds(followed);

      let query = supabase
        .from("posts")
        .select("id,author_id,game_id,body,status,created_at,updated_at,profiles!posts_author_id_fkey(id,username,display_name,avatar_url,bio),games!posts_game_id_fkey(slug,title)")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(30);

      if (feedMode === "following") {
        const authorIds = [user?.id, ...followed].filter((value): value is string => Boolean(value));
        if (authorIds.length === 0) {
          setPosts([]);
          setLikes([]);
          setComments([]);
          setLoading(false);
          return;
        }
        query = query.in("author_id", authorIds);
      }

      const postResult = await query;
      if (postResult.error) throw postResult.error;
      const nextPosts = (postResult.data ?? []) as unknown as SocialPost[];
      if (request !== requestId.current) return;
      setPosts(nextPosts);

      const ids = nextPosts.map((post) => post.id);
      if (ids.length === 0) {
        setLikes([]);
        setComments([]);
      } else {
        const [likeResult, commentResult] = await Promise.all([
          supabase.from("post_likes").select("post_id,user_id").in("post_id", ids),
          supabase.from("post_comments")
            .select("id,post_id,author_id,body,status,created_at,profiles!post_comments_author_id_fkey(id,username,display_name,avatar_url,bio)")
            .eq("status", "published")
            .in("post_id", ids)
            .order("created_at", { ascending: false })
            .limit(120),
        ]);
        if (likeResult.error || commentResult.error) throw new Error("Không tải được lượt thích hoặc bình luận.");
        if (request !== requestId.current) return;
        setLikes((likeResult.data ?? []) as SocialLike[]);
        setComments((commentResult.data ?? []) as unknown as SocialComment[]);
      }
    } catch {
      if (request === requestId.current) {
        setLoadError("Không thể tải bảng tin lúc này. Hãy thử tải lại sau ít phút.");
      }
    } finally {
      if (request === requestId.current) setLoading(false);
    }
  }, [authReady, feedMode, user]);

  useEffect(() => { void loadFeed(); }, [loadFeed]);

  const visiblePosts = useMemo(() => {
    const filtered = posts.filter((post) => (
      gameFilter === "all" || firstRelation(post.games)?.slug === gameFilter
    ));
    if (feedMode !== "trending") return filtered;
    const engagementScore = (postId: string) => (
      likes.reduce((total, like) => total + (like.post_id === postId ? 2 : 0), 0) +
      comments.reduce((total, comment) => total + (comment.post_id === postId ? 3 : 0), 0)
    );
    return [...filtered].sort((a, b) => (
      engagementScore(b.id) - engagementScore(a.id) ||
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ));
  }, [posts, gameFilter, feedMode, likes, comments]);

  async function handlePostSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      setActionMessage("Đăng nhập để chia sẻ bài viết với cộng đồng.");
      return;
    }
    const body = postBody.trim();
    if (!body || body.length > 1200) {
      setActionMessage("Bài viết cần có nội dung từ 1 đến 1.200 ký tự.");
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setActionMessage("Dịch vụ cộng đồng chưa được cấu hình.");
      return;
    }
    setBusyKey("post");
    setActionMessage("");
    try {
      let gameId: string | null = null;
      if (selectedGame) {
        const { data, error } = await supabase.from("games").select("id").eq("slug", selectedGame).maybeSingle();
        if (error || !data) throw new Error("Không tìm thấy game đã chọn.");
        gameId = data.id;
      }
      const { error } = await supabase.from("posts").insert({
        author_id: user.id,
        game_id: gameId,
        body,
        status: "published",
      });
      if (error) throw error;
      setPostBody("");
      setSelectedGame("");
      setActionMessage("Đã đăng bài. Chúc bạn có những cuộc thảo luận vui vẻ!");
      await loadFeed();
    } catch {
      setActionMessage("Chưa đăng được bài. Hãy kiểm tra kết nối và thử lại.");
    } finally {
      setBusyKey(null);
    }
  }

  async function toggleLike(post: SocialPost) {
    if (!user) {
      setActionMessage("Đăng nhập để thả tim và tương tác với game thủ khác.");
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const liked = likes.some((like) => like.post_id === post.id && like.user_id === user.id);
    setBusyKey("like:" + post.id);
    setActionMessage("");
    const result = liked
      ? await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", user.id)
      : await supabase.from("post_likes").insert({ post_id: post.id, user_id: user.id });
    setBusyKey(null);
    if (result.error) {
      setActionMessage("Chưa cập nhật được lượt thích. Hãy thử lại.");
      return;
    }
    await loadFeed();
  }

  async function toggleFollow(author: SocialProfile) {
    if (!user) {
      setActionMessage("Đăng nhập để theo dõi game thủ.");
      return;
    }
    if (user.id === author.id) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const following = followingIds.includes(author.id);
    setBusyKey("follow:" + author.id);
    const result = following
      ? await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", author.id)
      : await supabase.from("follows").insert({ follower_id: user.id, following_id: author.id });
    setBusyKey(null);
    if (result.error) {
      setActionMessage("Chưa cập nhật được danh sách theo dõi. Hãy thử lại.");
      return;
    }
    await loadFeed();
  }

  async function submitComment(event: FormEvent<HTMLFormElement>, postId: string) {
    event.preventDefault();
    if (!user) {
      setActionMessage("Đăng nhập để bình luận.");
      return;
    }
    const body = (commentDrafts[postId] ?? "").trim();
    if (!body || body.length > 1200) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setBusyKey("comment:" + postId);
    const { error } = await supabase.from("post_comments").insert({
      post_id: postId,
      author_id: user.id,
      body,
      status: "published",
    });
    setBusyKey(null);
    if (error) {
      setActionMessage("Chưa gửi được bình luận. Hãy thử lại.");
      return;
    }
    setCommentDrafts((current) => ({ ...current, [postId]: "" }));
    setActionMessage("Bình luận đã được gửi.");
    await loadFeed();
  }

  async function deletePost(post: SocialPost) {
    if (!user || post.author_id !== user.id) return;
    if (!window.confirm("Bạn có chắc muốn xóa bài viết này?")) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setBusyKey("delete:" + post.id);
    const { error } = await supabase.from("posts").delete().eq("id", post.id).eq("author_id", user.id);
    setBusyKey(null);
    if (error) {
      setActionMessage("Không thể xóa bài viết lúc này.");
      return;
    }
    setActionMessage("Đã xóa bài viết.");
    await loadFeed();
  }

  const selectedModeRequiresLogin = feedMode === "following" && !user && authReady;

  return (
    <section className="section social-feed-section">
      <div className="container social-feed-layout">
        <div className="social-feed-main">
          <div className="social-feed-heading">
            <div>
              <p className="eyebrow">SQUAD FEED / COMMUNITY LIVE</p>
              <h2>BẢNG TIN <span>GAME THỦ.</span></h2>
              <p>Chia sẻ pha highlight, xin lời khuyên build đồ hoặc tìm người cùng chiến game.</p>
            </div>
            <button className="social-refresh-button" type="button" onClick={() => void loadFeed()} disabled={loading}>↻ Làm mới</button>
          </div>

          <div className="social-pulse-grid" aria-label="Tổng quan bảng tin hiện tại">
            <div className="social-pulse-card"><span>POSTS IN FEED</span><strong>{posts.length.toString().padStart(2, "0")}</strong><small>Bài gần đây đã tải</small></div>
            <div className="social-pulse-card"><span>REACTIONS</span><strong>{likes.length.toString().padStart(2, "0")}</strong><small>Lượt thích trong feed</small></div>
            <div className="social-pulse-card"><span>DISCUSSIONS</span><strong>{comments.length.toString().padStart(2, "0")}</strong><small>Bình luận đã tải</small></div>
            <div className="social-pulse-card"><span>FOLLOWING</span><strong>{followingIds.length.toString().padStart(2, "0")}</strong><small>Game thủ bạn theo dõi</small></div>
          </div>
          <div className="social-feed-tabs" role="group" aria-label="Chọn bảng tin">
            <button type="button" className={feedMode === "latest" ? "is-active" : ""} aria-pressed={feedMode === "latest"} onClick={() => setFeedMode("latest")}>Mới nhất</button>
            <button type="button" className={feedMode === "trending" ? "is-active" : ""} aria-pressed={feedMode === "trending"} onClick={() => setFeedMode("trending")}>Đang nổi</button>
            <button type="button" className={feedMode === "following" ? "is-active" : ""} aria-pressed={feedMode === "following"} onClick={() => setFeedMode("following")}>Đang theo dõi</button>
          </div>
          <div className="social-game-channels" role="group" aria-label="Lọc bài viết theo game">
            <button type="button" className={gameFilter === "all" ? "is-active" : ""} aria-pressed={gameFilter === "all"} onClick={() => setGameFilter("all")}>Tất cả game</button>
            {games.map((game) => (
              <button type="button" key={game.slug} className={gameFilter === game.slug ? "is-active" : ""} aria-pressed={gameFilter === game.slug} onClick={() => setGameFilter(game.slug)}>{game.title}</button>
            ))}
          </div>

          {user ? (
            <form className="social-composer" onSubmit={handlePostSubmit}>
              <div className="social-composer-top">
                <PlayerAvatar profile={profile} size="large" />
                <div>
                  <p className="eyebrow">PLAYER POST / SHARE YOUR RUN</p>
                  <h3>Bạn đang chơi gì?</h3>
                </div>
              </div>
              <label className="social-sr-label" htmlFor="community-post-body">Nội dung bài viết</label>
              <textarea
                id="community-post-body"
                value={postBody}
                onChange={(event) => setPostBody(event.target.value)}
                maxLength={1200}
                rows={4}
                placeholder="Kể về trận rank vừa rồi, chia sẻ mẹo hay hoặc tìm đồng đội..."
                required
              />
              <div className="social-composer-footer">
                <label className="social-game-select">
                  <span>Gắn game (tùy chọn)</span>
                  <select value={selectedGame} onChange={(event) => setSelectedGame(event.target.value)}>
                    <option value="">Không gắn game</option>
                    {games.map((game) => <option key={game.slug} value={game.slug}>{game.title}</option>)}
                  </select>
                </label>
                <div className="social-composer-submit">
                  <span>{postBody.length}/1200</span>
                  <button type="submit" className="btn btn-primary" disabled={busyKey === "post" || !postBody.trim()}>
                    {busyKey === "post" ? "ĐANG ĐĂNG…" : "Đăng bài"} <span aria-hidden="true">↗</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="social-signin-card">
              <div><p className="eyebrow">YOUR VOICE / YOUR COMMUNITY</p><h3>Tham gia cuộc trò chuyện.</h3><p>Tạo tài khoản để đăng bài, theo dõi game thủ và nhận thông báo khi có người tương tác.</p></div>
              <Link href="/login" className="btn btn-primary">Tham gia LevelUP <span aria-hidden="true">↗</span></Link>
            </div>
          )}

          {actionMessage ? <p className="social-action-message" role="status">{actionMessage}</p> : null}
          {loadError ? (
            <div className="social-error-state" role="alert">
              <strong>Bảng tin đang gặp sự cố.</strong>
              <p>{loadError}</p>
              <button className="btn btn-secondary" type="button" onClick={() => void loadFeed()}>Thử lại</button>
            </div>
          ) : null}

          {selectedModeRequiresLogin ? (
            <div className="social-empty-state">
              <p className="eyebrow">FOLLOWING FEED / SIGN IN REQUIRED</p>
              <h3>Đăng nhập để xem bảng tin của bạn.</h3>
              <p>Bảng tin này tổng hợp bài viết của chính bạn và những người bạn theo dõi.</p>
              <Link href="/login" className="btn btn-primary">Đăng nhập <span aria-hidden="true">↗</span></Link>
            </div>
          ) : loading ? (
            <div className="social-loading-state" role="status"><span className="social-loader" /> Đang tải bài đăng cộng đồng…</div>
          ) : !loadError && visiblePosts.length === 0 ? (
            <div className="social-empty-state">
              <p className="eyebrow">{posts.length > 0 ? "GAME CHANNEL / NO MATCHES" : feedMode === "following" ? "YOUR SQUAD / NO POSTS" : "COMMUNITY / FIRST DROP"}</p>
              <h3>{posts.length > 0 ? "Kênh game này chưa có bài viết." : feedMode === "following" ? "Bảng tin của bạn đang yên ắng." : "Hãy là người mở màn."}</h3>
              <p>{posts.length > 0 ? "Thử chọn game khác hoặc xem tất cả bài đăng trong cộng đồng." : feedMode === "following" ? "Theo dõi game thủ hoặc tự đăng bài để tạo cuộc trò chuyện đầu tiên." : "Chưa có bài đăng công khai. Khi game thủ chia sẻ, bài viết sẽ xuất hiện tại đây."}</p>
              {posts.length > 0 ? <button className="social-text-action" type="button" onClick={() => setGameFilter("all")}>Xem tất cả game ↗</button> : null}
            </div>
          ) : !loadError ? (
            <div className="social-post-list">
              {visiblePosts.map((post) => {
                const author = firstRelation(post.profiles);
                const game = firstRelation(post.games);
                const postComments = comments.filter((comment) => comment.post_id === post.id).slice(0, 3).reverse();
                const liked = Boolean(user && likes.some((like) => like.post_id === post.id && like.user_id === user.id));
                const likeCount = likes.filter((like) => like.post_id === post.id).length;
                const isFollowing = Boolean(author && followingIds.includes(author.id));
                return (
                  <article className="social-post-card" id={"post-" + post.id} key={post.id}>
                    <div className="social-post-header">
                      <PlayerAvatar profile={author} />
                      <div className="social-post-author">
                        {author ? <Link href={"/profile/" + encodeURIComponent(author.username)} className="social-author-name">{author.display_name || author.username}</Link> : <span className="social-author-name">Game thủ LevelUP</span>}
                        <span className="social-author-handle">@{author?.username || "player"}</span>
                        <time dateTime={post.created_at}>{formatSocialDate(post.created_at)}</time>
                      </div>
                      <div className="social-post-menu">
                        {author && user && user.id !== author.id ? (
                          <button className="social-text-action" type="button" disabled={busyKey === "follow:" + author.id} onClick={() => void toggleFollow(author)}>
                            {isFollowing ? "Đang theo dõi" : "+ Theo dõi"}
                          </button>
                        ) : null}
                        {user && post.author_id === user.id ? (
                          <button className="social-text-action is-danger" type="button" disabled={busyKey === "delete:" + post.id} onClick={() => void deletePost(post)}>Xóa</button>
                        ) : null}
                        <ContentReportButton targetType="post" targetId={post.id} user={user} />
                      </div>
                    </div>
                    <p className="social-post-body">{post.body}</p>
                    {game ? <Link className="social-game-tag" href={"/games/" + game.slug}>⌁ {game.title}</Link> : null}
                    <div className="social-post-actions">
                      <button type="button" className={"social-post-action" + (liked ? " is-liked" : "")} onClick={() => void toggleLike(post)} disabled={busyKey === "like:" + post.id} aria-pressed={liked}>
                        <span aria-hidden="true">{liked ? "♥" : "♡"}</span> {likeCount} thích
                      </button>
                      <span className="social-post-action"><span aria-hidden="true">◌</span> {comments.filter((comment) => comment.post_id === post.id).length} bình luận</span>
                      <Link className="social-post-action" href={"/profile/" + encodeURIComponent(author?.username || "")}>Hồ sơ tác giả ↗</Link>
                    </div>
                    {postComments.length > 0 ? (
                      <div className="social-comment-list">
                        {postComments.map((comment) => {
                          const commenter = firstRelation(comment.profiles);
                          return (
                            <div className="social-comment" key={comment.id}>
                              <PlayerAvatar profile={commenter} size="small" />
                              <div className="social-comment-content">
                                <p><strong>{commenter?.display_name || commenter?.username || "Game thủ"}</strong> <span>{formatSocialDate(comment.created_at)}</span></p>
                                <div>{comment.body}</div>
                              </div>
                              <ContentReportButton targetType="comment" targetId={comment.id} user={user} />
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                    <form className="social-comment-form" onSubmit={(event) => void submitComment(event, post.id)}>
                      <label className="social-sr-label" htmlFor={"comment-" + post.id}>Viết bình luận</label>
                      <input
                        id={"comment-" + post.id}
                        value={commentDrafts[post.id] ?? ""}
                        onChange={(event) => setCommentDrafts((current) => ({ ...current, [post.id]: event.target.value }))}
                        maxLength={1200}
                        placeholder={user ? "Viết bình luận tử tế..." : "Đăng nhập để bình luận"}
                        disabled={!user || busyKey === "comment:" + post.id}
                      />
                      <button type="submit" className="social-small-button" disabled={!user || busyKey === "comment:" + post.id || !(commentDrafts[post.id] ?? "").trim()}>
                        {busyKey === "comment:" + post.id ? "Đang gửi…" : "Gửi"}
                      </button>
                    </form>
                  </article>
                );
              })}
            </div>
          ) : null}
        </div>

        <aside className="social-feed-aside">
          <div className="social-aside-card social-aside-profile">
            <p className="eyebrow">PLAYER ID / LEVELUP</p>
            {user ? (
              <>
                <PlayerAvatar profile={profile} size="large" />
                <h3>{profile?.display_name || profile?.username || user.email || "Game thủ"}</h3>
                <p>@{profile?.username || "player"}</p>
                <Link href={profile?.username ? "/profile/" + encodeURIComponent(profile.username) : "/login"} className="social-aside-link">Mở hồ sơ ↗</Link>
              </>
            ) : (
              <>
                <div className="social-aside-glyph" aria-hidden="true">L+</div>
                <h3>Chơi game có hội.</h3>
                <p>Follow người cùng gu, chia sẻ hành trình và tìm squad mới.</p>
                <Link href="/login" className="social-aside-link">Tạo LevelUP ID ↗</Link>
              </>
            )}
          </div>
          <div className="social-aside-card">
            <p className="eyebrow">COMMUNITY RULES / GG WP</p>
            <h3>Giữ cuộc chơi tích cực.</h3>
            <ul>
              <li>Tôn trọng người chơi khác, kể cả khi bất đồng.</li>
              <li>Không spam, lừa đảo, doxxing hoặc quấy rối.</li>
              <li>Dùng chức năng báo cáo khi thấy nội dung vi phạm.</li>
            </ul>
          </div>
          <div className="social-aside-card social-aside-status">
            <p className="eyebrow">SOCIAL CORE / LIVE DATA</p>
            <div><span>Database</span><strong>Supabase</strong></div>
            <div><span>Quyền truy cập</span><strong>RLS enabled</strong></div>
            <div><span>Thông báo</span><strong>Database trigger</strong></div>
            <Link href="/notifications" className="social-aside-link">Mở thông báo ↗</Link>
          </div>
        </aside>
      </div>
    </section>
  );
}
