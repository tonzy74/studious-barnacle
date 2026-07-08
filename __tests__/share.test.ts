import { buildVaultShareText } from '../src/lib/share';
import { Bottle } from '../src/types';

const b = (over: Partial<Bottle>): Bottle => ({
  id: Math.random().toString(),
  name: 'X',
  distillery: 'D',
  type: 'bourbon',
  proof: 100,
  flavor: {} as never,
  notes: '',
  rarity: 'C',
  opened: false,
  quantity: 1,
  addedAt: 0,
  ...over,
});

describe('buildVaultShareText', () => {
  it('invites others when the vault is empty', () => {
    expect(buildVaultShareText([])).toMatch(/Whiskey Vault/);
  });

  it('summarizes count, styles, and the rarest bottle', () => {
    const text = buildVaultShareText([
      b({ name: 'Pappy Van Winkle 15', rarity: 'S', type: 'bourbon' }),
      b({ name: 'Rittenhouse Rye', rarity: 'C', type: 'rye' }),
    ]);
    expect(text).toMatch(/2 bottles across 2 styles/);
    expect(text).toMatch(/Crown jewel: Pappy Van Winkle 15/);
    expect(text).toMatch(/Whiskey Vault\.$/);
  });

  it('omits value by default and includes it on request', () => {
    const bottles = [b({ msrp: 100, rarity: 'C' })];
    expect(buildVaultShareText(bottles)).not.toMatch(/value/i);
    expect(buildVaultShareText(bottles, { includeValue: true })).toMatch(/Estimated value/);
  });

  it('counts quantity toward the bottle total', () => {
    expect(buildVaultShareText([b({ quantity: 3 })])).toMatch(/3 bottles/);
  });
});
