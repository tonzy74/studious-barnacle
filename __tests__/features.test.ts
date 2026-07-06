import { stripBottleSize } from '../src/lib/barcodeLookup';
import { recommendBottles } from '../src/lib/recommend';
import { computeAchievements, earnedCount } from '../src/lib/achievements';
import { validateCocktails } from '../src/lib/claude';
import { WHISKEY_DB } from '../src/data/whiskeyDatabase';
import { Bottle, FlavorProfile } from '../src/types';

const flat: FlavorProfile = {
  sweet: 5, oak: 5, vanilla: 5, caramel: 5, spice: 5,
  fruit: 5, floral: 5, smoke: 5, nutty: 5, earthy: 5,
};

function bottle(over: Partial<Bottle>): Bottle {
  return {
    id: Math.random().toString(36).slice(2),
    name: 'Test Bourbon',
    distillery: 'Test',
    type: 'bourbon',
    proof: 90,
    flavor: flat,
    notes: '',
    opened: false,
    quantity: 1,
    addedAt: Date.now(),
    ...over,
  };
}

describe('recommendBottles', () => {
  it('returns nothing for an empty collection', () => {
    expect(recommendBottles([], [])).toEqual([]);
  });

  it('recommends real bottlings the user does not own, no pick variants', () => {
    const recs = recommendBottles([bottle({ name: 'Buffalo Trace' })], [], 10);
    expect(recs.length).toBeGreaterThan(0);
    for (const r of recs) {
      expect(r.record.name).not.toContain('—'); // no store-pick variants
      expect(r.record.name.toLowerCase()).not.toBe('buffalo trace'); // not owned
      expect(r.match).toBeGreaterThanOrEqual(0);
      expect(r.match).toBeLessThanOrEqual(100);
    }
  });

  it('limits to two per distillery for variety', () => {
    const recs = recommendBottles([bottle({})], [], 20);
    const perHouse: Record<string, number> = {};
    for (const r of recs) {
      const k = r.record.distillery.toLowerCase();
      perHouse[k] = (perHouse[k] ?? 0) + 1;
      expect(perHouse[k]).toBeLessThanOrEqual(2);
    }
  });
});

describe('computeAchievements', () => {
  it('earns collector + journal tiers as data grows', () => {
    const none = computeAchievements({ bottles: [], pours: [], corrections: [] });
    expect(earnedCount(none)).toBe(0);

    const some = computeAchievements({
      bottles: [bottle({ rarity: 'S', msrp: 300, secondary: 3000 })],
      pours: [{ id: 'p', name: 'x', rating: 90, at: Date.now() }],
      corrections: [],
    });
    const byId = Object.fromEntries(some.map((a) => [a.id, a]));
    expect(byId['collector-1'].earned).toBe(true);
    expect(byId['unicorn'].earned).toBe(true);
    expect(byId['journal-1'].earned).toBe(true);
    expect(byId['collector-100'].earned).toBe(false);
  });
});

describe('validateCocktails', () => {
  it('keeps valid entries and caps length/count', () => {
    const out = validateCocktails({
      cocktails: [
        { name: 'Old Fashioned', recipe: '2oz bourbon, sugar, bitters', note: 'classic' },
        { name: '', recipe: 'x', note: 'y' },
      ],
    });
    expect(out).toHaveLength(1);
    expect(out[0].name).toBe('Old Fashioned');
  });

  it('handles garbage', () => {
    expect(validateCocktails(null)).toEqual([]);
    expect(validateCocktails({ cocktails: 'no' })).toEqual([]);
  });
});

describe('stripBottleSize', () => {
  it('trims size/volume noise from product titles', () => {
    expect(stripBottleSize('13th Colony Cask Strength Bourbon 750ml')).toBe(
      '13th Colony Cask Strength Bourbon'
    );
    expect(stripBottleSize("Blanton's Single Barrel 750 ML")).toBe("Blanton's Single Barrel");
    expect(stripBottleSize('Elijah Craig 1.75L')).toBe('Elijah Craig');
    expect(stripBottleSize('Eagle Rare 10 Year')).toBe('Eagle Rare 10 Year');
  });
});

describe('WHISKEY_DB sanity for recommendations', () => {
  it('has non-pick real bottlings to recommend from', () => {
    const real = WHISKEY_DB.filter((r) => !r.name.includes('—'));
    expect(real.length).toBeGreaterThan(500);
  });
});
