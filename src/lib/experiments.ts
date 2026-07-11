/**
 * Deterministic, dependency-free A/B assignment.
 *
 * Buckets a stable per-install seed (the store's anonId) into a variant with a
 * hash — no server round-trip, no flicker, and the same install always resolves
 * to the same variant, so measurement stays clean and the price a user sees
 * never changes under them. Assignment is uniform across variants.
 *
 * Pure logic so it's unit-testable; the paywall reads the assigned variant to
 * pick prices and stamps it onto the funnel events for read-out.
 */

export interface Experiment<V extends string> {
  key: string;
  variants: readonly V[];
}

/** FNV-1a string hash → uint32. Stable across JS engines. */
function hash32(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/**
 * Assign a seed to one of the experiment's variants — uniform and stable. The
 * experiment key is mixed into the hash so a given install lands independently
 * in each experiment (no correlation between simultaneous tests).
 */
export function assignVariant<V extends string>(exp: Experiment<V>, seed: string): V {
  if (exp.variants.length === 0) throw new Error('experiment needs at least one variant');
  const h = hash32(`${exp.key}:${seed}`);
  return exp.variants[h % exp.variants.length];
}

/**
 * Annual-price A/B — per docs/PRICING.md the single biggest ARPU lever. A hobby
 * audience is price-insensitive, so a 33% higher annual often barely dents
 * conversion; the upside is close to pure margin. Two arms:
 *   a29 → $29.99/yr (current)   b39 → $39.99/yr (test).
 */
export const ANNUAL_PRICE_EXPERIMENT = {
  key: 'annual_price_v1',
  variants: ['a29', 'b39'],
} as const satisfies Experiment<'a29' | 'b39'>;

export type AnnualPriceVariant = (typeof ANNUAL_PRICE_EXPERIMENT.variants)[number];
