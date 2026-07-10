import { formatCountdown, introOfferState, INTRO_WINDOW_DAYS } from '../src/lib/introOffer';

const DAY = 86_400_000;
const HOUR = 3_600_000;

describe('introOfferState', () => {
  it('is inactive when we have no first-open time', () => {
    expect(introOfferState(undefined, 1000).active).toBe(false);
  });

  it('is active inside the window and reports time left', () => {
    const first = 1_000_000_000_000;
    const s = introOfferState(first, first + 2 * DAY);
    expect(s.active).toBe(true);
    expect(s.endsAt).toBe(first + INTRO_WINDOW_DAYS * DAY);
    expect(s.msLeft).toBe((INTRO_WINDOW_DAYS - 2) * DAY);
  });

  it('expires and does NOT reset (honest urgency)', () => {
    const first = 1_000_000_000_000;
    const after = introOfferState(first, first + (INTRO_WINDOW_DAYS + 3) * DAY);
    expect(after.active).toBe(false);
    expect(after.msLeft).toBe(0);
  });
});

describe('formatCountdown', () => {
  it('formats days, hours, and minutes', () => {
    expect(formatCountdown(2 * DAY + 4 * HOUR)).toBe('2d 4h');
    expect(formatCountdown(5 * HOUR + 12 * 60_000)).toBe('5h 12m');
    expect(formatCountdown(8 * 60_000)).toBe('8m');
    expect(formatCountdown(0)).toBe('0m');
  });
});
