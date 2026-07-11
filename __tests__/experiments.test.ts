import { assignVariant, ANNUAL_PRICE_EXPERIMENT } from '../src/lib/experiments';
import { buildProPlans, FOUNDER_DISCOUNT } from '../src/lib/monetization';

describe('assignVariant', () => {
  it('is deterministic for a given seed', () => {
    const a = assignVariant(ANNUAL_PRICE_EXPERIMENT, 'install-123');
    const b = assignVariant(ANNUAL_PRICE_EXPERIMENT, 'install-123');
    expect(a).toBe(b);
  });

  it('only ever returns a declared variant', () => {
    for (let i = 0; i < 200; i++) {
      const v = assignVariant(ANNUAL_PRICE_EXPERIMENT, `seed-${i}`);
      expect(ANNUAL_PRICE_EXPERIMENT.variants).toContain(v);
    }
  });

  it('splits roughly evenly across a large population', () => {
    const counts: Record<string, number> = {};
    const N = 4000;
    for (let i = 0; i < N; i++) {
      const v = assignVariant(ANNUAL_PRICE_EXPERIMENT, `user-${i}`);
      counts[v] = (counts[v] ?? 0) + 1;
    }
    // Two arms → each should land near 50%; allow generous slack.
    for (const v of ANNUAL_PRICE_EXPERIMENT.variants) {
      expect(counts[v] / N).toBeGreaterThan(0.4);
      expect(counts[v] / N).toBeLessThan(0.6);
    }
  });

  it('mixes the experiment key so different tests are independent', () => {
    const expA = { key: 'exp_a', variants: ['x', 'y'] } as const;
    const expB = { key: 'exp_b', variants: ['x', 'y'] } as const;
    // Not asserting they differ for one seed, but that the key changes the hash:
    // across seeds the assignments should not be perfectly correlated.
    let disagree = 0;
    for (let i = 0; i < 100; i++) {
      if (assignVariant(expA, `s${i}`) !== assignVariant(expB, `s${i}`)) disagree += 1;
    }
    expect(disagree).toBeGreaterThan(0);
  });
});

describe('buildProPlans pricing math', () => {
  it('control arm is $29.99 annual with honest derived savings', () => {
    const plans = buildProPlans('a29');
    const annual = plans.find((p) => p.id === 'annual')!;
    expect(annual.price).toBe('$29.99/yr');
    expect(annual.sub).toBe('Just $2.50/mo, billed yearly'); // 29.99 / 12
    expect(annual.anchor).toBe('$83.88'); // 12 × 6.99 monthly
    // 1 - 29.99/83.88 ≈ 64%
    expect(annual.badge).toBe('SAVE 64%');
  });

  it('test arm is $39.99 annual with a correspondingly smaller honest discount', () => {
    const plans = buildProPlans('b39');
    const annual = plans.find((p) => p.id === 'annual')!;
    expect(annual.price).toBe('$39.99/yr');
    expect(annual.sub).toBe('Just $3.33/mo, billed yearly'); // 39.99 / 12
    expect(annual.anchor).toBe('$83.88');
    expect(annual.badge).toBe('SAVE 52%'); // 1 - 39.99/83.88 ≈ 52%
  });

  it('monthly is the $6.99 decoy and lifetime is unchanged', () => {
    const plans = buildProPlans('a29');
    expect(plans.find((p) => p.id === 'monthly')!.price).toBe('$6.99/mo');
    expect(plans.find((p) => p.id === 'lifetime')!.price).toBe('$99.99');
  });

  it('founder intro price is the real discount off the arm price', () => {
    const a = buildProPlans('a29').find((p) => p.id === 'annual')!;
    const b = buildProPlans('b39').find((p) => p.id === 'annual')!;
    // 40% off, derived — not hand-typed.
    expect(FOUNDER_DISCOUNT).toBeCloseTo(0.4);
    expect(a.introPrice).toBe('$17.99/yr'); // 29.99 × 0.6
    expect(b.introPrice).toBe('$23.99/yr'); // 39.99 × 0.6
  });

  it('each arm carries a distinct annual RevenueCat package id', () => {
    const a = buildProPlans('a29').find((p) => p.id === 'annual')!;
    const b = buildProPlans('b39').find((p) => p.id === 'annual')!;
    expect(a.packageId).not.toBe(b.packageId);
  });
});
