import { Rarity } from '../types';

/**
 * Known pricing anchors for famous bottlings: [msrp, secondary] in USD.
 * These are ballpark estimates (prices move and vary by state/market) —
 * every bottle's pricing is user-editable, and AI estimation can fill in
 * anything not listed here. Keyed by normalized-name substring.
 */
const PRICE_ANCHORS: [marker: string, msrp: number, secondary: number][] = [
  ['pappy van winkle 23', 300, 3800],
  ['pappy van winkle 20', 250, 2800],
  ['pappy van winkle 15', 150, 1800],
  ['van winkle special reserve 12', 100, 900],
  ['old rip van winkle 10', 80, 700],
  ['george t stagg', 100, 1100],
  ['william larue weller', 100, 1300],
  ['thomas h handy', 100, 900],
  ['eagle rare 17', 100, 1100],
  ['sazerac rye 18', 100, 900],
  ['eagle rare 10', 40, 70],
  ['blantons straight from the barrel', 65, 200],
  ['blantons gold', 75, 180],
  ['blantons original', 65, 110],
  ['blantons special reserve', 55, 90],
  ['buffalo trace', 28, 40],
  ['weller special reserve', 25, 50],
  ['old weller antique 107', 40, 100],
  ['weller 12', 40, 220],
  ['weller full proof', 50, 280],
  ['weller single barrel', 50, 350],
  ['weller c y p b', 40, 250],
  ['stagg', 70, 300],
  ['e h taylor small batch', 45, 90],
  ['e h taylor single barrel', 65, 180],
  ['e h taylor barrel proof', 80, 350],
  ['elijah craig barrel proof', 70, 110],
  ['elijah craig 18', 150, 350],
  ['henry mckenna 10', 40, 80],
  ['old fitzgerald bottled in bond', 110, 250],
  ['parkers heritage', 150, 400],
  ['makers mark cask strength', 45, 60],
  ['makers mark', 25, 30],
  ['four roses limited edition', 180, 500],
  ['four roses single barrel barrel strength', 90, 150],
  ['four roses single barrel', 50, 60],
  ['four roses small batch select', 60, 70],
  ['wild turkey rare breed', 55, 65],
  ['russells reserve 13', 150, 500],
  ['russells reserve 15', 250, 600],
  ['russells reserve single barrel', 65, 80],
  ['bookers', 90, 110],
  ['knob creek 18', 170, 300],
  ['old forester 1920', 60, 70],
  ['king of kentucky', 250, 1500],
  ['michters 10 year bourbon', 185, 400],
  ['michters 10 year rye', 185, 350],
  ['michters 20', 1200, 2500],
  ['michters toasted', 110, 250],
  ['blood oath', 140, 250],
  ['kentucky owl', 300, 450],
  ['joseph magnus cigar blend', 250, 450],
  ['old carter', 250, 450],
  ['boss hog', 500, 900],
  ['whistlepig 15', 260, 350],
  ['whistlepig 18', 400, 550],
  ['high west midwinter', 200, 350],
  ['garrison brothers cowboy', 280, 450],
  ['jack daniels 12', 90, 200],
  ['jack daniels 10', 80, 150],
  ['jack daniels single barrel barrel proof', 70, 90],
  ['macallan 18', 380, 450],
  ['macallan rare cask', 380, 500],
  ['macallan 12', 90, 100],
  ['lagavulin 16', 110, 120],
  ['lagavulin 12 cask strength', 160, 250],
  ['ardbeg 10', 55, 60],
  ['laphroaig 10', 55, 60],
  ['octomore', 220, 300],
  ['springbank 10', 75, 200],
  ['springbank 12 cask strength', 110, 350],
  ['springbank 15', 150, 450],
  ['springbank 18', 250, 700],
  ['springbank 21', 500, 1500],
  ['glendronach 21', 200, 300],
  ['highland park 18', 200, 250],
  ['balvenie 21', 300, 350],
  ['glenfiddich 18', 110, 120],
  ['redbreast 12', 70, 80],
  ['redbreast 15', 110, 130],
  ['redbreast 21', 300, 400],
  ['redbreast 27', 600, 800],
  ['midleton very rare', 220, 400],
  ['gold spot', 130, 250],
  ['red spot', 140, 200],
  ['green spot', 65, 75],
  ['yamazaki 12', 160, 200],
  ['yamazaki 18', 450, 1200],
  ['yamazaki 25', 1600, 5000],
  ['hakushu 12', 160, 200],
  ['hakushu 18', 450, 1000],
  ['hibiki 17', 350, 700],
  ['hibiki 21', 500, 1500],
  ['hibiki', 100, 130],
  ['nikka from the barrel', 65, 75],
  ['found north', 100, 200],
  ['kavalan solist', 180, 250],
  ['jameson', 30, 35],
  ['jim beam white', 18, 20],
  ['evan williams black', 15, 18],
  ['old grand dad 114', 35, 45],
  ['wild turkey 101', 25, 30],
  ['old forester 1910', 60, 70],
  ['1792 full proof', 45, 90],
  ['knob creek 12', 65, 80],
  ['smoke wagon uncut', 60, 120],
  ['crown royal', 30, 35],
];

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function lookupPricing(name: string): { msrp: number; secondary: number } | undefined {
  const n = norm(name);
  for (const [marker, msrp, secondary] of PRICE_ANCHORS) {
    if (n.includes(marker)) return { msrp, secondary };
  }
  return undefined;
}

/**
 * A "fair price" between retail and secondary: what a reasonable buyer might
 * pay without getting fleeced. For shelf bottles it's MSRP; for allocated
 * bottles it drifts partway toward the secondary market (retail lottery odds
 * aren't a price).
 */
export function fairPrice(msrp?: number, secondary?: number, rarity?: Rarity): number | undefined {
  if (msrp === undefined && secondary === undefined) return undefined;
  if (msrp === undefined) return secondary;
  if (secondary === undefined || secondary <= msrp) return msrp;
  const drift: Record<Rarity, number> = { S: 0.55, A: 0.4, B: 0.25, C: 0.1, D: 0 };
  const factor = drift[rarity ?? 'C'];
  return Math.round(msrp + (secondary - msrp) * factor);
}

export function formatUsd(v?: number): string {
  return v === undefined ? '—' : `$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}
