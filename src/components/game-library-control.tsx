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
  const { library, ready, setGameStatus } = useGameLibrary();
  const [feedback, setFeedback] = useState("");
  const entry = library[gameSlug];

  const updateStatus = (status: GameLibraryStatus | null) => {
    const persisted = setGameStatus(gameSlug, status);
    if (!status) {
      setFeedback(persisted
        ? `${gameTitle} đã được bỏ khỏi Game Locker.`
        : "Đã cập nhật tạm thời; trình duyệt không cho phép lưu dữ liệu cục bộ.");
      return;
    }
    setFeedback(persisted
      ? `${gameTitle}: ${statusLabels[status]}.`
      : "Đã cập nhật tạm thời; trình duyệt không cho phép lưu dữ liệu cục bộ.");
  };

  if (variant === "compact") {
    return (
      <div className="game-library-control game-library-control-compact">
        {entry ? <span className={`library-status-chip status-${entry.status}`}>{statusLabels[entry.status]}</span> : null}
        <button
          type="button"
          className={`library-save-btn${entry ? " is-saved" : ""}`}
          aria-label={entry ? `Bỏ ${gameTitle} khỏi Game Locker` : `Lưu ${gameTitle} vào Game Locker`}
          aria-pressed={Boolean(entry)}
          disabled={!ready}
          onClick={() => updateStatus(entry ? null : "wishlist")}
        >
          {!ready ? "Đang tải…" : entry ? "✓ Đã lưu" : "＋ Lưu game"}
        </button>
        <span className="sr-only" role="status">{feedback}</span>
      </div>
    );
  }

  return (
    <div className="game-library-control game-library-control-full">
      <p className="library-control-label">TRẠNG THÁI TRONG GAME LOCKER</p>
      <div className="library-status-group" role="group" aria-label={`Trạng thái ${gameTitle} trong Game Locker`}>
        {gameLibraryStatuses.map((status) => (
          <button
            key={status}
            type="button"
            className={`library-status-btn${entry?.status === status ? " active" : ""}`}
            aria-pressed={entry?.status === status}
            disabled={!ready}
            onClick={() => updateStatus(status)}
          >
            {statusLabels[status]}
          </button>
        ))}
        {entry ? (
          <button type="button" className="library-remove-btn" disabled={!ready} onClick={() => updateStatus(null)}>
            Bỏ khỏi Locker
          </button>
        ) : null}
      </div>
      {feedback ? <p className="library-feedback" role="status">{feedback}</p> : null}
    </div>
  );
}
