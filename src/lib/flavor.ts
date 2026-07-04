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

/**
 * Words that describe a batch/pick rather than the bottling itself:
 * mixed letter-digit codes ("C923", "B524", "23A"), and pick vocabulary.
 * Pure numbers are kept — they're often part of the real name ("1792",
 * "Weller 107", "Eagle Rare 10").
 */
const VARIANT_WORDS = new Set(['batch', 'pick', 'picked', 'bbl', 'store']);

/** Collector shorthand → full bottling names. */
const ALIASES: Record<string, string> = {
  ecbp: 'elijah craig barrel proof',
  gts: 'george t stagg',
  wlw: 'william larue weller',
  thh: 'thomas h handy sazerac rye',
  sftb: 'blantons straight from the barrel',
  owa: 'old weller antique 107',
  jd: 'jack daniels',
  wt: 'wild turkey',
  ofbb: 'old fitzgerald bottled in bond',
  mm: 'makers mark',
  ehtaylor: 'e h taylor',
};

function isBatchCode(word: string): boolean {
  return /^[a-z]\d{2,}$/i.test(word) || /^\d{2,}[a-z]$/i.test(word) || /^\d{4}-\d{2}$/.test(word);
}

/**
 * Scale a flavor profile for a proof different from the reference bottling —
 * store picks and barrel-proof batches run hotter or softer than the base
 * expression. Intensity-driven axes shift ~0.25 points per 10 proof.
 */
export function scaleProfileForProof(
  profile: FlavorProfile,
  fromProof: number,
  toProof: number
): FlavorProfile {
  const delta = (toProof - fromProof) / 10;
  if (Math.abs(delta) < 0.2) return { ...profile };
  const bump = (v: number, factor: number) =>
    Math.round(Math.min(10, Math.max(0, v + delta * factor)) * 10) / 10;
  return {
    ...profile,
    oak: bump(profile.oak, 0.3),
    caramel: bump(profile.caramel, 0.25),
    spice: bump(profile.spice, 0.3),
    smoke: bump(profile.smoke, 0.1),
  };
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
 * Reduce a raw query to the significant words used for matching: drop batch
 * codes and pick vocabulary so "ECBP batch C923" or "Blanton's Total Wine
 * pick" still resolve to the base bottling, and expand collector shorthand
 * ("ecbp", "gts", "wlw").
 */
function queryWordsFor(query: string): { q: string; words: string[] } {
  const q = normalizeName(query);
  if (!q) return { q, words: [] };
  const words = q
    .split(' ')
    .filter((w) => !isBatchCode(w) && !VARIANT_WORDS.has(w))
    .flatMap((w) => (ALIASES[w] ? ALIASES[w].split(' ') : [w]));
  return { q, words };
}

/** Score one reference record against pre-computed query words. */
function scoreRecord(record: WhiskeyRecord, q: string, qWords: string[]): number {
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
  return score;
}

/** A ranked reference match with its raw relevance score. */
export interface WhiskeyCandidate {
  record: WhiskeyRecord;
  score: number;
}

/**
 * Rank the reference database against a query, best first. Powers the "not
 * the right bottle?" corrections list — the scanner's single best guess is
 * just candidates[0], and the user can pick any of the alternates.
 */
export function findWhiskeyCandidates(
  query: string,
  extraDb: WhiskeyRecord[] = [],
  limit = 6
): WhiskeyCandidate[] {
  const { q, words } = queryWordsFor(query);
  if (words.length === 0) return [];
  const scored: WhiskeyCandidate[] = [];
  for (const record of [...WHISKEY_DB, ...extraDb]) {
    const score = scoreRecord(record, q, words);
    // Require at least one solid word match to avoid nonsense matches.
    if (score >= 2) scored.push({ record, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

/**
 * Fuzzy-match a user-typed whiskey name against the reference database.
 * Scores on shared word overlap so "weller" finds W.L. Weller Special Reserve
 * and "elijah craig bp" finds Elijah Craig Barrel Proof.
 */
export function findWhiskeyByName(query: string, extraDb: WhiskeyRecord[] = []): WhiskeyRecord | undefined {
  return findWhiskeyCandidates(query, extraDb, 1)[0]?.record;
}

export function findWhiskeyByBarcode(
  barcode: string,
  extraDb: WhiskeyRecord[] = []
): WhiskeyRecord | undefined {
  return (
    WHISKEY_DB.find((r) => r.barcodes?.includes(barcode)) ??
    extraDb.find((r) => r.barcodes?.includes(barcode))
  );
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
  collection: Bottle[],
  extraDb: WhiskeyRecord[] = []
): { results: MatchResult[]; unrecognized: string[]; recognized: WhiskeyRecord[] } {
  const recognized: WhiskeyRecord[] = [];
  const unrecognized: string[] = [];
  for (const fav of favorites) {
    const record = findWhiskeyByName(fav, extraDb);
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
  opts: {
    type?: WhiskeyType | 'any';
    openedOnly?: boolean;
    minProof?: number;
    maxProof?: number;
    /** Exclude S/A-tier allocated bottles — don't burn unicorns on a Tuesday. */
    protectAllocated?: boolean;
  } = {}
): Bottle | undefined {
  const pool = collection.filter((b) => {
    if (b.quantity <= 0) return false;
    if (opts.openedOnly && !b.opened) return false;
    if (opts.type && opts.type !== 'any' && b.type !== opts.type) return false;
    if (opts.minProof !== undefined && b.proof < opts.minProof) return false;
    if (opts.maxProof !== undefined && b.proof > opts.maxProof) return false;
    if (opts.protectAllocated && (b.rarity === 'S' || b.rarity === 'A')) return false;
    return true;
  });
  if (pool.length === 0) return undefined;
  return pool[Math.floor(Math.random() * pool.length)];
}
