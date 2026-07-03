import { FlavorProfile, WhiskeyRecord, WhiskeyType } from '../types';
import { assignRarity } from '../lib/rarity';
import { lookupPricing } from '../lib/pricing';
import { expandHouses } from './generator';
import { AMERICAN_MAJORS } from './houses/americanMajors';
import { AMERICAN_CRAFT } from './houses/americanCraft';
import { SCOTCH_SPEYSIDE_HIGHLAND } from './houses/scotchSpeysideHighland';
import { SCOTCH_ISLAY_ISLANDS } from './houses/scotchIslayIslands';
import { SCOTCH_BLENDS } from './houses/scotchBlends';
import { WORLD_WHISKEYS } from './houses/worldWhiskeys';
import { EXTRA_HOUSES } from './houses/extraHouses';

export { FLAVOR_AXES, FLAVOR_LABELS } from './flavorAxes';

function fp(
  sweet: number,
  oak: number,
  vanilla: number,
  caramel: number,
  spice: number,
  fruit: number,
  floral: number,
  smoke: number,
  nutty: number,
  earthy: number
): FlavorProfile {
  return { sweet, oak, vanilla, caramel, spice, fruit, floral, smoke, nutty, earthy };
}

function rec(
  id: string,
  name: string,
  distillery: string,
  type: WhiskeyType,
  proof: number,
  flavor: FlavorProfile,
  notes: string,
  barcodes?: string[]
): WhiskeyRecord {
  return { id, name, distillery, type, proof, flavor, notes, barcodes };
}

/**
 * Hand-curated flagship bottlings with individually written note summaries,
 * aggregated from the common language of professional reviews
 * (Whisky Advocate, Breaking Bourbon, Distiller, Whiskey Raiders).
 * These take precedence over generated entries with the same name.
 */
