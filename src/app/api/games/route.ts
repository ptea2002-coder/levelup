import { NextRequest, NextResponse } from "next/server";
import { getGamesPage } from "@/lib/game-repository";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams;
  const page = Math.max(1, Math.min(Number(search.get("page") ?? 1) || 1, 100000));
  const pageSize = Math.max(1, Math.min(Number(search.get("limit") ?? 24) || 24, 48));
  const query = (search.get("query") ?? "").trim().slice(0, 100);
  const category = (search.get("category") ?? "").trim().slice(0, 80);
  const platform = (search.get("platform") ?? "").trim().slice(0, 80);
  const sort = search.get("sort");
  const safeSort = sort === "newest" || sort === "name" || sort === "positive" || sort === "recommended"
    ? sort
    : "popular";

  const result = await getGamesPage({
    query,
    category,
    platform,
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
