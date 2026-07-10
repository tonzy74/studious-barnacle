import { assignRarity, rarityRank, RARITY_LABELS, RARITY_ORDER } from '../src/lib/rarity';

describe('assignRarity', () => {
  it('flags unicorn allocated bottles as S', () => {
    expect(assignRarity({ name: 'Pappy Van Winkle 23 Year', distillery: 'Buffalo Trace' })).toBe('S');
    expect(assignRarity({ name: 'George T. Stagg', distillery: 'Buffalo Trace' })).toBe('S');
  });

  it('keeps an everyday bottle out of the top (S/A) tiers', () => {
    expect(['B', 'C', 'D']).toContain(
      assignRarity({ name: 'Evan Williams Black Label', distillery: 'Heaven Hill' })
    );
  });

  it('uses age statements when no marker matches', () => {
    // A very old age statement lifts rarity even without a name marker.
    const r = assignRarity({ name: 'Random Distillery 25 Year', distillery: 'Random' });
    expect(['A', 'B']).toContain(r);
  });

  it('returns a valid tier for anything', () => {
    const r = assignRarity({ name: 'zzz', distillery: 'zzz' });
    expect(RARITY_ORDER).toContain(r);
  });
});

describe('rarityRank', () => {
  it('ranks S highest (lowest index) through D', () => {
    expect(rarityRank('S')).toBeLessThan(rarityRank('A'));
    expect(rarityRank('A')).toBeLessThan(rarityRank('C'));
    expect(rarityRank('C')).toBeLessThan(rarityRank('D'));
  });

  it('treats undefined as C', () => {
    expect(rarityRank(undefined)).toBe(rarityRank('C'));
  });
});

describe('RARITY_LABELS', () => {
  it('has a human label for every tier', () => {
    for (const t of RARITY_ORDER) expect(typeof RARITY_LABELS[t]).toBe('string');
  });
});
