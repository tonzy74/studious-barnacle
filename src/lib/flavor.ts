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

/**
 * Generic words that shouldn't count as evidence of a *specific* bottle.
 * These are descriptors shared across hundreds of bottlings (cask strength,
 * barrel proof, small batch, bottled in bond…). Without them here, a query
 * like "13th Colony Cask Strength" would falsely match "Maker's Mark Cask
 * Strength" on the shared "cask"+"strength" — so accuracy depends on the
 * distinctive brand words carrying the match, not the descriptors.
 */
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
  'in',
  'a',
  'aged',
  'year',
  'years',
  'yr',
  // Strength / proof descriptors
  'cask',
  'strength',
  'barrel',
  'barrels',
  'proof',
  'full',
  'overproof',
  // Batch / release descriptors
  'small',
  'batch',
  'bottled',
  'bond',
  'bonded',
  'reserve',
  'select',
  'selection',
  'limited',
  'edition',
  'release',
  'special',
  'original',
  'finish',
  'finished',
  'number',
  'no',
  // Origin / producer descriptors
  'kentucky',
  'tennessee',
  'distillery',
  'distilling',
  'distillers',
  'company',
  'co',
  'sour',
  'mash',
  'old',
  'rare',
  'premium',
]);

const isNumberWord = (w: string) => /^\d+$/.test(w);
/** 1–3 digit number = age/proof (Eagle Rare 10, Weller 107); not a brand word. */
const isAgeNumber = (w: string) => /^\d{1,3}$/.test(w);

/** A query name is a whiskey name; a distillery is matched separately. */
export type NameQuery = string | { name: string; distillery?: string };

interface MatchQuery {
  /** Normalized name string, for whole-name containment. */
  nameNorm: string;
  /** Distinctive (non-stopword) words from the product name. */
  nameWords: string[];
  /** Pure-number words in the name (age/proof) — matched, never anchoring. */
  nameNums: Set<string>;
  /** Generic descriptor words present in the query — tie-breakers only. */
  descriptors: Set<string>;
  /** Distinctive words from the distillery (empty for free-text queries). */
  distWords: Set<string>;
}

/**
 * Split a query into name words vs distillery words so distillery agreement is
 * scored separately and can never, on its own, pull in an unrelated bottling.
 * Drops batch codes and pick vocabulary, and expands collector shorthand
 * ("ecbp" → "elijah craig barrel proof").
 */
function buildQuery(input: NameQuery): MatchQuery {
  const name = typeof input === 'string' ? input : input.name;
  const distillery = typeof input === 'string' ? '' : input.distillery ?? '';
  const nameNorm = normalizeName(name);
  const words = nameNorm
    .split(' ')
    .filter((w) => w && !isBatchCode(w) && !VARIANT_WORDS.has(w))
    .flatMap((w) => (ALIASES[w] ? ALIASES[w].split(' ') : [w]));
  // 1–3 digit numbers are ages/proofs (matched, never anchoring); 4-digit
  // numbers ("1792", "1910", "1920") are brand identifiers and stay as name
  // words that can anchor a match.
  const nameWords = words.filter((w) => !STOPWORDS.has(w) && !isAgeNumber(w));
  return {
    nameNorm: words.join(' '),
    nameWords,
    nameNums: new Set(words.filter(isAgeNumber)),
    // Generic descriptors (cask/strength/small/batch…) — only break ties.
    descriptors: new Set(words.filter((w) => STOPWORDS.has(w))),
    distWords: new Set(
      normalizeName(distillery)
        .split(' ')
        .filter((w) => w && !STOPWORDS.has(w))
    ),
  };
}

/**
 * Per-record normalized search text, computed once and cached. Without this,
 * every keystroke re-runs the normalize regex over every record — the single
 * biggest cost as the database grows. Keyed by record identity so both the
 * static DB and the runtime-learned library are covered, and entries are
 * garbage-collected with their records.
 */
