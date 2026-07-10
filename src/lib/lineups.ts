import { Bottle } from '../types';

/**
 * "Complete the set" cross-sell. Collectors are completionists — an
 * almost-finished set is a powerful pull (Zeigarnik effect + goal-gradient), and
 * surfacing the *missing* bottles turns that pull into hunt-list adds and
 * affiliate buy-throughs. These are real, iconic lineups; nothing invented.
 */

export interface Lineup {
  name: string;
  distillery: string;
  bottles: string[];
}

export const LINEUPS: Lineup[] = [
  {
    name: 'Buffalo Trace Antique Collection',
    distillery: 'Buffalo Trace',
    bottles: ['George T. Stagg', 'William Larue Weller', 'Thomas H. Handy', 'Eagle Rare 17', 'Sazerac 18'],
  },
  {
    name: 'E.H. Taylor Collection',
    distillery: 'Buffalo Trace',
    bottles: ['E.H. Taylor Small Batch', 'E.H. Taylor Single Barrel', 'E.H. Taylor Barrel Proof', 'E.H. Taylor Straight Rye'],
  },
  {
    name: 'W.L. Weller Lineup',
    distillery: 'Buffalo Trace',
    bottles: ['W.L. Weller Special Reserve', 'W.L. Weller Antique 107', 'W.L. Weller 12 Year', 'W.L. Weller Full Proof'],
  },
  {
    name: 'Old Forester Whiskey Row',
    distillery: 'Brown-Forman',
    bottles: ['Old Forester 1870', 'Old Forester 1897', 'Old Forester 1910', 'Old Forester 1920'],
  },
  {
    name: 'Four Roses Core',
    distillery: 'Four Roses',
    bottles: ['Four Roses Small Batch', 'Four Roses Single Barrel', 'Four Roses Small Batch Select'],
  },
  {
    name: 'Pappy Van Winkle Vertical',
    distillery: 'Buffalo Trace',
    bottles: ['Pappy Van Winkle 15 Year', 'Pappy Van Winkle 20 Year', 'Pappy Van Winkle 23 Year'],
  },
];

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '');

/**
 * Whether the collection contains a bottle matching this lineup member. Match
 * when the owned name equals or *contains* the canonical member (so batch codes
 * / picks still count) — but not the reverse, so a shorter "Small Batch" can't
 * satisfy the distinct "Small Batch Select".
 */
function owns(ownedNorms: string[], member: string): boolean {
  const m = norm(member);
  return ownedNorms.some((o) => o === m || o.includes(m));
}

export interface LineupProgress {
  name: string;
  distillery: string;
  total: number;
  owned: number;
  progress: number;
  /** Names still missing — the buy/hunt targets. */
  missing: string[];
}

/**
 * Lineups the user has *started but not finished*, closest to complete first.
 * Started-but-unfinished is the sweet spot: enough investment to care, a clear
 * gap to close. Fully-owned and untouched lineups are excluded.
 */
export function lineupProgress(bottles: Bottle[]): LineupProgress[] {
  const ownedNorms = bottles.map((b) => norm(b.name));
  const out: LineupProgress[] = [];
  for (const lu of LINEUPS) {
    const missing = lu.bottles.filter((m) => !owns(ownedNorms, m));
    const owned = lu.bottles.length - missing.length;
    if (owned >= 1 && missing.length >= 1) {
      out.push({
        name: lu.name,
        distillery: lu.distillery,
        total: lu.bottles.length,
        owned,
        progress: owned / lu.bottles.length,
        missing,
      });
    }
  }
  return out.sort((a, b) => b.progress - a.progress);
}

/** The single most-nudgeable lineup (closest to done), if any. */
export function closestLineup(bottles: Bottle[]): LineupProgress | undefined {
  return lineupProgress(bottles)[0];
}
