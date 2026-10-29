export type GameArtworkVariant = "card" | "detail" | "cinematic";

type ArtworkSources = {
  card: string[];
  detail: string[];
  cinematic?: string[];
};

const steamArtwork = (appId: string): ArtworkSources => ({
  card: [`https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`],
  detail: [
    `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/library_600x900.jpg`,
    `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/library_hero.jpg`,
    `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`,
  ],
  cinematic: [
    `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/library_hero.jpg`,
    `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`,
    `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/library_600x900.jpg`,
  ],
});

/**
 * Public promotional artwork for the starter catalog.
 * Remote artwork is optional: GameArtwork automatically falls back to the
 * game's branded gradient if an image host is unavailable.
 */
const artworkBySlug: Record<string, ArtworkSources> = {
  valorant: {
    card: ["https://tuta.com/assets/Beta%20Key%20Art_VALORANT.imMFdIsd.jpg"],
    detail: ["https://tuta.com/assets/Beta%20Key%20Art_VALORANT.imMFdIsd.jpg"],
  },
  "league-of-legends": {
    card: ["https://miro.medium.com/1%2AwcjvmgRQkiGTTLme_VgreQ.jpeg"],
    detail: ["https://miro.medium.com/1%2AwcjvmgRQkiGTTLme_VgreQ.jpeg"],
  },
  "counter-strike-2": steamArtwork("730"),
  "apex-legends": steamArtwork("1172470"),
  "genshin-impact": {
    card: ["https://images.squarespace-cdn.com/content/v1/611d60fe1bdfad3944022ea3/1659168836462-ZDII9AXWBTCUODLLGI71/maxresdefault.jpg"],
    detail: ["https://images.squarespace-cdn.com/content/v1/611d60fe1bdfad3944022ea3/1659168836462-ZDII9AXWBTCUODLLGI71/maxresdefault.jpg"],
  },
  "elden-ring": steamArtwork("1245620"),
  "pubg-battlegrounds": steamArtwork("578080"),
  fortnite: {
    card: ["https://citybrawl.com/data/image/fornite.jpg"],
    detail: ["https://citybrawl.com/data/image/fornite.jpg"],
  },
  "dota-2": steamArtwork("570"),
  "overwatch-2": steamArtwork("2357570"),
  "call-of-duty-warzone": steamArtwork("1938090"),
  minecraft: {
    card: ["https://www.windowscentral.com/sites/wpcentral.com/files/styles/large/public/field/image/2021/07/minecraft-official-key-art-02.jpg"],
    detail: ["https://www.windowscentral.com/sites/wpcentral.com/files/styles/large/public/field/image/2021/07/minecraft-official-key-art-02.jpg"],
  },
  roblox: {
    card: ["https://prod.assets.earlygamecdn.com/images/RobloxActiveCodes_2023-04-03-130932_hzxi.jpg?transform=Article+Webp"],
    detail: ["https://prod.assets.earlygamecdn.com/images/RobloxActiveCodes_2023-04-03-130932_hzxi.jpg?transform=Article+Webp"],
  },
  "honkai-star-rail": {
    card: ["https://miro.medium.com/1%2AZm4wg5T5PO7tzZudbLN2Hg.jpeg"],
    detail: ["https://miro.medium.com/1%2AZm4wg5T5PO7tzZudbLN2Hg.jpeg"],
  },
  "zenless-zone-zero": steamArtwork("4162040"),
  "black-myth-wukong": steamArtwork("2358720"),
  "stardew-valley": steamArtwork("413150"),
  "ea-sports-fc-26": steamArtwork("3405690"),
  "the-witcher-3": steamArtwork("292030"),
  "final-fantasy-xiv": steamArtwork("39210"),
  "marvel-rivals": steamArtwork("2767030"),
  "helldivers-2": steamArtwork("553850"),
};

export function getGameArtworkSources(
  slug: string,
  variant: GameArtworkVariant = "card",
): string[] {
  const artwork = artworkBySlug[slug];
  if (!artwork) return [];
  if (variant === "cinematic") return artwork.cinematic ?? artwork.detail ?? artwork.card;
  return artwork[variant];
}

export function getGameArtworkUrl(
  slug: string,
  variant: GameArtworkVariant = "card",
): string | undefined {
  return getGameArtworkSources(slug, variant)[0];
}