interface RecordSearchText {
  full: string;
  fullWords: Set<string>;
  nameNorm: string;
  /**
   * Distinctive product-name words drawn from the bottling's NAME only (minus
   * generic descriptors and age numbers). These identify the bottle ("weller",
   * "forester", "emmer", "1792"). A match must share one — and because these
   * come from the name, not the distillery, a shared distillery alone can never
   * produce a (wrong) match: unrelated bottlings from the same distillery don't
   * carry that distillery's words in their names.
   */
  nameWords: Set<string>;
  /** Age/proof numbers in the name (1–3 digits): matched, never anchoring. */
  nums: Set<string>;
  /** The distillery's words — supporting evidence only, never sufficient. */
  distWords: Set<string>;
}
const searchTextCache = new WeakMap<WhiskeyRecord, RecordSearchText>();

function searchTextFor(record: WhiskeyRecord): RecordSearchText {
  const cached = searchTextCache.get(record);
  if (cached) return cached;
  // Store picks carry a "— Retailer Pick #1234" suffix that identifies the
  // barrel, not the whiskey. Match only on the base bottling name (before the
  // em-dash) so retailer words never create spurious matches.
  const baseName = record.name.split('—')[0];
  const nameNorm = normalizeName(baseName);
  const full = normalizeName(`${baseName} ${record.distillery}`);
  const distWords = new Set(
    normalizeName(record.distillery)
      .split(' ')
      .filter((w) => w && !STOPWORDS.has(w))
  );
  const nameTokens = nameNorm.split(' ').filter(Boolean);
  const value: RecordSearchText = {
    full,
    fullWords: new Set(full.split(' ')),
    nameNorm,
    nameWords: new Set(nameTokens.filter((w) => !STOPWORDS.has(w) && !isAgeNumber(w))),
    nums: new Set(nameTokens.filter(isAgeNumber)),
    distWords,
  };
  searchTextCache.set(record, value);
  return value;
}

/** A record's relevance, split so callers can require real name agreement. */
interface RecordScore {
  /** Total weighted score for ranking. */
  score: number;
  /** True when the record clears the bar to be considered a match at all. */
  qualifies: boolean;
}

/** Score one reference record against a structured query. */
function scoreRecord(record: WhiskeyRecord, query: MatchQuery): RecordScore {
  const rec = searchTextFor(record);
  const qNameSet = new Set(query.nameWords);
  let score = 0;
  let nameHits = 0;

  // Distinctive product-name agreement — the only thing that can anchor a match.
  for (const w of query.nameWords) {
    if (rec.nameWords.has(w)) {
      score += 3;
      nameHits++;
    } else if (w.length >= 4 && rec.full.includes(w)) {
      score += 1; // partial/substring hit
    }
  }
  // Two coverage views decide whether the anchor is trustworthy:
  //  • recordCoverage — how much of THIS record's identity the query hit. A
  //    lone "hill" against Rock Hill Farms is weak (0.33) and won't qualify.
  //  • queryCoverage — how many of the QUERY's own distinctive words landed. A
  //    casual "pappy 15" fully covers its one distinctive word ("pappy") so it
  //    resolves, while "Heaven Hill 19" only half-covers against Rock Hill Farms.
  const recordCoverage = rec.nameWords.size ? nameHits / rec.nameWords.size : 0;
  const queryCoverage = query.nameWords.length ? nameHits / query.nameWords.length : 0;

  // Distillery agreement is supporting evidence only — capped low so it can
  // never rival real name agreement or, on its own, produce a match.
  let distHits = 0;
  for (const w of rec.distWords) {
    if (query.distWords.has(w) || qNameSet.has(w)) distHits++;
  }
  score += Math.min(distHits, 3) * 0.5;

  // Age/proof numbers: reward agreement; flag an age the query specified that
  // this record lacks — they're almost certainly different expressions
  // ("Heaven Hill 19" must not match a Heaven Hill with a different/no age).
  let numHits = 0;
  let numMismatch = false;
  for (const n of query.nameNums) {
    if (rec.nums.has(n)) numHits++;
    else numMismatch = true;
  }
  score += numHits * 1.5;

  // Prefer the least over-specific record: dock the record's own distinctive
  // words the query never mentioned, so "Buffalo Trace" beats "Buffalo Trace
  // White Dog" and a plain scan doesn't grab a random single-barrel pick.
  let extra = 0;
  for (const w of rec.nameWords) {
    if (!qNameSet.has(w)) extra++;
  }
  score -= extra * 0.75;

  // Generic descriptors (cask/proof/small/batch…) only break ties between
  // bottlings that already share a name anchor.
  for (const w of query.descriptors) {
    if (rec.full.includes(w)) score += 0.25;
  }

  // Whole-name containment is a strong signal.
  if (rec.nameNorm.includes(query.nameNorm) || query.nameNorm.includes(rec.nameNorm)) {
    score += 3;
  }

  // A match needs a real name-word anchor that either covers half this record's
  // identity or fully accounts for the query's own distinctive words (a short,
  // exact brand name like "pappy" or "weller"), and must not contradict an age
  // the query named. Distillery/descriptor overlap alone is never enough.
  const qualifies =
    nameHits >= 1 && (recordCoverage >= 0.5 || queryCoverage >= 1) && !numMismatch;
  return { score, qualifies: qualifies && score >= 2.5 };
}

