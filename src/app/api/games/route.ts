import { NextRequest, NextResponse } from "next/server";
import { getGamesBySlugs, getGamesPage } from "@/lib/game-repository";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams;
  const slugsParam = search.get("slugs");
  if (slugsParam !== null) {
    const slugs = [...new Set(slugsParam.split(",")
      .map((slug) => slug.trim())
      .filter((slug) => slug.length <= 100 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)))]
      .slice(0, 48);

    if (slugs.length === 0) {
      return NextResponse.json({ items: [], total: 0, page: 1, pageSize: 0, source: "database" }, {
        headers: { "Cache-Control": "private, no-store" },
      });
    }

    const items = await getGamesBySlugs(slugs);
    return NextResponse.json({ items, total: items.length, page: 1, pageSize: slugs.length, source: "database" }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  }
  const page = Math.max(1, Math.min(Number(search.get("page") ?? 1) || 1, 100000));
  const pageSize = Math.max(1, Math.min(Number(search.get("limit") ?? 24) || 24, 48));
  const query = (search.get("query") ?? "").trim().slice(0, 100);
  const categoryParam = search.get("category");
  const categoriesParam = search.get("categories");
  const categories = [...new Set(
    (categoriesParam !== null ? categoriesParam.split(",") : categoryParam ? [categoryParam] : [])
      .map((category) => category.trim().slice(0, 80))
      .filter(Boolean),
  )].slice(0, 20);
  const platform = (search.get("platform") ?? "").trim().slice(0, 80);
  const modeParam = search.get("mode");
  const safeMode = modeParam === "competitive" || modeParam === "coop" || modeParam === "story" || modeParam === "chill"
    ? modeParam
    : "all";
  const sort = search.get("sort");
  const safeSort = sort === "newest" || sort === "name" || sort === "positive" || sort === "recommended"
    ? sort
    : "popular";

  const result = await getGamesPage({
    query,
    categories,
    platform,
    mode: safeMode,
    sort: safeSort,
    page,
    pageSize,
  });

  if (!result.available) {
    return NextResponse.json(
      { error: "Kho dữ liệu game hiện chưa kết nối được. Vui lòng thử lại sau.", items: [], total: 0 },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    { items: result.items, total: result.total, page, pageSize, source: "database" },
    { headers: { "Cache-Control": "public, max-age=0, s-maxage=30, stale-while-revalidate=120" } },
  );
}
