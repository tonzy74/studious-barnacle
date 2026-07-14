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

/**
 * FNV-1a string hash + a MurmurHash3 fmix32 avalanche → uint32. Stable across
 * JS engines. The finalizer is important: raw multiplicative hashes have poorly
 * distributed *low* bits, and we bucket with `% variants` (the low bits), so
 * without it small variant counts would correlate across seeds/experiments.
 */
function hash32(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  // fmix32 avalanche — spreads entropy into the low bits we key on.
  h ^= h >>> 16;
  h = Math.imul(h, 2246822507) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 3266489909) >>> 0;
  h ^= h >>> 16;
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

/**
 * Free-trial length A/B (docs/PRICING.md §5). Shorter trials can lift paid
 * conversion for impulse categories — less time to forget the value — while
 * longer trials suit considered purchases. Two arms:
 *   t7 → 7-day (current)   t3 → 3-day (test).
 * NOTE: the *real* trial length is set on the RevenueCat / App Store Connect
 * intro offer, so shipping this test for real means configuring both offers and
 * mapping the arm to the right one. The displayed copy here must match the arm's
 * actual offer — never promise a trial the store won't grant.
 */
export const TRIAL_LENGTH_EXPERIMENT = {
  key: 'trial_length_v1',
  variants: ['t7', 't3'],
} as const satisfies Experiment<'t7' | 't3'>;

export type TrialVariant = (typeof TRIAL_LENGTH_EXPERIMENT.variants)[number];

const TRIAL_DAYS: Record<TrialVariant, number> = { t7: 7, t3: 3 };

/** Stable trial assignment for an install: the arm and its day count. */
export function resolveTrial(seed: string): { variant: TrialVariant; days: number } {
  const variant = assignVariant(TRIAL_LENGTH_EXPERIMENT, seed);
  return { variant, days: TRIAL_DAYS[variant] };
}
