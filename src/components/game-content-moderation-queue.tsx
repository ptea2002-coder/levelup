"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatSocialDate } from "@/lib/social-types";

type Relation<T> = T | T[] | null;
type Author = { username: string; display_name: string | null };
type GameRef = { title: string; slug: string };
type ArticleRef = { title: string; slug: string };

type ReviewQueueItem = {
  id: string;
  rating: number;
  title: string;
  body: string;
  created_at: string;
  game: Relation<GameRef>;
  author: Relation<Author>;
};

type CommentQueueItem = {
  id: string;
  body: string;
  created_at: string;
  game: Relation<GameRef>;
  article: Relation<ArticleRef>;
  author: Relation<Author>;
};

function first<T>(value: Relation<T>): T | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

export function GameContentModerationQueue() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [reviews, setReviews] = useState<ReviewQueueItem[]>([]);
  const [comments, setComments] = useState<CommentQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setAuthReady(true);
      setLoading(false);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthReady(true);
    });
    void supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setAuthReady(true);
    }).catch(() => setAuthReady(true));

    return () => subscription.unsubscribe();
  }, []);

  const isAdmin = user?.app_metadata?.role === "admin";

  const loadQueue = useCallback(async () => {
    if (!authReady) return;
    if (!isAdmin) {
      setLoading(false);
      setReviews([]);
      setComments([]);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Chưa kết nối Supabase.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    const [reviewResult, commentResult] = await Promise.all([
      supabase.from("reviews")
        .select("id,rating,title,body,created_at,game:games!reviews_game_id_fkey(title,slug),author:profiles!reviews_user_id_fkey(username,display_name)")
        .eq("status", "pending")
        .order("created_at", { ascending: true })
        .limit(100),
      supabase.from("comments")
        .select("id,body,created_at,game:games!comments_game_id_fkey(title,slug),article:articles!comments_article_id_fkey(title,slug),author:profiles!comments_user_id_fkey(username,display_name)")
        .eq("status", "pending")
        .order("created_at", { ascending: true })
        .limit(100),
    ]);

    if (reviewResult.error || commentResult.error) {
      setError("Không tải được hàng đợi đánh giá/bình luận. Hãy xác nhận role admin và chính sách RLS.");
      setReviews([]);
      setComments([]);
    } else {
      setReviews((reviewResult.data ?? []) as unknown as ReviewQueueItem[]);
      setComments((commentResult.data ?? []) as unknown as CommentQueueItem[]);
    }
    setLoading(false);
  }, [authReady, isAdmin]);

  useEffect(() => { void loadQueue(); }, [loadQueue]);

  async function moderate(kind: "review" | "comment", id: string, status: "published" | "rejected") {
    if (!isAdmin) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setBusyId(kind + ":" + id);
    setMessage("");
    const result = kind === "review"
      ? await supabase.from("reviews").update({ status }).eq("id", id).eq("status", "pending")
      : await supabase.from("comments").update({ status }).eq("id", id).eq("status", "pending");
    setBusyId("");
    if (result.error) {
      setError("Không thể cập nhật trạng thái. Hãy kiểm tra quyền admin và RLS.");
      return;
    }
    setMessage(kind === "review" ? "Đã cập nhật đánh giá." : "Đã cập nhật bình luận.");
    await loadQueue();
  }

  if (!authReady || !isAdmin) return null;

  return (
    <section className="section moderation-section game-content-moderation">
      <div className="container">
        <div className="section-head">
          <div>
            <p className="eyebrow">TRUST & SAFETY / GAME CONTENT</p>
            <h2>REVIEWS &<br /><span>COMMENTS QUEUE.</span></h2>
          </div>
          <p className="section-aside">Duyệt nội dung trước khi xuất hiện công khai. Mọi thay đổi trạng thái đều được bảo vệ bằng RLS phía database.</p>
        </div>
        {message ? <p className="social-action-message" role="status">{message}</p> : null}
        {error ? <div className="social-error-state" role="alert"><p>{error}</p><button type="button" className="btn btn-secondary" onClick={() => void loadQueue()}>Thử lại</button></div> : null}
        {loading ? <div className="social-loading-state" role="status"><span className="social-loader" /> Đang tải hàng đợi…</div> : null}
        {!loading && !error && reviews.length === 0 && comments.length === 0 ? <div className="social-empty-state"><p className="eyebrow">QUEUE CLEAR</p><h2>Không có nội dung chờ duyệt.</h2></div> : null}

        {reviews.length > 0 ? (
          <div className="moderation-report-list">
            <h3>Đánh giá game ({reviews.length})</h3>
            {reviews.map((review) => {
              const author = first(review.author);
              const game = first(review.game);
              return (
                <article className="moderation-report-card" key={review.id}>
                  <div className="moderation-report-top"><span className="moderation-reason">{review.rating}/10 · {review.title}</span><time>{formatSocialDate(review.created_at)}</time></div>
                  <p className="moderation-report-meta">@{author?.username ?? "player"} · {game?.title ?? "Game không xác định"}</p>
                  <blockquote>{review.body}</blockquote>
                  <div className="moderation-report-actions">
                    <button type="button" className="social-small-button" disabled={busyId === "review:" + review.id} onClick={() => void moderate("review", review.id, "published")}>Duyệt đánh giá</button>
                    <button type="button" className="social-small-button is-danger" disabled={busyId === "review:" + review.id} onClick={() => void moderate("review", review.id, "rejected")}>Từ chối</button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}

        {comments.length > 0 ? (
          <div className="moderation-report-list">
            <h3>Bình luận game / bài viết ({comments.length})</h3>
            {comments.map((comment) => {
              const author = first(comment.author);
              const game = first(comment.game);
              const article = first(comment.article);
              return (
                <article className="moderation-report-card" key={comment.id}>
                  <div className="moderation-report-top"><span className="moderation-reason">{game?.title ?? article?.title ?? "Nội dung cộng đồng"}</span><time>{formatSocialDate(comment.created_at)}</time></div>
                  <p className="moderation-report-meta">@{author?.username ?? "player"} · {game ? "Game" : "Bài viết"}</p>
                  <blockquote>{comment.body}</blockquote>
                  <div className="moderation-report-actions">
                    <button type="button" className="social-small-button" disabled={busyId === "comment:" + comment.id} onClick={() => void moderate("comment", comment.id, "published")}>Duyệt bình luận</button>
                    <button type="button" className="social-small-button is-danger" disabled={busyId === "comment:" + comment.id} onClick={() => void moderate("comment", comment.id, "rejected")}>Từ chối</button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}
