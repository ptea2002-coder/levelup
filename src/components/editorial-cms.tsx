"use client";

import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type ArticleStatus = "draft" | "published" | "archived";
type ArticleRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body_md: string;
  status: ArticleStatus;
  category: string;
  cover_image_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  canonical_url: string | null;
  source_url: string | null;
  source_name: string | null;
  correction_note: string | null;
  author_id: string | null;
  published_at: string | null;
  updated_at: string;
};

type ArticleDraft = {
  id: string | null;
  slug: string;
  title: string;
  excerpt: string;
  body_md: string;
  status: ArticleStatus;
  category: string;
  cover_image_url: string;
  seo_title: string;
  seo_description: string;
  canonical_url: string;
  source_url: string;
  source_name: string;
  correction_note: string;
  author_id: string | null;
};

const emptyDraft: ArticleDraft = {
  id: null, slug: "", title: "", excerpt: "", body_md: "", status: "draft", category: "LEVELUP EDITORIAL",
  cover_image_url: "", seo_title: "", seo_description: "", canonical_url: "", source_url: "", source_name: "", correction_note: "", author_id: null,
};

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100);
}

function safeHttpUrl(value: string) {
  if (!value.trim()) return true;
  try { const url = new URL(value); return url.protocol === "https:" || url.protocol === "http:"; } catch { return false; }
}

function toDraft(article: ArticleRow): ArticleDraft {
  return {
    id: article.id, slug: article.slug, title: article.title, excerpt: article.excerpt, body_md: article.body_md,
    status: article.status, category: article.category || "LEVELUP EDITORIAL", cover_image_url: article.cover_image_url || "",
    seo_title: article.seo_title || "", seo_description: article.seo_description || "", canonical_url: article.canonical_url || "",
    source_url: article.source_url || "", source_name: article.source_name || "", correction_note: article.correction_note || "",
    author_id: article.author_id,
  };
}

