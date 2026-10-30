"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type SourceStatus = "unreviewed" | "approved" | "denied";
type ReusePolicy = "link_only" | "metadata_excerpt";
type FeedFormat = "rss" | "atom" | "json";

type NewsSource = {
  id: string;
  name: string;
  feed_url: string;
  site_url: string;
  feed_format: FeedFormat;
  license_status: SourceStatus;
  reuse_policy: ReusePolicy;
  license_notes: string | null;
  license_review_url: string | null;
  license_reviewed_at: string | null;
  is_enabled: boolean;
  last_fetched_at: string | null;
  last_error: string | null;
  created_at: string;
};

type IntakeItem = {
  id: string;
  source_id: string;
  canonical_url: string;
  title: string;
  excerpt: string;
  author_name: string | null;
  published_at: string | null;
  fetched_at: string;
  status: "pending" | "converted" | "dismissed";
};

type IngestRun = {
  id: string;
  source_id: string | null;
  started_at: string;
  finished_at: string | null;
  status: "running" | "succeeded" | "failed";
  fetched_count: number;
  inserted_count: number;
  duplicate_count: number;
  error_message: string | null;
};

function isPublicHttpsUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    const isIpLiteral = /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host) || host.startsWith("[");
    return url.protocol === "https:" && !url.username && !url.password && !isIpLiteral &&
      host !== "localhost" && !host.endsWith(".localhost") && !host.endsWith(".local") &&
      !host.endsWith(".internal") && !host.endsWith(".test");
  } catch {
    return false;
  }
}

function formatDate(value: string | null) {
  if (!value) return "Chưa có";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("vi-VN");
}

function sourceStatusLabel(source: NewsSource) {
  if (source.license_status === "denied") return "KHÔNG ĐƯỢC DUYỆT";
  if (source.license_status === "approved" && source.is_enabled) return "ĐÃ DUYỆT · ĐANG BẬT";
  if (source.license_status === "approved") return "ĐÃ DUYỆT · ĐANG TẮT";
  return "CHỜ RÀ SOÁT";
}

