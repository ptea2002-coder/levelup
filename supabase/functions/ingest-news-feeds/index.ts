import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

type NewsSource = {
  id: string;
  name: string;
  feed_url: string;
  feed_format: "rss" | "atom" | "json";
  reuse_policy: "link_only" | "metadata_excerpt";
  license_status: "unreviewed" | "approved" | "denied";
  license_reviewed_at: string | null;
  is_enabled: boolean;
};

type RawItem = {
  id: string;
  url: string;
  title: string;
  summary: string;
  author: string;
  publishedAt: string;
};

const MAX_FEED_BYTES = 512 * 1024;
const MAX_ITEMS_PER_SOURCE = 25;
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function safeHttpsUrl(value: string, expectedHost?: string): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Feed URL is invalid");
  }

  const host = url.hostname.toLowerCase();
  const isIpLiteral = /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host) || host.startsWith("[");
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    isIpLiteral ||
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host.endsWith(".test") ||
    host === "metadata.google.internal"
  ) {
    throw new Error("Only public HTTPS feed hosts are allowed");
  }
  if (expectedHost && host !== expectedHost) {
    throw new Error("Cross-host feed redirects are blocked; save the final HTTPS feed URL instead");
  }
  return url;
}

async function readLimitedBody(response: Response): Promise<string> {
  const contentLength = Number(response.headers.get("content-length") ?? 0);
  if (contentLength > MAX_FEED_BYTES) throw new Error("Feed exceeds the 512 KB limit");
  if (!response.body) throw new Error("Feed response has no body");

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > MAX_FEED_BYTES) {
      await reader.cancel();
      throw new Error("Feed exceeds the 512 KB limit");
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return new TextDecoder().decode(bytes);
}

async function fetchFeed(feedUrl: string): Promise<string> {
  const original = safeHttpsUrl(feedUrl);
  let current = original;
  for (let redirectCount = 0; redirectCount <= 3; redirectCount += 1) {
    const response = await fetch(current.toString(), {
      redirect: "manual",
      headers: {
        "Accept": "application/rss+xml, application/atom+xml, application/feed+json, application/json, application/xml, text/xml",
        "User-Agent": "LevelUP-News-Intelligence/2.0",
      },
      signal: AbortSignal.timeout(9000),
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location || redirectCount === 3) throw new Error("Feed redirect limit exceeded");
      current = safeHttpsUrl(new URL(location, current).toString(), original.hostname);
      continue;
    }
    if (!response.ok) throw new Error("Feed returned HTTP " + response.status);
    return await readLimitedBody(response);
  }
  throw new Error("Feed redirect limit exceeded");
}

function plainText(value: string, maxLength = 2000): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function firstXmlText(node: Element, names: string[]): string {
  const children = Array.from(node.getElementsByTagName("*"));
  const found = children.find((child) => names.includes(child.localName.toLowerCase()));
  return found?.textContent?.trim() ?? "";
}

function xmlLink(node: Element): string {
  const links = Array.from(node.getElementsByTagName("*")).filter((child) => child.localName.toLowerCase() === "link");
  const alternate = links.find((link) => link.getAttribute("rel") === "alternate" && link.getAttribute("href"))
    ?? links.find((link) => link.getAttribute("href"))
    ?? links[0];
  return alternate?.getAttribute("href") ?? alternate?.textContent?.trim() ?? "";
}

function canonicalArticleUrl(value: string): string {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return "";
    url.hash = "";
    for (const key of Array.from(url.searchParams.keys())) {
      if (/^(utm_.+|fbclid|gclid|mc_cid|mc_eid|ref|source)$/i.test(key)) url.searchParams.delete(key);
    }
    const canonical = url.toString();
    return canonical.length <= 2048 ? canonical : "";
  } catch {
    return "";
  }
}

