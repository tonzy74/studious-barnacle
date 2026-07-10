import { freshStartMoment } from '../src/lib/freshStart';

const at = (y: number, m: number, d: number) => new Date(y, m, d, 12).getTime();

describe('freshStartMoment', () => {
  it('is undefined on a non-landmark day', () => {
    expect(freshStartMoment(at(2026, 4, 14))).toBeUndefined();
  });

  it('fires the new-year moment on Jan 1', () => {
    const fs = freshStartMoment(at(2026, 0, 1));
    expect(fs?.label).toMatch(/year/i);
    expect(fs?.key).toBe('fs-2026-year');
  });

  it('fires a season moment on the 1st of Mar/Jun/Sep/Dec', () => {
    expect(freshStartMoment(at(2026, 5, 1))?.label).toMatch(/season/i);
  });

  it('fires a generic new-month moment on other 1sts', () => {
    const fs = freshStartMoment(at(2026, 3, 1)); // April 1
    expect(fs?.label).toMatch(/month/i);
    expect(fs?.key).toBe('fs-2026-3-month');
  });

  it('keys are stable per landmark for once-only display', () => {
    expect(freshStartMoment(at(2026, 0, 1))?.key).toBe(freshStartMoment(at(2026, 0, 1))?.key);
  });
});
