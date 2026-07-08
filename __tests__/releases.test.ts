import { validateReleases } from '../src/lib/claude';

describe('validateReleases', () => {
  it('keeps valid releases and normalizes fields', () => {
    const out = validateReleases({
      releases: [
        {
          name: 'Buffalo Trace Antique Collection',
          distillery: 'Buffalo Trace',
          category: 'annual',
          window: 'Fall 2026',
          rarity: 'S',
          note: 'The most chased annual allocated drop.',
        },
      ],
    });
    expect(out).toHaveLength(1);
    expect(out[0].category).toBe('annual');
    expect(out[0].rarity).toBe('S');
  });

  it('rolls a past-year window forward to the current year', () => {
    const out = validateReleases(
      {
        releases: [
          { name: 'Old Forester Birthday Bourbon', distillery: 'Brown-Forman', category: 'annual', window: 'Fall 2024', note: 'n' },
          { name: 'Pappy Van Winkle 15', distillery: 'Buffalo Trace', category: 'annual', window: 'Winter 2027', note: 'n' },
          { name: 'BTAC', distillery: 'Buffalo Trace', category: 'annual', window: 'TBD', note: 'n' },
        ],
      },
      2026
    );
    // Past year bumped to current; future year and yearless windows untouched.
    expect(out[0].window).toBe('Fall 2026');
    expect(out[1].window).toBe('Winter 2027');
    expect(out[2].window).toBe('TBD');
  });

  it('defaults unknown category and drops invalid rarity', () => {
    const out = validateReleases({
      releases: [
        { name: 'X', distillery: 'Y', category: 'bogus', window: 'Soon', rarity: 'SSS', note: 'n' },
      ],
    });
    expect(out[0].category).toBe('other');
    expect(out[0].rarity).toBeUndefined();
  });

  it('dedupes by name, caps lengths, and caps list size', () => {
    const many = Array.from({ length: 50 }, (_, i) => ({
      name: `Release ${i}`,
      distillery: 'D'.repeat(200),
      category: 'limited',
      window: 'W'.repeat(100),
      note: 'N'.repeat(500),
    }));
    many.push({ name: 'Release 0', distillery: 'dup', category: 'limited', window: 'w', note: 'n' });
    const out = validateReleases({ releases: many });
    expect(out.length).toBeLessThanOrEqual(30);
    expect(out[0].distillery.length).toBeLessThanOrEqual(80);
    expect(out[0].window.length).toBeLessThanOrEqual(40);
    expect(out[0].note.length).toBeLessThanOrEqual(200);
    // No duplicate names.
    expect(new Set(out.map((r) => r.name)).size).toBe(out.length);
  });

  it('handles garbage input without throwing', () => {
    expect(validateReleases(null)).toEqual([]);
    expect(validateReleases({})).toEqual([]);
    expect(validateReleases({ releases: 'nope' })).toEqual([]);
    expect(validateReleases({ releases: [null, 42, 'x'] })).toEqual([]);
  });

  it('ignores prototype-pollution payloads', () => {
    const out = validateReleases(
      JSON.parse(
        '{"releases":[{"name":"A","distillery":"B","category":"core","window":"Now","note":"n","__proto__":{"polluted":true}}]}'
      )
    );
    expect(out).toHaveLength(1);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
});
