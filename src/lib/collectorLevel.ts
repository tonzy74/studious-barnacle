import { Bottle } from '../types';

/**
 * Collector Level — a single overall status rank derived from the collection.
 * Grounded in well-studied, *honest* psychology:
 *  • Self-signaling / identity (Bodner & Prelec): people act to confirm a
 *    self-image. "I'm a Curator" makes the hobby part of who they are.
 *  • Goal-setting theory (Locke & Latham): a specific, slightly-out-of-reach
 *    next rank motivates more than a vague "collect more".
 *  • Goal-gradient effect (Kivetz): progress toward the next rank accelerates
 *    effort as it nears.
 * Every input is the user's own data — no fabricated stats. The score rewards a
 * deep, well-rounded, quality collection, not just raw count, so it nudges the
 * behavior a serious hobbyist actually values.
 */

export interface LevelTier {
  title: string;
  /** Minimum score to reach this tier. */
  min: number;
}

// Aspirational, whiskey-native titles. Thresholds ramp so early levels come
// quickly (early wins) and later ones stretch (long-term pull).
export const LEVEL_TIERS: LevelTier[] = [
  { title: 'Novice', min: 0 },
  { title: 'Enthusiast', min: 15 },
  { title: 'Aficionado', min: 40 },
  { title: 'Collector', min: 90 },
  { title: 'Curator', min: 180 },
  { title: 'Connoisseur', min: 350 },
  { title: 'Master', min: 650 },
  { title: 'Legend', min: 1000 },
];

const RARITY_POINTS: Record<string, number> = { S: 8, A: 4, B: 2, C: 0.5, D: 0.25 };

/**
 * A collection's collector score: rewards count, style diversity, rarity depth,
 * and value together, so a curated 20-bottle bar can outrank a shallow 40.
 */
export function collectorScore(bottles: Bottle[], value: number): number {
  if (bottles.length === 0) return 0;
  const units = bottles.reduce((n, b) => n + Math.max(1, b.quantity), 0);
  const styles = new Set(bottles.map((b) => b.type)).size;
  const rarity = bottles.reduce((sum, b) => sum + (RARITY_POINTS[b.rarity ?? 'C'] ?? 0.5), 0);
  const valuePoints = value / 100; // 1 pt per $100 of collection value
  return Math.round(units + styles * 3 + rarity + valuePoints);
}

export interface CollectorLevel {
  /** 1-based level number. */
  level: number;
  title: string;
  score: number;
  /** Title of the next rank, or undefined at the top. */
  nextTitle?: string;
  /** Score needed to reach the next rank, or undefined at the top. */
  nextAt?: number;
  /** Points remaining to the next rank (0 at the top). */
  toNext: number;
  /** 0–1 progress from this rank to the next (1 at the top). */
  progress: number;
}

/** Resolve a collection to its collector level with progress to the next rank. */
export function collectorLevel(bottles: Bottle[], value: number): CollectorLevel {
  const score = collectorScore(bottles, value);
  let idx = 0;
  for (let i = 0; i < LEVEL_TIERS.length; i++) {
    if (score >= LEVEL_TIERS[i].min) idx = i;
  }
  const tier = LEVEL_TIERS[idx];
  const next = LEVEL_TIERS[idx + 1];
  if (!next) {
    return { level: idx + 1, title: tier.title, score, toNext: 0, progress: 1 };
  }
  const span = next.min - tier.min;
  return {
    level: idx + 1,
    title: tier.title,
    score,
    nextTitle: next.title,
    nextAt: next.min,
    toNext: Math.max(0, next.min - score),
    progress: Math.min(1, (score - tier.min) / span),
  };
}