const CURATED_DB: WhiskeyRecord[] = [
  // ── Bourbons ────────────────────────────────────────────────
  rec('buffalo-trace', 'Buffalo Trace', 'Buffalo Trace', 'bourbon', 90,
    fp(7, 5, 7, 6, 4, 4, 2, 1, 3, 2),
    'Brown sugar and toffee sweetness, vanilla, light oak, hints of mint and dried fruit. Approachable, balanced everyday bourbon.',
    ['080244009963']),
  rec('eagle-rare-10', 'Eagle Rare 10 Year', 'Buffalo Trace', 'bourbon', 90,
    fp(6, 7, 6, 6, 4, 5, 2, 1, 4, 3),
    'Toasted oak, honey, orange peel, leather and cocoa. Older-profile Buffalo Trace mash with more polish and depth.'),
  rec('blantons', "Blanton's Original Single Barrel", 'Buffalo Trace', 'bourbon', 93,
    fp(7, 6, 7, 7, 5, 5, 3, 1, 4, 2),
    'Citrus and honey, vanilla custard, baking spice and caramel corn. Silky single-barrel with a spicy rye kick on the finish.'),
  rec('weller-sb', 'W.L. Weller Special Reserve', 'Buffalo Trace', 'bourbon', 90,
    fp(8, 4, 6, 7, 2, 4, 3, 0, 3, 1),
    'Soft wheated profile: honey, butterscotch, fresh bread and gentle cherry. Sweet and easy with minimal spice.'),
  rec('weller-107', 'Old Weller Antique 107', 'Buffalo Trace', 'bourbon', 107,
    fp(8, 6, 6, 8, 4, 5, 2, 1, 3, 2),
    'Cinnamon-dusted caramel, cherry cola, toasted marshmallow. Wheated sweetness with real proof behind it.'),
  rec('ecbp', "Elijah Craig Barrel Proof", 'Heaven Hill', 'bourbon', 124,
    fp(7, 9, 7, 8, 6, 4, 1, 2, 5, 3),
    'Huge oak, dark caramel, roasted nuts, espresso and dark chocolate. Full-throttle barrel-proof classic.'),
  rec('elijah-craig-sb', 'Elijah Craig Small Batch', 'Heaven Hill', 'bourbon', 94,
    fp(6, 6, 7, 6, 4, 3, 2, 1, 5, 2),
    'Vanilla bean, sweet oak, nutmeg and toasted nuts. Benchmark small-batch with a woody backbone.'),
  rec('henry-mckenna-10', 'Henry McKenna Single Barrel 10 Year', 'Heaven Hill', 'bourbon', 100,
    fp(6, 8, 7, 7, 5, 4, 2, 1, 4, 3),
    'Bottled-in-bond oak bomb: caramel apple, vanilla, cinnamon and old wood with a long finish.'),
  rec('makers-mark', "Maker's Mark", 'Maker\'s Mark', 'bourbon', 90,
    fp(8, 4, 6, 7, 2, 4, 3, 0, 3, 1),
    'Wheated and friendly: caramel, vanilla, baked bread, red fruit. Soft, round, low spice.'),
  rec('makers-46', "Maker's Mark 46", 'Maker\'s Mark', 'bourbon', 94,
    fp(7, 6, 7, 8, 3, 4, 2, 1, 3, 2),
    'French-oak staves add mocha, toasted caramel and baking chocolate to the soft wheated core.'),
  rec('woodford-reserve', 'Woodford Reserve', 'Woodford Reserve', 'bourbon', 90.4,
    fp(6, 6, 6, 6, 5, 5, 3, 1, 5, 2),
    'Dried fruit, cocoa, toasty oak and clean spice. Polished, food-friendly pot-still character.'),
  rec('four-roses-sb', 'Four Roses Single Barrel', 'Four Roses', 'bourbon', 100,
    fp(6, 5, 6, 6, 7, 6, 4, 0, 3, 2),
    'High-rye brightness: ripe plum, cherry, cinnamon and clove over delicate florals.'),
  rec('four-roses-sbs', 'Four Roses Small Batch Select', 'Four Roses', 'bourbon', 104,
    fp(6, 6, 6, 6, 7, 6, 4, 1, 3, 2),
    'Non-chill-filtered blend of six recipes: raspberry, apricot, clove, vanilla cream and rye spice.'),
  rec('wild-turkey-101', 'Wild Turkey 101', 'Wild Turkey', 'bourbon', 101,
    fp(6, 7, 6, 6, 7, 4, 1, 2, 4, 3),
    'Bold classic: toffee, char, black pepper, orange rind. High-proof value with a Kentucky-hug finish.'),
  rec('russells-10', "Russell's Reserve 10 Year", 'Wild Turkey', 'bourbon', 90,
    fp(6, 7, 7, 6, 6, 4, 2, 1, 5, 3),
    'Toasted oak, vanilla, honeyed nuts and gentle leather. A refined, older Wild Turkey profile.'),
  rec('knob-creek-9', 'Knob Creek 9 Year', 'Jim Beam', 'bourbon', 100,
    fp(6, 8, 6, 6, 5, 3, 1, 2, 6, 3),
    'Beam nuttiness dialed up: roasted peanut, charred oak, maple and brown sugar.'),
  rec('knob-creek-12', 'Knob Creek 12 Year', 'Jim Beam', 'bourbon', 100,
    fp(6, 9, 7, 7, 5, 3, 1, 2, 6, 3),
    'Deep oak and dark chocolate over the classic peanut-brittle Beam core. Long, drying finish.'),
  rec('bookers', "Booker's", 'Jim Beam', 'bourbon', 125,
    fp(6, 8, 7, 7, 6, 3, 1, 3, 7, 3),
    'Uncut Beam: peanut, vanilla, charred wood, tobacco and intense heat.'),
  rec('basil-hayden', 'Basil Hayden', 'Jim Beam', 'bourbon', 80,
    fp(6, 4, 5, 5, 5, 4, 3, 0, 4, 2),
    'Light and gentle high-rye: honey, black pepper, dried herbs. Low proof, easy entry point.'),
  rec('old-forester-1920', 'Old Forester 1920 Prohibition Style', 'Old Forester', 'bourbon', 115,
    fp(7, 7, 7, 9, 6, 5, 2, 2, 4, 3),
    'Dark caramel bordering on burnt sugar, cherry cordial, cocoa, graham cracker and smoked marshmallow.'),
  rec('old-forester-100', 'Old Forester 100 Signature', 'Old Forester', 'bourbon', 100,
    fp(6, 6, 6, 7, 6, 5, 2, 1, 3, 2),
    'Banana bread, caramel, baking spice and sharp oak. Classic Brown-Forman fruit-forward yeast note.'),
  rec('1792-sb', '1792 Small Batch', 'Barton 1792', 'bourbon', 93.7,
    fp(6, 6, 6, 6, 6, 4, 2, 1, 4, 2),
    'Caramel and rye spice in balance, apple peel, clove and a slightly dry oak finish.'),
  rec('stagg-jr', 'Stagg', 'Buffalo Trace', 'bourbon', 130,
    fp(7, 8, 7, 8, 7, 5, 1, 2, 4, 3),
    'Barrel-proof brute: dark cherry, molasses, tobacco, char and cinnamon fire.'),
  rec('ehtaylor-sb', 'E.H. Taylor Small Batch', 'Buffalo Trace', 'bourbon', 100,
    fp(7, 6, 7, 7, 5, 4, 3, 1, 3, 2),
    'Butterscotch, corn sweetness, gentle tobacco and lemon zest. Bottled-in-bond refinement.'),
  rec('woodinville', 'Woodinville Straight Bourbon', 'Woodinville', 'bourbon', 90,
    fp(7, 6, 7, 7, 4, 4, 2, 1, 3, 2),
    'Craft darling: crème brûlée, sweet corn, dusty oak and vanilla bean.'),
  rec('jack-daniels-sbbp', "Jack Daniel's Single Barrel Barrel Proof", 'Jack Daniel\'s', 'tennessee', 130,
    fp(7, 7, 8, 7, 5, 4, 1, 2, 4, 2),
    'Banana, vanilla fudge, toasted oak and cinnamon at full strength. The Lincoln-County classic, amplified.'),
  rec('jack-daniels-old-7', "Jack Daniel's Old No. 7", 'Jack Daniel\'s', 'tennessee', 80,
    fp(7, 4, 6, 6, 2, 4, 1, 1, 3, 1),
    'Charcoal-mellowed and light: banana, caramel, soft vanilla, faint smoke.'),
  rec('george-dickel-12', 'George Dickel No. 12', 'Cascade Hollow', 'tennessee', 90,
    fp(6, 5, 6, 6, 3, 3, 1, 2, 4, 4),
    'Buttered corn, dusty earth ("Dickel funk"), maple and light char.'),

  // ── Ryes ────────────────────────────────────────────────────
  rec('rittenhouse', 'Rittenhouse Rye Bottled-in-Bond', 'Heaven Hill', 'rye', 100,
    fp(5, 6, 5, 6, 8, 4, 2, 1, 4, 3),
    'Cocoa-dusted rye spice, caramel, citrus pith. The bartender workhorse rye.'),
  rec('sazerac-rye', 'Sazerac Rye', 'Buffalo Trace', 'rye', 90,
    fp(5, 5, 5, 5, 7, 5, 3, 0, 3, 2),
    'Candied spice, anise, lemon zest and soft vanilla. Kentucky-style gentle rye.'),
  rec('pikesville', 'Pikesville Rye 110', 'Heaven Hill', 'rye', 110,
    fp(5, 7, 6, 6, 8, 4, 2, 1, 4, 3),
    'Dense caramel, dark rye bread, clove, mint and charred oak.'),
  rec('whistlepig-10', 'WhistlePig 10 Year', 'WhistlePig', 'rye', 100,
    fp(5, 6, 5, 6, 9, 5, 3, 0, 3, 3),
    '95% rye intensity: mint, rye grain, allspice, caramel and orchard fruit.'),
  rec('high-west-dr', 'High West Double Rye', 'High West', 'rye', 92,
    fp(5, 4, 4, 5, 8, 5, 3, 0, 2, 3),
    'Blended rye with juniper, mint, cinnamon red-hots and honeyed citrus.'),
  rec('michters-rye', "Michter's US*1 Rye", "Michter's", 'rye', 84.8,
    fp(5, 5, 5, 6, 6, 4, 2, 1, 3, 2),
    'Peppery but plush: butterscotch, oak, citrus and gentle spice.'),

  // ── Scotch ──────────────────────────────────────────────────
  rec('glenlivet-12', 'The Glenlivet 12', 'The Glenlivet', 'scotch', 80,
    fp(6, 3, 4, 3, 2, 7, 6, 0, 3, 2),
    'Orchard fruit, honey, citrus blossom and cream. Gentle Speyside benchmark.'),
  rec('glenfiddich-12', 'Glenfiddich 12', 'Glenfiddich', 'scotch', 80,
    fp(6, 3, 3, 3, 2, 8, 5, 0, 2, 2),
    'Pear-forward Speyside with apple, malt sweetness and light oak.'),
  rec('macallan-12', 'The Macallan 12 Double Cask', 'The Macallan', 'scotch', 86,
    fp(7, 5, 5, 5, 3, 7, 3, 0, 4, 2),
    'Sherry-seasoned: dried fruit, butterscotch, ginger and toffee apple.'),
  rec('glendronach-12', 'GlenDronach 12', 'GlenDronach', 'scotch', 86,
    fp(7, 5, 4, 5, 3, 8, 2, 0, 5, 3),
    'Rich sherry bomb: stewed plum, fig, dark chocolate and walnut.'),
  rec('laphroaig-10', 'Laphroaig 10', 'Laphroaig', 'scotch', 86,
    fp(3, 4, 3, 2, 3, 3, 1, 10, 2, 6),
    'Medicinal Islay peat: iodine, seaweed, campfire smoke and sea salt.'),
  rec('ardbeg-10', 'Ardbeg 10', 'Ardbeg', 'scotch', 92,
    fp(4, 3, 4, 2, 3, 4, 2, 9, 2, 5),
    'Intense peat smoke balanced by lime, vanilla and black pepper.'),
  rec('lagavulin-16', 'Lagavulin 16', 'Lagavulin', 'scotch', 86,
    fp(5, 5, 4, 4, 3, 5, 1, 9, 3, 6),
    'Slow, rich Islay smoke with sherry sweetness, dried fig and maritime brine.'),
  rec('highland-park-12', 'Highland Park 12', 'Highland Park', 'scotch', 86,
    fp(6, 4, 4, 4, 3, 6, 4, 4, 3, 4),
    'Heather honey and gentle floral peat, citrus and winter spice.'),
  rec('talisker-10', 'Talisker 10', 'Talisker', 'scotch', 91.6,
    fp(5, 4, 3, 3, 5, 5, 2, 7, 2, 5),
    'Maritime smoke, black pepper, brine and dried fruit sweetness.'),
  rec('monkey-shoulder', 'Monkey Shoulder', 'William Grant & Sons', 'scotch', 86,
    fp(7, 3, 5, 5, 3, 6, 4, 0, 3, 1),
    'Blended-malt crowd-pleaser: malty honey, vanilla, orange and baking spice.'),
  rec('johnnie-black', 'Johnnie Walker Black Label', 'Johnnie Walker', 'scotch', 80,
    fp(6, 4, 4, 4, 3, 5, 2, 4, 3, 3),
    'Smooth blended smoke: dried fruit, vanilla, toffee and a wisp of peat.'),

  // ── Irish ───────────────────────────────────────────────────
  rec('jameson', 'Jameson', 'Midleton', 'irish', 80,
    fp(6, 3, 4, 4, 2, 5, 4, 0, 4, 1),
    'Triple-distilled and easy: green apple, honey, floral malt and light toasted wood.'),
  rec('redbreast-12', 'Redbreast 12', 'Midleton', 'irish', 80,
    fp(7, 5, 4, 5, 4, 8, 4, 0, 5, 2),
    'Single pot still classic: baked orchard fruit, sherry, marzipan and creamy spice.'),
  rec('green-spot', 'Green Spot', 'Midleton', 'irish', 80,
    fp(7, 4, 4, 4, 3, 7, 5, 0, 4, 2),
    'Fresh-cut apple, barley sugar, menthol and honeyed pot-still cream.'),

  // ── Japanese ────────────────────────────────────────────────
  rec('toki', 'Suntory Toki', 'Suntory', 'japanese', 86,
    fp(5, 3, 4, 3, 2, 6, 5, 0, 2, 1),
    'Bright and delicate blend: grapefruit, green apple, white pepper and subtle vanilla.'),
  rec('yamazaki-12', 'Yamazaki 12', 'Suntory', 'japanese', 86,
    fp(6, 4, 4, 4, 3, 7, 5, 1, 3, 2),
    'Mizunara elegance: peach, coconut, incense and candied citrus.'),
  rec('hibiki-harmony', 'Hibiki Japanese Harmony', 'Suntory', 'japanese', 86,
    fp(6, 4, 4, 4, 2, 7, 6, 1, 3, 1),
    'Silky, floral blend: honey, orange peel, rosewater and light oak.'),
  rec('nikka-fbrn', 'Nikka From the Barrel', 'Nikka', 'japanese', 102.8,
    fp(6, 5, 5, 6, 5, 6, 3, 2, 3, 2),
    'Concentrated blend: toffee, winter spice, dried fruit and gentle smoke.'),

  // ── Canadian ────────────────────────────────────────────────
  rec('lot40', 'Lot No. 40', 'Hiram Walker', 'canadian', 86,
    fp(5, 5, 5, 5, 8, 4, 3, 0, 3, 3),
    '100% pot-still rye: rye bread, clove, dark caramel and oak resin.'),
  rec('crown-royal', 'Crown Royal Deluxe', 'Crown Royal', 'canadian', 80,
    fp(7, 3, 5, 6, 3, 4, 3, 0, 2, 1),
    'Soft and sweet blend: vanilla cream, caramel, light fruit and gentle spice.'),
];

