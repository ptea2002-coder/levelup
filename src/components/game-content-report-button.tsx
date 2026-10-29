"use client";

import { useState, type FormEvent } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type GameContentReportButtonProps = {
  userId: string;
  targetType: "review" | "game_comment";
  targetId: string;
};

const reasonOptions = [
  { value: "spam", label: "Spam / quảng cáo" },
  { value: "harassment", label: "Quấy rối" },
  { value: "hate", label: "Thù ghét / xúc phạm" },
  { value: "scam", label: "Lừa đảo" },
  { value: "other", label: "Khác" },
];

export function GameContentReportButton({ userId, targetType, targetId }: GameContentReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("other");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Chưa kết nối được hệ thống báo cáo.");
      return;
    }

    setBusy(true);
    const payload = targetType === "review"
      ? {
          reporter_id: userId,
          target_type: "review",
          target_review_id: targetId,
          target_game_comment_id: null,
          reason,
          details: details.trim(),
          status: "open",
        }
      : {
          reporter_id: userId,
          target_type: "game_comment",
          target_review_id: null,
          target_game_comment_id: targetId,
          reason,
          details: details.trim(),
          status: "open",
        };
    const { error: reportError } = await supabase.from("content_reports").insert(payload);
    setBusy(false);

    if (reportError) {
      setError("Không gửi được báo cáo. Nội dung của bạn có thể đã được báo cáo hoặc không còn khả dụng.");
      return;
    }

    setMessage("Đã gửi báo cáo để đội ngũ kiểm duyệt xem xét.");
    setOpen(false);
    setDetails("");
  }

  return (
    <div className="game-community-report">
      <button type="button" className="game-community-text-button" aria-expanded={open} onClick={() => { setOpen((value) => !value); setError(""); }}>
        {open ? "Đóng báo cáo" : "Báo cáo nội dung"}
      </button>
      {open ? (
        <form className="game-community-report-form" onSubmit={submitReport}>
          <label>
            Lý do
            <select value={reason} onChange={(event) => setReason(event.target.value)} disabled={busy}>
              {reasonOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label>
            Thông tin thêm (không bắt buộc)
            <textarea value={details} onChange={(event) => setDetails(event.target.value)} maxLength={500} rows={2} disabled={busy} placeholder="Mô tả ngắn lý do báo cáo…" />
          </label>
          {error ? <p className="game-community-error" role="alert">{error}</p> : null}
          <button type="submit" className="social-small-button is-danger" disabled={busy}>{busy ? "Đang gửi…" : "Gửi báo cáo"}</button>
        </form>
      ) : null}
      {message ? <p className="game-community-report-message" role="status">{message}</p> : null}
    </div>
  );
}