function parseDate(value: string): string | null {
  if (!value.trim()) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

function parseXmlFeed(xml: string, format: "rss" | "atom"): RawItem[] {
  const document = new DOMParser().parseFromString(xml, "text/xml");
  if (document.getElementsByTagName("parsererror").length > 0) throw new Error("Feed XML could not be parsed");
  const entries = format === "atom"
    ? Array.from(document.getElementsByTagNameNS("*", "entry"))
    : Array.from(document.getElementsByTagName("item"));

  return entries.slice(0, MAX_ITEMS_PER_SOURCE).map((entry) => ({
    id: firstXmlText(entry, ["guid", "id"]),
    url: xmlLink(entry),
    title: firstXmlText(entry, ["title"]),
    summary: firstXmlText(entry, ["description", "summary", "subtitle"]),
    author: firstXmlText(entry, ["creator", "author", "name"]),
    publishedAt: firstXmlText(entry, ["pubdate", "published", "updated", "date"]),
  }));
}

function parseJsonFeed(jsonText: string): RawItem[] {
  let payload: { version?: string; items?: Array<Record<string, unknown>> };
  try {
    payload = JSON.parse(jsonText);
  } catch {
    throw new Error("Feed JSON could not be parsed");
  }
  if (!Array.isArray(payload.items)) throw new Error("JSON Feed has no items array");
  return payload.items.slice(0, MAX_ITEMS_PER_SOURCE).map((item) => {
    const authors = Array.isArray(item.authors) ? item.authors as Array<Record<string, unknown>> : [];
    return {
      id: typeof item.id === "string" ? item.id : "",
      url: typeof item.url === "string" ? item.url : typeof item.external_url === "string" ? item.external_url : "",
      title: typeof item.title === "string" ? item.title : "",
      summary: typeof item.summary === "string" ? item.summary : typeof item.content_text === "string" ? item.content_text : typeof item.content_html === "string" ? item.content_html : "",
      author: typeof authors[0]?.name === "string" ? authors[0].name as string : "",
      publishedAt: typeof item.date_published === "string" ? item.date_published : typeof item.date_modified === "string" ? item.date_modified : "",
    };
  });
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function safeError(error: unknown): string {
  const message = error instanceof Error ? error.message : "Unknown feed error";
  return message.replace(/https?:\/\/[^\s)]+/gi, "[feed URL]").slice(0, 500);
}

async function prepareItems(source: NewsSource, body: string) {
  const rawItems = source.feed_format === "json"
    ? parseJsonFeed(body)
    : parseXmlFeed(body, source.feed_format);
  const prepared: Array<Record<string, unknown>> = [];

  for (const item of rawItems) {
    const title = plainText(item.title, 240);
    const canonicalUrl = canonicalArticleUrl(item.url);
    if (title.length < 5 || !canonicalUrl) continue;

    const publishedAt = parseDate(item.publishedAt);
    const normalizedTitle = title.normalize("NFKD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    const fingerprint = await sha256Hex(normalizedTitle + "|" + (publishedAt?.slice(0, 10) ?? "undated"));
    const externalId = plainText(item.id || canonicalUrl, 512) || canonicalUrl;

    prepared.push({
      source_id: source.id,
      external_id: externalId,
      canonical_url: canonicalUrl,
      title,
      excerpt: source.reuse_policy === "metadata_excerpt" ? plainText(item.summary, 280) : "",
      author_name: plainText(item.author, 160),
      published_at: publishedAt,
      fingerprint,
    });
    if (prepared.length >= MAX_ITEMS_PER_SOURCE) break;
  }
  return prepared;
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authorization = request.headers.get("Authorization") ?? "";
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1];

  if (!supabaseUrl || !serviceRoleKey) return json({ error: "Supabase server environment is not configured" }, 500);
  if (!token) return json({ error: "Authentication required" }, 401);

  const verifier = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await verifier.auth.getUser(token);
  if (authError || !authData.user) return json({ error: "Invalid session" }, 401);

  const role = authData.user.app_metadata?.role;
  if (role !== "admin" && role !== "editor") return json({ error: "Editor access required" }, 403);

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: sources, error: sourceError } = await admin
    .from("news_sources")
    .select("id,name,feed_url,feed_format,reuse_policy,license_status,license_reviewed_at,is_enabled")
    .eq("is_enabled", true)
    .eq("license_status", "approved")
    .not("license_reviewed_at", "is", null)
    .order("created_at", { ascending: true })
    .limit(20);

  if (sourceError) return json({ error: "Could not load approved news sources" }, 500);
  if (!sources?.length) {
    return json({ ok: true, sources: 0, fetched: 0, inserted: 0, duplicates: 0, errors: [], message: "No approved, enabled sources. Review a source before ingesting." });
  }

  const totals = { sources: sources.length, fetched: 0, inserted: 0, duplicates: 0 };
  const errors: Array<{ source: string; message: string }> = [];

  for (const source of sources as NewsSource[]) {
    const startedAt = new Date().toISOString();
    const { data: run, error: runError } = await admin
      .from("news_ingest_runs")
      .insert({ source_id: source.id, started_by: authData.user.id, status: "running", started_at: startedAt })
      .select("id")
      .single();

    if (runError || !run) {
      errors.push({ source: source.name, message: "Could not create ingest run record" });
      continue;
    }

    try {
      const feedBody = await fetchFeed(source.feed_url);
      const items = await prepareItems(source, feedBody);
      let inserted = 0;

      if (items.length) {
        const { data, error } = await admin.rpc("ingest_news_items", { p_items: items });
        if (error) throw new Error("Could not store the intake batch");
        inserted = Number(data ?? 0);
      }

      const finishedAt = new Date().toISOString();
      const duplicates = Math.max(0, items.length - inserted);
      totals.fetched += items.length;
      totals.inserted += inserted;
      totals.duplicates += duplicates;

      await admin.from("news_ingest_runs").update({
        status: "succeeded",
        finished_at: finishedAt,
        fetched_count: items.length,
        inserted_count: inserted,
        duplicate_count: duplicates,
        error_message: null,
      }).eq("id", run.id);
      await admin.from("news_sources").update({ last_fetched_at: finishedAt, last_error: null }).eq("id", source.id);
    } catch (error) {
      const message = safeError(error);
      errors.push({ source: source.name, message });
      const finishedAt = new Date().toISOString();
      await admin.from("news_ingest_runs").update({
        status: "failed",
        finished_at: finishedAt,
        error_message: message,
      }).eq("id", run.id);
      await admin.from("news_sources").update({ last_error: message }).eq("id", source.id);
    }
  }

  return json({ ok: errors.length === 0, ...totals, errors });
});
