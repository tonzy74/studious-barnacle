import { Comp } from '../types';

/**
 * Secondary-market valuation from real comps.
 *
 * Every completed in-app trade (and any logged sale) drops one observed
 * value per bottling into the comp set. We turn those into a live
 * secondary-market value with a **time-decayed weighted median** — recent
 * activity counts more, and the median resists outliers. This is the
 * compliant, activity-grown answer to a "blue book": the more the community
 * trades, the sharper the numbers, with no scraping and no fabricated data.
 *
 * Today comps are on-device; the same shape submits to / hydrates from the
 * pricing backend for cross-user aggregation (see submitComp / config).
 */

const HALF_LIFE_DAYS = 90;
const MAX_AGE_DAYS = 540;
/** Effective sample weight needed before we trust comps over the estimate. */
const MIN_CONFIDENT_WEIGHT = 2.5;

export function compKey(name: string): string {
  return name
    .toLowerCase()
    // Drop apostrophes/periods first so "Blanton's" == "Blantons".
    .replace(/['’`.]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export interface CompValue {
  value: number;
  /** Number of comps that fed this value. */
  count: number;
  /** Effective (decay-weighted) sample size. */
  weight: number;
  confidence: 'comps' | 'thin';
}

/** Time-decayed weighted median secondary value for a bottling, if any comps exist. */
export function compValue(name: string, comps: Comp[], now: number = Date.now()): CompValue | undefined {
  const key = compKey(name);
  if (!key) return undefined;
  const dayMs = 86_400_000;

  const weighted: { value: number; w: number }[] = [];
  let count = 0;
  let totalWeight = 0;
  for (const c of comps) {
    if (compKey(c.name) !== key) continue;
    if (!Number.isFinite(c.value) || c.value <= 0) continue;
    const ageDays = Math.max(0, (now - c.at) / dayMs);
    if (ageDays > MAX_AGE_DAYS) continue;
    const w = Math.pow(0.5, ageDays / HALF_LIFE_DAYS);
    weighted.push({ value: c.value, w });
    totalWeight += w;
    count++;
  }
  if (count === 0 || totalWeight === 0) return undefined;

  // Weighted median.
  weighted.sort((a, b) => a.value - b.value);
  let acc = 0;
  let median = weighted[weighted.length - 1].value;
  for (const item of weighted) {
    acc += item.w;
    if (acc >= totalWeight / 2) {
      median = item.value;
      break;
    }
  }

  return {
    value: Math.round(median),
    count,
    weight: Math.round(totalWeight * 100) / 100,
    confidence: totalWeight >= MIN_CONFIDENT_WEIGHT ? 'comps' : 'thin',
  };
}

let seq = 0;
function newCompId(): string {
  seq = (seq + 1) % 1000;
  return `${Date.now().toString(36)}-${seq}-${Math.random().toString(36).slice(2, 6)}`;
}

/** Build comp records for the bottles in a completed trade. */
export function tradeComps(
  entries: { name: string; value: number }[],
  now: number = Date.now()
): Comp[] {
  return entries
    .filter((e) => e.name.trim() && Number.isFinite(e.value) && e.value > 0)
    .map((e) => ({ id: newCompId(), name: e.name.trim(), value: Math.round(e.value), at: now, source: 'trade' as const }));
}
