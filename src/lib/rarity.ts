import { Rarity, WhiskeyRecord } from '../types';

export const RARITY_ORDER: Rarity[] = ['S', 'A', 'B', 'C', 'D'];

export const RARITY_COLORS: Record<Rarity, string> = {
  S: '#e5b13a',
  A: '#a486b0',
  B: '#87a0b8',
  C: '#7da35c',
  D: '#9a8b7a',
};

export const RARITY_LABELS: Record<Rarity, string> = {
  S: 'Unicorn — heavily allocated / lottery-only',
  A: 'Allocated — rarely on shelves at retail',
  B: 'Limited — semi-allocated or periodic releases',
  C: 'Shelf — generally available at retail',
  D: 'Everywhere — bottom-shelf staple',
};

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

/**
 * Allocation-aware overrides, checked in order (S first). Substring match on
 * the normalized bottle name. Opinionated but user-editable per bottle.
 */
const S_MARKERS = [
  'pappy',
  'van winkle',
  'george t stagg',
  'william larue weller',
  'thomas h handy',
  'sazerac rye 18',
  'eagle rare 17',
  'elijah craig 23',
  'ofc old fashioned',
  'king of kentucky',
  'michters 20',
  'boss hog',
  'yamazaki 25',
  'hibiki 21',
  'redbreast 27',
  'midleton very rare',
  'macallan rare cask',
  'springbank 21',
  'hardins creek',
  'double eagle',
];

const A_MARKERS = [
  'weller',
  'blanton',
  'e h taylor',
  'eh taylor',
  'stagg',
  'elmer t lee',
  'rock hill farms',
  'hancock',
  'eagle rare',
  'elijah craig 18',
  'parkers heritage',
  'old fitzgerald bottled in bond',
  'four roses limited edition',
  'masters keep',
  'russells reserve 13',
  'russells reserve 15',
  'michters 10',
  'michters toasted',
  'whistlepig 15',
  'whistlepig 18',
  'old carter',
  'kentucky owl',
  'cigar blend',
  'blood oath',
  'king ranch',
  'birthday bourbon',
  'very fine rare',
  'cellar aged',
  'knob creek 18',
  'jack daniels 12',
  'gold spot',
  'red spot',
  'springbank',
  'lagavulin 12 cask strength',
  'octomore',
  'traigh bhan',
  'ardbeg 25',
  'chichibu',
  'hakushu 18',
  'yamazaki 18',
  'hibiki 17',
  'redbreast 21',
  'macallan 18',
  'glendronach 21',
  'found north',
  'rare character',
  'smoke wagon desert jewel',
  'garrison brothers cowboy',
];

const B_MARKERS = [
  'barrel proof',
  'cask strength',
  'full proof',
  'single rickhouse',
  'limited edition',
  'toasted',
  'batch proof',
  'uncut',
  'booker',
  'buffalo trace',
  'henry mckenna 10',
  'four roses single barrel',
  'kilkerran',
  'redbreast 15',
  'blue run',
  'a bunadh',
  'nadurra',
  'jack daniels 10',
  'high west midwinter',
];

const D_MARKERS = [
  'benchmark old no 8',
  'ancient age',
  'old crow',
  'fleischmanns',
  'canadian mist',
  'black velvet',
  'seagrams vo',
  'jim beam white',
  'evan williams black',
  'ezra brooks 99',
  'very old barton',
  'famous grouse',
  'cutty sark original',
  'johnnie walker red',
  'ballantines finest',
  'grants triple wood',
  'white horse',
  'teachers highland cream',
  'pigs nose',
  'old overholt straight rye',
  'wild turkey 81',
  'jack daniels old no 7',
  'canadian club 1858',
];

function ageFromName(name: string): number | undefined {
  const m = /(\d{1,2})\s*(?:year|yr)/i.exec(name);
  return m ? parseInt(m[1], 10) : undefined;
}

/**
 * Assign a rarity tier from allocation-aware overrides, then age heuristics,
 * defaulting to shelf-tier C.
 */
export function assignRarity(record: Pick<WhiskeyRecord, 'name' | 'distillery'>): Rarity {
  const n = norm(`${record.name}`);
  if (S_MARKERS.some((m) => n.includes(m))) return 'S';
  if (A_MARKERS.some((m) => n.includes(m))) return 'A';
  if (D_MARKERS.some((m) => n.includes(m))) return 'D';
  const age = ageFromName(record.name);
  if (age !== undefined) {
    if (age >= 23) return 'A';
    if (age >= 18) return 'B';
  }
  if (B_MARKERS.some((m) => n.includes(m))) return 'B';
  return 'C';
}

/** Sort helper: S ranks highest. */
export function rarityRank(r: Rarity | undefined): number {
  return r ? RARITY_ORDER.indexOf(r) : RARITY_ORDER.indexOf('C');
}
