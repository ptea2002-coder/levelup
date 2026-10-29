"use client";

import { useState } from "react";
import { gameLibraryStatuses, type GameLibraryStatus } from "@/lib/game-library";
import { useGameLibrary } from "@/components/game-library-provider";

const statusLabels: Record<GameLibraryStatus, string> = {
  wishlist: "Muốn chơi",
  playing: "Đang chơi",
  completed: "Đã hoàn thành",
};

type GameLibraryControlProps = {
  gameSlug: string;
  gameTitle: string;
  variant?: "compact" | "full";
};

export function GameLibraryControl({ gameSlug, gameTitle, variant = "compact" }: GameLibraryControlProps) {
  const { library, ready, setGameStatus, setFavorite, signedIn, syncStatus } = useGameLibrary();
  const [feedback, setFeedback] = useState("");
  const entry = library[gameSlug];
  const hasStatus = Boolean(entry?.status);
  const isFavorite = Boolean(entry?.isFavorite);

  const updateStatus = (status: GameLibraryStatus | null) => {
    const persisted = setGameStatus(gameSlug, status);
    setFeedback(persisted
      ? status
        ? \`${gameTitle}: ${statusLabels[status]}.\`
        : \`${gameTitle} đã được bỏ khỏi Game Locker.\`
      : "Đã cập nhật tạm thời; trình duyệt không cho phép lưu dữ liệu cục bộ.");
  };

  const updateFavorite = () => {
    const nextFavorite = !isFavorite;
    const persisted = setFavorite(gameSlug, nextFavorite);
    setFeedback(persisted
      ? nextFavorite
        ? \`${gameTitle} đã được thêm vào yêu thích.\`
        : \`${gameTitle} đã được bỏ khỏi yêu thích.\`
      : "Đã cập nhật tạm thời; trình duyệt không cho phép lưu dữ liệu cục bộ.");
  };

  const syncHint = !signedIn
    ? "Đang lưu trên thiết bị này. Đăng nhập để đồng bộ giữa các thiết bị."
    : syncStatus === "syncing"
      ? "Đang đồng bộ thư viện với tài khoản LevelUP…"
      : syncStatus === "error"
        ? "Chưa đồng bộ được. Dữ liệu cục bộ vẫn được giữ; hãy tải lại trang để thử lại."
        : "Thư viện đã được đồng bộ với tài khoản LevelUP.";

  const favoriteButton = (
    <button
      type="button"
      className={\`library-favorite-btn${isFavorite ? " is-favorite" : ""}\`}
      aria-label={isFavorite ? \`Bỏ ${gameTitle} khỏi yêu thích\` : \`Thêm ${gameTitle} vào yêu thích\`}
      aria-pressed={isFavorite}
      disabled={!ready}
      onClick={updateFavorite}
    >
      <span aria-hidden="true">{isFavorite ? "♥" : "♡"}</span>
      <span>{isFavorite ? "Đã thích" : "Yêu thích"}</span>
    </button>
  );

  if (variant === "compact") {
    return (
      <div className="game-library-control game-library-control-compact">
        {entry?.status ? <span className={\`library-status-chip status-${entry.status}\`}>{statusLabels[entry.status]}</span> : null}
        <button
          type="button"
          className={\`library-save-btn${hasStatus ? " is-saved" : ""}\`}
          aria-label={hasStatus ? \`Bỏ ${gameTitle} khỏi Game Locker\` : \`Lưu ${gameTitle} vào Game Locker\`}
          aria-pressed={hasStatus}
          disabled={!ready}
          onClick={() => updateStatus(hasStatus ? null : "wishlist")}
        >
          {!ready ? "Đang tải…" : hasStatus ? "✓ Đã lưu" : "＋ Lưu game"}
        </button>
        {favoriteButton}
        <span className="sr-only" role="status">{feedback}</span>
      </div>
    );
  }

  return (
    <div className="game-library-control game-library-control-full">
      <p className="library-control-label">TRẠNG THÁI TRONG GAME LOCKER</p>
      <div className="library-status-group" role="group" aria-label={\`Trạng thái ${gameTitle} trong Game Locker\`}>
        {gameLibraryStatuses.map((status) => (
          <button
            key={status}
            type="button"
            className={\`library-status-btn${entry?.status === status ? " active" : ""}\`}
            aria-pressed={entry?.status === status}
            disabled={!ready}
            onClick={() => updateStatus(status)}
          >
            {statusLabels[status]}
          </button>
        ))}
        {hasStatus ? (
          <button type="button" className="library-remove-btn" disabled={!ready} onClick={() => updateStatus(null)}>
            Bỏ khỏi Locker
          </button>
        ) : null}
      </div>
      <div className="library-favorite-row">
        <span className="library-control-label">DANH SÁCH YÊU THÍCH</span>
        {favoriteButton}
      </div>
      {feedback ? <p className="library-feedback" role="status">{feedback}</p> : null}
      <p className="library-sync-hint">{syncHint}</p>
    </div>
  );
}
