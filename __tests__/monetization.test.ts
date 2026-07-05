import { isLocked, PRO_FEATURES, PRO_PLANS, hasReferral } from '../src/lib/monetization';

describe('monetization gating', () => {
  it('locks Pro features for free users and unlocks for Pro', () => {
    for (const f of PRO_FEATURES) {
      expect(isLocked(f, false)).toBe(true);
      expect(isLocked(f, true)).toBe(false);
    }
  });

  it('keeps core (non-listed) features free', () => {
    // A feature not in PRO_FEATURES is never locked.
    // @ts-expect-error intentionally testing a non-Pro key
    expect(isLocked('collection', false)).toBe(false);
  });

  it('exposes plans with an annual best-value option', () => {
    expect(PRO_PLANS.length).toBeGreaterThanOrEqual(2);
    expect(PRO_PLANS.some((p) => p.best)).toBe(true);
    for (const p of PRO_PLANS) expect(p.packageId).toBeTruthy();
  });

  it('only shows referral surfaces with a real https link configured', () => {
    expect(hasReferral('')).toBe(false);
    expect(hasReferral('http://x.com')).toBe(false);
    expect(hasReferral('https://flaviar.com/?aff=me')).toBe(true);
  });
});
