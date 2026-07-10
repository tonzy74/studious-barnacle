import {
  DEFAULT_REMINDER_HOUR,
  releaseDigestCopy,
  streakReminderCopy,
} from '../src/lib/notificationCopy';

describe('streakReminderCopy', () => {
  it('invites a first pour when there is no streak', () => {
    const c = streakReminderCopy(0);
    expect(c.title).toBeTruthy();
    expect(c.body).toMatch(/streak|pour/i);
  });

  it('names the exact streak at risk (loss aversion)', () => {
    expect(streakReminderCopy(6).title).toMatch(/6-day/);
    expect(streakReminderCopy(30).title).toMatch(/30-day/);
  });

  it('handles the day-1 edge with its own copy', () => {
    expect(streakReminderCopy(1).title).not.toMatch(/1-day/);
  });
});

describe('releaseDigestCopy', () => {
  it('nudges toward upcoming releases', () => {
    expect(releaseDigestCopy().body).toMatch(/release/i);
  });
});

test('default reminder hour is in the evening', () => {
  expect(DEFAULT_REMINDER_HOUR).toBeGreaterThanOrEqual(17);
  expect(DEFAULT_REMINDER_HOUR).toBeLessThanOrEqual(21);
});
