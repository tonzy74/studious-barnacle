import { seedFromTastes, TASTE_PROFILES } from '../src/lib/taste';

describe('seedFromTastes', () => {
  it('returns undefined for no selection', () => {
    expect(seedFromTastes([])).toBeUndefined();
    expect(seedFromTastes(['nope'])).toBeUndefined();
  });

  it('returns a single archetype profile unchanged', () => {
    const smoky = TASTE_PROFILES.find((t) => t.id === 'smoky-peated')!;
    expect(seedFromTastes(['smoky-peated'])).toEqual(smoky.profile);
  });

  it('averages multiple archetypes', () => {
    const seed = seedFromTastes(['sweet-smooth', 'bold-spicy'])!;
    const a = TASTE_PROFILES.find((t) => t.id === 'sweet-smooth')!.profile;
    const b = TASTE_PROFILES.find((t) => t.id === 'bold-spicy')!.profile;
    expect(seed.sweet).toBeCloseTo((a.sweet + b.sweet) / 2);
    expect(seed.spice).toBeCloseTo((a.spice + b.spice) / 2);
  });

  it('every archetype is a full 10-axis profile', () => {
    for (const t of TASTE_PROFILES) {
      expect(Object.keys(t.profile)).toHaveLength(10);
    }
  });
});
