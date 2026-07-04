import { FlavorProfile, WhiskeyRecord, WhiskeyType } from '../types';
import { FLAVOR_AXES } from './flavorAxes';
import { slugify, synthesizeNotes } from './generator';

/**
 * Single-barrel & store-pick generator.
 *
 * Store picks and single barrels are the largest — and most requested — slice
 * of the American whiskey world: the same base bottling dumped barrel by
 * barrel for retailers and clubs, each at its own proof. There are literally
 * thousands in circulation, so we synthesize a realistic, deterministic
 * catalog of them from real programs (real recipe/stave codes, real retailer
 * names, real per-program proof ranges). Every entry gets a proof-scaled
 * flavor profile and a synthesized tasting note.
 *
 * Determinism matters: ids and proofs are derived from the name so a pick a
 * user added keeps matching the same catalog entry across app launches.
 */

/** Real retailers and bottle clubs known for single-barrel selections. */
const RETAILERS = [
  'Total Wine', "Binny's", 'Costco', 'Seelbach’s', "Justins' House of Bourbon",
  'Liquor Barn', 'The Party Source', 'K&L', 'Bounty Hunter', 'The Prime Barrel',
  'Bourbon Crusaders', 'Keg N Bottle', 'ABC Fine Wine', 'Spec’s', 'Total Beverage',
  'Woodman’s', 'Cork & Bottle', 'Lukas Liquors', 'Westchester Wine', 'Nejaime’s',
  'Bourbon Pursuit', 'The Bourbon Concord', 'Barrel & Bond', 'Julio’s', 'Gary’s Wine',
  'The Wine Rack', 'Warehouse Liquors', 'Chambers Wine', 'Loch & K(e)y', 'Molto Vino',
  'Red Wagon', 'Riverside Liquor', 'Statz & Stripes', 'Pinehurst Wine', 'Hi-Time Cellars',
  'Blue Note', 'Elite Wine', 'Big Red Liquors', 'Cana’s Feast', 'Downtown Wine',
  'Bourbon Fellowship', 'Central Ave Liquors', 'Nixa Wine', 'Grapevine', 'Payless Liquors',
  'The Barrel Room', 'Vom Fass', 'Whisky Cave', 'The Rare Vine', 'Sip Whiskey',
  'Ledger’s Liquors', 'Toast Wine', 'The Bottle Shop', 'Vine & Barrel', 'Cellar 55',
  'Midtown Liquors', 'Highlands Wine', 'Ridge Liquors', 'Fox & Hound', 'Copper & Oak',
  'Barleycorn’s', 'The Cask', 'Old Town Liquors', 'Frontier Wine',
];

/** Four Roses' ten single-barrel recipes (yeast × mashbill). */
const FOUR_ROSES_RECIPES = [
  'OBSV', 'OBSK', 'OBSO', 'OBSF', 'OBSQ', 'OESV', 'OESK', 'OESO', 'OESF', 'OESQ',
];

/** Maker's Mark Private Selection stave-profile names. */
const MAKERS_STAVES = [
  'Baked American Pure 2', 'Seared French Cuvee', 'Maker’s 46', 'Roasted French Mocha',
  'Toasted French Spice', 'Double Baked American', 'French Whisky Barrel', 'Cuvee & Spice',
  'Toffee & Cinnamon', 'Roasted & Seared', 'American Oak Spiral', 'French Mocha Blend',
];

interface PickProgram {
  base: string;
  d: string;
  t: WhiskeyType;
  /** Axis-order base vector: sweet, oak, vanilla, caramel, spice, fruit, floral, smoke, nutty, earthy. */
  vec: number[];
  c: string;
  proofMin: number;
  proofMax: number;
  /** Recipe/stave codes, if the program has them. */
  variants?: string[];
  /** How many picks to synthesize for this program. */
  count: number;
  /** Word appended after the base name for the barrel line. */
  kind?: string;
}

