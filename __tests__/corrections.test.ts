import { applyCorrections, correctionKey, upsertCorrection } from '../src/lib/corrections';
import { IdentifiedBottle } from '../src/lib/claude';
import { Correction } from '../src/types';

const ident = (over: Partial<IdentifiedBottle>): IdentifiedBottle => ({
  name: 'X',
  distillery: 'Y',
  type: 'bourbon',
  confidence: 'low',
  ...over,
});

describe('correctionKey', () => {
  it('normalizes name + distillery', () => {
    expect(correctionKey("Blanton's!!", 'Buffalo   Trace')).toBe('blanton s buffalo trace');
  });
});

describe('upsertCorrection', () => {
  it('adds a correction and counts confirmations', () => {
    let list: Correction[] = [];
    list = upsertCorrection(
      list,
      { name: 'Eagle Rar', distillery: '' },
      { name: 'Eagle Rare 10', distillery: 'Buffalo Trace', type: 'bourbon', proof: 90 }
    );
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe('Eagle Rare 10');
    expect(list[0].count).toBe(1);

    list = upsertCorrection(
      list,
      { name: 'Eagle Rar', distillery: '' },
      { name: 'Eagle Rare 10', distillery: 'Buffalo Trace', type: 'bourbon', proof: 90 }
    );
    expect(list).toHaveLength(1);
    expect(list[0].count).toBe(2);
  });

  it('does not store a no-op correction', () => {
    const list = upsertCorrection(
      [],
      { name: 'Weller 12', distillery: 'Buffalo Trace' },
      { name: 'Weller 12', distillery: 'Buffalo Trace', type: 'bourbon' }
    );
    expect(list).toHaveLength(0);
  });
});

describe('applyCorrections', () => {
  it('rewrites a known misread and promotes confidence', () => {
    const corrections = upsertCorrection(
      [],
      { name: 'Blantons Gold', distillery: 'BT' },
      { name: "Blanton's Gold Edition", distillery: 'Buffalo Trace', type: 'bourbon', proof: 103 }
    );
    const out = applyCorrections([ident({ name: 'Blantons Gold', distillery: 'BT' })], corrections);
    expect(out[0].name).toBe("Blanton's Gold Edition");
    expect(out[0].distillery).toBe('Buffalo Trace');
    expect(out[0].proof).toBe(103);
    expect(out[0].confidence).toBe('high');
  });

  it('leaves unknown reads untouched', () => {
    const out = applyCorrections([ident({ name: 'Mystery Pour', distillery: 'Z' })], []);
    expect(out[0].name).toBe('Mystery Pour');
    expect(out[0].confidence).toBe('low');
  });
});
