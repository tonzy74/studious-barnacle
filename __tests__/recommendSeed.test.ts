import { recommendBottles } from '../src/lib/recommend';
import { seedFromTastes } from '../src/lib/taste';

describe('recommendBottles cold-start seed', () => {
  it('returns nothing for an empty collection with no seed', () => {
    expect(recommendBottles([], [], 10)).toHaveLength(0);
  });

  it('recommends from the taste seed when the collection is empty', () => {
    const seed = seedFromTastes(['smoky-peated']);
    const recs = recommendBottles([], [], 10, seed);
    expect(recs.length).toBeGreaterThan(0);
    // A smoky-peated palate should surface smoky bottles near the top.
    expect(recs[0].record.flavor.smoke).toBeGreaterThan(4);
  });

  it('caps variety at two per distillery', () => {
    const seed = seedFromTastes(['sweet-smooth']);
    const recs = recommendBottles([], [], 30, seed);
    const perHouse = new Map<string, number>();
    for (const r of recs) {
      const k = r.record.distillery.toLowerCase();
      perHouse.set(k, (perHouse.get(k) ?? 0) + 1);
    }
    expect(Math.max(...perHouse.values())).toBeLessThanOrEqual(2);
  });
});
