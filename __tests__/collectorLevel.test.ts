import { collectorLevel, collectorScore, LEVEL_TIERS } from '../src/lib/collectorLevel';
import { Bottle } from '../src/types';

const b = (over: Partial<Bottle> = {}): Bottle => ({
  id: Math.random().toString(),
  name: 'X',
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

describe('collectorScore', () => {
  it('is zero for an empty collection', () => {
    expect(collectorScore([], 0)).toBe(0);
  });

  it('rewards diversity and rarity, not just count', () => {
    const shallow = Array.from({ length: 6 }, () => b({ type: 'bourbon', rarity: 'D' }));
    const curated = [
      b({ type: 'bourbon', rarity: 'S' }),
      b({ type: 'rye', rarity: 'A' }),
      b({ type: 'scotch', rarity: 'B' }),
    ];
    // A 3-bottle curated set of rare, diverse pours beats 6 shallow dupes.
    expect(collectorScore(curated, 0)).toBeGreaterThan(collectorScore(shallow, 0));
  });

  it('counts collection value', () => {
    const base = [b({ rarity: 'C' })];
    expect(collectorScore(base, 1000)).toBeGreaterThan(collectorScore(base, 0));
  });
});

describe('collectorLevel', () => {
  it('starts at Novice level 1 when empty', () => {
    const l = collectorLevel([], 0);
    expect(l.level).toBe(1);
    expect(l.title).toBe('Novice');
    expect(l.nextTitle).toBe('Enthusiast');
    expect(l.progress).toBeGreaterThanOrEqual(0);
  });

  it('advances tiers as the score grows and reports progress to next', () => {
    const many = Array.from({ length: 20 }, () => b({ type: 'bourbon', rarity: 'B' }));
    const l = collectorLevel(many, 2000);
    expect(l.level).toBeGreaterThan(1);
    expect(l.progress).toBeGreaterThan(0);
    expect(l.progress).toBeLessThanOrEqual(1);
    expect(l.toNext).toBeGreaterThanOrEqual(0);
  });

  it('caps at the top tier with full progress and no next', () => {
    const huge = Array.from({ length: 200 }, () => b({ type: 'bourbon', rarity: 'S' }));
    const l = collectorLevel(huge, 500000);
    expect(l.title).toBe(LEVEL_TIERS[LEVEL_TIERS.length - 1].title);
    expect(l.level).toBe(LEVEL_TIERS.length);
    expect(l.nextTitle).toBeUndefined();
    expect(l.progress).toBe(1);
    expect(l.toNext).toBe(0);
  });
});
