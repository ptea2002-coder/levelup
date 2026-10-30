"use client";

import type { SocialProfile } from "@/lib/social-types";

type PlayerAvatarProps = {
  profile: Pick<SocialProfile, "username" | "display_name" | "avatar_url"> | null;
  size?: "small" | "medium" | "large";
};

export function PlayerAvatar({ profile, size = "medium" }: PlayerAvatarProps) {
  const label = (profile?.display_name || profile?.username || "G").trim();
  const avatarUrl = profile?.avatar_url?.startsWith("https://") ? profile.avatar_url : null;

  return (
    <span className={"player-avatar player-avatar-" + size} aria-hidden="true">
      {avatarUrl ? (
        <img src={avatarUrl} alt="" loading="lazy" referrerPolicy="no-referrer" />
      ) : (
        <span>{label.slice(0, 1).toLocaleUpperCase("vi")}</span>
      )}
    </span>
  );
}
