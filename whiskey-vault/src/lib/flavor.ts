import { FLAVOR_AXES, TYPE_DEFAULTS, WHISKEY_DB } from '../data/whiskeyDatabase';
import { Bottle, FlavorProfile, MatchResult, WhiskeyRecord, WhiskeyType } from '../types';

export function toVector(p: FlavorProfile): number[] {
  return FLAVOR_AXES.map((axis) => p[axis]);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

export function averageProfiles(profiles: FlavorProfile[]): FlavorProfile {
  const result = {} as FlavorProfile;
  for (const axis of FLAVOR_AXES) {
    const sum = profiles.reduce((acc, p) => acc + p[axis], 0);
    result[axis] = profiles.length ? sum / profiles.length : 0;
  }
  return result;
}

function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .replace(/[''`.]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Generic words that shouldn't count as evidence of a specific bottle. */
const STOPWORDS = new Set([
  'whiskey',
  'whisky',
  'bourbon',
  'straight',
  'single',
  'malt',
  'the',
  'and',
  'of',
  'aged',
  'year',
  'years',
  'yr',
]);

/**
 * Fuzzy-match a user-typed whiskey name against the reference database.
 * Scores on shared word overlap so "weller" finds W.L. Weller Special Reserve
 * and "elijah craig bp" finds Elijah Craig Barrel Proof.
 */
export function findWhiskeyByName(query: string): WhiskeyRecord | undefined {
  const q = normalizeName(query);
  if (!q) return undefined;
  const qWords = q.split(' ');

  let best: WhiskeyRecord | undefined;
  let bestScore = 0;
  for (const record of WHISKEY_DB) {
    const target = normalizeName(`${record.name} ${record.distillery}`);
    const targetWords = new Set(target.split(' '));
    let score = 0;
    for (const w of qWords) {
      if (STOPWORDS.has(w)) {
        // Generic words only break ties, they can't establish a match.
        if (targetWords.has(w)) score += 0.25;
      } else if (targetWords.has(w)) {
        score += 2;
      } else if (w.length >= 4 && target.includes(w)) {
        score += 1;
      }
    }
    // Exact full-name containment is a strong signal.
    if (normalizeName(record.name).includes(q) || q.includes(normalizeName(record.name))) {
      score += 3;
    }
    if (score > bestScore) {
      bestScore = score;
      best = record;
    }
  }
  // Require at least one solid word match to avoid nonsense matches.
  return bestScore >= 2 ? best : undefined;
}

export function findWhiskeyByBarcode(barcode: string): WhiskeyRecord | undefined {
  return WHISKEY_DB.find((r) => r.barcodes?.includes(barcode));
}

export function defaultProfileFor(type: WhiskeyType): FlavorProfile {
  return { ...TYPE_DEFAULTS[type] };
}

/**
 * Score every bottle in the collection against a set of favorite whiskeys.
 * Favorites are resolved against the reference DB; unresolvable names are
 * returned so the UI can tell the user which ones weren't recognized.
 */
export function matchCollection(
  favorites: string[],
  collection: Bottle[]
): { results: MatchResult[]; unrecognized: string[]; recognized: WhiskeyRecord[] } {
  const recognized: WhiskeyRecord[] = [];
  const unrecognized: string[] = [];
  for (const fav of favorites) {
    const record = findWhiskeyByName(fav);
    if (record) recognized.push(record);
    else unrecognized.push(fav);
  }

  if (recognized.length === 0) {
    return { results: [], unrecognized, recognized };
  }

  const target = toVector(averageProfiles(recognized.map((r) => r.flavor)));
  const results = collection
    .map((bottle) => ({
      bottle,
      percent: Math.round(cosineSimilarity(target, toVector(bottle.flavor)) * 100),
    }))
    .sort((a, b) => b.percent - a.percent);

  return { results, unrecognized, recognized };
}

/** Pick a random bottle, optionally filtered. */
export function randomPour(
  collection: Bottle[],
  opts: { type?: WhiskeyType | 'any'; openedOnly?: boolean; minProof?: number; maxProof?: number } = {}
): Bottle | undefined {
  const pool = collection.filter((b) => {
    if (b.quantity <= 0) return false;
    if (opts.openedOnly && !b.opened) return false;
    if (opts.type && opts.type !== 'any' && b.type !== opts.type) return false;
    if (opts.minProof !== undefined && b.proof < opts.minProof) return false;
    if (opts.maxProof !== undefined && b.proof > opts.maxProof) return false;
    return true;
  });
  if (pool.length === 0) return undefined;
  return pool[Math.floor(Math.random() * pool.length)];
}
