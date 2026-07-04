import { FlavorProfile, WhiskeyRecord, WhiskeyType } from '../types';
import { FLAVOR_AXES } from './flavorAxes';

/**
 * Compact expression entry: [name, proof, modifier tokens].
 * Modifiers adjust the house base profile (see MODS below). Age statements
 * are written as e.g. "age15" and add oak/earth depth past 8 years.
 */
export type ExprDef = [name: string, proof: number, mods?: string];

export interface HouseDef {
  /** Distillery or brand name. */
  d: string;
  t: WhiskeyType;
  /** Base flavor vector in FLAVOR_AXES order (sweet..earthy). */
  base: number[];
  /** One-line house character used to open every synthesized note. */
  c: string;
  e: ExprDef[];
}

/** Axis-order delta vectors applied per modifier token. */
const MODS: Record<string, number[]> = {
  //        sw   oak   van  car   sp   fr   fl   sm   nut  ea
  bp:      [0,   1.5,  0,   1,    1,   0,   0,   0.5, 0.5, 0.5], // barrel/cask strength
  sb:      [0,   0.5,  0.5, 0,    0,   0,   0,   0,   0,   0],   // single barrel
  bib:     [0,   0.5,  0,   0.5,  0.5, 0,   0,   0,   0,   0],   // bottled in bond
  wheat:   [1,   0,    0,   0.5, -2,   0,   0.5, 0,   0,   0],
  highrye: [-0.5,0,    0,   0,    2,   0.5, 0.5, 0,   0,   0],
  rye95:   [-1,  0,    0,   0,    2.5, 0,   1,   0,   0,   0.5],
  fourgrain:[0.5,0,    0.5, 0,    0.5, 0,   0.5, 0,   0,   0],
  sherry:  [1,   0,    0,   0.5,  0,   2,   0,   0,   1,   0],
  px:      [2,   0,    0,   1,    0,   2.5, 0,   0,   0.5, 0],
  oloroso: [1,   0,    0,   0.5,  0,   2,   0,   0,   1.5, 0],
  port:    [1.5, 0,    0,   0.5,  0,   2,   0,   0,   0,   0],
  wine:    [0.5, 0,    0,   0,    0.5, 1.5, 0,   0,   0,   0],
  rum:     [1.5, 0,    0.5, 1,    0,   0.5, 0,   0,   0,   0],
  madeira: [1,   0,    0,   0.5,  0,   1.5, 0,   0,   1,   0],
  cognac:  [0.5, 0,    0,   0.5,  0,   1.5, 0.5, 0,   0.5, 0],
  maple:   [2,   0,    0.5, 1.5,  0,   0,   0,   0,   0,   0],
  stout:   [0.5, 0.5,  0,   1,    0,   0,   0,   0.5, 1,   0.5],
  toast:   [1,   0.5,  2,   1.5,  0,   0,   0,   0,   0,   0],
  char:    [0,   1,    0,   0.5,  0,   0,   0,   1,   0,   0.5],
  peat1:   [0,   0,    0,   0,    0,   0,   0,   3,   0,   1.5], // lightly peated
  peat2:   [-1,  0,    0,   0,    0,   0,   0,   6,   0,   2.5], // peated
  peat3:   [-1.5,0,    0,  -0.5,  0,   0,   0,   8,   0,   3],   // heavily peated
  virgin:  [0,   2,    1,   0.5,  0.5, 0,   0,   0,   0,   0],   // virgin oak
  miz:     [0,   0.5,  0,   0,    1,   0,   1.5, 0,   0,   0.5], // mizunara
  grain:   [1,  -0.5,  0.5, 0.5, -0.5, 0,   0,   0,   0,   0],   // soft grain whisky
  pot:     [0.5, 0,    0,   0,    0.5, 1,   0,   0,   1,   0],   // single pot still
  coastal: [0,   0,    0,   0,    0.5, 0,   0,   1,   0,   1],   // brine/maritime
  floral2: [0,   0,    0,   0,    0,   0,   1.5, 0,   0,   0],
  fruity2: [0,   0,    0,   0,    0,   1.5, 0,   0,   0,   0],
  honeyed: [1.5, 0,    0.5, 0.5,  0,   0,   0.5, 0,   0,   0],
  dry:     [-1.5,0.5,  0,   0,    0.5, 0,   0,   0,   0,   0.5],
  light:   [-1, -1,    0,   0,   -0.5, 0,   0.5, 0,   0,  -0.5],
  rich:    [1,   0.5,  0,   0.5,  0,   0.5, 0,   0,   0.5, 0],
};

