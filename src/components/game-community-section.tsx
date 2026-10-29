"use client";

import Link from "next/link";
import { GameContentReportButton } from "@/components/game-content-report-button";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatSocialDate } from "@/lib/social-types";

type AuthorSummary = {
  username: string;
  display_name: string | null;
};

type Relation<T> = T | T[] | null;

type GameReview = {
  id: string;
  user_id: string;
  rating: number;
  title: string;
  body: string;
  status: "pending" | "published" | "rejected";
  created_at: string;
  author: Relation<AuthorSummary>;
};

type GameComment = {
  id: string;
  user_id: string;
  body: string;
  status: "pending" | "published" | "rejected";
  created_at: string;
  author: Relation<AuthorSummary>;
};

function firstRelation<T>(value: Relation<T> | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function statusLabel(status: GameReview["status"]) {
  if (status === "pending") return "Đang chờ duyệt";
  if (status === "rejected") return "Chưa được duyệt";
  return "Đã xuất bản";
}

export function GameCommunitySection({ gameSlug, gameTitle }: { gameSlug: string; gameTitle: string }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [gameId, setGameId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<GameReview[]>([]);
  const [comments, setComments] = useState<GameComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewBody, setReviewBody] = useState("");
  const [rating, setRating] = useState("8");
  const [commentBody, setCommentBody] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [commentError, setCommentError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyAction, setBusyAction] = useState("");

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setAuthReady(true);
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
      setAuthReady(true);
    });

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!error) setUserId(data.session?.user.id ?? null);
      setAuthReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadCommunity = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setLoadError("Chưa kết nối được cơ sở dữ liệu cộng đồng.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError("");
    try {
      const { data: game, error: gameError } = await supabase
        .from("games")
        .select("id")
        .eq("slug", gameSlug)
        .maybeSingle();

      if (gameError || !game?.id) {
        setLoadError("Không tìm thấy game trong catalog để tải nội dung cộng đồng.");
        setGameId(null);
        setReviews([]);
        setComments([]);
        setLoading(false);
        return;
      }

      setGameId(game.id);
      const [reviewResult, commentResult] = await Promise.all([
        supabase
          .from("reviews")
          .select("id,user_id,rating,title,body,status,created_at,author:profiles!reviews_user_id_fkey(username,display_name)")
          .eq("game_id", game.id)
          .order("created_at", { ascending: false })
          .limit(30),
        supabase
          .from("comments")
          .select("id,user_id,body,status,created_at,author:profiles!comments_user_id_fkey(username,display_name)")
          .eq("game_id", game.id)
          .order("created_at", { ascending: false })
          .limit(30),
      ]);

      if (reviewResult.error || commentResult.error) {
        setLoadError("Không thể tải đánh giá hoặc thảo luận. Hãy thử tải lại trang.");
        setReviews([]);
        setComments([]);
      } else {
        setReviews((reviewResult.data ?? []) as unknown as GameReview[]);
        setComments((commentResult.data ?? []) as unknown as GameComment[]);
      }
    } catch {
      setLoadError("Kết nối cộng đồng bị gián đoạn. Hãy thử lại sau.");
      setReviews([]);
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [gameSlug]);

  useEffect(() => {
    if (authReady) void loadCommunity();
  }, [authReady, loadCommunity, userId]);

  const visibleReviews = useMemo(
    () => reviews.filter((review) => review.status === "published" || review.user_id === userId),
    [reviews, userId],
  );
  const publishedReviews = useMemo(
    () => visibleReviews.filter((review) => review.status === "published"),
    [visibleReviews],
  );
  const ownReview = visibleReviews.find((review) => review.user_id === userId);
  const visibleComments = useMemo(
    () => comments.filter((comment) => comment.status === "published" || comment.user_id === userId),
    [comments, userId],
  );
  const averageRating = publishedReviews.length
    ? (publishedReviews.reduce((total, review) => total + review.rating, 0) / publishedReviews.length).toFixed(1)
    : null;

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setReviewError("");
    setNotice("");
    if (!userId || !gameId) {
      setReviewError("Hãy đăng nhập để gửi đánh giá.");
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setReviewError("Chưa kết nối được cơ sở dữ liệu cộng đồng.");
      return;
    }

    setBusyAction("review-submit");
    const { error } = await supabase.from("reviews").insert({
      game_id: gameId,
      user_id: userId,
      rating: Number(rating),
      title: reviewTitle.trim(),
      body: reviewBody.trim(),
      status: "pending",
    });
    setBusyAction("");

    if (error) {
      setReviewError(error.message.includes("rate_limit_exceeded")
        ? "Bạn đã gửi quá nhiều đánh giá gần đây. Hãy đợi một lúc rồi thử lại."
        : error.code === "23505"
          ? "Bạn đã gửi đánh giá cho game này rồi."
          : "Không gửi được đánh giá. Hãy kiểm tra nội dung và thử lại.");
      return;
    }

    setReviewTitle("");
    setReviewBody("");
    setNotice("Đánh giá đã gửi và đang chờ kiểm duyệt.");
    await loadCommunity();
  }

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCommentError("");
    setNotice("");
    if (!userId || !gameId) {
      setCommentError("Hãy đăng nhập để tham gia thảo luận.");
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setCommentError("Chưa kết nối được cơ sở dữ liệu cộng đồng.");
      return;
    }

    setBusyAction("comment-submit");
    const { error } = await supabase.from("comments").insert({
      game_id: gameId,
      user_id: userId,
      body: commentBody.trim(),
      status: "pending",
    });
    setBusyAction("");

    if (error) {
      setCommentError(error.message.includes("rate_limit_exceeded")
        ? "Bạn đang gửi bình luận quá nhanh. Hãy đợi vài phút rồi thử lại."
        : "Không gửi được bình luận. Hãy kiểm tra nội dung và thử lại.");
      return;
    }

    setCommentBody("");
    setNotice("Bình luận đã gửi và đang chờ kiểm duyệt.");
    await loadCommunity();
  }

  async function removeOwnItem(kind: "review" | "comment", id: string) {
    if (!userId) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setBusyAction(kind + ":" + id);
    setReviewError("");
    setCommentError("");

    const result = kind === "review"
      ? await supabase.from("reviews").delete().eq("id", id).eq("user_id", userId)
      : await supabase.from("comments").delete().eq("id", id).eq("user_id", userId);

    setBusyAction("");
    if (result.error) {
      setNotice("");
      if (kind === "review") setReviewError("Không thể rút đánh giá này.");
      else setCommentError("Không thể xóa bình luận này.");
      return;
    }

    setNotice(kind === "review" ? "Đã rút đánh giá." : "Đã xóa bình luận.");
    await loadCommunity();
  }

  return (
    <section className="section game-community-section" aria-labelledby="game-community-heading">
      <div className="container">
        <div className="section-head">
          <div>
            <p className="eyebrow">PLAYER SIGNAL / COMMUNITY</p>
            <h2 id="game-community-heading">ĐÁNH GIÁ &<br /><span>THẢO LUẬN.</span></h2>
          </div>
          <p className="section-aside">
            Chia sẻ trải nghiệm thực tế. Nội dung mới sẽ được kiểm duyệt trước khi hiển thị công khai.
          </p>
        </div>

        {notice ? <p className="game-community-notice" role="status">{notice}</p> : null}
        {loadError ? <p className="game-community-error" role="alert">{loadError}</p> : null}
        {loading ? <p className="game-community-loading" role="status">Đang tải đánh giá và thảo luận…</p> : null}

        <div className="game-community-grid">
          <section className="game-community-panel" aria-labelledby="game-reviews-heading">
            <header className="game-community-panel-head">
              <div>
                <p className="eyebrow">01 / PLAYER REVIEWS</p>
                <h3 id="game-reviews-heading">Đánh giá <span>game</span></h3>
              </div>
              <div className="game-community-rating-summary" aria-label="Điểm đánh giá cộng đồng">
                <strong>{averageRating ?? "—"}</strong>
                <span>{publishedReviews.length} đánh giá công khai / 10</span>
              </div>
            </header>

            {ownReview ? (
              <div className="game-community-own-state">
                <span className={"game-community-status is-" + ownReview.status}>{statusLabel(ownReview.status)}</span>
                <p>{ownReview.status === "published" ? "Bạn đã đánh giá game này." : ownReview.status === "pending" ? "Đánh giá của bạn chỉ hiển thị với bạn cho đến khi được duyệt." : "Đánh giá chưa được duyệt. Bạn có thể xóa và gửi lại bản đã chỉnh sửa."}</p>
                {ownReview.status !== "published" ? (
                  <button type="button" className="game-community-text-button" disabled={busyAction === "review:" + ownReview.id} onClick={() => void removeOwnItem("review", ownReview.id)}>
                    {busyAction === "review:" + ownReview.id ? "Đang xử lý…" : "Rút đánh giá"}
                  </button>
                ) : null}
              </div>
            ) : userId ? (
              <form className="game-community-form" onSubmit={submitReview}>
                <label>
                  Điểm của bạn
                  <select value={rating} onChange={(event) => setRating(event.target.value)} disabled={busyAction === "review-submit"}>
                    {Array.from({ length: 10 }, (_, index) => index + 1).reverse().map((score) => <option value={score} key={score}>{score}/10</option>)}
                  </select>
                </label>
                <label>
                  Tiêu đề đánh giá
                  <input value={reviewTitle} onChange={(event) => setReviewTitle(event.target.value)} minLength={3} maxLength={100} required placeholder="Điểm mạnh nhất của game?" />
                </label>
                <label>
                  Trải nghiệm của bạn
                  <textarea value={reviewBody} onChange={(event) => setReviewBody(event.target.value)} minLength={20} maxLength={5000} rows={4} required placeholder={"Chia sẻ điều bạn thích hoặc chưa thích ở " + gameTitle + "…"} />
                </label>
                {reviewError ? <p className="game-community-error" role="alert">{reviewError}</p> : null}
                <button type="submit" className="btn btn-primary" disabled={busyAction === "review-submit" || !gameId}>
                  {busyAction === "review-submit" ? "Đang gửi…" : "Gửi đánh giá chờ duyệt"}
                </button>
              </form>
            ) : (
              <div className="game-community-sign-in">
                <p>Đăng nhập để đánh giá game và lưu bài đánh giá vào hồ sơ của bạn.</p>
                <Link href="/login" className="btn btn-secondary">Đăng nhập ↗</Link>
              </div>
            )}

            <div className="game-community-list">
              {visibleReviews.filter((review) => review.status === "published" || review.user_id === userId).map((review) => {
                const author = firstRelation(review.author);
                return (
                  <article className="game-community-entry" key={review.id}>
                    <div className="game-community-entry-head">
                      <div>
                        <strong>{author?.display_name || author?.username || "Game thủ LevelUP"}</strong>
                        <time>{formatSocialDate(review.created_at)}</time>
                      </div>
                      <strong className="game-community-review-score">{review.rating}/10</strong>
                    </div>
                    <h4>{review.title}</h4>
                    <p>{review.body}</p>
                    {review.status !== "published" ? <span className={"game-community-status is-" + review.status}>{statusLabel(review.status)}</span> : null}
                    {review.status === "published" && userId && review.user_id !== userId ? <GameContentReportButton userId={userId} targetType="review" targetId={review.id} /> : null}
                  </article>
                );
              })}
              {!loading && visibleReviews.length === 0 ? <p className="game-community-empty">Chưa có đánh giá công khai. Hãy là người đầu tiên chia sẻ góc nhìn của bạn.</p> : null}
            </div>
          </section>

          <section className="game-community-panel" aria-labelledby="game-comments-heading">
            <header className="game-community-panel-head">
              <div>
                <p className="eyebrow">02 / OPEN DISCUSSION</p>
                <h3>Thảo luận <span>cộng đồng</span></h3>
              </div>
              <span className="game-community-count">{visibleComments.filter((comment) => comment.status === "published").length} bình luận công khai</span>
            </header>

            {userId ? (
              <form className="game-community-form" onSubmit={submitComment}>
                <label>
                  Bình luận của bạn
                  <textarea value={commentBody} onChange={(event) => setCommentBody(event.target.value)} maxLength={3000} rows={3} required placeholder={"Bạn muốn chia sẻ gì về " + gameTitle + "?"} />
                </label>
                {commentError ? <p className="game-community-error" role="alert">{commentError}</p> : null}
                <button type="submit" className="btn btn-primary" disabled={busyAction === "comment-submit" || !gameId}>
                  {busyAction === "comment-submit" ? "Đang gửi…" : "Gửi bình luận chờ duyệt"}
                </button>
              </form>
            ) : (
              <div className="game-community-sign-in">
                <p>Đăng nhập để tham gia thảo luận. Bình luận mới sẽ được duyệt trước khi công khai.</p>
                <Link href="/login" className="btn btn-secondary">Đăng nhập ↗</Link>
              </div>
            )}

            <div className="game-community-list">
              {visibleComments.map((comment) => {
                const author = firstRelation(comment.author);
                return (
                  <article className="game-community-entry" key={comment.id}>
                    <div className="game-community-entry-head">
                      <div>
                        <strong>{author?.display_name || author?.username || "Game thủ LevelUP"}</strong>
                        <time>{formatSocialDate(comment.created_at)}</time>
                      </div>
                    </div>
                    <p>{comment.body}</p>
                    {comment.status !== "published" ? (
                      <div className="game-community-entry-actions">
                        <span className={"game-community-status is-" + comment.status}>{statusLabel(comment.status)}</span>
                        {comment.user_id === userId ? <button type="button" className="game-community-text-button" disabled={busyAction === "comment:" + comment.id} onClick={() => void removeOwnItem("comment", comment.id)}>Xóa</button> : null}
                      </div>
                    ) : null}
                    {comment.status === "published" && userId && comment.user_id !== userId ? <GameContentReportButton userId={userId} targetType="game_comment" targetId={comment.id} /> : null}
                  </article>
                );
              })}
              {!loading && visibleComments.length === 0 ? <p className="game-community-empty">Chưa có bình luận. Mở đầu cuộc trò chuyện một cách tôn trọng và hữu ích.</p> : null}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
