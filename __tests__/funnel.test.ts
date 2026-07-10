import { computeFunnel, dailyActiveUsers } from '../src/lib/funnel';
import { AnalyticsEvent } from '../src/types';

const ev = (name: string, anonId: string, at = 1): AnalyticsEvent =>
  ({ name, anonId, at, props: {} }) as AnalyticsEvent;

describe('computeFunnel', () => {
  it('derives activation, paywall conversion, and purchase rate', () => {
    const f = computeFunnel([
      ev('app_opened', 'u1'),
      ev('app_opened', 'u2'),
      ev('app_opened', 'u3'),
      ev('bottle_added', 'u1'),
      ev('bottle_added', 'u2'),
      ev('paywall_shown', 'u1'),
      ev('paywall_shown', 'u2'),
      ev('pro_purchased', 'u1'),
      ev('vault_shared', 'u3'),
    ]);
    expect(f.users).toBe(3);
    expect(f.activated).toBe(2);
    expect(f.activationRate).toBeCloseTo(2 / 3);
    expect(f.paywallConversion).toBeCloseTo(0.5);
    expect(f.purchaseRate).toBeCloseTo(0.5);
    expect(f.sharers).toBe(1);
  });

  it('handles an empty stream without dividing by zero', () => {
    const f = computeFunnel([]);
    expect(f.users).toBe(0);
    expect(f.activationRate).toBe(0);
    expect(f.paywallConversion).toBe(0);
  });
});

describe('dailyActiveUsers', () => {
  it('counts distinct installs per day, in order', () => {
    const d1 = Date.UTC(2026, 0, 1, 12);
    const d2 = Date.UTC(2026, 0, 2, 12);
    const dau = dailyActiveUsers([
      ev('app_opened', 'u1', d1),
      ev('app_opened', 'u1', d1),
      ev('app_opened', 'u2', d1),
      ev('app_opened', 'u1', d2),
    ]);
    expect(dau).toEqual([
      { day: '2026-01-01', users: 2 },
      { day: '2026-01-02', users: 1 },
    ]);
  });
});
