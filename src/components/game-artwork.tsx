"use client";

import { useState } from "react";
import Image from "next/image";
import type { CSSProperties } from "react";
import { getGameArtworkSources, type GameArtworkVariant } from "@/lib/game-art";

type GameArtworkProps = {
  slug: string;
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
  const isCinematic = variant === "cinematic";
  const isFeatureArtwork = isDetail || isCinematic;
  const artStyle = {
    "--art-primary": artPrimary,
    "--art-secondary": artSecondary,
  } as CSSProperties;

  return (
    <div
      className={isFeatureArtwork ? "detail-art" : "game-art"}
      style={artStyle}
      data-image-loaded={loaded ? "true" : "false"}
    >
      {src ? (
        <Image
          key={src}
          className="game-art-image"
          src={src}
          alt=""
          aria-hidden="true"
          fill
          sizes={isCinematic
            ? "(max-width: 700px) 100vw, (max-width: 1100px) 90vw, 50vw"
            : isDetail
              ? "(max-width: 700px) calc(100vw - 32px), (max-width: 980px) 90vw, 42vw"
              : "(max-width: 539px) calc(100vw - 32px), (max-width: 700px) 45vw, (max-width: 980px) 50vw, 33vw"}
          preload={isFeatureArtwork}
          loading={isFeatureArtwork ? undefined : "lazy"}
          onLoad={() => setLoaded(true)}
          onError={() => {
            setLoaded(false);
            setSourceIndex((current) => current + 1);
          }}
        />
      ) : null}
      <span className="game-art-kicker">
        {isCinematic ? "LEVELUP / FEATURED SIGNAL" : isDetail ? "LEVELUP / GAME PROFILE" : "LEVELUP / SELECTED"}
      </span>
      {!isFeatureArtwork && index !== undefined ? (
        <span className="game-art-index">{String(index + 1).padStart(2, "0")}</span>
      ) : null}
      <span className={(isFeatureArtwork ? "detail-mark" : "game-art-mark") + (loaded ? " is-hidden" : "")} aria-hidden="true">
        {mark}
      </span>
      {!isDetail ? <span className="game-art-bottom">{category}</span> : null}
      {isDetail ? (
        <span className="detail-art-caption">{category} / RELEASE {releaseYear}</span>
      ) : null}
    </div>
  );
}