function SourceCard({
  source,
  canManage,
  userId,
  onUpdated,
}: {
  source: NewsSource;
  canManage: boolean;
  userId: string;
  onUpdated: () => void;
}) {
  const [reusePolicy, setReusePolicy] = useState<ReusePolicy>(source.reuse_policy);
  const [reviewUrl, setReviewUrl] = useState(source.license_review_url ?? "");
  const [notes, setNotes] = useState(source.license_notes ?? "");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function approveAndEnable() {
    if (!confirmed) {
      setError("Hãy xác nhận đã tự kiểm tra điều khoản và quyền sử dụng của nguồn.");
      return;
    }
    if (!isPublicHttpsUrl(reviewUrl)) {
      setError("URL điều khoản/chính sách phải là HTTPS công khai hợp lệ.");
      return;
    }
    if (notes.trim().length < 20) {
      setError("Ghi chú rà soát cần ít nhất 20 ký tự, nêu rõ cơ sở cho phép lưu metadata.");
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Chưa kết nối Supabase.");
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");
    const { error: updateError } = await supabase.from("news_sources").update({
      license_status: "approved",
      reuse_policy: reusePolicy,
      license_notes: notes.trim(),
      license_review_url: reviewUrl.trim(),
      license_reviewed_at: new Date().toISOString(),
      license_reviewed_by: userId,
      is_enabled: true,
      last_error: null,
    }).eq("id", source.id);

    setBusy(false);
    if (updateError) {
      setError("Không lưu được xác nhận nguồn. Chỉ admin mới có thể duyệt nguồn.");
      return;
    }
    setMessage("Đã lưu xác nhận và bật nguồn. Việc duyệt pháp lý vẫn là trách nhiệm của quản trị viên.");
    setConfirmed(false);
    onUpdated();
  }

  async function disableSource() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setBusy(true);
    setError("");
    setMessage("");
    const { error: updateError } = await supabase.from("news_sources").update({ is_enabled: false }).eq("id", source.id);
    setBusy(false);
    if (updateError) setError("Không thể tắt nguồn.");
    else {
      setMessage("Đã tắt nguồn. Dữ liệu đã nhập vẫn nằm trong hàng chờ riêng tư.");
      onUpdated();
    }
  }

  return (
    <article className="news-intel-source-card">
      <div className="news-intel-source-top">
        <div>
          <p className="news-intel-kicker">{source.feed_format.toUpperCase()} / SOURCE REGISTRY</p>
          <h3>{source.name}</h3>
          <p><a href={source.site_url} target="_blank" rel="noopener noreferrer">{source.site_url}</a></p>
          <p className="news-intel-feed-url"><a href={source.feed_url} target="_blank" rel="noopener noreferrer">{source.feed_url}</a></p>
        </div>
        <span className={"news-intel-status is-" + source.license_status}>{sourceStatusLabel(source)}</span>
      </div>
      <div className="news-intel-source-meta">
        <span>Chính sách: {source.reuse_policy === "link_only" ? "Chỉ tiêu đề + liên kết" : "Cho phép đoạn trích metadata"}</span>
        <span>Lần quét gần nhất: {formatDate(source.last_fetched_at)}</span>
      </div>
      {source.license_review_url ? <p className="news-intel-policy-link">Hồ sơ rà soát: <a href={source.license_review_url} target="_blank" rel="noopener noreferrer">Mở điều khoản tham chiếu ↗</a></p> : null}
      {source.last_error ? <p className="news-intel-error" role="status">Lỗi gần nhất: {source.last_error}</p> : null}
      {canManage ? (
        <div className="news-intel-source-review">
          <label>URL điều khoản / tài liệu quyền sử dụng
            <input type="url" value={reviewUrl} onChange={(event) => setReviewUrl(event.target.value)} placeholder="https://publisher.example/terms" />
          </label>
          <label>Ghi chú rà soát (ít nhất 20 ký tự)
            <textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Nêu rõ điều khoản RSS/API, phạm vi metadata được lưu và căn cứ cho quyết định." />
          </label>
          <label>Phạm vi metadata được phép lưu
            <select value={reusePolicy} onChange={(event) => setReusePolicy(event.target.value as ReusePolicy)}>
              <option value="link_only">Chỉ tiêu đề + liên kết</option>
              <option value="metadata_excerpt">Cho phép đoạn trích ngắn (tối đa 280 ký tự)</option>
            </select>
          </label>
          <label className="news-intel-confirm">
            <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
            Tôi đã tự kiểm tra điều khoản nguồn và có căn cứ để cho phép lưu metadata đã chọn.
          </label>
          {error ? <p className="news-intel-error" role="alert">{error}</p> : null}
          {message ? <p className="news-intel-success" role="status">{message}</p> : null}
          <div className="news-intel-actions">
            <button className="btn btn-primary" type="button" disabled={busy} onClick={() => void approveAndEnable()}>
              {busy ? "Đang lưu…" : "Xác nhận rà soát & bật nguồn"}
            </button>
            {source.is_enabled ? <button className="btn btn-secondary" type="button" disabled={busy} onClick={() => void disableSource()}>Tắt nguồn</button> : null}
          </div>
          <p className="news-intel-legal-note">Chỉ bật nguồn sau khi tự xác minh điều khoản. Hệ thống lưu lại lời xác nhận của admin, không tự kết luận quyền sử dụng là hợp pháp.</p>
        </div>
      ) : null}
    </article>
  );
}

