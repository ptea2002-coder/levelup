import type { Game } from "@/lib/games";

const REVIEW_PRIOR_WEIGHT = 5000;
const REVIEW_PRIOR_MEAN = 0.75;

type ReviewTotals = {
  positive: number;
  negative: number;
  total: number;
};

function safeCount(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0;
}

function reviewTotals(game: Game): ReviewTotals {
  const positive = safeCount(game.positiveReviews);
  const negative = safeCount(game.negativeReviews);
  return { positive, negative, total: positive + negative };
}

/** Bayesian rating keeps tiny review samples from outranking well-supported games. */
export function bayesianReviewScore(game: Game): number {
  const { positive, total } = reviewTotals(game);
  return (positive + REVIEW_PRIOR_WEIGHT * REVIEW_PRIOR_MEAN) / (total + REVIEW_PRIOR_WEIGHT);
}

/** Matches the catalog's community-rating order for positive-review sorting. */
export function comparePositiveReviews(a: Game, b: Game): number {
  const scoreDifference = bayesianReviewScore(b) - bayesianReviewScore(a);
  if (scoreDifference !== 0) return scoreDifference;

  const aReviews = reviewTotals(a);
  const bReviews = reviewTotals(b);
  return bReviews.total - aReviews.total
    || bReviews.positive - aReviews.positive
    || a.title.localeCompare(b.title, "vi");
}

/** Matches the database recommendation order, including popularity as a tie-breaker. */
export function compareRecommendedGames(a: Game, b: Game): number {
  const scoreDifference = bayesianReviewScore(b) - bayesianReviewScore(a);
  if (scoreDifference !== 0) return scoreDifference;

  const aReviews = reviewTotals(a);
  const bReviews = reviewTotals(b);
  return bReviews.total - aReviews.total
    || safeCount(b.concurrentPlayers) - safeCount(a.concurrentPlayers)
    || bReviews.positive - aReviews.positive
    || a.title.localeCompare(b.title, "vi");
}
