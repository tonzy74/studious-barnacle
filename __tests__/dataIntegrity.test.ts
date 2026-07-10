import { FLAVOR_AXES, WHISKEY_DB } from '../src/data/whiskeyDatabase';
import { RARITY_ORDER } from '../src/lib/rarity';
import { fairPrice } from '../src/lib/pricing';

/**
 * Guards the reference catalog against data bugs that would surface as wrong
 * numbers/charts to users — the kind of thing that erodes trust in a collection
 * app where accuracy is paramount.
 */
describe('reference DB integrity', () => {
  it('has a healthy number of bottlings', () => {
    expect(WHISKEY_DB.length).toBeGreaterThan(5000);
  });

  it('every record has a complete, in-range flavor profile', () => {
    const bad: string[] = [];
    for (const r of WHISKEY_DB) {
      for (const axis of FLAVOR_AXES) {
        const v = (r.flavor as unknown as Record<string, number>)[axis];
        if (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > 10) {
          bad.push(`${r.name}: ${axis}=${v}`);
          break;
        }
      }
    }
    expect(bad.slice(0, 10)).toEqual([]);
  });

  it('every record has a sane proof and valid rarity', () => {
    const bad: string[] = [];
    for (const r of WHISKEY_DB) {
      if (!(r.proof > 0 && r.proof <= 200)) bad.push(`${r.name}: proof ${r.proof}`);
      if (r.rarity && !RARITY_ORDER.includes(r.rarity)) bad.push(`${r.name}: rarity ${r.rarity}`);
    }
    expect(bad.slice(0, 10)).toEqual([]);
  });

  it('prices are positive when present', () => {
    const bad: string[] = [];
    for (const r of WHISKEY_DB) {
      if (r.msrp !== undefined && !(r.msrp > 0)) bad.push(`${r.name}: msrp ${r.msrp}`);
      if (r.secondary !== undefined && !(r.secondary > 0)) bad.push(`${r.name}: secondary ${r.secondary}`);
    }
    expect(bad.slice(0, 10)).toEqual([]);
  });

  it('fairPrice returns a finite value for every priced record', () => {
    const bad: string[] = [];
    for (const r of WHISKEY_DB) {
      const fp = fairPrice(r.msrp, r.secondary, r.rarity);
      if (fp !== undefined && (!Number.isFinite(fp) || fp < 0)) bad.push(`${r.name}: ${fp}`);
    }
    expect(bad.slice(0, 10)).toEqual([]);
  });

  it('has unique ids', () => {
    const ids = WHISKEY_DB.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
