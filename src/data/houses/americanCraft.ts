import { HouseDef } from '../generator';

// Axis order: sweet, oak, vanilla, caramel, spice, fruit, floral, smoke, nutty, earthy

export const AMERICAN_CRAFT: HouseDef[] = [
  {
    d: 'MGP / Ross & Squibb', t: 'rye',
    base: [5, 5, 5, 5, 8, 4, 3, 0, 3, 3],
    c: 'The dill-and-mint 95/5 Indiana rye signature.',
    e: [
      ['Rossville Union Master Crafted Rye', 94, 'rye95'],
      ['Rossville Union Barrel Proof Rye', 112.6, 'rye95 bp'],
      ['George Remus Straight Bourbon', 94, 'highrye'],
      ['George Remus Repeal Reserve', 100, 'highrye rich'],
      ['George Remus Single Barrel', 104, 'highrye sb'],
    ],
  },
  {
    d: 'Bulleit', t: 'bourbon',
    base: [6, 5, 6, 6, 6, 4, 2, 0, 3, 2],
    c: 'Bulleit\'s high-rye frontier style.',
    e: [
      ['Bulleit Bourbon', 90, ''],
      ['Bulleit 10 Year', 91.2, 'age10'],
      ['Bulleit Barrel Strength', 119, 'bp'],
      ['Bulleit Rye', 90, 'rye95'],
      ['Bulleit 12 Year Rye', 92, 'rye95 age12'],
    ],
  },
  {
    d: 'Smoke Wagon', t: 'bourbon',
    base: [7, 5, 6, 7, 6, 5, 2, 0, 3, 2],
    c: 'Smoke Wagon\'s dessert-sweet Nevada-blended MGP bourbon.',
    e: [
      ['Smoke Wagon Small Batch', 100, ''],
      ['Smoke Wagon Uncut Unfiltered', 116, 'bp'],
      ['Smoke Wagon Straight Bourbon', 86, 'light'],
      ['Smoke Wagon Desert Jewel', 102, 'rich age10'],
    ],
  },
  {
    d: 'Barrell Craft Spirits', t: 'bourbon',
    base: [6, 6, 6, 6, 6, 6, 2, 1, 3, 2],
    c: 'Barrell\'s cask-strength blending house complexity.',
    e: [
      ['Barrell Bourbon Batch Series', 115, 'bp fruity2'],
      ['Barrell Seagrass', 118, 'rum madeira highrye bp'],
      ['Barrell Dovetail', 122, 'port rum wine bp'],
      ['Barrell Armida', 112, 'rum bp'],
      ['Barrell Vantage', 114, 'virgin toast miz bp'],
      ['Barrell Foundation', 100, 'fruity2'],
      ['Barrell Gray Label Seagrass 16 Year', 130, 'rum madeira highrye bp age16'],
    ],
  },
  {
    d: "Angel's Envy", t: 'bourbon',
    base: [7, 5, 6, 6, 4, 5, 2, 0, 3, 1],
    c: 'Angel\'s Envy\'s silky port-finished house style.',
    e: [
      ["Angel's Envy Port Finish", 86.6, 'port'],
      ["Angel's Envy Cask Strength Port Finish", 119.8, 'port bp'],
      ["Angel's Envy Rye Rum Finish", 100, 'rye95 rum'],
      ["Angel's Envy Cellar Collection Madeira", 105, 'madeira rich'],
    ],
  },
  {
    d: 'High West', t: 'rye',
    base: [5, 4, 4, 5, 8, 5, 3, 0, 2, 3],
    c: 'High West\'s Utah blending of rugged rye stocks.',
    e: [
      ['High West Rendezvous Rye', 92, 'rye95 rich'],
      ['High West Bourbon', 92, 'highrye'],
      ['High West Bourye', 92, 'highrye rich'],
      ['High West Campfire', 92, 'peat1 honeyed'],
      ['High West Midwinter Night\'s Dram', 98.6, 'port rye95 rich'],
      ['High West A Midwinter Night\'s Dram Act 11', 98.6, 'port rye95 rich'],
      ['High West Cask Collection Barbados Rum', 100, 'rum rye95'],
    ],
  },
  {
    d: 'Redemption', t: 'rye',
    base: [5, 4, 5, 5, 8, 4, 3, 0, 2, 2],
    c: 'Redemption\'s bright MGP-sourced rye focus.',
    e: [
      ['Redemption Rye', 92, 'rye95'],
      ['Redemption High Rye Bourbon', 92, 'highrye'],
      ['Redemption Wheated Bourbon', 96, 'wheat'],
      ['Redemption Barrel Proof Rye 9 Year', 109.2, 'rye95 bp age9'],
    ],
  },
  {
    d: 'New Riff', t: 'bourbon',
    base: [6, 5, 6, 6, 6, 4, 2, 0, 3, 3],
    c: 'New Riff\'s sour-mash Kentucky-regular, bonded-first philosophy.',
    e: [
      ['New Riff Bottled in Bond Bourbon', 100, 'bib highrye'],
      ['New Riff Single Barrel Bourbon', 110, 'sb highrye bp'],
      ['New Riff Bottled in Bond Rye', 100, 'rye95 bib'],
      ['New Riff Single Barrel Rye', 104, 'rye95 sb'],
      ['New Riff Maltster Bourbon', 100, 'bib rich'],
    ],
  },
  {
    d: 'Old Elk', t: 'bourbon',
    base: [7, 5, 6, 6, 5, 4, 2, 0, 4, 2],
    c: 'Old Elk\'s high-malt slow-cut Colorado smoothness.',
    e: [
      ['Old Elk Straight Bourbon', 88, ''],
      ['Old Elk Wheated Bourbon', 92, 'wheat'],
      ['Old Elk Straight Rye', 100, 'rye95'],
      ['Old Elk Cigar Cut', 111, 'rich bp'],
      ['Old Elk Double Wheat', 103.2, 'wheat grain'],
    ],
  },
  {
    d: 'Penelope', t: 'bourbon',
    base: [7, 5, 6, 6, 4, 5, 3, 0, 3, 1],
    c: 'Penelope\'s soft four-grain approachability.',
    e: [
      ['Penelope Four Grain', 80, 'fourgrain light'],
      ['Penelope Barrel Strength', 116, 'fourgrain bp'],
      ['Penelope Toasted Series', 100, 'fourgrain toast'],
      ['Penelope Architect', 104, 'fourgrain toast'],
      ['Penelope Havana Rum Cask', 92, 'fourgrain rum'],
      ['Penelope American Light Whiskey 15 Year', 111.8, 'grain age15 bp'],
    ],
  },
  {
    d: 'Sagamore Spirit', t: 'rye',
    base: [5, 5, 5, 5, 7, 5, 3, 0, 3, 2],
    c: 'Sagamore\'s Maryland-style fruit-and-spice rye balance.',
    e: [
      ['Sagamore Spirit Signature Rye', 83, 'light'],
      ['Sagamore Spirit Double Oak Rye', 96.6, 'virgin'],
      ['Sagamore Spirit Cask Strength Rye', 112.2, 'bp'],
      ['Sagamore Spirit Bottled in Bond Rye', 100, 'bib'],
      ['Sagamore Spirit 8 Year Rye', 101, 'age8'],
    ],
  },
  {
    d: 'Pinhook', t: 'bourbon',
    base: [6, 5, 6, 6, 5, 5, 3, 0, 3, 2],
    c: 'Pinhook\'s vintage-blended, vintage-dated freshness.',
    e: [
      ['Pinhook Bourbon Heist', 95, ''],
      ['Pinhook Bourbon War', 101, 'rich'],
      ['Pinhook Vertical Series Bourbon', 108, 'bp'],
      ['Pinhook Rye Humor', 97, 'rye95'],
    ],
  },
  {
    d: 'Widow Jane', t: 'bourbon',
    base: [7, 5, 6, 7, 4, 5, 2, 0, 4, 2],
    c: 'Widow Jane\'s Brooklyn-blended maple-cherry richness.',
    e: [
      ['Widow Jane 10 Year', 91, 'age10'],
      ['Widow Jane Decadence', 91, 'maple toast'],
      ['Widow Jane Lucky Thirteen', 93, 'age13 rich'],
    ],
  },
  {
    d: 'Joseph Magnus', t: 'bourbon',
    base: [6, 6, 6, 6, 5, 6, 3, 0, 4, 2],
    c: 'Magnus\'s triple-cask-finished pre-Prohibition revival style.',
    e: [
      ['Joseph Magnus Straight Bourbon', 100, 'sherry cognac'],
      ['Joseph Magnus Cigar Blend', 118, 'sherry cognac bp rich'],
      ['Murray Hill Club Blended Bourbon', 103, 'grain rich'],
    ],
  },
  {
    d: 'Belle Meade', t: 'bourbon',
    base: [6, 5, 6, 6, 6, 5, 2, 0, 3, 2],
    c: 'Belle Meade\'s Nashville high-rye sourced elegance.',
    e: [
      ['Belle Meade Classic', 90.4, 'highrye'],
      ['Belle Meade Reserve', 108.3, 'highrye bp'],
      ['Belle Meade Madeira Cask', 90.4, 'highrye madeira'],
    ],
  },
  {
    d: 'Bardstown Bourbon Company', t: 'bourbon',
    base: [6, 6, 6, 6, 5, 5, 2, 0, 3, 2],
    c: 'BBC\'s modern collaborative blending precision.',
    e: [
      ['Bardstown Bourbon Fusion Series', 98.9, ''],
      ['Bardstown Bourbon Discovery Series', 110, 'bp fruity2'],
      ['Bardstown Bourbon Origin Series Bottled in Bond', 100, 'bib'],
      ['Bardstown Origin Series High Wheat', 96, 'wheat'],
      ['Bardstown Collaborative Chateau de Laubade', 107, 'cognac bp'],
      ['Bardstown Collaborative Foursquare Rum', 107, 'rum bp'],
      ['Bardstown Collaborative West Virginia Great Barrel Co Rye', 105, 'highrye toast'],
    ],
  },
  {
    d: 'Jefferson\'s', t: 'bourbon',
    base: [6, 5, 6, 6, 4, 4, 2, 0, 3, 2],
    c: 'Jefferson\'s experimental blending house style.',
    e: [
      ["Jefferson's Very Small Batch", 82.3, 'light'],
      ["Jefferson's Reserve", 90.2, 'rich'],
      ["Jefferson's Ocean Aged at Sea", 90, 'coastal rich'],
      ["Jefferson's Ocean Cask Strength", 112, 'coastal bp'],
      ["Jefferson's Tropics Aged in Humidity", 104, 'rich'],
    ],
  },
  {
    d: 'Peerless', t: 'rye',
    base: [6, 5, 5, 6, 7, 5, 3, 0, 3, 2],
    c: 'Peerless\'s sweet-mash, non-chill-filtered Louisville craft.',
    e: [
      ['Peerless Straight Rye', 108.6, 'bp'],
      ['Peerless Small Batch Bourbon', 108.9, 'bp honeyed'],
      ['Peerless Double Oak Bourbon', 108, 'virgin bp'],
    ],
  },
  {
    d: 'Wilderness Trail', t: 'bourbon',
    base: [6, 5, 6, 6, 4, 4, 2, 0, 3, 3],
    c: 'Wilderness Trail\'s sweet-mash scientific precision.',
    e: [
      ['Wilderness Trail Bottled in Bond Wheated', 100, 'wheat bib'],
      ['Wilderness Trail Bottled in Bond High Rye', 100, 'highrye bib'],
      ['Wilderness Trail Single Barrel Rye', 100, 'rye95 sb'],
      ['Wilderness Trail 8 Year Barrel Proof', 114, 'bp age8'],
    ],
  },
  {
    d: 'Rabbit Hole', t: 'bourbon',
    base: [6, 5, 6, 6, 5, 5, 3, 0, 3, 2],
    c: 'Rabbit Hole\'s modern Louisville grain-bill experimentation.',
    e: [
      ['Rabbit Hole Cavehill', 95, 'fourgrain'],
      ['Rabbit Hole Heigold', 95, 'highrye'],
      ['Rabbit Hole Dareringer PX Finish', 93, 'px wheat'],
      ['Rabbit Hole Boxergrail Rye', 95, 'rye95'],
    ],
  },
  {
    d: 'Castle & Key', t: 'bourbon',
    base: [6, 4, 5, 5, 5, 5, 4, 0, 3, 3],
    c: 'Castle & Key\'s restored-Taylorton garden-fresh profile.',
    e: [
      ['Castle & Key Restoration Rye', 103, 'rye95'],
      ['Castle & Key Small Batch Bourbon', 98, 'wheat'],
    ],
  },
  {
    d: 'Green River', t: 'bourbon',
    base: [7, 5, 6, 6, 4, 4, 2, 0, 3, 2],
    c: 'Green River\'s revived Owensboro value wheated style.',
    e: [
      ['Green River Wheated Bourbon', 90, 'wheat'],
      ['Green River Full Proof', 117, 'wheat bp'],
      ['Green River Rye', 95, 'highrye'],
    ],
  },
  {
    d: 'Lux Row', t: 'bourbon',
    base: [6, 5, 6, 6, 5, 4, 2, 0, 3, 2],
    c: 'Lux Row\'s Bardstown value-to-premium range.',
    e: [
      ['Rebel 100', 100, 'wheat bib'],
      ['Rebel 10 Year Single Barrel', 100, 'wheat sb age10'],
      ['David Nicholson Reserve', 100, 'highrye'],
      ['Blood Oath Pact Series', 98.6, 'rich sherry'],
      ['Daviess County Cabernet Finish', 96, 'wine'],
      ['Yellowstone Select', 93, ''],
      ['Yellowstone Limited Edition', 101, 'rich toast'],
    ],
  },
  {
    d: 'Blue Run', t: 'bourbon',
    base: [7, 5, 6, 7, 5, 5, 3, 0, 3, 2],
    c: 'Blue Run\'s polished modern-luxury Kentucky profile.',
    e: [
      ['Blue Run High Rye Bourbon', 111, 'highrye bp'],
      ['Blue Run Trifecta', 115.1, 'bp rich'],
      ['Blue Run Golden Rye', 95, 'highrye honeyed'],
    ],
  },
  {
    d: 'Starlight', t: 'bourbon',
    base: [6, 5, 6, 6, 5, 6, 3, 0, 3, 2],
    c: 'Starlight\'s Indiana orchard-country cask creativity.',
    e: [
      ['Starlight Carl T. Huber\'s Bourbon', 92, ''],
      ['Starlight Double Oaked Bourbon', 105, 'virgin bp'],
      ['Starlight Honey Barrel Bourbon', 110, 'honeyed bp'],
      ['Starlight Cigar Batch', 111, 'rum port bp rich'],
      ['Starlight Old Rickhouse Rye', 106, 'rye95 bp'],
    ],
  },
  {
    d: 'Woodinville', t: 'bourbon',
    base: [7, 6, 7, 7, 4, 4, 2, 1, 3, 2],
    c: 'Woodinville\'s Washington-aged crème-brûlée richness.',
    e: [
      ['Woodinville Port Cask Finished', 90, 'port'],
      ['Woodinville Cask Strength', 118.6, 'bp'],
      ['Woodinville Straight Rye', 90, 'rye95'],
      ['Woodinville Moscatel Finished', 96, 'wine honeyed'],
    ],
  },
  {
    d: 'Westland', t: 'other',
    base: [6, 4, 4, 4, 3, 5, 4, 1, 5, 3],
    c: 'Westland\'s Pacific-Northwest American single malt.',
    e: [
      ['Westland American Oak', 92, ''],
      ['Westland Sherry Wood', 92, 'sherry'],
      ['Westland Peated', 92, 'peat2'],
      ['Westland Garryana', 100, 'virgin rich'],
      ['Westland Solum', 100, 'peat1'],
    ],
  },
  {
    d: 'Balcones', t: 'other',
    base: [7, 6, 5, 6, 4, 4, 1, 2, 4, 3],
    c: 'Balcones\' big, roasty Texas heat-aged intensity.',
    e: [
      ['Balcones Baby Blue Corn Whisky', 92, 'grain'],
      ['Balcones Texas Pot Still Bourbon', 92, ''],
      ['Balcones Lineage Single Malt', 94, 'fruity2'],
      ['Balcones Texas Single Malt Classic', 106, 'rich bp'],
      ['Balcones Brimstone', 106, 'peat2 char'],
      ['Balcones True Blue Cask Strength', 120, 'grain bp'],
    ],
  },
  {
    d: 'Garrison Brothers', t: 'bourbon',
    base: [8, 7, 7, 7, 4, 3, 1, 1, 4, 2],
    c: 'Garrison Brothers\' massive sun-baked Texas bourbon.',
    e: [
      ['Garrison Brothers Small Batch', 94, ''],
      ['Garrison Brothers Balmorhea', 115, 'virgin bp rich'],
      ['Garrison Brothers Cowboy Bourbon', 134, 'bp rich'],
      ['Garrison Brothers Guadalupe', 107, 'port bp'],
      ['Garrison Brothers HoneyDew', 80, 'honeyed light'],
    ],
  },
  {
    d: 'Ironroot Republic', t: 'bourbon',
    base: [7, 6, 6, 7, 4, 5, 1, 1, 3, 3],
    c: 'Ironroot\'s French-inspired Texas heirloom-corn depth.',
    e: [
      ['Ironroot Harbinger', 115, 'bp'],
      ['Ironroot Hubris Corn Whiskey', 122.4, 'grain bp'],
    ],
  },
  {
    d: 'Still Austin', t: 'bourbon',
    base: [6, 5, 6, 6, 5, 5, 3, 0, 3, 2],
    c: 'Still Austin\'s grain-to-glass Texas street-corn brightness.',
    e: [
      ['Still Austin The Musician', 98.4, ''],
      ['Still Austin Cask Strength', 118, 'bp'],
      ['Still Austin The Naturalist Rye', 98, 'rye95'],
      ['Still Austin Red Corn Bottled in Bond', 100, 'bib'],
    ],
  },
  {
    d: 'Frey Ranch', t: 'bourbon',
    base: [6, 5, 6, 6, 5, 4, 3, 0, 4, 3],
    c: 'Frey Ranch\'s estate-grown Nevada four-grain farm character.',
    e: [
      ['Frey Ranch Straight Bourbon', 90, 'fourgrain'],
      ['Frey Ranch Farm Strength Bourbon', 124, 'fourgrain bp'],
      ['Frey Ranch 100% Rye', 100, 'rye95'],
    ],
  },
  {
    d: 'FEW Spirits', t: 'bourbon',
    base: [6, 5, 5, 5, 6, 4, 2, 0, 3, 3],
    c: 'FEW\'s Evanston craft grain-forward spice.',
    e: [
      ['FEW Bourbon', 93, ''],
      ['FEW Rye', 93, 'rye95'],
      ['FEW Immortal Rye', 92.5, 'rye95 honeyed'],
    ],
  },
  {
    d: 'Koval', t: 'bourbon',
    base: [6, 4, 5, 5, 5, 5, 4, 0, 3, 3],
    c: 'Koval\'s organic Chicago millet-and-oat experimentation.',
    e: [
      ['Koval Single Barrel Bourbon', 94, 'sb'],
      ['Koval Four Grain', 94, 'fourgrain'],
      ['Koval Rye Single Barrel', 80, 'rye95 sb light'],
    ],
  },
  {
    d: 'Cedar Ridge', t: 'bourbon',
    base: [6, 5, 6, 6, 4, 4, 2, 0, 4, 2],
    c: 'Cedar Ridge\'s Iowa corn-country craft.',
    e: [
      ['Cedar Ridge Iowa Bourbon', 86, ''],
      ['Cedar Ridge The QuintEssential Single Malt', 92, 'sherry'],
      ['Cedar Ridge Slipknot No. 9 Iowa Whiskey', 96, 'rich'],
    ],
  },
  {
    d: 'Journeyman', t: 'bourbon',
    base: [6, 5, 5, 6, 5, 4, 2, 0, 3, 2],
    c: 'Journeyman\'s organic Michigan featherbone style.',
    e: [
      ['Journeyman Featherbone Bourbon', 90, ''],
      ['Journeyman Last Feather Rye', 90, 'highrye'],
    ],
  },
  {
    d: 'Smooth Ambler', t: 'bourbon',
    base: [6, 5, 6, 6, 5, 4, 2, 0, 3, 2],
    c: 'Smooth Ambler\'s West Virginia scout-and-blend craft.',
    e: [
      ['Smooth Ambler Old Scout Bourbon', 99, ''],
      ['Smooth Ambler Old Scout Single Barrel', 110, 'sb bp'],
      ['Smooth Ambler Contradiction', 100, 'wheat'],
      ['Smooth Ambler Big Level Wheated', 100, 'wheat honeyed'],
    ],
  },
  {
    d: 'Wyoming Whiskey', t: 'bourbon',
    base: [7, 5, 6, 6, 4, 4, 2, 0, 3, 2],
    c: 'Wyoming Whiskey\'s big-sky wheated softness.',
    e: [
      ['Wyoming Whiskey Small Batch', 88, 'wheat'],
      ['Wyoming Whiskey Outryder', 100, 'highrye bib'],
      ['Wyoming Whiskey Double Cask Sherry', 100, 'wheat sherry'],
    ],
  },
  {
    d: 'TX / Firestone & Robertson', t: 'bourbon',
    base: [7, 5, 6, 6, 4, 4, 2, 0, 4, 2],
    c: 'TX\'s Fort Worth brown-sugar hospitality.',
    e: [
      ['TX Blended Whiskey', 82, 'grain light'],
      ['TX Straight Bourbon', 90, ''],
      ['TX Bottled in Bond', 100, 'bib'],
    ],
  },
  {
    d: 'Whiskey Del Bac', t: 'other',
    base: [6, 5, 4, 5, 4, 3, 1, 5, 4, 4],
    c: 'Del Bac\'s mesquite-smoked Sonoran single malt.',
    e: [
      ['Whiskey Del Bac Dorado', 90, 'peat1 char'],
      ['Whiskey Del Bac Classic', 90, ''],
    ],
  },
  {
    d: 'Kings County', t: 'bourbon',
    base: [7, 6, 6, 7, 4, 4, 1, 1, 4, 3],
    c: 'Kings County\'s chocolatey Brooklyn pot-still bourbon.',
    e: [
      ['Kings County Straight Bourbon', 90, ''],
      ['Kings County Barrel Strength Bourbon', 118, 'bp'],
      ['Kings County Peated Bourbon', 90, 'peat2'],
      ['Kings County Bottled in Bond', 100, 'bib'],
    ],
  },
  {
    d: 'WhistlePig', t: 'rye',
    base: [5, 6, 5, 6, 9, 5, 3, 0, 3, 3],
    c: 'WhistlePig\'s Vermont temple of high-proof rye.',
    e: [
      ['WhistlePig PiggyBack 6 Year', 96.56, ''],
      ['WhistlePig 12 Year Old World', 86, 'madeira port sherry'],
      ['WhistlePig 15 Year Estate Oak', 92, 'age15 virgin'],
      ['WhistlePig 18 Year Double Malt', 92, 'age18 rich'],
      ['WhistlePig The Boss Hog', 124, 'bp rich age14'],
      ['WhistlePig FarmStock Beyond Bonded', 100, 'bib'],
    ],
  },
  {
    d: 'Lock Stock & Barrel', t: 'rye',
    base: [5, 6, 5, 5, 8, 5, 2, 0, 3, 3],
    c: 'Cooper Spirits\' well-aged Canadian-stock rye.',
    e: [
      ['Lock Stock & Barrel 13 Year Rye', 107, 'rye95 age13'],
      ['Lock Stock & Barrel 16 Year Rye', 107, 'rye95 age16'],
    ],
  },
  {
    d: 'Dad\'s Hat', t: 'rye',
    base: [5, 4, 5, 5, 8, 4, 3, 0, 3, 3],
    c: 'Dad\'s Hat\'s true Pennsylvania rye revival.',
    e: [
      ['Dad\'s Hat Pennsylvania Rye', 90, ''],
      ['Dad\'s Hat Bottled in Bond Rye', 100, 'bib'],
    ],
  },
  {
    d: 'Leopold Bros', t: 'rye',
    base: [5, 4, 5, 5, 7, 5, 5, 0, 3, 3],
    c: 'Leopold\'s revived Three Chamber floral antique rye.',
    e: [
      ['Leopold Bros Three Chamber Rye', 100, 'floral2 rich'],
      ['Leopold Bros Maryland-Style Rye', 86, 'fruity2'],
    ],
  },
  {
    d: 'Hochstadter\'s', t: 'rye',
    base: [5, 5, 5, 5, 8, 4, 2, 0, 3, 3],
    c: 'Hochstadter\'s slow-and-low vatted rye.',
    e: [
      ['Hochstadter\'s Vatted Straight Rye', 100, ''],
      ['Hochstadter\'s Family Reserve 16 Year Rye', 123.8, 'bp age16'],
    ],
  },
  {
    d: 'Old Potrero', t: 'rye',
    base: [5, 5, 5, 5, 8, 4, 2, 0, 4, 4],
    c: 'Anchor\'s San Francisco single-malt rye heritage.',
    e: [
      ['Old Potrero Single Malt Rye', 97, 'rye95 pot'],
    ],
  },
  {
    d: 'Stranahan\'s', t: 'other',
    base: [6, 5, 5, 5, 3, 5, 3, 0, 4, 3],
    c: 'Stranahan\'s Rocky Mountain single malt.',
    e: [
      ['Stranahan\'s Original Single Malt', 94, ''],
      ['Stranahan\'s Blue Peak', 86, 'honeyed'],
      ['Stranahan\'s Sherry Cask', 94, 'sherry'],
      ['Stranahan\'s Diamond Peak', 94, 'rich'],
    ],
  },
  {
    d: 'St. George', t: 'other',
    base: [6, 4, 4, 4, 3, 6, 5, 0, 4, 3],
    c: 'St. George\'s pioneering California malt artistry.',
    e: [
      ['St. George Single Malt Lot Series', 86, 'fruity2'],
      ['St. George Baller Single Malt', 94, 'light fruity2'],
      ['St. George Breaking & Entering Bourbon', 86, ''],
    ],
  },
  {
    d: 'Westward', t: 'other',
    base: [6, 5, 5, 5, 3, 5, 3, 0, 4, 2],
    c: 'Westward\'s ale-yeast Oregon single malt.',
    e: [
      ['Westward American Single Malt', 90, ''],
      ['Westward Pinot Noir Cask', 90, 'wine'],
      ['Westward Cask Strength', 125, 'bp'],
    ],
  },
  {
    d: 'Boulder Spirits', t: 'other',
    base: [6, 5, 5, 5, 3, 5, 3, 0, 4, 3],
    c: 'Boulder\'s Scottish-influenced Colorado malt.',
    e: [
      ['Boulder American Single Malt', 92, ''],
      ['Boulder Bottled in Bond Single Malt', 100, 'bib'],
      ['Boulder Peated Single Malt', 92, 'peat2'],
    ],
  },
  {
    d: 'Virginia Distillery Co.', t: 'other',
    base: [6, 4, 4, 5, 3, 6, 3, 1, 4, 2],
    c: 'Virginia Distillery\'s Courage & Conviction Highland-style malt.',
    e: [
      ['Courage & Conviction Signature', 92, ''],
      ['Courage & Conviction Sherry Cask', 92, 'sherry'],
      ['Courage & Conviction Cuvée Cask', 92, 'wine'],
    ],
  },
  {
    d: 'Jeptha Creed', t: 'bourbon',
    base: [7, 5, 6, 6, 4, 4, 2, 0, 3, 2],
    c: 'Jeptha Creed\'s ground-to-glass Bloody Butcher corn.',
    e: [
      ['Jeptha Creed Bottled in Bond', 100, 'bib'],
      ['Jeptha Creed Red, White & Blue', 98, 'fourgrain'],
    ],
  },
  {
    d: 'Old 55', t: 'bourbon',
    base: [7, 5, 6, 6, 3, 4, 2, 0, 4, 2],
    c: 'Old 55\'s Indiana sweet-corn farm distillery.',
    e: [
      ['Old 55 Sweet Corn Bourbon', 100, 'honeyed'],
    ],
  },
  {
    d: 'Spirits of French Lick', t: 'bourbon',
    base: [6, 5, 5, 6, 5, 4, 2, 0, 4, 3],
    c: 'French Lick\'s historic-mashbill Indiana revivalism.',
    e: [
      ['Spirits of French Lick Lee Sinclair Four Grain', 90, 'fourgrain'],
      ['Spirits of French Lick William Dalton Wheated', 92, 'wheat'],
    ],
  },
  {
    d: 'Old Dominick', t: 'tennessee',
    base: [6, 5, 6, 6, 4, 4, 2, 1, 3, 2],
    c: 'Old Dominick\'s Memphis wheated revival.',
    e: [
      ['Old Dominick Huling Station Wheated', 100, 'wheat bib'],
      ['Old Dominick Huling Station Very Small Batch', 114, 'bp'],
    ],
  },
  {
    d: 'New Holland', t: 'bourbon',
    base: [7, 5, 6, 6, 3, 4, 2, 1, 4, 2],
    c: 'New Holland\'s brewer-turned-distiller Michigan style.',
    e: [
      ['New Holland Beer Barrel Bourbon', 80, 'stout light'],
      ['New Holland Beer Barrel Rye', 80, 'stout highrye light'],
    ],
  },
  {
    d: 'Traverse City Whiskey Co.', t: 'bourbon',
    base: [6, 5, 6, 6, 5, 5, 2, 0, 3, 2],
    c: 'Traverse City\'s cherry-country Michigan blending.',
    e: [
      ['Traverse City XXX Straight Bourbon', 86, ''],
      ['Traverse City Barrel Proof Bourbon', 116, 'bp'],
      ['Traverse City Barrel Proof Rye', 111, 'rye95 bp'],
    ],
  },
  {
    d: 'Corsair', t: 'other',
    base: [5, 4, 4, 4, 4, 3, 2, 5, 4, 4],
    c: 'Corsair\'s experimental smoked-grain Nashville punk streak.',
    e: [
      ['Corsair Triple Smoke', 80, 'peat2 char light'],
    ],
  },
  {
    d: 'Clyde May\'s', t: 'bourbon',
    base: [7, 5, 6, 6, 4, 5, 2, 0, 3, 2],
    c: 'Clyde May\'s Alabama-style orchard sweetness.',
    e: [
      ['Clyde May\'s Alabama Style Whiskey', 85, 'fruity2 light'],
      ['Clyde May\'s Straight Bourbon', 92, ''],
    ],
  },
  {
    d: 'Duke', t: 'bourbon',
    base: [6, 5, 6, 6, 4, 4, 2, 0, 3, 2],
    c: 'Duke\'s John Wayne tribute Kentucky style.',
    e: [
      ['Duke Grand Cru Founder\'s Reserve', 110, 'wine bp'],
    ],
  },
  {
    d: 'Horse Soldier', t: 'bourbon',
    base: [7, 5, 6, 7, 4, 4, 2, 0, 3, 2],
    c: 'Horse Soldier\'s veteran-founded wheated smoothness.',
    e: [
      ['Horse Soldier Straight Bourbon', 87, 'wheat'],
      ['Horse Soldier Barrel Strength', 118, 'wheat bp'],
    ],
  },
  {
    d: 'Frank August', t: 'bourbon',
    base: [6, 5, 6, 6, 5, 4, 2, 0, 3, 2],
    c: 'Frank August\'s polished modern Kentucky sourcing.',
    e: [
      ['Frank August Small Batch', 100.5, ''],
      ['Frank August Case Study Mizunara', 100.5, 'miz'],
    ],
  },
  {
    d: 'Buzzard\'s Roost', t: 'rye',
    base: [5, 5, 5, 5, 7, 4, 2, 0, 3, 2],
    c: 'Buzzard\'s Roost\'s char-#1-barrel finishing science.',
    e: [
      ['Buzzard\'s Roost Char #1 Rye', 105, 'char toast'],
      ['Buzzard\'s Roost Toasted Barrel Bourbon', 105, 'toast'],
    ],
  },
  {
    d: 'Remus (Ross & Squibb)', t: 'bourbon',
    base: [6, 5, 6, 6, 6, 4, 2, 0, 3, 2],
    c: 'Ross & Squibb\'s flagship high-rye Indiana bourbon.',
    e: [
      ['Remus Gatsby Reserve', 97.9, 'age15 rich'],
      ['Remus Highest Rye', 109, 'highrye bp'],
    ],
  },
  {
    d: 'Backbone', t: 'bourbon',
    base: [6, 5, 6, 6, 6, 4, 2, 0, 3, 2],
    c: 'Backbone\'s uncut Indiana-sourced bravado.',
    e: [
      ['Backbone Uncut Bourbon', 116, 'bp'],
      ['Backbone Prime Blended Bourbon', 96, ''],
    ],
  },
  {
    d: 'Boone County', t: 'bourbon',
    base: [6, 5, 6, 7, 5, 4, 2, 0, 3, 2],
    c: 'Boone County\'s pot-still finished Kentucky sourcing.',
    e: [
      ['Boone County 10 Year Single Barrel', 112, 'sb bp age10'],
      ['Boone County Small Batch', 90.4, ''],
    ],
  },
  {
    d: 'Old Carter', t: 'bourbon',
    base: [7, 6, 6, 7, 5, 4, 2, 0, 4, 2],
    c: 'Old Carter\'s barrel-strength small-batch luxury blending.',
    e: [
      ['Old Carter Straight American Whiskey', 118, 'grain bp rich'],
      ['Old Carter Straight Bourbon Batch', 116, 'bp rich'],
      ['Old Carter Straight Rye Batch', 114, 'rye95 bp rich'],
    ],
  },
  {
    d: 'Kentucky Owl', t: 'bourbon',
    base: [7, 5, 6, 7, 5, 5, 2, 0, 3, 2],
    c: 'Kentucky Owl\'s "wise man\'s bourbon" blending flourish.',
    e: [
      ['Kentucky Owl Confiscated', 96.4, ''],
      ['Kentucky Owl Batch Series Bourbon', 116, 'bp rich'],
      ['Kentucky Owl Takumi Edition', 100, 'miz'],
    ],
  },
  {
    d: 'Calumet Farm', t: 'bourbon',
    base: [6, 5, 6, 6, 5, 4, 2, 0, 3, 2],
    c: 'Calumet\'s thoroughbred-country single-rack sourcing.',
    e: [
      ['Calumet Farm Small Batch', 86, 'light'],
      ['Calumet Farm 15 Year Single Rack', 105, 'age15'],
    ],
  },
  {
    d: 'Weller-alike / Wheated craft', t: 'bourbon',
    base: [7, 5, 6, 7, 3, 4, 3, 0, 3, 1],
    c: 'Soft wheated-bourbon comfort.',
    e: [
      ['Maker\'s-style Wheated Small Batch (store pick)', 90, 'wheat sb'],
    ],
  },
];
