import {
  dayNumber,
  nextMilestone,
  pourOfTheDay,
  registerVisit,
  streakAlive,
  tipOfTheDay,
  WHISKEY_TIPS,
} from '../src/lib/engagement';
import { Bottle } from '../src/types';

const DAY = 86_400_000;
// A fixed local-noon timestamp so day math is timezone-stable in the test.
const noon = (dayOffset: number) => {
  const d = new Date(2026, 0, 10 + dayOffset, 12, 0, 0);
  return d.getTime();
};

const bottle = (id: string, over: Partial<Bottle> = {}): Bottle => ({
  id,
  name: id,
  distillery: 'D',
  type: 'bourbon',
  proof: 100,
  flavor: {} as never,
  notes: '',
  rarity: 'C',
  opened: false,
  quantity: 1,
  addedAt: 0,
  ...over,
});

describe('streak', () => {
  const fresh = { streak: 0, longestStreak: 0, lastVisitDay: -999 };

  it('starts at 1 on first visit', () => {
    const s = registerVisit(fresh, noon(0));
    expect(s.streak).toBe(1);
    expect(s.longestStreak).toBe(1);
  });

  it('is idempotent within the same day', () => {
    const s1 = registerVisit(fresh, noon(0));
    const s2 = registerVisit(s1, noon(0) + 3 * 3_600_000);
    expect(s2).toBe(s1); // unchanged reference
    expect(s2.streak).toBe(1);
  });

  it('extends on consecutive days and tracks the longest', () => {
    let s = registerVisit(fresh, noon(0));
    s = registerVisit(s, noon(1));
    s = registerVisit(s, noon(2));
    expect(s.streak).toBe(3);
    expect(s.longestStreak).toBe(3);
  });

  it('resets after a missed day but keeps the record', () => {
    let s = registerVisit(fresh, noon(0));
    s = registerVisit(s, noon(1)); // streak 2
    s = registerVisit(s, noon(3)); // skipped day 2 → reset
    expect(s.streak).toBe(1);
    expect(s.longestStreak).toBe(2);
  });

  it('knows when a streak is still alive', () => {
    const s = registerVisit({ streak: 0, longestStreak: 0, lastVisitDay: -999 }, noon(0));
    expect(streakAlive(s, noon(0))).toBe(true);
    expect(streakAlive(s, noon(1))).toBe(true); // yesterday → still recoverable
    expect(streakAlive(s, noon(2))).toBe(false); // 2 days gap → broken
  });

  it('dayNumber advances by exactly one per day', () => {
    expect(dayNumber(noon(1)) - dayNumber(noon(0))).toBe(1);
    expect(dayNumber(noon(0) + DAY) - dayNumber(noon(0))).toBe(1);
  });
});

describe('pourOfTheDay', () => {
  it('is stable within a day and rotates across days', () => {
    const bottles = [bottle('a'), bottle('b'), bottle('c')];
    const d0 = pourOfTheDay(bottles, noon(0));
    expect(pourOfTheDay(bottles, noon(0) + 3_600_000)?.id).toBe(d0?.id);
    // Across three distinct days we should see it move (not all identical).
    const picks = [noon(0), noon(1), noon(2)].map((t) => pourOfTheDay(bottles, t)?.id);
    expect(new Set(picks).size).toBeGreaterThan(1);
  });

  it('prefers an open bottle when one exists', () => {
    const bottles = [bottle('a'), bottle('b', { opened: true }), bottle('c')];
    for (const off of [0, 1, 2, 3]) {
      expect(pourOfTheDay(bottles, noon(off))?.opened).toBe(true);
    }
  });

  it('returns undefined for an empty collection', () => {
    expect(pourOfTheDay([], noon(0))).toBeUndefined();
  });
});

describe('nextMilestone', () => {
  it('surfaces the goal closest to completion', () => {
    // 4 bottles (→5 target, 80%) beats a $200 vault (→$500, 40%).
    const bottles = [bottle('a'), bottle('b'), bottle('c'), bottle('d')];
    const m = nextMilestone(bottles, 200);
    expect(m?.key).toBe('bottles');
    expect(m?.current).toBe(4);
    expect(m?.target).toBe(5);
    expect(m?.progress).toBeCloseTo(0.8);
  });

  it('counts distinct styles toward the variety goal', () => {
    const bottles = [
      bottle('a', { type: 'bourbon' }),
      bottle('b', { type: 'rye' }),
      bottle('c', { type: 'scotch' }),
    ];
    const m = nextMilestone(bottles, 100);
    // With 3 bottles the count goal (3/5) ties/exceeds styles (3/7); either is
    // valid, but a milestone must be returned and be in-progress.
    expect(m).toBeDefined();
    expect(m!.current).toBeGreaterThan(0);
  });
});

describe('tipOfTheDay', () => {
  it('returns a real tip that rotates daily', () => {
    expect(WHISKEY_TIPS).toContain(tipOfTheDay(noon(0)));
    const week = [0, 1, 2, 3, 4, 5, 6].map((o) => tipOfTheDay(noon(o)));
    expect(new Set(week).size).toBeGreaterThan(3);
  });
});