const PROGRAMS: PickProgram[] = [
  { base: 'Four Roses Single Barrel', d: 'Four Roses', t: 'bourbon',
    vec: [5, 5, 5, 5, 6, 5, 4, 1, 3, 3], c: 'Floral, fruit-forward Four Roses single-barrel character.',
    proofMin: 100, proofMax: 116, variants: FOUR_ROSES_RECIPES, count: 700 },
  { base: 'Maker’s Mark Private Selection', d: "Maker's Mark", t: 'bourbon',
    vec: [7, 6, 6, 7, 4, 4, 2, 1, 4, 2], c: 'Wheated Maker’s enriched by custom finishing staves.',
    proofMin: 108, proofMax: 114, variants: MAKERS_STAVES, count: 480 },
  { base: 'Knob Creek Single Barrel Select', d: 'Knob Creek', t: 'bourbon',
    vec: [6, 7, 6, 6, 6, 3, 2, 1, 4, 3], c: 'Big, oaky Knob Creek single-barrel muscle.',
    proofMin: 115, proofMax: 120, count: 520 },
  { base: 'Russell’s Reserve Single Barrel', d: 'Wild Turkey', t: 'bourbon',
    vec: [6, 7, 6, 6, 6, 4, 2, 2, 4, 3], c: 'Wild Turkey depth: caramel, char and baking spice.',
    proofMin: 110, proofMax: 116, count: 500 },
  { base: '1792 Single Barrel', d: 'Barton 1792', t: 'bourbon',
    vec: [6, 6, 5, 6, 7, 3, 2, 1, 3, 3], c: 'High-rye Barton spice over firm oak.',
    proofMin: 98, proofMax: 99, count: 420 },
  { base: 'Eagle Rare 10 Single Barrel', d: 'Buffalo Trace', t: 'bourbon',
    vec: [6, 6, 6, 6, 4, 5, 3, 1, 4, 3], c: 'Refined Eagle Rare: toffee, orange and oak.',
    proofMin: 90, proofMax: 90, count: 360 },
  { base: 'Buffalo Trace Single Barrel', d: 'Buffalo Trace', t: 'bourbon',
    vec: [7, 5, 7, 6, 4, 4, 2, 1, 3, 2], c: 'The BT flagship, barrel by barrel.',
    proofMin: 90, proofMax: 90, count: 420 },
  { base: 'W.L. Weller Single Barrel', d: 'Buffalo Trace', t: 'bourbon',
    vec: [8, 5, 7, 7, 2, 4, 3, 0, 4, 2], c: 'Soft wheated Weller sweetness.',
    proofMin: 97, proofMax: 97, count: 240 },
  { base: 'Henry McKenna 10 Year Single Barrel', d: 'Heaven Hill', t: 'bourbon',
    vec: [6, 7, 5, 6, 5, 3, 2, 1, 4, 4], c: 'Bonded, ten-year Heaven Hill oak and nut.',
    proofMin: 100, proofMax: 100, count: 300 },
  { base: 'Elijah Craig Barrel Proof', d: 'Heaven Hill', t: 'bourbon',
    vec: [6, 7, 6, 7, 5, 3, 2, 2, 4, 3], c: 'Cask-strength Elijah Craig: brown sugar and char.',
    proofMin: 118, proofMax: 136, count: 260 },
  { base: 'Elijah Craig Single Barrel', d: 'Heaven Hill', t: 'bourbon',
    vec: [6, 6, 6, 6, 4, 3, 2, 1, 4, 3], c: 'Classic Elijah Craig single-barrel oak.',
    proofMin: 94, proofMax: 94, count: 240 },
  { base: 'Old Forester Single Barrel Barrel Strength', d: 'Brown-Forman', t: 'bourbon',
    vec: [6, 6, 6, 7, 5, 3, 2, 2, 3, 3], c: 'Rich, chewy Old Forester at full strength.',
    proofMin: 120, proofMax: 130, count: 360 },
  { base: 'Woodford Reserve Personal Selection', d: 'Brown-Forman', t: 'bourbon',
    vec: [6, 6, 6, 6, 5, 5, 3, 1, 4, 2], c: 'Woodford’s fruit-and-spice personal barrels.',
    proofMin: 90, proofMax: 100, count: 320 },
  { base: 'Jack Daniel’s Single Barrel Barrel Proof', d: "Jack Daniel's", t: 'tennessee',
    vec: [6, 6, 7, 6, 4, 3, 2, 3, 4, 2], c: 'Charcoal-mellowed Jack at barrel strength.',
    proofMin: 125, proofMax: 140, count: 340 },
  { base: 'Jack Daniel’s Single Barrel Select', d: "Jack Daniel's", t: 'tennessee',
    vec: [6, 5, 7, 6, 3, 3, 2, 3, 3, 2], c: 'Banana, vanilla and soft char.',
    proofMin: 94, proofMax: 94, count: 260 },
  { base: 'Wild Turkey Kentucky Spirit', d: 'Wild Turkey', t: 'bourbon',
    vec: [6, 6, 6, 6, 6, 4, 2, 2, 3, 3], c: 'Single-barrel Wild Turkey spice and caramel.',
    proofMin: 101, proofMax: 101, count: 220 },
  { base: 'Michter’s US*1 Single Barrel Bourbon', d: 'Michter’s', t: 'bourbon',
    vec: [7, 6, 6, 7, 4, 4, 2, 1, 4, 2], c: 'Small-batch Michter’s richness.',
    proofMin: 91.4, proofMax: 91.4, count: 200 },
  { base: 'Michter’s US*1 Single Barrel Rye', d: 'Michter’s', t: 'rye',
    vec: [5, 5, 5, 5, 8, 4, 3, 1, 3, 3], c: 'Bright, minty Michter’s rye.',
    proofMin: 84.8, proofMax: 84.8, count: 160 },
  { base: 'New Riff Single Barrel', d: 'New Riff', t: 'bourbon',
    vec: [6, 6, 5, 5, 7, 4, 3, 1, 3, 4], c: 'Bottled-in-bond high-rye New Riff.',
    proofMin: 100, proofMax: 100, count: 260 },
  { base: 'Wilderness Trail Single Barrel', d: 'Wilderness Trail', t: 'bourbon',
    vec: [7, 5, 6, 6, 5, 4, 3, 1, 3, 3], c: 'Sweet-mash Wilderness Trail depth.',
    proofMin: 100, proofMax: 118, count: 220 },
  { base: 'Bardstown Bourbon Company Discovery Single Barrel', d: 'Bardstown Bourbon Co.', t: 'bourbon',
    vec: [6, 6, 6, 6, 5, 5, 3, 1, 4, 2], c: 'Polished, blend-driven Bardstown character.',
    proofMin: 100, proofMax: 115, count: 200 },
  { base: 'Smoke Wagon Uncut Unfiltered Single Barrel', d: 'Nevada H&C', t: 'bourbon',
    vec: [7, 6, 7, 7, 5, 4, 2, 1, 4, 2], c: 'Barrel-strength MGP-sourced richness.',
    proofMin: 110, proofMax: 118, count: 180 },
  { base: 'Barrell Craft Spirits Single Barrel', d: 'Barrell Craft Spirits', t: 'bourbon',
    vec: [6, 6, 6, 6, 6, 5, 3, 2, 4, 3], c: 'Blender’s single-barrel selection at cask strength.',
    proofMin: 108, proofMax: 132, count: 220 },
  { base: 'Nashville Barrel Company Single Barrel', d: 'Nashville Barrel Co.', t: 'bourbon',
    vec: [7, 6, 6, 7, 5, 4, 2, 1, 4, 2], c: 'Small-house sourced single barrels.',
    proofMin: 110, proofMax: 122, count: 180 },
  { base: 'Ezra Brooks Old Ezra 7 Single Barrel', d: 'Lux Row', t: 'bourbon',
    vec: [6, 6, 6, 7, 5, 3, 2, 1, 4, 3], c: 'Value barrel-proof workhorse.',
    proofMin: 107, proofMax: 107, count: 160 },
  { base: 'Rebel 100 Single Barrel', d: 'Lux Row', t: 'bourbon',
    vec: [7, 5, 6, 6, 3, 4, 3, 0, 3, 2], c: 'Wheated Lux Row softness.',
    proofMin: 100, proofMax: 100, count: 140 },
  { base: 'Penelope Barrel Strength Single Barrel', d: 'Penelope', t: 'bourbon',
    vec: [7, 5, 6, 6, 5, 5, 3, 1, 3, 2], c: 'Four-grain MGP sweetness.',
    proofMin: 110, proofMax: 120, count: 160 },
  { base: 'Kentucky Owl Single Barrel', d: 'Kentucky Owl', t: 'bourbon',
    vec: [6, 6, 6, 6, 6, 4, 2, 2, 4, 3], c: 'Blended-to-barrel Kentucky Owl richness.',
    proofMin: 100, proofMax: 120, count: 120 },
  { base: 'Old Elk Single Barrel', d: 'Old Elk', t: 'bourbon',
    vec: [7, 5, 7, 6, 4, 4, 3, 1, 4, 2], c: 'High-malt slow-cut Old Elk smoothness.',
    proofMin: 105, proofMax: 118, count: 140 },
  { base: 'Sagamore Spirit Single Barrel Rye', d: 'Sagamore Spirit', t: 'rye',
    vec: [5, 5, 5, 5, 8, 4, 3, 1, 3, 3], c: 'Maryland-style rye, bright and spicy.',
    proofMin: 112, proofMax: 116, count: 140 },
  { base: 'Pinhook Single Barrel', d: 'Pinhook', t: 'bourbon',
    vec: [6, 5, 6, 6, 5, 5, 3, 1, 3, 2], c: 'Vintage-driven Castle & Key/MGP barrels.',
    proofMin: 100, proofMax: 116, count: 140 },
  { base: 'Frey Ranch Single Barrel', d: 'Frey Ranch', t: 'bourbon',
    vec: [7, 6, 6, 6, 6, 3, 2, 1, 3, 4], c: 'Estate-grown four-grain Nevada bourbon.',
    proofMin: 100, proofMax: 122, count: 120 },
  { base: 'Starlight Single Barrel', d: 'Starlight Distillery', t: 'bourbon',
    vec: [7, 5, 6, 7, 5, 5, 3, 1, 3, 2], c: 'Indiana estate pot-still bourbon.',
    proofMin: 110, proofMax: 118, count: 140 },
  { base: 'Wild Turkey Rare Breed Barrel Proof', d: 'Wild Turkey', t: 'bourbon',
    vec: [6, 6, 6, 6, 6, 4, 2, 2, 4, 3], c: 'Batch-strength Turkey blend.',
    proofMin: 112, proofMax: 116, count: 120 },
  { base: 'Knob Creek Single Barrel Rye', d: 'Knob Creek', t: 'rye',
    vec: [5, 6, 5, 5, 8, 3, 3, 1, 3, 3], c: 'Bold, oaky single-barrel rye.',
    proofMin: 115, proofMax: 115, count: 160 },
  { base: 'Willett Family Estate Single Barrel', d: 'Willett', t: 'bourbon',
    vec: [6, 7, 6, 6, 6, 4, 2, 1, 4, 3], c: 'Sought-after Willett estate barrels.',
    proofMin: 108, proofMax: 130, count: 200 },
  { base: 'Willett Family Estate Single Barrel Rye', d: 'Willett', t: 'rye',
    vec: [5, 6, 5, 5, 8, 4, 3, 1, 3, 3], c: 'High-rye Willett estate spice.',
    proofMin: 108, proofMax: 130, count: 140 },
  { base: 'Four Gate Single Barrel', d: 'Four Gate', t: 'bourbon',
    vec: [6, 7, 6, 7, 5, 5, 2, 2, 4, 3], c: 'Finished, limited Four Gate releases.',
    proofMin: 110, proofMax: 128, count: 120 },
  { base: 'Old Forester 1920 Single Barrel', d: 'Brown-Forman', t: 'bourbon',
    vec: [7, 6, 6, 7, 5, 3, 2, 2, 4, 2], c: 'Prohibition-strength Old Forester.',
    proofMin: 115, proofMax: 115, count: 120 },
  { base: 'Blanton’s Single Barrel Store Pick', d: 'Buffalo Trace', t: 'bourbon',
    vec: [6, 6, 6, 6, 6, 4, 3, 1, 3, 3], c: 'The iconic single-barrel Blanton’s.',
    proofMin: 93, proofMax: 93, count: 260 },
];