const GENERATED_DB: WhiskeyRecord[] = expandHouses([
  ...AMERICAN_MAJORS,
  ...AMERICAN_CRAFT,
  ...SCOTCH_SPEYSIDE_HIGHLAND,
  ...SCOTCH_ISLAY_ISLANDS,
  ...SCOTCH_BLENDS,
  ...WORLD_WHISKEYS,
  ...EXTRA_HOUSES,
]);

function normKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

/**
 * Full reference database: curated flagships (richer hand-written notes)
 * merged with the generated house/expression catalog. Curated entries win
 * on name collisions.
 */
export const WHISKEY_DB: WhiskeyRecord[] = (() => {
  const seen = new Set(CURATED_DB.map((r) => normKey(r.name)));
  const merged = [...CURATED_DB];
  for (const record of GENERATED_DB) {
    const key = normKey(record.name);
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(record);
    }
  }
  // Attach rarity tiers and pricing anchors to every record.
  return merged.map((r) => ({
    ...r,
    rarity: r.rarity ?? assignRarity(r),
    ...(lookupPricing(r.name) ?? {}),
  }));
})();

/** Default flavor profiles used when a bottle isn't in the reference DB. */
export const TYPE_DEFAULTS: Record<WhiskeyType, FlavorProfile> = {
  bourbon: fp(7, 6, 6, 6, 4, 4, 2, 1, 4, 2),
  rye: fp(5, 5, 5, 5, 8, 4, 3, 1, 3, 3),
  tennessee: fp(7, 5, 6, 6, 3, 4, 1, 2, 3, 2),
  scotch: fp(5, 4, 4, 4, 3, 6, 4, 3, 3, 3),
  irish: fp(6, 4, 4, 4, 3, 6, 4, 0, 4, 2),
  japanese: fp(6, 4, 4, 4, 3, 6, 5, 1, 3, 2),
  canadian: fp(6, 4, 5, 5, 4, 4, 3, 0, 2, 2),
  other: fp(6, 5, 5, 5, 4, 4, 3, 1, 3, 2),
};