export function EditorialCms() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [draft, setDraft] = useState<ArticleDraft>(emptyDraft);
  const [preview, setPreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const role = user?.app_metadata?.role;
  const canEdit = role === "admin" || role === "editor";

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setAuthReady(true); setLoading(false); setError("Chưa kết nối Supabase."); return;
    }
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null); setAuthReady(true);
    });
    void supabase.auth.getUser().then(({ data }) => { setUser(data.user); setAuthReady(true); }).catch(() => setAuthReady(true));
    return () => listener.subscription.unsubscribe();
  }, []);

  const loadArticles = useCallback(async () => {
    if (!authReady || !canEdit) { setLoading(false); return; }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setLoading(false); setError("Chưa kết nối Supabase."); return; }
    setLoading(true); setError("");
    const { data, error: queryError } = await supabase.from("articles")
      .select("id,slug,title,excerpt,body_md,status,category,cover_image_url,seo_title,seo_description,canonical_url,source_url,source_name,correction_note,author_id,published_at,updated_at")
      .order("updated_at", { ascending: false }).limit(100);
    if (queryError) { setArticles([]); setError("Không tải được bản thảo. Hãy xác nhận role admin/editor trong app_metadata."); }
    else setArticles((data ?? []) as ArticleRow[]);
    setLoading(false);
  }, [authReady, canEdit]);

  useEffect(() => { void loadArticles(); }, [loadArticles]);

  const wordCount = useMemo(() => draft.body_md.trim().split(/\s+/).filter(Boolean).length, [draft.body_md]);

  function setField<K extends keyof ArticleDraft>(key: K, value: ArticleDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function editArticle(article: ArticleRow) {
    setDraft(toDraft(article)); setPreview(false); setError(""); setMessage("");
  }

  async function uploadCover(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)) {
      setError("Ảnh bìa chỉ hỗ trợ JPG, PNG, WebP hoặc AVIF."); return;
    }
    if (file.size > 5 * 1024 * 1024) { setError("Ảnh bìa tối đa 5 MB."); return; }
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !canEdit) return;
    setBusy(true); setError(""); setMessage("");
    const baseName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-80) || "cover";
    const path = `articles/${user?.id}/${Date.now()}-${baseName}`;
    const { error: uploadError } = await supabase.storage.from("editorial-media").upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) setError("Không tải được ảnh. Kiểm tra quyền editor/admin và thử lại.");
    else {
      const { data } = supabase.storage.from("editorial-media").getPublicUrl(path);
      setField("cover_image_url", data.publicUrl);
      setMessage("Đã tải ảnh bìa lên thư viện biên tập.");
    }
    setBusy(false);
  }

  async function saveArticle(event: FormEvent<HTMLFormElement>, nextStatus?: ArticleStatus) {
    event.preventDefault();
    if (!canEdit || !user) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setError("Chưa kết nối Supabase."); return; }
    const title = draft.title.trim();
    const slug = slugify(draft.slug || title);
    if (title.length < 5 || title.length > 180) { setError("Tiêu đề cần từ 5 đến 180 ký tự."); return; }
    if (!slug) { setError("Slug không hợp lệ."); return; }
    if (draft.excerpt.trim().length < 20) { setError("Mô tả ngắn cần ít nhất 20 ký tự."); return; }
    if (draft.body_md.trim().length < 50) { setError("Nội dung cần ít nhất 50 ký tự."); return; }
    if (!safeHttpUrl(draft.source_url) || !safeHttpUrl(draft.canonical_url) || !safeHttpUrl(draft.cover_image_url)) {
      setError("URL nguồn, canonical và ảnh phải là địa chỉ HTTP/HTTPS hợp lệ."); return;
    }

    const status = nextStatus ?? draft.status;
    if (status === "published" && (
      draft.body_md.includes("[Viết nội dung nguyên bản") ||
      draft.body_md.includes("Đây là đầu mối tin tức từ nguồn bên ngoài") ||
      draft.excerpt.startsWith("Tin tham khảo từ ")
    )) {
      setError("Bản nháp News Intelligence vẫn còn nội dung giữ chỗ. Hãy xác minh dữ kiện, viết nội dung nguyên bản và cập nhật mô tả trước khi xuất bản.");
      return;
    }
    const payload = {
      slug, title, excerpt: draft.excerpt.trim(), body_md: draft.body_md.trim(), status,
      category: draft.category.trim() || "LEVELUP EDITORIAL",
      cover_image_url: draft.cover_image_url.trim() || null,
      seo_title: draft.seo_title.trim() || null,
      seo_description: draft.seo_description.trim() || null,
      canonical_url: draft.canonical_url.trim() || null,
      source_url: draft.source_url.trim() || null,
      source_name: draft.source_name.trim() || null,
      correction_note: draft.correction_note.trim() || null,
      author_id: draft.author_id || user.id,
      published_by: status === "published" ? user.id : null,
      published_at: status === "published" ? (draft.id ? articles.find((article) => article.id === draft.id)?.published_at : null) || new Date().toISOString() : null,
      archived_at: status === "archived" ? new Date().toISOString() : null,
    };
    setBusy(true); setError(""); setMessage("");
    const result = draft.id
      ? await supabase.from("articles").update(payload).eq("id", draft.id).select("id").maybeSingle()
      : await supabase.from("articles").insert(payload).select("id").maybeSingle();
    setBusy(false);
    if (result.error || !result.data) {
      setError(result.error?.code === "23505" ? "Slug này đã được dùng. Hãy chọn slug khác." : "Không lưu được bài. Có thể tài khoản chưa có quyền editor/admin.");
      return;
    }
    setDraft((current) => ({ ...current, id: result.data!.id, slug, status }));
    setMessage(status === "published" ? "Đã xuất bản bài viết." : status === "archived" ? "Đã lưu vào kho lưu trữ." : "Đã lưu bản nháp.");
    await loadArticles();
  }

  async function archiveArticle(article: ArticleRow) {
    if (!canEdit) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setBusy(true); setError(""); setMessage("");
    const { error: archiveError } = await supabase.from("articles").update({ status: "archived", archived_at: new Date().toISOString() }).eq("id", article.id);
    setBusy(false);
    if (archiveError) setError("Không thể lưu trữ bài viết.");
    else { setMessage("Đã lưu trữ bài viết."); if (draft.id === article.id) setField("status", "archived"); await loadArticles(); }
  }

  if (!authReady || loading) return <section className="section"><div className="container editorial-state" role="status">Đang kiểm tra quyền biên tập…</div></section>;
  if (!user) return <section className="section"><div className="container editorial-state"><h2>Đăng nhập để tiếp tục.</h2><a className="btn btn-primary" href="/login">Đăng nhập ↗</a></div></section>;
  if (!canEdit) return <section className="section"><div className="container editorial-state is-error" role="alert"><h2>Không có quyền truy cập.</h2><p>CMS yêu cầu role <code>admin</code> hoặc <code>editor</code> trong Supabase Auth app_metadata. Quyền không được đọc từ user_metadata có thể tự chỉnh sửa.</p></div></section>;

  return (
    <section className="section editorial-section">
      <div className="container">
        <div className="editorial-toolbar">
          <div><p className="eyebrow">EDITORIAL CONTROL / {role?.toString().toUpperCase()}</p><h2>STORY<br /><span>WORKSHOP.</span></h2><p className="editorial-subtitle">Soạn, xem trước, xuất bản và lưu trữ nội dung. Quyền ghi được kiểm tra lại ở PostgreSQL RLS.</p></div>
          <button className="btn btn-primary" type="button" onClick={() => { setDraft(emptyDraft); setPreview(false); setError(""); setMessage(""); }}>+ Bài mới</button>
        </div>
        {error ? <p className="editorial-alert is-error" role="alert">{error}</p> : null}
        {message ? <p className="editorial-alert is-success" role="status">{message}</p> : null}
        <div className="editorial-layout">
          <aside className="editorial-list">
            <div className="editorial-list-head"><strong>BẢN THẢO & BÀI VIẾT</strong><span>{articles.length}</span></div>
            {articles.length === 0 ? <p className="editorial-muted">Chưa có bài trong CMS. Tạo bài đầu tiên ở bên cạnh.</p> : null}
            {articles.map((article) => (
              <button key={article.id} type="button" className={"editorial-list-item" + (draft.id === article.id ? " is-selected" : "")} onClick={() => editArticle(article)}>
                <span className={"editorial-status is-" + article.status}>{article.status === "published" ? "ĐÃ XUẤT BẢN" : article.status === "archived" ? "LƯU TRỮ" : "BẢN NHÁP"}</span>
                <strong>{article.title}</strong><small>{article.slug}</small>
              </button>
            ))}
          </aside>
          <div className="editorial-workspace">
            <form className="editorial-form" onSubmit={(event) => void saveArticle(event)}>
              <div className="editorial-form-head"><div><p className="eyebrow">CONTENT RECORD</p><h3>{draft.id ? "Chỉnh sửa bài viết" : "Tạo bản nháp"}</h3></div><span>{wordCount} từ</span></div>
              <label>Tiêu đề *<input required minLength={5} maxLength={180} value={draft.title} onChange={(event) => { setField("title", event.target.value); if (!draft.id || !draft.slug) setField("slug", slugify(event.target.value)); }} placeholder="Tiêu đề bài viết" /></label>
              <label>Slug *<input required maxLength={100} pattern="[a-z0-9-]+" value={draft.slug} onChange={(event) => setField("slug", slugify(event.target.value))} placeholder="ten-bai-viet" /></label>
              <div className="editorial-two-col">
                <label>Chuyên mục<input maxLength={80} value={draft.category} onChange={(event) => setField("category", event.target.value)} /></label>
                <label>Trạng thái<select value={draft.status} onChange={(event) => setField("status", event.target.value as ArticleStatus)}><option value="draft">Bản nháp</option><option value="published">Xuất bản</option><option value="archived">Lưu trữ</option></select></label>
              </div>
              <label>Mô tả ngắn *<textarea required minLength={20} maxLength={320} rows={3} value={draft.excerpt} onChange={(event) => setField("excerpt", event.target.value)} placeholder="Tóm tắt hữu ích, rõ ràng cho độc giả và công cụ tìm kiếm." /></label>
              <label>Nội dung Markdown *<textarea className="editorial-body-input" required minLength={50} rows={15} value={draft.body_md} onChange={(event) => setField("body_md", event.target.value)} placeholder={"## Tiêu đề phần\n\nViết nội dung ở đây…\n\n## Phần tiếp theo\n\nThêm dữ kiện và bối cảnh."} /></label>
              <div className="editorial-field-help">Hỗ trợ tiêu đề ##, đoạn văn và gạch đầu dòng. Nội dung được hiển thị dưới dạng text an toàn; HTML nhúng không được thực thi.</div>
              <div className="editorial-two-col">
                <label>URL ảnh bìa<input type="url" value={draft.cover_image_url} onChange={(event) => setField("cover_image_url", event.target.value)} placeholder="https://…" /></label>
                <label>Tải ảnh (JPG/PNG/WebP/AVIF, tối đa 5 MB)<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={busy} onChange={(event) => void uploadCover(event)} /></label>
              </div>
              {draft.cover_image_url ? <div className="editorial-cover-preview"><img src={draft.cover_image_url} alt="Xem trước ảnh bìa" /><button type="button" className="editorial-text-button" onClick={() => setField("cover_image_url", "")}>Gỡ ảnh</button></div> : null}
              <div className="editorial-divider" />
              <p className="eyebrow">SEO & PROVENANCE</p>
              <div className="editorial-two-col">
                <label>SEO title<input maxLength={180} value={draft.seo_title} onChange={(event) => setField("seo_title", event.target.value)} placeholder="Mặc định dùng tiêu đề" /></label>
                <label>SEO description<input maxLength={320} value={draft.seo_description} onChange={(event) => setField("seo_description", event.target.value)} placeholder="Mặc định dùng mô tả ngắn" /></label>
              </div>
              <label>Canonical URL (không bắt buộc)<input type="url" value={draft.canonical_url} onChange={(event) => setField("canonical_url", event.target.value)} placeholder="https://levelup…" /></label>
              <div className="editorial-two-col">
                <label>Tên nguồn<input maxLength={120} value={draft.source_name} onChange={(event) => setField("source_name", event.target.value)} placeholder="Nhà phát hành / nguồn dữ kiện" /></label>
                <label>URL nguồn<input type="url" value={draft.source_url} onChange={(event) => setField("source_url", event.target.value)} placeholder="https://…" /></label>
              </div>
              <label>Ghi chú cập nhật / đính chính<textarea maxLength={1200} rows={2} value={draft.correction_note} onChange={(event) => setField("correction_note", event.target.value)} placeholder="Ghi rõ nội dung đã sửa và thời điểm nếu có." /></label>
              <div className="editorial-actions">
                <button type="submit" className="btn btn-secondary" disabled={busy}>{busy ? "Đang lưu…" : "Lưu trạng thái"}</button>
                <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => setPreview((value) => !value)}>{preview ? "Đóng xem trước" : "Xem trước"}</button>
                <button type="button" className="btn btn-primary" disabled={busy} onClick={(event) => { const form = event.currentTarget.form; if (form) void saveArticle({ preventDefault: () => {}, currentTarget: form } as unknown as FormEvent<HTMLFormElement>, "published"); }}>Xuất bản ↗</button>
                {draft.id && draft.status !== "archived" ? <button type="button" className="editorial-archive-button" disabled={busy} onClick={() => { const item = articles.find((article) => article.id === draft.id); if (item) void archiveArticle(item); }}>Lưu trữ</button> : null}
              </div>
            </form>
            {preview ? <article className="editorial-preview"><p className="eyebrow">PREVIEW / CHƯA CÔNG KHAI</p>{draft.cover_image_url ? <img className="editorial-preview-cover" src={draft.cover_image_url} alt="" /> : null}<p className="editorial-preview-category">{draft.category}</p><h2>{draft.title || "Tiêu đề bài viết"}</h2><p className="editorial-preview-lead">{draft.excerpt || "Mô tả ngắn sẽ xuất hiện tại đây."}</p>{draft.body_md.split(/\n\s*\n/).filter(Boolean).map((block, index) => block.trim().startsWith("#") ? <h3 key={index}>{block.replace(/^#+\s*/, "")}</h3> : <p key={index}>{block.replace(/^[-*]\s+/gm, "• ").replace(/\*\*(.*?)\*\*/g, "$1")}</p>)}{draft.source_url ? <p className="editorial-preview-source">Nguồn: <a href={draft.source_url} target="_blank" rel="noopener noreferrer">{draft.source_name || draft.source_url}</a></p> : null}</article> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
