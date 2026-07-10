import {
  canShowContextualPaywall,
  crossedCollectionThreshold,
  isValuableScan,
  MAX_AUTO_PROMPTS,
  PAYWALL_COOLDOWN_DAYS,
} from '../src/lib/paywallEngine';

const NOW = 1_800_000_000_000;
const DAY = 86_400_000;
const base = { isPro: false, lastShownAt: 0, promptCount: 0, now: NOW };

describe('canShowContextualPaywall', () => {
  it('allows a first prompt for a non-Pro user', () => {
    expect(canShowContextualPaywall(base)).toBe(true);
  });

  it('never prompts a Pro user', () => {
    expect(canShowContextualPaywall({ ...base, isPro: true })).toBe(false);
  });

  it('respects the cooldown window', () => {
    expect(canShowContextualPaywall({ ...base, lastShownAt: NOW - DAY })).toBe(false); // within 3d
    expect(
      canShowContextualPaywall({ ...base, lastShownAt: NOW - (PAYWALL_COOLDOWN_DAYS + 1) * DAY })
    ).toBe(true);
  });

  it('stops after the lifetime cap (respects the decline)', () => {
    expect(canShowContextualPaywall({ ...base, promptCount: MAX_AUTO_PROMPTS })).toBe(false);
    expect(canShowContextualPaywall({ ...base, promptCount: MAX_AUTO_PROMPTS - 1 })).toBe(true);
  });
});

describe('crossedCollectionThreshold', () => {
  it('fires only when a threshold is crossed by the add', () => {
    expect(crossedCollectionThreshold(4, 5)).toBe(true); // hit 5
    expect(crossedCollectionThreshold(5, 6)).toBe(false); // already past 5
    expect(crossedCollectionThreshold(14, 15)).toBe(true); // hit 15
    expect(crossedCollectionThreshold(1, 2)).toBe(false); // below first threshold
  });
});

describe('isValuableScan', () => {
  it('is true for pricey or highly-allocated bottles', () => {
    expect(isValuableScan(200, 'C')).toBe(true);
    expect(isValuableScan(20, 'S')).toBe(true);
    expect(isValuableScan(20, 'A')).toBe(true);
  });
  it('is false for cheap, common bottles', () => {
    expect(isValuableScan(30, 'C')).toBe(false);
    expect(isValuableScan(undefined, undefined)).toBe(false);
  });
});