export function NewsIntelligence() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [sources, setSources] = useState<NewsSource[]>([]);
  const [items, setItems] = useState<IntakeItem[]>([]);
  const [runs, setRuns] = useState<IngestRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [feedUrl, setFeedUrl] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [feedFormat, setFeedFormat] = useState<FeedFormat>("rss");

  const role = user?.app_metadata?.role;
  const canReview = role === "admin" || role === "editor";
  const canManageSources = role === "admin";

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

  const loadData = useCallback(async () => {
    if (!authReady || !canReview) {
      setLoading(false);
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setLoading(false);
      setError("Chưa kết nối Supabase.");
      return;
    }

    setLoading(true);
    setError("");
    const [sourceResult, itemResult, runResult] = await Promise.all([
      supabase.from("news_sources").select("id,name,feed_url,site_url,feed_format,license_status,reuse_policy,license_notes,license_review_url,license_reviewed_at,is_enabled,last_fetched_at,last_error,created_at").order("created_at", { ascending: false }).limit(100),
      supabase.from("news_ingest_items").select("id,source_id,canonical_url,title,excerpt,author_name,published_at,fetched_at,status").eq("status", "pending").order("published_at", { ascending: false, nullsFirst: false }).limit(100),
      supabase.from("news_ingest_runs").select("id,source_id,started_at,finished_at,status,fetched_count,inserted_count,duplicate_count,error_message").order("started_at", { ascending: false }).limit(12),
    ]);

    if (sourceResult.error || itemResult.error || runResult.error) {
      setError("Không tải được hàng chờ. Kiểm tra migration P6, Supabase và role admin/editor trong app_metadata.");
      setSources([]);
      setItems([]);
      setRuns([]);
    } else {
      setSources((sourceResult.data ?? []) as NewsSource[]);
      setItems((itemResult.data ?? []) as IntakeItem[]);
      setRuns((runResult.data ?? []) as IngestRun[]);
    }
    setLoading(false);
  }, [authReady, canReview]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function addSource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManageSources || !user) return;
    if (sourceName.trim().length < 3 || !isPublicHttpsUrl(feedUrl) || !isPublicHttpsUrl(siteUrl)) {
      setError("Tên nguồn cần ít nhất 3 ký tự; feed URL và website phải là HTTPS công khai.");
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Chưa kết nối Supabase.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    const { error: insertError } = await supabase.from("news_sources").insert({
      name: sourceName.trim(),
      feed_url: feedUrl.trim(),
      site_url: siteUrl.trim(),
      feed_format: feedFormat,
      created_by: user.id,
    });
    setBusy(false);
    if (insertError) {
      setError(insertError.code === "23505" ? "Feed URL này đã được đăng ký." : "Không tạo được nguồn. Chỉ admin mới được quản lý nguồn tin.");
      return;
    }
    setSourceName("");
    setFeedUrl("");
    setSiteUrl("");
    setFeedFormat("rss");
    setMessage("Đã thêm nguồn ở trạng thái CHỜ RÀ SOÁT; chưa có dữ liệu nào được tải.");
    await loadData();
  }

  async function ingestNow() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !canReview) return;
    setBusy(true);
    setError("");
    setMessage("");
    const { data, error: invokeError } = await supabase.functions.invoke("ingest-news-feeds", { body: {} });
    setBusy(false);
    if (invokeError) {
      setError("Không chạy được pipeline. Hãy triển khai Edge Function ingest-news-feeds và áp dụng migration P6.");
      return;
    }
    const result = data as { sources?: number; fetched?: number; inserted?: number; duplicates?: number; errors?: Array<{ source: string; message: string }>; message?: string };
    const failed = result.errors?.length ?? 0;
    setMessage(result.message ?? ("Đã quét " + (result.sources ?? 0) + " nguồn · nhận " + (result.fetched ?? 0) + " mục · mới " + (result.inserted ?? 0) + " · trùng " + (result.duplicates ?? 0) + (failed ? " · lỗi nguồn " + failed : "") + "."));
    const sourceErrors = failed ? (result.errors ?? []).map((entry) => entry.source + ": " + entry.message).join(" · ") : "";
    await loadData();
    if (sourceErrors) setError(sourceErrors);
  }

  async function createDraft(item: IntakeItem) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setBusy(true);
    setError("");
    setMessage("");
    const { data, error: rpcError } = await supabase.rpc("create_article_draft_from_news_item", { p_item_id: item.id });
    setBusy(false);
    if (rpcError) {
      setError("Không tạo được bản nháp. Kiểm tra quyền editor/admin và trạng thái rà soát của nguồn.");
      return;
    }
    setMessage("Đã tạo bản nháp CMS (ID: " + String(data) + "). Bài chưa được xuất bản.");
    await loadData();
  }

  async function dismissItem(item: IntakeItem) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setBusy(true);
    setError("");
    setMessage("");
    const { error: rpcError } = await supabase.rpc("dismiss_news_ingest_item", {
      p_item_id: item.id,
      p_notes: "Không chọn để biên tập",
    });
    setBusy(false);
    if (rpcError) {
      setError("Không thể bỏ qua mục này. Có thể mục đã được xử lý ở phiên khác.");
      return;
    }
    setMessage("Đã bỏ qua mục tin.");
    await loadData();
  }

  if (!authReady || loading) {
    return <section className="section news-intel-section"><div className="container news-intel-state" role="status">Đang kiểm tra quyền truy cập News Intelligence…</div></section>;
  }
  if (!user) {
    return <section className="section news-intel-section"><div className="container news-intel-state"><h2>Đăng nhập để tiếp tục.</h2><a className="btn btn-primary" href="/login">Đăng nhập ↗</a></div></section>;
  }
  if (!canReview) {
    return <section className="section news-intel-section"><div className="container news-intel-state is-error" role="alert"><h2>Không có quyền truy cập.</h2><p>News Intelligence chỉ dành cho admin/editor được xác thực bằng Supabase Auth app_metadata.</p></div></section>;
  }

  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const enabledSources = sources.filter((source) => source.is_enabled && source.license_status === "approved").length;

  return (
    <section className="section news-intel-section">
      <div className="container">
        {error ? <p className="news-intel-alert is-error" role="alert">{error}</p> : null}
        {message ? <p className="news-intel-alert is-success" role="status">{message}</p> : null}

        <div className="news-intel-overview">
          <div><p className="news-intel-kicker">SOURCE-GATED INGESTION / P6</p><h2>INTELLIGENCE<br /><span>QUEUE.</span></h2><p>Chỉ nhập metadata từ nguồn HTTPS đã được admin rà soát. Mọi mục mới đều chờ người biên tập; pipeline không tự xuất bản.</p></div>
          <div className="news-intel-metrics">
            <div><strong>{sources.length}</strong><span>Nguồn đăng ký</span></div>
            <div><strong>{enabledSources}</strong><span>Nguồn đã duyệt + bật</span></div>
            <div><strong>{items.length}</strong><span>Mục chờ biên tập</span></div>
          </div>
        </div>

        <div className="news-intel-section-heading">
          <div><p className="news-intel-kicker">01 / SOURCE GOVERNANCE</p><h3>Danh mục nguồn tin</h3></div>
          <button className="btn btn-primary" type="button" disabled={busy || enabledSources === 0} onClick={() => void ingestNow()}>{busy ? "Đang xử lý…" : "Quét nguồn đã duyệt ↻"}</button>
        </div>
        <p className="news-intel-legal-note">Mặc định không có nguồn nào được bật. Admin phải lưu URL điều khoản và ghi chú rà soát trước khi kích hoạt. Chế độ “chỉ tiêu đề + liên kết” không lưu đoạn trích; chế độ đoạn trích chỉ giữ tối đa 280 ký tự khi đã được cho phép rõ ràng.</p>

        {canManageSources ? (
          <form className="news-intel-add-form" onSubmit={(event) => void addSource(event)}>
            <div className="news-intel-form-title"><p className="news-intel-kicker">ADMIN ONLY</p><h4>Đăng ký nguồn mới</h4></div>
            <label>Tên nguồn<input required minLength={3} maxLength={120} value={sourceName} onChange={(event) => setSourceName(event.target.value)} placeholder="Ví dụ: Newsroom nhà phát hành" /></label>
            <label>Feed URL (HTTPS)<input required type="url" value={feedUrl} onChange={(event) => setFeedUrl(event.target.value)} placeholder="https://example.com/feed.xml" /></label>
            <div className="news-intel-form-row">
              <label>Website nguồn<input required type="url" value={siteUrl} onChange={(event) => setSiteUrl(event.target.value)} placeholder="https://example.com" /></label>
              <label>Định dạng<select value={feedFormat} onChange={(event) => setFeedFormat(event.target.value as FeedFormat)}><option value="rss">RSS 2.0</option><option value="atom">Atom</option><option value="json">JSON Feed</option></select></label>
            </div>
            <button className="btn btn-secondary" type="submit" disabled={busy}>{busy ? "Đang lưu…" : "+ Thêm ở trạng thái chờ rà soát"}</button>
          </form>
        ) : null}

        <div className="news-intel-source-list">
          {sources.length === 0 ? <div className="news-intel-empty"><h4>Chưa có nguồn tin</h4><p>Thêm một feed bằng tài khoản admin. Nguồn sẽ vẫn tắt cho tới khi được rà soát và xác nhận.</p></div> : null}
          {sources.map((source) => <SourceCard key={source.id} source={source} canManage={canManageSources} userId={user.id} onUpdated={() => void loadData()} />)}
        </div>

        <div className="news-intel-section-heading">
          <div><p className="news-intel-kicker">02 / HUMAN REVIEW</p><h3>Hàng chờ biên tập</h3></div>
          <span className="news-intel-count">{items.length} mục</span>
        </div>
        <div className="news-intel-queue">
          {items.length === 0 ? <div className="news-intel-empty"><h4>Hàng chờ đang trống</h4><p>Khi có nguồn được duyệt và quét thành công, các mục mới sẽ xuất hiện tại đây. Tin trùng URL hoặc fingerprint sẽ tự bỏ qua.</p></div> : null}
          {items.map((item) => {
            const source = sourceById.get(item.source_id);
            const sourceApproved = source?.license_status === "approved";
            return (
              <article className="news-intel-item" key={item.id}>
                <div className="news-intel-item-meta"><span>{source?.name ?? "Nguồn đã gỡ"}</span><span>{formatDate(item.published_at)}</span></div>
                <h4>{item.title}</h4>
                {item.excerpt ? <p className="news-intel-excerpt">{item.excerpt}</p> : <p className="news-intel-excerpt is-muted">Chỉ lưu tiêu đề và liên kết theo chính sách nguồn.</p>}
                {item.author_name ? <p className="news-intel-author">Tác giả nguồn: {item.author_name}</p> : null}
                <a className="news-intel-open-source" href={item.canonical_url} target="_blank" rel="noopener noreferrer">Đọc tại nguồn gốc ↗</a>
                <div className="news-intel-actions">
                  <button className="btn btn-primary" type="button" disabled={busy || !sourceApproved} onClick={() => void createDraft(item)}>Tạo bản nháp trong CMS</button>
                  <button className="btn btn-secondary" type="button" disabled={busy} onClick={() => void dismissItem(item)}>Bỏ qua</button>
                </div>
                {!sourceApproved ? <p className="news-intel-legal-note">Nguồn không còn trạng thái được duyệt; không thể chuyển mục này thành bản nháp.</p> : null}
              </article>
            );
          })}
        </div>

        <div className="news-intel-section-heading">
          <div><p className="news-intel-kicker">03 / AUDIT TRAIL</p><h3>Lịch sử quét gần đây</h3></div>
        </div>
        <div className="news-intel-runs">
          {runs.length === 0 ? <p className="news-intel-muted">Chưa có lượt quét nào.</p> : runs.map((run) => (
            <div className="news-intel-run" key={run.id}>
              <div><strong>{sourceById.get(run.source_id ?? "")?.name ?? "Nguồn"}</strong><span>{formatDate(run.started_at)}</span></div>
              <span className={"news-intel-status is-" + run.status}>{run.status === "succeeded" ? "THÀNH CÔNG" : run.status === "failed" ? "THẤT BẠI" : "ĐANG CHẠY"}</span>
              <div className="news-intel-run-counts"><span>{run.fetched_count} nhận</span><span>{run.inserted_count} mới</span><span>{run.duplicate_count} trùng</span></div>
              {run.error_message ? <p className="news-intel-error">{run.error_message}</p> : null}
            </div>
          ))}
        </div>
        <p className="news-intel-footnote">Đợt này chỉ có nút quét thủ công. Chưa cấu hình cron tự động; trước tiên cần rà soát thực tế nguồn, quyền lưu metadata và kết quả quét trong môi trường staging.</p>
      </div>
    </section>
  );
}
