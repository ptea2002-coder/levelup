"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { getGameArtworkSources, type GameArtworkVariant } from "@/lib/game-art";

type GameArtworkProps = {
  slug: string;
  title: string;
  mark: string;
  category: string;
  releaseYear: number;
  artPrimary: string;
  artSecondary: string;
  variant?: GameArtworkVariant;
  index?: number;
};

export function GameArtwork({
  slug,
  title,
  mark,
  category,
  releaseYear,
  artPrimary,
  artSecondary,
  variant = "card",
  index,
}: GameArtworkProps) {
  const sources = getGameArtworkSources(slug, variant);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const src = sources[sourceIndex];
  const isDetail = variant === "detail";
  const artStyle = {
    "--art-primary": artPrimary,
    "--art-secondary": artSecondary,
  } as CSSProperties;

  return (
    <div
      className={isDetail ? "detail-art" : "game-art"}
      style={artStyle}
      data-image-loaded={loaded ? "true" : "false"}
    >
      {src ? (
        // Native img keeps third-party artwork optional without requiring Next image host configuration.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          className="game-art-image"
          src={src}
          alt=""
          aria-hidden="true"
          loading={isDetail ? "eager" : "lazy"}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => {
            setLoaded(false);
            setSourceIndex((current) => current + 1);
          }}
        />
      ) : null}
      <span className="game-art-kicker">
        {isDetail ? "LEVELUP / GAME PROFILE" : "LEVELUP / SELECTED"}
      </span>
      {!isDetail && index !== undefined ? (
        <span className="game-art-index">{String(index + 1).padStart(2, "0")}</span>
      ) : null}
      <span className={(isDetail ? "detail-mark" : "game-art-mark") + (loaded ? " is-hidden" : "")} aria-hidden="true">
        {mark}
      </span>
      {!isDetail ? <span className="game-art-bottom">{category}</span> : null}
      {isDetail ? (
        <span className="detail-art-caption">{category} / RELEASE {releaseYear}</span>
      ) : null}
    </div>
  );
}
