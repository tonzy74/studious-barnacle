import { HouseDef } from '../generator';

// Axis order: sweet, oak, vanilla, caramel, spice, fruit, floral, smoke, nutty, earthy
// A broad set of real American craft & regional distilleries and their real
// expressions, to thicken genuine (non-pick) coverage beyond the majors.

export const MORE_AMERICAN: HouseDef[] = [
  // ── Kentucky craft & regional ───────────────────────────────
  {
    d: 'Kentucky Peerless', t: 'bourbon',
    base: [7, 5, 6, 6, 5, 4, 2, 1, 3, 2],
    c: 'Sweet-mash, barrel-proof Peerless out of Louisville.',
    e: [
      ['Peerless Small Batch Bourbon', 108, 'bp'],
      ['Peerless Single Barrel Bourbon', 110, 'sb bp'],
      ['Peerless Double Oak Bourbon', 110, 'bp virgin'],
      ['Peerless Rye', 108, 'highrye bp'],
      ['Peerless Single Barrel Rye', 110, 'sb highrye bp'],
      ['Peerless Toasted Bourbon', 108, 'bp toast'],
    ],
  },
  {
    d: 'Rabbit Hole', t: 'bourbon',
    base: [7, 5, 6, 6, 4, 5, 3, 1, 3, 2],
    c: 'Modern Louisville distillery with four-grain mashbills.',
    e: [
      ['Rabbit Hole Heigold', 95, 'highrye'],
      ['Rabbit Hole Cavehill', 95, 'fourgrain'],
      ['Rabbit Hole Dareringer', 93, 'sherry'],
      ['Rabbit Hole Boxergrail Rye', 95, 'highrye'],
      ['Rabbit Hole Founders Collection', 118, 'bp'],
    ],
  },
  {
    d: 'Castle & Key', t: 'bourbon',
    base: [6, 5, 6, 5, 5, 4, 3, 1, 3, 3],
    c: 'Revived Old Taylor estate on McCracken Springs.',
    e: [
      ['Castle & Key Small Batch Bourbon', 96, ''],
      ['Castle & Key Wheated Bourbon', 96, 'wheat'],
      ['Castle & Key Single Barrel Bourbon', 113, 'sb bp'],
      ['Castle & Key Restoration Rye', 103, 'highrye'],
    ],
  },
  {
    d: 'Green River', t: 'bourbon',
    base: [7, 5, 6, 6, 4, 4, 2, 1, 3, 2],
    c: 'Owensboro distillery, classic Kentucky profile.',
    e: [
      ['Green River Wheated Bourbon', 90, 'wheat'],
      ['Green River Full Proof Bourbon', 100, 'bib'],
      ['Green River Single Barrel', 104, 'sb'],
      ['Green River Rye', 90, 'highrye'],
    ],
  },
  {
    d: 'Log Still', t: 'bourbon',
    base: [7, 5, 6, 6, 4, 4, 2, 1, 3, 3],
    c: 'Dant family revival in Gethsemane, Kentucky.',
    e: [
      ['Log Still Monk\'s Road Bourbon', 92, ''],
      ['Log Still Rattle & Snap', 100, 'bib'],
      ['Log Still Bloody Butcher Rye', 100, 'highrye'],
    ],
  },
  {
    d: 'Old Pogue', t: 'bourbon',
    base: [7, 5, 6, 6, 4, 4, 2, 1, 3, 2],
    c: 'Historic Maysville family brand.',
    e: [
      ['Old Pogue Master\'s Select', 91, ''],
      ['Old Pogue Limestone Landing Rye', 92, 'highrye'],
    ],
  },
  {
    d: 'Jeptha Creed', t: 'bourbon',
    base: [7, 5, 6, 6, 4, 4, 3, 1, 3, 3],
    c: 'Shelbyville estate distillery using Bloody Butcher corn.',
    e: [
      ['Jeptha Creed Straight Four-Grain Bourbon', 92, 'fourgrain'],
      ['Jeptha Creed Bottled in Bond', 100, 'bib'],
      ['Jeptha Creed Rye', 90, 'highrye'],
    ],
  },
  {
    d: 'Boone County', t: 'bourbon',
    base: [7, 5, 6, 6, 4, 4, 2, 1, 3, 2],
    c: 'Northern Kentucky small-batch revival.',
    e: [
      ['Boone County Small Batch Bourbon', 90, ''],
      ['Boone County Bottled in Bond', 100, 'bib'],
      ['Boone County Single Barrel', 118, 'sb bp'],
    ],
  },

  // ── Texas ───────────────────────────────────────────────────
  {
    d: 'Ironroot Republic', t: 'bourbon',
    base: [7, 6, 6, 6, 5, 5, 3, 1, 4, 3],
    c: 'Denison, Texas distillery using purple corn and French methods.',
    e: [
      ['Ironroot Harbinger', 115, 'bp'],
      ['Ironroot Hubris', 121, 'bp'],
      ['Ironroot Promentory', 116, 'bp rich'],
    ],
  },
  {
    d: 'Still Austin', t: 'bourbon',
    base: [7, 5, 6, 6, 5, 4, 3, 1, 3, 3],
    c: 'Grain-to-glass Austin distillery, slow-water reduction.',
    e: [
      ['Still Austin The Musician', 98, ''],
      ['Still Austin Cask Strength', 115, 'bp'],
      ['Still Austin Straight Rye', 100, 'highrye'],
    ],
  },
  {
    d: 'Andalusia', t: 'bourbon',
    base: [7, 6, 6, 6, 4, 4, 2, 2, 3, 3],
    c: 'Blanco, Texas distillery with a hot-climate profile.',
    e: [
      ['Andalusia Stryker', 100, 'peat1'],
      ['Andalusia Revenant Oak', 100, 'virgin'],
      ['Andalusia Triple Distilled Bourbon', 90, ''],
    ],
  },
  {
    d: 'Milam & Greene', t: 'bourbon',
    base: [7, 5, 6, 6, 5, 5, 3, 1, 3, 2],
    c: 'Blanco blender-distiller led by Heather Greene.',
    e: [
      ['Milam & Greene Triple Cask Bourbon', 94, ''],
      ['Milam & Greene Port Finished Bourbon', 107, 'port'],
      ['Milam & Greene Single Barrel Rye', 118, 'sb highrye bp'],
    ],
  },
  {
    d: 'TX Whiskey', t: 'bourbon',
    base: [7, 5, 6, 6, 4, 4, 2, 1, 4, 2],
    c: 'Fort Worth (Firestone & Robertson) blended and straight whiskeys.',
    e: [
      ['TX Blended Bourbon', 82, 'light'],
      ['TX Straight Bourbon', 90, ''],
      ['TX Bottled in Bond', 100, 'bib'],
    ],
  },
  {
    d: 'Yellow Rose', t: 'bourbon',
    base: [7, 5, 6, 6, 4, 4, 3, 1, 3, 2],
    c: 'Houston distillery, outlaw-style bourbons.',
    e: [
      ['Yellow Rose Outlaw Bourbon', 92, ''],
      ['Yellow Rose Double Barrel Bourbon', 104, 'rich'],
    ],
  },

  // ── Colorado / Mountain West ────────────────────────────────
  {
    d: 'Laws Whiskey House', t: 'bourbon',
    base: [7, 5, 6, 6, 5, 4, 3, 1, 3, 3],
    c: 'Denver four-grain, bottled-in-bond focus.',
    e: [
      ['Laws Four Grain Straight Bourbon', 95, 'fourgrain'],
      ['Laws Four Grain Bottled in Bond', 100, 'bib fourgrain'],
      ['Laws Secale Straight Rye', 95, 'highrye'],
      ['Laws Cognac Cask Bourbon', 110, 'cognac bp'],
    ],
  },
  {
    d: 'Breckenridge', t: 'bourbon',
    base: [7, 5, 6, 6, 4, 5, 3, 1, 3, 2],
    c: 'High-altitude Colorado blended bourbon.',
    e: [
      ['Breckenridge Bourbon', 86, ''],
      ['Breckenridge Port Cask Finish', 90, 'port'],
      ['Breckenridge Distiller\'s High Proof Blend', 105, 'rich'],
    ],
  },
  {
    d: 'Stranahan\'s', t: 'other',
    base: [6, 5, 6, 5, 3, 5, 4, 1, 4, 2],
    c: 'Colorado single malt, Rocky Mountain water.',
    e: [
      ['Stranahan\'s Original Single Malt', 94, ''],
      ['Stranahan\'s Blue Peak', 86, ''],
      ['Stranahan\'s Sherry Cask', 94, 'sherry'],
      ['Stranahan\'s Diamond Peak', 94, 'rich'],
    ],
  },
  {
    d: 'Leopold Bros', t: 'bourbon',
    base: [6, 5, 6, 5, 6, 4, 3, 1, 3, 3],
    c: 'Denver distillery famed for three-chamber rye.',
    e: [
      ['Leopold Bros Straight Bourbon', 100, 'bib'],
      ['Leopold Bros Three Chamber Rye', 100, 'highrye'],
      ['Leopold Bros Maryland-Style Rye', 86, 'highrye'],
    ],
  },

  // ── Pacific Northwest single malts ──────────────────────────
  {
    d: 'Westward', t: 'other',
    base: [6, 5, 6, 5, 3, 6, 4, 2, 4, 2],
    c: 'Portland American single malt, ale-yeast fermented.',
    e: [
      ['Westward American Single Malt', 90, ''],
      ['Westward Stout Cask', 90, 'stout'],
      ['Westward Pinot Noir Cask', 90, 'wine'],
      ['Westward Cask Strength', 125, 'bp'],
    ],
  },
  {
    d: 'Westland', t: 'other',
    base: [6, 5, 6, 5, 3, 5, 4, 3, 4, 3],
    c: 'Seattle single malt with peated and Garryana oak releases.',
    e: [
      ['Westland American Oak', 92, ''],
      ['Westland Peated', 92, 'peat2'],
      ['Westland Sherry Wood', 92, 'sherry'],
      ['Westland Garryana', 100, 'virgin rich'],
    ],
  },
  {
    d: 'Copperworks', t: 'other',
    base: [6, 4, 6, 5, 3, 6, 5, 1, 4, 2],
    c: 'Seattle single malt from craft-brewing malts.',
    e: [
      ['Copperworks American Single Malt', 92, ''],
      ['Copperworks Peated Single Malt', 106, 'peat2'],
    ],
  },

  // ── Northeast / Mid-Atlantic ────────────────────────────────
  {
    d: 'Kings County', t: 'bourbon',
    base: [7, 5, 6, 6, 4, 5, 3, 2, 4, 2],
    c: 'Brooklyn pot-still bourbon and peated bourbon.',
    e: [
      ['Kings County Straight Bourbon', 90, ''],
      ['Kings County Bottled in Bond', 100, 'bib'],
      ['Kings County Peated Bourbon', 90, 'peat1'],
      ['Kings County Empire Rye', 102, 'highrye'],
    ],
  },
  {
    d: 'Widow Jane', t: 'bourbon',
    base: [7, 5, 6, 6, 4, 5, 3, 1, 4, 2],
    c: 'Red Hook, Brooklyn blender using limestone water.',
    e: [
      ['Widow Jane 10 Year', 91, 'age10'],
      ['Widow Jane The Vaults', 99, 'rich'],
      ['Widow Jane Paradigm', 98, ''],
    ],
  },
  {
    d: 'Hudson', t: 'bourbon',
    base: [7, 5, 6, 6, 4, 4, 3, 1, 3, 2],
    c: 'Tuthilltown, New York — the first NY bourbon since Prohibition.',
    e: [
      ['Hudson Baby Bourbon', 92, ''],
      ['Hudson Bright Lights Big Bourbon', 92, ''],
      ['Hudson Do The Rye Thing', 92, 'highrye'],
    ],
  },
  {
    d: 'Hillrock', t: 'bourbon',
    base: [7, 5, 6, 6, 4, 5, 3, 1, 4, 3],
    c: 'Hudson Valley solera-aged estate bourbon.',
    e: [
      ['Hillrock Solera Aged Bourbon', 92, 'rich'],
      ['Hillrock Double Cask Rye', 92, 'highrye'],
    ],
  },
  {
    d: 'Finger Lakes', t: 'bourbon',
    base: [7, 5, 6, 6, 4, 4, 3, 1, 3, 3],
    c: 'Upstate NY distillery, Maple Street mashbills.',
    e: [
      ['Finger Lakes McKenzie Bourbon', 91, ''],
      ['Finger Lakes McKenzie Bottled in Bond', 100, 'bib'],
      ['Finger Lakes McKenzie Rye', 91, 'highrye'],
    ],
  },
  {
    d: 'Sagamore Spirit', t: 'rye',
    base: [5, 5, 5, 5, 7, 4, 3, 1, 3, 3],
    c: 'Baltimore Maryland-style rye blender.',
    e: [
      ['Sagamore Spirit Signature Rye', 83, 'highrye'],
      ['Sagamore Spirit Cask Strength Rye', 112, 'highrye bp'],
      ['Sagamore Spirit Bottled in Bond', 100, 'bib highrye'],
      ['Sagamore Spirit Double Oak Rye', 96, 'highrye virgin'],
    ],
  },

  // ── Midwest ─────────────────────────────────────────────────
  {
    d: 'Cedar Ridge', t: 'bourbon',
    base: [7, 5, 6, 6, 4, 5, 3, 1, 3, 2],
    c: 'Iowa\'s oldest distillery, corn-belt bourbon.',
    e: [
      ['Cedar Ridge Bourbon', 80, ''],
      ['Cedar Ridge The QuintEssential', 92, 'rich'],
      ['Cedar Ridge Port Cask', 90, 'port'],
    ],
  },
  {
    d: 'FEW Spirits', t: 'bourbon',
    base: [7, 5, 6, 6, 5, 4, 4, 1, 3, 2],
    c: 'Evanston, Illinois grain-to-glass, botanical heritage.',
    e: [
      ['FEW Straight Bourbon', 93, ''],
      ['FEW Straight Rye', 93, 'highrye'],
      ['FEW Bottled in Bond Bourbon', 100, 'bib'],
    ],
  },
  {
    d: 'Journeyman', t: 'bourbon',
    base: [7, 5, 6, 6, 5, 4, 3, 1, 3, 2],
    c: 'Three Oaks, Michigan organic grain distillery.',
    e: [
      ['Journeyman Featherbone Bourbon', 90, ''],
      ['Journeyman Silver Cross', 90, 'fourgrain'],
      ['Journeyman Last Feather Rye', 90, 'highrye'],
    ],
  },
  {
    d: 'Middle West', t: 'bourbon',
    base: [7, 5, 6, 6, 5, 4, 3, 1, 3, 2],
    c: 'Columbus, Ohio spirits with soft-red-wheat character.',
    e: [
      ['Middle West Straight Bourbon', 95, ''],
      ['Middle West Michelone Reserve', 116, 'bp'],
      ['Middle West Straight Rye', 97, 'highrye'],
    ],
  },
  {
    d: 'Watershed', t: 'bourbon',
    base: [7, 5, 6, 6, 4, 5, 3, 1, 3, 2],
    c: 'Columbus, Ohio four-grain bourbon with apple-brandy barrels.',
    e: [
      ['Watershed Bourbon', 94, 'fourgrain'],
      ['Watershed Bourbon Barrel Strength', 116, 'bp fourgrain'],
    ],
  },
  {
    d: 'Templeton', t: 'rye',
    base: [5, 5, 5, 5, 7, 4, 3, 1, 3, 3],
    c: 'Iowa Prohibition-era rye recipe.',
    e: [
      ['Templeton 4 Year Rye', 80, 'highrye'],
      ['Templeton 6 Year Rye', 91, 'highrye'],
      ['Templeton Bottled in Bond Rye', 100, 'bib highrye'],
    ],
  },

  // ── Virginia / Southeast ────────────────────────────────────
  {
    d: 'Virginia Distillery', t: 'other',
    base: [6, 5, 6, 5, 3, 6, 4, 2, 4, 2],
    c: 'Virginia Highland American single malt with Scotch heritage.',
    e: [
      ['Courage & Conviction American Single Malt', 92, ''],
      ['Courage & Conviction Sherry Cask', 92, 'sherry'],
      ['Courage & Conviction Cuvee Cask', 92, 'wine'],
    ],
  },
  {
    d: 'Catoctin Creek', t: 'rye',
    base: [5, 5, 5, 5, 7, 5, 4, 1, 3, 3],
    c: 'Purcellville, Virginia organic rye.',
    e: [
      ['Catoctin Creek Roundstone Rye', 80, 'highrye'],
      ['Catoctin Creek Roundstone Rye Cask Proof', 116, 'highrye bp'],
    ],
  },
  {
    d: 'Ragged Branch', t: 'bourbon',
    base: [7, 5, 6, 6, 4, 4, 2, 1, 3, 3],
    c: 'Charlottesville estate-grown bourbon.',
    e: [
      ['Ragged Branch Bottled in Bond Bourbon', 100, 'bib'],
      ['Ragged Branch Wheated Bourbon', 90, 'wheat'],
      ['Ragged Branch Signature Rye', 90, 'highrye'],
    ],
  },
  {
    d: 'Reservoir', t: 'bourbon',
    base: [7, 6, 6, 6, 5, 4, 2, 1, 4, 2],
    c: 'Richmond, Virginia 100% single-grain distiller.',
    e: [
      ['Reservoir Bourbon', 100, 'rich'],
      ['Reservoir Wheat Whiskey', 100, 'wheat'],
      ['Reservoir Rye', 100, 'highrye'],
    ],
  },

  // ── West / Southwest ────────────────────────────────────────
  {
    d: 'Frey Ranch', t: 'bourbon',
    base: [7, 5, 6, 6, 5, 4, 2, 1, 3, 4],
    c: 'Nevada estate farm-distillery, four-grain bourbon.',
    e: [
      ['Frey Ranch Straight Bourbon', 90, 'fourgrain'],
      ['Frey Ranch Bottled in Bond', 100, 'bib fourgrain'],
      ['Frey Ranch Straight Rye', 100, 'highrye'],
    ],
  },
  {
    d: 'Whiskey Del Bac', t: 'other',
    base: [5, 5, 6, 5, 3, 5, 4, 4, 4, 3],
    c: 'Tucson mesquite-smoked American single malt.',
    e: [
      ['Del Bac Dorado Mesquite Smoked', 90, 'peat1'],
      ['Del Bac Classic Single Malt', 92, ''],
      ['Del Bac Distiller\'s Cut', 111, 'peat1 bp'],
    ],
  },
  {
    d: 'Balcones', t: 'other',
    base: [6, 5, 6, 6, 3, 6, 3, 3, 5, 3],
    c: 'Waco, Texas — blue corn and Texas single malt.',
    e: [
      ['Balcones Baby Blue', 92, ''],
      ['Balcones Texas Single Malt', 106, 'rich'],
      ['Balcones Brimstone', 106, 'peat2'],
      ['Balcones Pot Still Bourbon', 92, ''],
      ['Balcones True Blue Cask Strength', 128, 'bp'],
    ],
  },
  {
    d: 'Garrison Brothers', t: 'bourbon',
    base: [8, 6, 7, 7, 4, 5, 2, 1, 3, 2],
    c: 'Hye, Texas — hot-climate sweet wheated-corn bourbon.',
    e: [
      ['Garrison Brothers Small Batch', 94, 'rich'],
      ['Garrison Brothers Single Barrel', 94, 'sb rich'],
      ['Garrison Brothers Balmorhea', 115, 'bp rich'],
      ['Garrison Brothers Cowboy Bourbon', 134, 'bp rich'],
    ],
  },

  // ── Additional national craft ───────────────────────────────
  {
    d: 'New Riff', t: 'bourbon',
    base: [7, 5, 6, 5, 6, 4, 3, 1, 3, 4],
    c: 'Newport, Kentucky bottled-in-bond high-rye producer.',
    e: [
      ['New Riff Bottled in Bond Bourbon', 100, 'bib highrye'],
      ['New Riff Kentucky Straight Rye Bottled in Bond', 100, 'bib highrye'],
      ['New Riff Balboa Rye', 100, 'highrye'],
      ['New Riff Winter Whiskey', 100, ''],
    ],
  },
  {
    d: 'Wilderness Trail', t: 'bourbon',
    base: [7, 5, 6, 6, 5, 4, 3, 1, 3, 3],
    c: 'Danville, Kentucky sweet-mash bottled-in-bond.',
    e: [
      ['Wilderness Trail Bottled in Bond Bourbon', 100, 'bib'],
      ['Wilderness Trail Small Batch Bourbon', 100, ''],
      ['Wilderness Trail Wheated Bourbon', 100, 'wheat'],
      ['Wilderness Trail Rye', 100, 'highrye'],
    ],
  },
  {
    d: 'Bardstown Bourbon Company', t: 'bourbon',
    base: [7, 5, 6, 6, 5, 5, 3, 1, 3, 2],
    c: 'Bardstown blends and collaborative finishes.',
    e: [
      ['Bardstown Origin Series Bourbon', 96, ''],
      ['Bardstown Origin Bottled in Bond', 100, 'bib'],
      ['Bardstown Fusion Series', 98, ''],
      ['Bardstown Château de Laubade Finish', 107, 'cognac'],
    ],
  },
  {
    d: 'Penelope', t: 'bourbon',
    base: [7, 5, 6, 6, 5, 5, 3, 1, 3, 2],
    c: 'Four-grain MGP-sourced blender.',
    e: [
      ['Penelope Four Grain Bourbon', 80, 'fourgrain'],
      ['Penelope Barrel Strength', 118, 'bp fourgrain'],
      ['Penelope Toasted', 100, 'toast'],
      ['Penelope Rio Rye', 95, 'highrye'],
    ],
  },
  {
    d: 'Barrell Craft Spirits', t: 'bourbon',
    base: [7, 6, 6, 6, 5, 6, 3, 2, 4, 3],
    c: 'Louisville independent blender of sourced cask-strength whiskeys.',
    e: [
      ['Barrell Bourbon Batch', 110, 'bp'],
      ['Barrell Seagrass', 118, 'bp highrye'],
      ['Barrell Dovetail', 122, 'bp rum'],
      ['Barrell Armida', 115, 'bp'],
      ['Barrell Vantage', 115, 'bp virgin'],
    ],
  },
  {
    d: 'Old Elk', t: 'bourbon',
    base: [7, 5, 6, 6, 4, 4, 3, 1, 4, 2],
    c: 'Fort Collins high-malt slow-cut blends.',
    e: [
      ['Old Elk Blended Straight Bourbon', 88, ''],
      ['Old Elk Wheated Bourbon', 92, 'wheat'],
      ['Old Elk Straight Rye', 95, 'highrye'],
      ['Old Elk Cigar Cut', 115, 'bp rich'],
    ],
  },
];
