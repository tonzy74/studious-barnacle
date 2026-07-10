/**
 * When to ask for an App Store rating. Prompting at a moment of genuine delight
 * (peak-end rule) yields more, higher ratings — which lifts App Store ranking
 * and organic installs (ASO), one of the cheapest acquisition channels there is.
 * Never on cold launch, never after a negative event, and only once (Apple also
 * rate-limits the real prompt). Every input is real engagement — no coercion,
 * no "rate us or else"; the OS dialog is Apple's own.
 */

export interface ReviewInput {
  /** Whether we've already asked. */
  requested: boolean;
  /** Collector level (identity milestone). */
  level: number;
  /** Bottles in the collection (investment). */
  bottleCount: number;
  /** Current daily streak (habit). */
  streak: number;
}

/**
 * True when the user is demonstrably engaged and happy — an earned rank, a real
 * collection, or a sustained streak — and we haven't asked before.
 */
export function shouldAskForReview(input: ReviewInput): boolean {
  if (input.requested) return false;
  return input.level >= 3 || input.bottleCount >= 8 || input.streak >= 3;
}