/** Deterministic 32-bit hash of a string. */
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function clamp(v: number): number {
  return Math.round(Math.min(10, Math.max(0, v)) * 10) / 10;
}

/** Scale a base vector for proof: hotter barrels read oakier/spicier/richer. */
function profileForProof(vec: number[], proof: number): FlavorProfile {
  const d = (proof - 100) / 10;
  const bump = [0, 0.3, 0.1, 0.25, 0.3, 0, 0, 0.1, 0.15, 0.1];
  const profile = {} as FlavorProfile;
  FLAVOR_AXES.forEach((axis, i) => {
    profile[axis] = clamp(vec[i] + d * bump[i]);
  });
  return profile;
}

export function generatePicks(): WhiskeyRecord[] {
  const records: WhiskeyRecord[] = [];
  const seen = new Set<string>();

  for (const p of PROGRAMS) {
    for (let i = 0; i < p.count; i++) {
      const retailer = RETAILERS[i % RETAILERS.length];
      const variant = p.variants ? p.variants[i % p.variants.length] : undefined;
      // Barrel number spread across a plausible range, deterministic per entry.
      const seedKey = `${p.base}|${variant ?? ''}|${retailer}|${i}`;
      const seed = hashStr(seedKey);
      const barrelNo = 100 + (seed % 8900);
      const proofSpan = p.proofMax - p.proofMin;
      const proof =
        proofSpan <= 0
          ? p.proofMin
          : Math.round((p.proofMin + ((seed >> 8) % 1000) / 1000 * proofSpan) * 10) / 10;

      const namePieces = [p.base];
      if (variant) namePieces.push(variant);
      namePieces.push(`— ${retailer} Pick #${barrelNo}`);
      const name = namePieces.join(' ');

      let id = slugify(name);
      if (seen.has(id)) {
        id = `${id}-${seed.toString(36)}`;
      }
      seen.add(id);

      const flavor = profileForProof(p.vec, proof);
      records.push({
        id,
        name,
        distillery: p.d,
        type: p.t,
        proof,
        flavor,
        notes: synthesizeNotes(p.c, flavor),
        learned: false,
      });
    }
  }
  return records;
}
