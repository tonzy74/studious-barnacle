import { WHISKEY_DB } from '../data/whiskeyDatabase';
import { averageProfiles, cosineSimilarity, toVector } from './flavor';
import { Bottle, WhiskeyRecord } from '../types';

export interface Recommendation {
  record: WhiskeyRecord;
  /** 0-100 palate match. */
  match: number;
}

function normName(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

/**
 * Recommend bottles the user is likely to love, from the reference catalog,
 * by matching each candidate's flavor profile to the user's *palate* — the
 * average of their collection's profiles. Excludes bottles they already own,
 * skips store-pick variants (near-duplicates), and limits per distillery so
 * the list stays varied.
 */
export function recommendBottles(
  bottles: Bottle[],
  learned: WhiskeyRecord[] = [],
  limit = 15
): Recommendation[] {
  if (bottles.length === 0) return [];
  const palate = toVector(averageProfiles(bottles.map((b) => b.flavor)));
  const owned = new Set(bottles.map((b) => normName(b.name)));

  const scored: Recommendation[] = [];
  for (const record of [...WHISKEY_DB, ...learned]) {
    // Skip store-pick variants — they'd flood the list with near-duplicates.
    if (record.name.includes('—')) continue;
    if (owned.has(normName(record.name))) continue;
    const sim = cosineSimilarity(palate, toVector(record.flavor));
    scored.push({ record, match: Math.round(Math.max(0, Math.min(1, sim)) * 100) });
  }
  scored.sort((a, b) => b.match - a.match);

  // Cap to two per distillery for variety.
  const perHouse = new Map<string, number>();
  const out: Recommendation[] = [];
  for (const rec of scored) {
    const key = normName(rec.record.distillery);
    const n = perHouse.get(key) ?? 0;
    if (n >= 2) continue;
    perHouse.set(key, n + 1);
    out.push(rec);
    if (out.length >= limit) break;
  }
  return out;
}
