"use client";

import { useState, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type ReportTargetType = "post" | "comment" | "profile";
type ReportReason = "spam" | "harassment" | "hate" | "scam" | "other";

type ContentReportButtonProps = {
  targetType: ReportTargetType;
  targetId: string;
  user: User | null;
};

const reasons: { value: ReportReason; label: string }[] = [
  { value: "spam", label: "Spam hoặc quảng cáo" },
  { value: "harassment", label: "Quấy rối hoặc bắt nạt" },
  { value: "hate", label: "Ngôn từ thù ghét" },
  { value: "scam", label: "Lừa đảo hoặc mạo danh" },
  { value: "other", label: "Lý do khác" },
];

export function ContentReportButton({ targetType, targetId, user }: ContentReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("spam");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      setMessage("Hãy đăng nhập để gửi báo cáo.");
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setMessage("Dịch vụ cộng đồng chưa được cấu hình.");
      return;
    }

    setBusy(true);
    setMessage("");
    const payload = {
      reporter_id: user.id,
      target_type: targetType,
      target_post_id: targetType === "post" ? targetId : null,
      target_comment_id: targetType === "comment" ? targetId : null,
      target_profile_id: targetType === "profile" ? targetId : null,
      reason,
      details: details.trim(),
      status: "open",
    };

    const { error } = await supabase.from("content_reports").insert(payload);
    setBusy(false);
    if (error) {
      setMessage(error.code === "23505"
        ? "Báo cáo này đã được gửi trước đó."
        : "Chưa gửi được báo cáo. Vui lòng thử lại sau.");
      return;
    }
    setSent(true);
    setMessage("Đã gửi báo cáo. Cảm ơn bạn đã giúp giữ cộng đồng an toàn.");
  }

  if (sent) return <span className="report-confirmation" role="status">Đã báo cáo</span>;

  return (
    <div className="content-report">
      <button type="button" className="social-text-action report-trigger" onClick={() => setOpen(!open)} aria-expanded={open}>
        Báo cáo
      </button>
      {open ? (
        <form className="report-form" onSubmit={submitReport}>
          {!user ? <p className="report-help">Bạn cần <Link href="/login">đăng nhập</Link> để gửi báo cáo.</p> : null}
          <label>
            <span>Lý do</span>
            <select value={reason} onChange={(event) => setReason(event.target.value as ReportReason)} required>
              {reasons.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <label>
            <span>Thông tin thêm (không bắt buộc)</span>
            <textarea value={details} onChange={(event) => setDetails(event.target.value)} maxLength={500} rows={2} placeholder="Mô tả ngắn gọn vấn đề..." />
          </label>
          <div className="report-actions">
            <button type="button" className="social-text-action" onClick={() => setOpen(false)}>Hủy</button>
            <button type="submit" className="social-small-button" disabled={busy || !user}>{busy ? "Đang gửi…" : "Gửi báo cáo"}</button>
          </div>
          {message ? <p className="social-inline-message" role="status">{message}</p> : null}
        </form>
      ) : null}
    </div>
  );
}
