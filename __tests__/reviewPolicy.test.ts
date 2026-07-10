import { shouldAskForReview } from '../src/lib/reviewPolicy';

const base = { requested: false, level: 1, bottleCount: 0, streak: 0 };

describe('shouldAskForReview', () => {
  it('never asks twice', () => {
    expect(shouldAskForReview({ ...base, requested: true, level: 9 })).toBe(false);
  });

  it('does not ask an unengaged new user', () => {
    expect(shouldAskForReview(base)).toBe(false);
    expect(shouldAskForReview({ ...base, level: 2, bottleCount: 3, streak: 2 })).toBe(false);
  });

  it('asks once the user is demonstrably engaged/happy', () => {
    expect(shouldAskForReview({ ...base, level: 3 })).toBe(true); // earned a rank
    expect(shouldAskForReview({ ...base, bottleCount: 8 })).toBe(true); // real collection
    expect(shouldAskForReview({ ...base, streak: 3 })).toBe(true); // sustained habit
  });
});
