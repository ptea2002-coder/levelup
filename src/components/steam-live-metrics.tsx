"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { steamTrackedGameSlugs } from "@/lib/steam-games";

type SteamGameSummary = {
  slug: string;
  title: string;
  category: string;
};

type SteamMetricRow = {
  game_slug: string;
  steam_app_id: number;
  current_players: number | null;
  price_label: string | null;
  price_currency: string | null;
  price_discount_percent: number;
  is_free: boolean;
  store_url: string;
  players_updated_at: string | null;
  price_updated_at: string | null;
  synced_at: string | null;
};

type SteamLiveMetricsProps = {
  games?: SteamGameSummary[];
  game?: SteamGameSummary;
};

const metricColumns =
  "game_slug,steam_app_id,current_players,price_label,price_currency,price_discount_percent,is_free,store_url,players_updated_at,price_updated_at,synced_at";

function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

function formatUpdatedAt(value: string | null | undefined) {
  if (!value) return "Đang chờ lần đồng bộ đầu tiên";
  return `Cập nhật ${new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))}`;
}

function priceLabel(metric: SteamMetricRow | undefined, state: string) {
  if (!metric) {
    if (state === "loading") return "Đang tải...";
    if (state === "unconfigured") return "Chưa kết nối";
    if (state === "error") return "Chưa tải được";
    return "Đang chờ đồng bộ";
  }
  if (metric.is_free) return "Miễn phí";
  return metric.price_label || "Chưa có giá";
}

function latestTimestamp(metric: SteamMetricRow) {
  return metric.players_updated_at ?? metric.price_updated_at ?? metric.synced_at;
}

export function SteamLiveMetrics({ games = [], game }: SteamLiveMetricsProps) {
  const trackedGames = useMemo(() => {
    const candidates = game ? [game] : games;
    return candidates.filter((candidate) =>
      steamTrackedGameSlugs.some((slug) => slug === candidate.slug),
    );
  }, [game, games]);

  const slugsKey = trackedGames.map((item) => item.slug).join("|");
  const [rows, setRows] = useState<SteamMetricRow[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error" | "unconfigured">("loading");

  useEffect(() => {
    let active = true;
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setState("unconfigured");
      return () => {
        active = false;
      };
    }

    const slugs = slugsKey ? slugsKey.split("|") : [];
    if (slugs.length === 0) {
      setRows([]);
      setState("ready");
      return () => {
        active = false;
      };
    }

    const refresh = async () => {
      const { data, error } = await supabase
        .from("steam_game_metrics")
        .select(metricColumns)
        .in("game_slug", slugs);

      if (!active) return;
      if (error) {
        setState("error");
        return;
      }

      setRows((data ?? []) as unknown as SteamMetricRow[]);
      setState("ready");
    };

    void refresh();

    const channel = supabase
      .channel(`steam-live-${slugsKey.replaceAll("|", "-")}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "steam_game_metrics" },
        () => {
          void refresh();
        },
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [slugsKey]);

  const metricsBySlug = useMemo(
    () => new Map(rows.map((row) => [row.game_slug, row] as const)),
    [rows],
  );

  if (trackedGames.length === 0) return null;

  if (game) {
    const metric = metricsBySlug.get(game.slug);
    return (
      <aside className="steam-detail-card" aria-label={`Dữ liệu Steam của ${game.title}`}>
        <div className="steam-live-heading">
          <div>
            <p className="eyebrow">STEAM / LIVE DATA</p>
            <h2>{game.title}</h2>
          </div>
          <span className="steam-live-status"><i aria-hidden="true" /> CẬP NHẬT TỰ ĐỘNG</span>
        </div>
        <div className="steam-detail-stats">
          <div className="steam-detail-stat">
            <span>NGƯỜI CHƠI TRÊN STEAM</span>
            <strong>{metric?.current_players == null ? "—" : formatNumber(metric.current_players)}</strong>
            <small>{metric?.current_players == null ? "Chưa có số liệu mới" : "người chơi đang hoạt động"}</small>
          </div>
          <div className="steam-detail-stat">
            <span>GIÁ STEAM / VIỆT NAM</span>
            <strong>{priceLabel(metric, state)}</strong>
            {metric && metric.price_discount_percent > 0 ? (
              <small className="steam-discount">Giảm {metric.price_discount_percent}%</small>
            ) : (
              <small>{metric?.price_currency ? `Tiền tệ: ${metric.price_currency}` : "Giá có thể thay đổi theo tài khoản/khu vực"}</small>
            )}
          </div>
        </div>
        <div className="steam-live-footer">
          <span>{metric ? formatUpdatedAt(latestTimestamp(metric)) : state === "error" ? "Không tải được dữ liệu" : "Đang chờ dữ liệu Steam"}</span>
          {metric?.store_url ? (
            <a href={metric.store_url} target="_blank" rel="noopener noreferrer">Mở Steam Store ↗</a>
          ) : null}
        </div>
      </aside>
    );
  }

  const items = trackedGames
    .map((item) => ({ game: item, metric: metricsBySlug.get(item.slug) }))
    .filter((item): item is { game: SteamGameSummary; metric: SteamMetricRow } => Boolean(item.metric))
    .sort((a, b) => (b.metric.current_players ?? -1) - (a.metric.current_players ?? -1));

  if (items.length === 0) {
    return (
      <div className="steam-live-empty" role="status">
        {state === "unconfigured"
          ? "Hãy cấu hình Supabase để bật dữ liệu Steam trực tiếp."
          : state === "error"
            ? "Chưa tải được dữ liệu Steam. Dữ liệu sẽ tự thử lại khi có kết nối."
            : "Đang chờ lượt đồng bộ Steam đầu tiên."}
      </div>
    );
  }

  return (
    <div className="steam-live-grid" aria-live="polite">
      {items.map(({ game: item, metric }) => (
        <article className="steam-live-card" key={item.slug}>
          <div className="steam-live-card-top">
            <div>
              <span className="steam-live-category">{item.category}</span>
              <h3>{item.title}</h3>
            </div>
            <span className="steam-live-pill"><i aria-hidden="true" /> LIVE</span>
          </div>
          <div className="steam-live-card-stats">
            <div>
              <span>ĐANG CHƠI</span>
              <strong>{metric.current_players == null ? "—" : formatNumber(metric.current_players)}</strong>
              <small>người trên Steam</small>
            </div>
            <div>
              <span>GIÁ GAME</span>
              <strong>{priceLabel(metric, state)}</strong>
              {metric.price_discount_percent > 0 ? (
                <small className="steam-discount">-{metric.price_discount_percent}%</small>
              ) : (
                <small>{metric.is_free ? "Free-to-play" : "Khu vực Việt Nam"}</small>
              )}
            </div>
          </div>
          <div className="steam-live-footer">
            <span>{formatUpdatedAt(latestTimestamp(metric))}</span>
            <a href={metric.store_url} target="_blank" rel="noopener noreferrer">Steam ↗</a>
          </div>
        </article>
      ))}
    </div>
  );
}
