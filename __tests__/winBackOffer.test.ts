import { winBackState, WIN_BACK_WINDOW_DAYS } from '../src/lib/winBackOffer';

const DAY = 86_400_000;
const NOW = 1_800_000_000_000;

describe('winBackState', () => {
  it('is not eligible for a current Pro user', () => {
    expect(winBackState({ isPro: true, proLapsedAt: NOW - DAY, now: NOW }).eligible).toBe(false);
  });

  it('is not eligible for someone who never had Pro', () => {
    expect(winBackState({ isPro: false, proLapsedAt: undefined, now: NOW }).eligible).toBe(false);
  });

  it('is eligible within the window with a discount and days left', () => {
    const s = winBackState({ isPro: false, proLapsedAt: NOW - 10 * DAY, now: NOW });
    expect(s.eligible).toBe(true);
    expect(s.discountLabel).toMatch(/50%/);
    expect(s.daysLeft).toBe(WIN_BACK_WINDOW_DAYS - 10);
  });

  it('expires after the window (honest urgency)', () => {
    const s = winBackState({ isPro: false, proLapsedAt: NOW - (WIN_BACK_WINDOW_DAYS + 1) * DAY, now: NOW });
    expect(s.eligible).toBe(false);
  });
});
