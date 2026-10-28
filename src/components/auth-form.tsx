"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type AuthMode = "signin" | "signup";

export function AuthForm() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setConfigured(false);
      return;
    }

    setConfigured(true);
    void supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setIsError(true);
      setMessage("Chưa cấu hình Supabase. Hãy thêm URL và Publishable key vào .env.local rồi khởi động lại ứng dụng.");
      return;
    }

    setBusy(true);
    setMessage("");
    setIsError(false);

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/login`,
          },
        });

        if (error) throw error;
        setMessage(
          data.session
            ? "Tạo tài khoản thành công. Bạn đã đăng nhập."
            : "Đã tạo yêu cầu đăng ký. Hãy kiểm tra email để xác nhận tài khoản trước khi đăng nhập.",
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        setMessage("Đăng nhập thành công.");
      }
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    setBusy(true);
    setMessage("");
    const { error } = await supabase.auth.signOut();
    setBusy(false);

    if (error) {
      setIsError(true);
      setMessage(error.message);
      return;
    }

    setMessage("Bạn đã đăng xuất.");
  }

  if (configured === false) {
    return (
      <div className="auth-panel">
        <p className="eyebrow">SUPABASE / CONFIGURATION REQUIRED</p>
        <h2>Chưa kết nối môi trường.</h2>
        <p className="auth-description">
          Thêm <code>NEXT_PUBLIC_SUPABASE_URL</code> và <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>
          vào file <code>.env.local</code>, sau đó khởi động lại máy chủ phát triển.
        </p>
        <p className="auth-footnote">
          Không dùng Database Password, Secret key hoặc service-role key ở trình duyệt.
        </p>
      </div>
    );
  }

  if (user) {
    return (
      <div className="auth-panel">
        <p className="eyebrow">PLAYER ACCOUNT / ACTIVE</p>
        <h2>Chào mừng trở lại.</h2>
        <p className="auth-description">Bạn đang đăng nhập bằng tài khoản <strong>{user.email}</strong>.</p>
        <button className="btn btn-primary" type="button" onClick={handleSignOut} disabled={busy}>
          {busy ? "ĐANG XỬ LÝ..." : "Đăng xuất"}
        </button>
        {message && <p className={`auth-message${isError ? " is-error" : ""}`} role="status">{message}</p>}
      </div>
    );
  }

  return (
    <div className="auth-panel">
      <p className="eyebrow">PLAYER ACCOUNT / LEVELUP ID</p>
      <h2>{mode === "signin" ? "Tiếp tục cuộc chơi." : "Tạo tài khoản LevelUP."}</h2>
      <p className="auth-description">
        {mode === "signin"
          ? "Đăng nhập để bắt đầu xây dựng hồ sơ game thủ của bạn."
          : "Đăng ký bằng email và mật khẩu. Nếu xác nhận email được bật, bạn cần xác nhận trước khi đăng nhập."}
      </p>

      <div className="auth-mode-switch" aria-label="Chọn hình thức tài khoản">
        <button type="button" className={mode === "signin" ? "is-active" : ""} onClick={() => { setMode("signin"); setMessage(""); }}>
          Đăng nhập
        </button>
        <button type="button" className={mode === "signup" ? "is-active" : ""} onClick={() => { setMode("signup"); setMessage(""); }}>
          Tạo tài khoản
        </button>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          <span>Email</span>
          <input
            autoComplete="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="ban@example.com"
            required
          />
        </label>
        <label>
          <span>Mật khẩu</span>
          <input
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Ít nhất 8 ký tự"
            minLength={8}
            required
          />
        </label>
        <button className="btn btn-primary auth-submit" type="submit" disabled={busy}>
          {busy ? "ĐANG XỬ LÝ..." : mode === "signin" ? "Đăng nhập" : "Tạo tài khoản"}
          <span aria-hidden="true">↗</span>
        </button>
      </form>

      {message && <p className={`auth-message${isError ? " is-error" : ""}`} role="status">{message}</p>}
      <p className="auth-footnote">
        Tài khoản dùng Supabase Auth. Không gửi mật khẩu cho LevelUP qua bất kỳ kênh hỗ trợ nào.
      </p>
    </div>
  );
}
