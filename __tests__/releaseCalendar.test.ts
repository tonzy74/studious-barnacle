import { buildCalendar, parseWindow } from '../src/lib/releaseCalendar';
import { UpcomingRelease } from '../src/lib/claude';

const rel = (name: string, window: string): UpcomingRelease => ({
  name,
  distillery: 'D',
  category: 'annual',
  window,
  note: 'n',
});

describe('parseWindow', () => {
  it('reads season + year', () => {
    expect(parseWindow('Fall 2026')).toEqual({ year: 2026, month: 9 });
    expect(parseWindow('Spring 2027')).toEqual({ year: 2027, month: 3 });
  });
  it('reads named months and quarters', () => {
    expect(parseWindow('October 2026')).toEqual({ year: 2026, month: 9 });
    expect(parseWindow('Q1 2027')).toEqual({ year: 2027, month: 1 });
  });
  it('handles year-only and undated windows', () => {
    expect(parseWindow('2026')).toEqual({ year: 2026, month: undefined });
    expect(parseWindow('TBD')).toEqual({ year: undefined, month: undefined });
  });
});

describe('buildCalendar', () => {
  it('orders groups chronologically and buckets by season', () => {
    const groups = buildCalendar([
      rel('C', 'Fall 2026'),
      rel('A', 'Spring 2026'),
      rel('D', 'Winter 2027'),
      rel('B', 'October 2026'), // same season as C → same group
    ]);
    expect(groups.map((g) => g.label)).toEqual(['Spring 2026', 'Fall 2026', 'Winter 2027']);
    // Fall 2026 collects both the "Fall 2026" and "October 2026" drops.
    expect(groups[1].releases.map((r) => r.name).sort()).toEqual(['B', 'C']);
  });

  it('sends undated releases to a trailing "Date TBD" group', () => {
    const groups = buildCalendar([rel('TBD one', 'TBD'), rel('Dated', 'Summer 2026')]);
    expect(groups[0].label).toBe('Summer 2026');
    expect(groups[groups.length - 1].label).toBe('Date TBD');
  });
});