/** A ranked reference match with its raw relevance score. */
export interface WhiskeyCandidate {
  record: WhiskeyRecord;
  score: number;
}

/**
 * Rank the reference database against a query, best first. Powers the "not
 * the right bottle?" corrections list — the scanner's single best guess is
 * just candidates[0], and the user can pick any of the alternates. Pass a
 * `{ name, distillery }` object (from a scan) so distillery agreement is scored
 * separately and can't, by itself, pull in an unrelated bottling.
 */
export function findWhiskeyCandidates(
  query: NameQuery,
  extraDb: WhiskeyRecord[] = [],
  limit = 6
): WhiskeyCandidate[] {
  const mq = buildQuery(query);
  if (mq.nameWords.length === 0) return [];
  const scored: WhiskeyCandidate[] = [];
  for (const record of [...WHISKEY_DB, ...extraDb]) {
    const { score, qualifies } = scoreRecord(record, mq);
    if (qualifies) scored.push({ record, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

/**
 * Fuzzy-match a whiskey against the reference database. Scores on distinctive
 * name-word overlap so "weller" finds W.L. Weller Special Reserve and
 * "elijah craig bp" finds Elijah Craig Barrel Proof — but a shared distillery
 * alone never produces a (wrong) match.
 */
export function findWhiskeyByName(
  query: NameQuery,
  extraDb: WhiskeyRecord[] = []
): WhiskeyRecord | undefined {
  return findWhiskeyCandidates(query, extraDb, 1)[0]?.record;
}

/** How sure we are that a library record is the scanned bottle. */
export type MatchConfidence = 'high' | 'medium' | 'low';

export interface WhiskeyMatch {
  record: WhiskeyRecord;
  score: number;
  confidence: MatchConfidence;
}

/**
 * Best library match for a scan, with a confidence tier the UI can surface so a
 * guess never silently masquerades as fact. Because the matcher only qualifies
 * records with genuine name agreement, the raw score is a reliable proxy: a
 * clean multi-word/anchored match lands high, a thin single-word match low.
 * Returns undefined when nothing qualifies — the caller keeps the AI's read and
 * saves it as a new library entry.
 */
export function matchWhiskey(
  query: NameQuery,
  extraDb: WhiskeyRecord[] = []
): WhiskeyMatch | undefined {
  const top = findWhiskeyCandidates(query, extraDb, 1)[0];
  if (!top) return undefined;
  const confidence: MatchConfidence =
    top.score >= 7 ? 'high' : top.score >= 4 ? 'medium' : 'low';
  return { record: top.record, score: top.score, confidence };
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
