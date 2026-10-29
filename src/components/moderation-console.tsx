"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatSocialDate, firstRelation, type SocialProfile } from "@/lib/social-types";

type ReportRow = {
  id: string;
  target_type: "post" | "comment" | "profile" | "review" | "game_comment";
  target_post_id: string | null;
  target_comment_id: string | null;
  target_profile_id: string | null;
  target_review_id: string | null;
  target_game_comment_id: string | null;
  reason: string;
  details: string;
  status: "open" | "reviewed" | "actioned" | "dismissed";
  created_at: string;
  reporter: SocialProfile | SocialProfile[] | null;
  post: { id: string; body: string; status: string } | { id: string; body: string; status: string }[] | null;
  comment: { id: string; body: string; status: string } | { id: string; body: string; status: string }[] | null;
  target_profile: SocialProfile | SocialProfile[] | null;
  review: { id: string; rating: number; title: string; body: string; status: string } | { id: string; rating: number; title: string; body: string; status: string }[] | null;
  game_comment: { id: string; body: string; status: string } | { id: string; body: string; status: string }[] | null;
};

export function ModerationConsole() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setAuthReady(true);
      setLoading(false);
      setError("Chưa kết nối Supabase.");
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

  const isAdmin = user?.app_metadata?.role === "admin";

  const loadReports = useCallback(async () => {
    if (!authReady) return;
    if (!isAdmin) {
      setReports([]);
      setLoading(false);
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
    const { data, error: queryError } = await supabase
      .from("content_reports")
      .select("id,target_type,target_post_id,target_comment_id,target_profile_id,target_review_id,target_game_comment_id,reason,details,status,created_at,reporter:profiles!content_reports_reporter_id_fkey(id,username,display_name,avatar_url),post:posts!content_reports_target_post_id_fkey(id,body,status),comment:post_comments!content_reports_target_comment_id_fkey(id,body,status),target_profile:profiles!content_reports_target_profile_id_fkey(id,username,display_name,avatar_url),review:reviews!content_reports_target_review_id_fkey(id,rating,title,body,status),game_comment:comments!content_reports_target_game_comment_id_fkey(id,body,status)")
      .eq("status", "open")
      .order("created_at", { ascending: true })
      .limit(100);
    if (queryError) {
      setError("Không tải được hàng đợi kiểm duyệt. Hãy xác nhận quyền admin và chính sách RLS.");
      setReports([]);
    } else {
      setReports((data ?? []) as unknown as ReportRow[]);
    }
    setLoading(false);
  }, [authReady, isAdmin]);

  useEffect(() => { void loadReports(); }, [loadReports]);

  async function resolveReport(report: ReportRow, action: "dismiss" | "hide") {
    if (!isAdmin) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setBusyId(report.id);
    setMessage("");
    let contentError: { message: string } | null = null;
    if (action === "hide" && report.target_type === "post" && report.target_post_id) {
      const result = await supabase.from("posts").update({ status: "hidden" }).eq("id", report.target_post_id);
      contentError = result.error;
    } else if (action === "hide" && report.target_type === "comment" && report.target_comment_id) {
      const result = await supabase.from("post_comments").update({ status: "hidden" }).eq("id", report.target_comment_id);
      contentError = result.error;
    } else if (action === "hide" && report.target_type === "review" && report.target_review_id) {
      const result = await supabase.from("reviews").update({ status: "rejected" }).eq("id", report.target_review_id);
      contentError = result.error;
    } else if (action === "hide" && report.target_type === "game_comment" && report.target_game_comment_id) {
      const result = await supabase.from("comments").update({ status: "rejected" }).eq("id", report.target_game_comment_id);
      contentError = result.error;
    }
    if (contentError) {
      setBusyId("");
      setMessage("Không thể ẩn nội dung. Hãy kiểm tra quyền quản trị trong app_metadata.");
      return;
    }
    const { error: reportError } = await supabase.from("content_reports")
      .update({ status: action === "dismiss" ? "dismissed" : "actioned" })
      .eq("id", report.id);
    setBusyId("");
    if (reportError) {
      setMessage("Nội dung đã được xử lý, nhưng trạng thái báo cáo chưa cập nhật.");
      return;
    }
    setMessage(action === "dismiss" ? "Đã đóng báo cáo." : "Đã xử lý báo cáo.");
    await loadReports();
  }

  return (
    <section className="section moderation-section">
      <div className="container">
        {!authReady || loading ? <div className="social-loading-state" role="status"><span className="social-loader" /> Đang kiểm tra quyền truy cập…</div> : null}
        {authReady && !user ? <div className="social-empty-state"><h2>Đăng nhập quản trị viên.</h2><p>Công cụ này chỉ dành cho tài khoản được cấp role admin ở app_metadata.</p><Link href="/login" className="btn btn-primary">Đăng nhập ↗</Link></div> : null}
        {authReady && user && !isAdmin ? <div className="social-error-state" role="alert"><h2>Không có quyền truy cập.</h2><p>Quyền quản trị phải được cấp an toàn qua Supabase Auth app_metadata, không phải user_metadata.</p></div> : null}
        {message ? <p className="social-action-message" role="status">{message}</p> : null}
        {isAdmin && error ? <div className="social-error-state" role="alert"><p>{error}</p><button type="button" className="btn btn-secondary" onClick={() => void loadReports()}>Thử lại</button></div> : null}
        {isAdmin && !loading && !error && reports.length === 0 ? <div className="social-empty-state"><p className="eyebrow">QUEUE CLEAR / TRUST & SAFETY</p><h2>Không có báo cáo đang chờ.</h2><p>Khi người chơi gửi báo cáo mới, mục này sẽ xuất hiện ở đây.</p></div> : null}
        {isAdmin && reports.length > 0 ? (
          <div className="moderation-report-list">
            {reports.map((report) => {
              const reporter = firstRelation(report.reporter);
              const post = firstRelation(report.post);
              const comment = firstRelation(report.comment);
              const targetProfile = firstRelation(report.target_profile);
              const review = firstRelation(report.review);
              const gameComment = firstRelation(report.game_comment);
              const targetText = report.target_type === "post" ? post?.body : report.target_type === "comment" ? comment?.body : report.target_type === "review" ? review ? review.rating + "/10 · " + review.title + "\n" + review.body : "Đánh giá không còn tồn tại" : report.target_type === "game_comment" ? gameComment?.body : targetProfile ? "@" + targetProfile.username : "Nội dung không còn tồn tại";
              return (
                <article className="moderation-report-card" key={report.id}>
                  <div className="moderation-report-top"><span className="moderation-reason">{report.reason}</span><time>{formatSocialDate(report.created_at)}</time></div>
                  <p className="moderation-report-meta">Báo cáo bởi @{reporter?.username || "player"} · Loại: {report.target_type}</p>
                  <blockquote>{targetText || "Nội dung trống hoặc đã bị xóa."}</blockquote>
                  {report.details ? <p className="moderation-report-details">Thông tin thêm: {report.details}</p> : null}
                  <div className="moderation-report-actions">
                    {report.target_type !== "profile" ? <button type="button" className="social-small-button is-danger" disabled={busyId === report.id} onClick={() => void resolveReport(report, "hide")}>{busyId === report.id ? "Đang xử lý…" : "Ẩn nội dung & xử lý"}</button> : null}
                    <button type="button" className="social-small-button" disabled={busyId === report.id} onClick={() => void resolveReport(report, "dismiss")}>Đóng báo cáo</button>
                    {targetProfile?.username ? <Link href={"/profile/" + encodeURIComponent(targetProfile.username)} className="social-text-action">Mở hồ sơ ↗</Link> : null}
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