function clamp(v: number): number {
  return Math.round(Math.min(10, Math.max(0, v)) * 10) / 10;
}

export function applyMods(base: number[], mods?: string): FlavorProfile {
  const v = base.slice();
  if (mods) {
    for (const token of mods.split(/\s+/).filter(Boolean)) {
      const age = /^age(\d+)$/.exec(token);
      if (age) {
        const years = parseInt(age[1], 10);
        if (years > 8) {
          v[1] += Math.min(3, (years - 8) * 0.35); // oak
          v[9] += Math.min(1.5, (years - 8) * 0.15); // earthy
          if (years >= 18) v[8] += 1; // nutty
        }
        continue;
      }
      const delta = MODS[token];
      if (!delta) {
        throw new Error(`Unknown flavor modifier "${token}"`);
      }
      for (let i = 0; i < v.length; i++) v[i] += delta[i];
    }
  }
  const profile = {} as FlavorProfile;
  FLAVOR_AXES.forEach((axis, i) => {
    profile[axis] = clamp(v[i]);
  });
  return profile;
}

/** Descriptor vocabulary per axis at mild / moderate / strong intensity. */
const DESCRIPTORS: Record<keyof FlavorProfile, [string, string, string]> = {
  sweet: ['restrained sweetness', 'honeyed sweetness', 'rich brown-sugar sweetness'],
  oak: ['light oak', 'toasted oak', 'deep charred oak'],
  vanilla: ['a whisper of vanilla', 'vanilla bean', 'vanilla custard'],
  caramel: ['light toffee', 'caramel', 'dark caramel verging on molasses'],
  spice: ['gentle baking spice', 'cinnamon and black pepper', 'bold rye spice and clove'],
  fruit: ['faint orchard fruit', 'ripe orchard fruit', 'dense dried fruit and dark berries'],
  floral: ['subtle florals', 'heather and blossom', 'perfumed floral notes'],
  smoke: ['a wisp of smoke', 'campfire smoke', 'heavy peat smoke and iodine'],
  nutty: ['light nuttiness', 'toasted nuts', 'walnut and roasted-almond richness'],
  earthy: ['clean grain character', 'leather and damp earth', 'deep earthy funk'],
};

function level(value: number): 0 | 1 | 2 {
  return value >= 7.5 ? 2 : value >= 5.5 ? 1 : 0;
}

export function synthesizeNotes(character: string, profile: FlavorProfile): string {
  const ranked = FLAVOR_AXES.map((axis) => ({ axis, value: profile[axis] }))
    .filter((a) => a.value >= 4.5)
    .sort((a, b) => b.value - a.value)
    .slice(0, 4);
  if (ranked.length === 0) {
    return `${character} A light, delicate profile throughout.`;
  }
  const parts = ranked.map((a) => DESCRIPTORS[a.axis][level(a.value)]);
  const lead = parts.slice(0, Math.min(3, parts.length));
  const leadText =
    lead.length === 1
      ? lead[0]
      : `${lead.slice(0, -1).join(', ')} and ${lead[lead.length - 1]}`;
  const tail = parts[3] ? `, with ${parts[3]} underneath` : '';
  const sentence = leadText.charAt(0).toUpperCase() + leadText.slice(1);
  return `${character} ${sentence} lead${tail}.`;
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/['’`.]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function expandHouses(houses: HouseDef[]): WhiskeyRecord[] {
  const records: WhiskeyRecord[] = [];
  const seen = new Set<string>();
  for (const house of houses) {
    for (const [name, proof, mods] of house.e) {
      const flavor = applyMods(house.base, mods);
      let id = slugify(name);
      while (seen.has(id)) id = `${id}-x`;
      seen.add(id);
      records.push({
        id,
        name,
        distillery: house.d,
        type: house.t as WhiskeyType,
        proof,
        flavor,
        notes: synthesizeNotes(house.c, flavor),
      });
    }
  }
  return records;
}
