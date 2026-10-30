"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function CommunityNavStatus() {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState("");
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    void supabase.auth.getUser().then(({ data }) => setUser(data.user)).catch(() => setUser(null));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let active = true;
    async function loadNavStatus() {
      if (!user) {
        setUsername("");
        setUnread(0);
        return;
      }
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;
      const [profileResult, countResult] = await Promise.all([
        supabase.from("profiles").select("username").eq("id", user.id).maybeSingle(),
        supabase.from("notifications").select("id", { count: "exact", head: true }).eq("recipient_id", user.id).is("read_at", null),
      ]);
      if (!active) return;
      setUsername(profileResult.data?.username ?? "");
      setUnread(countResult.count ?? 0);
    }
    void loadNavStatus();
    return () => { active = false; };
  }, [user]);

  if (!user) return null;

  return (
    <div className="nav-social-status" aria-label="Lối tắt cộng đồng">
      {username ? <Link href={"/profile/" + encodeURIComponent(username)} className="nav-social-profile">Hồ sơ</Link> : null}
      <Link href="/notifications" className="nav-social-notifications" aria-label={"Thông báo, " + unread + " chưa đọc"}>
        <span aria-hidden="true">◉</span>
        <span>Thông báo</span>
        {unread > 0 ? <span className="nav-unread-count">{unread > 99 ? "99+" : unread}</span> : null}
      </Link>
    </div>
  );
}
