import { compValue, tradeComps, compKey } from '../src/lib/comps';
import { Comp } from '../src/types';

const DAY = 86_400_000;
const comp = (name: string, value: number, ageDays: number, now: number): Comp => ({
  id: `${name}-${value}-${ageDays}`,
  name,
  value,
  at: now - ageDays * DAY,
  source: 'trade',
});

describe('compValue', () => {
  const now = Date.now();

  it('returns undefined with no matching comps', () => {
    expect(compValue('Weller 12', [], now)).toBeUndefined();
    expect(compValue('Weller 12', [comp('Blanton', 100, 1, now)], now)).toBeUndefined();
  });

  it('computes a weighted median and flags confidence by sample weight', () => {
    const comps = [
      comp('Weller 12', 200, 5, now),
      comp('Weller 12', 220, 10, now),
      comp('Weller 12', 210, 15, now),
      comp('Weller 12', 205, 20, now),
    ];
    const cv = compValue('Weller 12', comps, now)!;
    expect(cv.count).toBe(4);
    expect(cv.value).toBeGreaterThanOrEqual(200);
    expect(cv.value).toBeLessThanOrEqual(220);
    expect(cv.confidence).toBe('comps');
  });

  it('marks a single recent comp as thin, not confident', () => {
    const cv = compValue('Stagg', [comp('Stagg', 300, 1, now)], now)!;
    expect(cv.count).toBe(1);
    expect(cv.confidence).toBe('thin');
  });

  it('ignores very old comps and down-weights older ones', () => {
    const withOld = compValue('X', [comp('X', 100, 5, now), comp('X', 999, 2000, now)], now)!;
    // The 2000-day comp is outside the window, so median stays near 100.
    expect(withOld.value).toBe(100);
    expect(withOld.count).toBe(1);
  });

  it('matches names case/punctuation-insensitively', () => {
    expect(compKey("Blanton's Gold!")).toBe('blantons gold');
    const cv = compValue("blantons gold", [comp("Blanton's Gold", 180, 3, now)], now);
    expect(cv).toBeDefined();
  });
});

describe('tradeComps', () => {
  it('builds comps and drops empty/invalid entries', () => {
    const out = tradeComps([
      { name: 'Eagle Rare', value: 70 },
      { name: '', value: 50 },
      { name: 'Bad', value: 0 },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].name).toBe('Eagle Rare');
    expect(out[0].source).toBe('trade');
  });
});
