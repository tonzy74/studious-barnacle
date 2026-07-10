/**
 * Decides *when* to surface the paywall. The best apps trigger at a moment of
 * peak intent (right after the product proves its value) — never on cold launch
 * — and cap frequency hard so a decline is respected. Over-prompting tanks both
 * conversion and retention, so this gate is deliberately conservative.
 */

export type PaywallTrigger =
  | 'valuable-scan' // a scan revealed a high-value / rare bottle
  | 'collection-grew' // the vault crossed an investment threshold
  | 'milestone' // a collection milestone was completed
  | 'portfolio'; // opened the portfolio trend (a Pro surface)

/** Days between contextual prompts — a comfortable breathing room. */
export const PAYWALL_COOLDOWN_DAYS = 3;
/** Lifetime cap on automatic prompts; after this we never auto-prompt again. */
export const MAX_AUTO_PROMPTS = 4;

export interface PaywallGateInput {
  isPro: boolean;
  /** Epoch ms of the last auto-prompt (0 if never). */
  lastShownAt: number;
  /** How many times we've auto-prompted so far. */
  promptCount: number;
  now: number;
}

/**
 * Whether it's acceptable to auto-show the paywall right now. Pro users, the
 * cooldown window, and the lifetime cap all short-circuit it. The *moment* (is
 * this a valuable scan? a threshold cross?) is decided by the caller; this owns
 * the global etiquette so we can't nag from any single surface.
 */
export function canShowContextualPaywall(input: PaywallGateInput): boolean {
  if (input.isPro) return false;
  if (input.promptCount >= MAX_AUTO_PROMPTS) return false;
  const gapMs = PAYWALL_COOLDOWN_DAYS * 86_400_000;
  if (input.lastShownAt > 0 && input.now - input.lastShownAt < gapMs) return false;
  return true;
}

/** Bottle counts where crossing them is a natural "you're invested" moment. */
export const COLLECTION_THRESHOLDS = [5, 15, 40];

/** True when adding a bottle just crossed one of the investment thresholds. */
export function crossedCollectionThreshold(before: number, after: number): boolean {
  return COLLECTION_THRESHOLDS.some((t) => before < t && after >= t);
}

/** A scan is "paywall-worthy" when the bottle is genuinely valuable or rare. */
export function isValuableScan(fairPrice: number | undefined, rarity: string | undefined): boolean {
  return (fairPrice ?? 0) >= 150 || rarity === 'S' || rarity === 'A';
}
