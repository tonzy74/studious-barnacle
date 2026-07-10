import { fairPrice, formatUsd, lookupPricing } from '../src/lib/pricing';

describe('lookupPricing', () => {
  it('finds a known anchor by normalized-name substring', () => {
    const p = lookupPricing('Buffalo Trace Kentucky Straight Bourbon');
    expect(p).toBeDefined();
    expect(p!.msrp).toBeGreaterThan(0);
    expect(p!.secondary).toBeGreaterThanOrEqual(p!.msrp);
  });

  it('returns undefined for an unknown bottle', () => {
    expect(lookupPricing('Totally Made Up Craft Whiskey XYZ')).toBeUndefined();
  });

  it('matches possessive brands despite the apostrophe (regression)', () => {
    // "Blanton's" / "Maker's" must resolve to their anchors ("blantons"/"makers").
    expect(lookupPricing("Blanton's Original Single Barrel")).toBeDefined();
    expect(lookupPricing("Maker's Mark Cask Strength")).toBeDefined();
    expect(lookupPricing("Booker's")).toBeDefined();
  });
});

describe('fairPrice', () => {
  it('is undefined when nothing is known', () => {
    expect(fairPrice(undefined, undefined)).toBeUndefined();
  });

  it('falls back to whichever price exists', () => {
    expect(fairPrice(40, undefined)).toBe(40);
    expect(fairPrice(undefined, 90)).toBe(90);
  });

  it('never drifts below MSRP for a shelf bottle', () => {
    // secondary <= msrp → just MSRP.
    expect(fairPrice(50, 45)).toBe(50);
  });

  it('drifts toward secondary more for rarer bottles', () => {
    const common = fairPrice(100, 1100, 'C')!;
    const allocated = fairPrice(100, 1100, 'S')!;
    expect(allocated).toBeGreaterThan(common);
    // S drifts 55% of the 1000 gap → 100 + 550 = 650.
    expect(allocated).toBe(650);
    // C drifts 10% → 100 + 100 = 200.
    expect(common).toBe(200);
  });

  it('defaults to C drift when rarity is missing', () => {
    expect(fairPrice(100, 1100)).toBe(fairPrice(100, 1100, 'C'));
  });
});

describe('formatUsd', () => {
  it('formats with a dollar sign and thousands separators', () => {
    expect(formatUsd(1800)).toBe('$1,800');
    expect(formatUsd(0)).toBe('$0');
  });
  it('renders an em dash for undefined', () => {
    expect(formatUsd(undefined)).toBe('—');
  });
});
