"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { PlayerAvatar } from "@/components/player-avatar";
import { firstRelation, formatSocialDate, type SocialProfile } from "@/lib/social-types";

type NotificationRow = {
  id: string;
  kind: "follow" | "like" | "comment";
  post_id: string | null;
  comment_id: string | null;
  read_at: string | null;
  created_at: string;
  actor: SocialProfile | SocialProfile[] | null;
};

export function NotificationsInbox() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setAuthReady(true);
      setLoading(false);
      setError("Chưa kết nối dịch vụ tài khoản.");
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

  const loadNotifications = useCallback(async () => {
    if (!authReady) return;
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Chưa kết nối dịch vụ thông báo.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    const { data, error: queryError } = await supabase
      .from("notifications")
      .select("id,kind,post_id,comment_id,read_at,created_at,actor:profiles!notifications_actor_id_fkey(id,username,display_name,avatar_url,bio)")
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);
    if (queryError) {
      setError("Không tải được thông báo. Hãy thử lại sau.");
      setNotifications([]);
    } else {
      setNotifications((data ?? []) as unknown as NotificationRow[]);
    }
    setLoading(false);
  }, [authReady, user]);

  useEffect(() => { void loadNotifications(); }, [loadNotifications]);

  async function markAllRead() {
    if (!user) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setBusy(true);
    const now = new Date().toISOString();
    const { error: updateError } = await supabase.from("notifications").update({ read_at: now }).eq("recipient_id", user.id).is("read_at", null);
    setBusy(false);
    if (updateError) {
      setError("Không thể đánh dấu đã đọc. Hãy thử lại.");
      return;
    }
    setNotifications((items) => items.map((item) => ({ ...item, read_at: item.read_at ?? now })));
  }

  async function markRead(notification: NotificationRow) {
    if (!notification.read_at && user) {
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        const now = new Date().toISOString();
        const { error: updateError } = await supabase.from("notifications").update({ read_at: now }).eq("id", notification.id).eq("recipient_id", user.id);
        if (!updateError) setNotifications((items) => items.map((item) => item.id === notification.id ? { ...item, read_at: now } : item));
      }
    }
  }

  const unreadCount = notifications.filter((item) => !item.read_at).length;

  return (
    <section className="section notifications-section">
      <div className="container notifications-container">
        {!authReady || loading ? <div className="social-loading-state" role="status"><span className="social-loader" /> Đang tải thông báo…</div> : null}
        {authReady && !user ? (
          <div className="social-empty-state">
            <p className="eyebrow">PLAYER ALERTS / SIGN IN REQUIRED</p>
            <h2>Đăng nhập để xem thông báo.</h2>
            <p>Hoạt động cộng đồng được gắn với tài khoản LevelUP của bạn.</p>
            <Link href="/login" className="btn btn-primary">Đăng nhập <span aria-hidden="true">↗</span></Link>
          </div>
        ) : null}
        {user && !loading ? (
          <>
            <div className="notifications-heading">
              <div><p className="eyebrow">YOUR ACTIVITY / LAST 100</p><h2>HOẠT ĐỘNG <span>CỦA BẠN.</span></h2><p>{unreadCount} thông báo chưa đọc</p></div>
              <button type="button" className="social-small-button" onClick={() => void markAllRead()} disabled={busy || unreadCount === 0}>{busy ? "Đang cập nhật…" : "Đánh dấu đã đọc"}</button>
            </div>
            {error ? <div className="social-error-state" role="alert"><p>{error}</p><button className="btn btn-secondary" type="button" onClick={() => void loadNotifications()}>Thử lại</button></div> : null}
            {!error && notifications.length === 0 ? (
              <div className="social-empty-state"><p className="eyebrow">INBOX CLEAR / GG</p><h3>Chưa có thông báo mới.</h3><p>Khi có người theo dõi, thích hoặc bình luận bài viết của bạn, hoạt động sẽ xuất hiện ở đây.</p><Link href="/community" className="btn btn-primary">Mở bảng tin ↗</Link></div>
            ) : null}
            <div className="notification-list">
              {notifications.map((notification) => {
                const actor = firstRelation(notification.actor);
                const label = notification.kind === "follow" ? "đã bắt đầu theo dõi bạn" : notification.kind === "like" ? "đã thích bài đăng của bạn" : "đã bình luận bài đăng của bạn";
                const href = notification.post_id ? "/community#post-" + notification.post_id : actor?.username ? "/profile/" + encodeURIComponent(actor.username) : "/community";
                return (
                  <Link key={notification.id} href={href} className={"notification-item" + (notification.read_at ? "" : " is-unread")} onClick={() => void markRead(notification)}>
                    <PlayerAvatar profile={actor} />
                    <div className="notification-copy">
                      <p><strong>{actor?.display_name || actor?.username || "Một game thủ"}</strong> {label}.</p>
                      <time dateTime={notification.created_at}>{formatSocialDate(notification.created_at)}</time>
                    </div>
                    {!notification.read_at ? <span className="notification-unread-dot" aria-label="Chưa đọc" /> : null}
                  </Link>
                );
              })}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
