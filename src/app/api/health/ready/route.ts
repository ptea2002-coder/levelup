import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const headers = { "Cache-Control": "no-store, max-age=0" };

function notReady(database: "not_configured" | "unavailable") {
  return NextResponse.json(
    { status: "not_ready", checks: { database } },
    { status: 503, headers },
  );
}

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return notReady("not_configured");

  try {
    const supabase = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
    const { error } = await supabase.from("games").select("slug").limit(1);

    if (error) {
      // Keep diagnostic details in platform logs, never in the public response.
      console.error("LevelUP readiness database check failed", {
        code: error.code ?? "unknown",
      });
      return notReady("unavailable");
    }

    return NextResponse.json(
      {
        status: "ready",
        checks: { database: "ok" },
        timestamp: new Date().toISOString(),
      },
      { headers },
    );
  } catch {
    console.error("LevelUP readiness check threw an unexpected error");
    return notReady("unavailable");
  }
}
