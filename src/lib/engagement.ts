import { Bottle, WhiskeyType } from '../types';

/**
 * Retention / engagement mechanics, grounded in behavioral research:
 *  • Streaks exploit loss aversion + the "don't break the chain" habit loop
 *    (Duolingo's single biggest retention lever; Eyal's Hooked model).
 *  • A daily-rotating "pour of the day" is a variable reward — the engine of
 *    habit formation — and a concrete reason to open the app every day.
 *  • Milestones use the goal-gradient effect (Kivetz 2006): motivation rises
 *    as a goal nears, so we always surface the *closest* unmet goal.
 * All logic here is pure and deterministic so it can be unit-tested and runs
 * instantly offline.
 */

/** Calendar day number in the user's local timezone (stable integer). */
export function dayNumber(now: number = Date.now()): number {
  const d = new Date(now);
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000);
}

export interface StreakState {
  /** Consecutive days the app was opened, including today. */
  streak: number;
  /** Best streak ever reached. */
  longestStreak: number;
  /** dayNumber of the most recent visit. */
  lastVisitDay: number;
}

/**
 * Fold a visit into the streak. Same-day visits are idempotent; a visit the
 * next calendar day extends the streak; a gap resets it to 1.
 */
export function registerVisit(prev: StreakState, now: number = Date.now()): StreakState {
  const today = dayNumber(now);
  if (prev.lastVisitDay === today) return prev;
  const streak = prev.lastVisitDay === today - 1 ? prev.streak + 1 : 1;
  return {
    streak,
    longestStreak: Math.max(prev.longestStreak, streak),
    lastVisitDay: today,
  };
}

/** True if the streak is still alive today (visited today or yesterday). */
export function streakAlive(s: StreakState, now: number = Date.now()): boolean {
  const today = dayNumber(now);
  return s.lastVisitDay === today || s.lastVisitDay === today - 1;
}

/**
 * A deterministic daily pick from the collection — same all day, changes
 * tomorrow. Prefers open bottles (something to actually pour tonight); falls
 * back to the whole collection so there's always a suggestion.
 */
export function pourOfTheDay(bottles: Bottle[], now: number = Date.now()): Bottle | undefined {
  if (bottles.length === 0) return undefined;
  const pool = bottles.filter((b) => b.opened);
  const list = pool.length ? pool : bottles;
  // Sort for stability (collection order isn't guaranteed), then index by day.
  const sorted = [...list].sort((a, b) => a.id.localeCompare(b.id));
  return sorted[dayNumber(now) % sorted.length];
}

export interface Milestone {
  key: string;
  label: string;
  /** Progress current / target (both integers for a clean "3 / 5"). */
  current: number;
  target: number;
  /** 0–1 completion fraction. */
  progress: number;
  /** What reaching it unlocks/earns, framed as a reward. */
  reward: string;
}

const BOTTLE_TIERS = [1, 5, 10, 25, 50, 100, 250];
const VALUE_TIERS = [500, 1_000, 2_500, 5_000, 10_000, 25_000, 50_000];
const ALL_STYLES: WhiskeyType[] = [
  'bourbon',
  'rye',
  'tennessee',
  'scotch',
  'irish',
  'japanese',
  'canadian',
];

const nextTier = (tiers: number[], value: number) => tiers.find((t) => value < t);

/**
 * The single most motivating next milestone — the one closest to completion
 * across collection size, value, and style diversity (goal-gradient effect).
 * Returns undefined only when every tracked goal is maxed out.
 */
export function nextMilestone(bottles: Bottle[], collectionValue: number): Milestone | undefined {
  const candidates: Milestone[] = [];

  const count = bottles.reduce((n, b) => n + Math.max(1, b.quantity), 0);
  const countTarget = nextTier(BOTTLE_TIERS, count);
  if (countTarget) {
    candidates.push({
      key: 'bottles',
      label: `Collect ${countTarget} bottles`,
      current: count,
      target: countTarget,
      progress: count / countTarget,
      reward: `${countTarget}-bottle collector badge`,
    });
  }

  const valueTarget = nextTier(VALUE_TIERS, collectionValue);
  if (valueTarget) {
    candidates.push({
      key: 'value',
      label: `Reach a $${valueTarget.toLocaleString()} vault`,
      current: Math.round(collectionValue),
      target: valueTarget,
      progress: collectionValue / valueTarget,
      reward: 'Higher vault tier',
    });
  }

  const styles = new Set(bottles.map((b) => b.type).filter((t) => ALL_STYLES.includes(t)));
  if (styles.size < ALL_STYLES.length) {
    candidates.push({
      key: 'styles',
      label: 'Collect all core styles',
      current: styles.size,
      target: ALL_STYLES.length,
      progress: styles.size / ALL_STYLES.length,
      reward: 'Well-Rounded Palate badge',
    });
  }

  if (candidates.length === 0) return undefined;
  // Closest to done wins (goal-gradient), but ignore not-yet-started goals so
  // we nudge toward something already in motion when possible.
  const started = candidates.filter((c) => c.current > 0);
  const pool = started.length ? started : candidates;
  return pool.sort((a, b) => b.progress - a.progress)[0];
}

/** Curated, offline micro-education — a small daily reason to linger + learn. */
export const WHISKEY_TIPS: string[] = [
  'A few drops of water can open up a high-proof pour — it breaks surface tension and releases aroma.',
  '"Bottled in Bond" means one distillery, one season, at least four years old, and exactly 100 proof.',
  'The angel\'s share is the whiskey lost to evaporation while aging — up to 4% a year in hot rickhouses.',
  'Bourbon must be at least 51% corn and aged in new charred oak. There\'s no minimum age unless it says "straight."',
  'Store bottles upright — unlike wine, high-proof spirits degrade the cork over time.',
  'A Glencairn glass concentrates aroma at the rim; most of "taste" is actually smell.',
  'Single barrel means every bottle came from one cask, so batch-to-batch variation is part of the fun.',
  'Higher rickhouse floors run hotter, aging spirit faster and often bolder — a favorite for single-barrel picks.',
  'Rye whiskey (51%+ rye) leans spicy and dry; wheated bourbons swap rye for wheat and drink softer.',
  'Chill filtration removes fatty acids for clarity, but many enthusiasts prefer non-chill-filtered for texture.',
  'Age is time in the barrel, not the bottle — whiskey stops maturing the moment it\'s bottled.',
  'Proof is twice the ABV: 100 proof = 50% alcohol. The term dates to British navy gunpowder tests.',
];

/** A deterministic daily tip (rotates with the calendar day). */
export function tipOfTheDay(now: number = Date.now()): string {
  return WHISKEY_TIPS[dayNumber(now) % WHISKEY_TIPS.length];
}
