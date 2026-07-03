import { HouseDef } from '../generator';

// Axis order: sweet, oak, vanilla, caramel, spice, fruit, floral, smoke, nutty, earthy

export const SCOTCH_ISLAY_ISLANDS: HouseDef[] = [
  {
    d: 'Laphroaig', t: 'scotch',
    base: [3, 4, 3, 2, 3, 3, 1, 10, 2, 6],
    c: 'Laphroaig\'s medicinal iodine-and-seaweed Islay peat.',
    e: [
      ['Laphroaig 10 Cask Strength', 116.8, 'bp'],
      ['Laphroaig Quarter Cask', 96, 'virgin'],
      ['Laphroaig Lore', 96, 'sherry rich'],
      ['Laphroaig Triple Wood', 96, 'sherry virgin'],
      ['Laphroaig PX Cask', 96, 'px'],
      ['Laphroaig 16', 96, 'age16'],
      ['Laphroaig 25', 96, 'age25 sherry'],
      ['Laphroaig Càirdeas', 104, 'fruity2'],
    ],
  },
  {
    d: 'Ardbeg', t: 'scotch',
    base: [4, 3, 4, 2, 3, 4, 2, 9, 2, 5],
    c: 'Ardbeg\'s intense citrus-laced peat-smoke engine.',
    e: [
      ['Ardbeg Uigeadail', 108.4, 'sherry bp'],
      ['Ardbeg Corryvreckan', 114.2, 'wine bp'],
      ['Ardbeg An Oa', 93.2, 'px honeyed'],
      ['Ardbeg Wee Beastie 5', 95.2, 'light'],
      ['Ardbeg Traigh Bhan 19', 92.2, 'age19'],
      ['Ardbeg 25', 92, 'age25'],
      ['Ardbeg Heavy Vapours', 92, 'dry'],
      ['Ardbeg Hypernova', 102, 'peat1 bp'],
    ],
  },
  {
    d: 'Lagavulin', t: 'scotch',
    base: [5, 5, 4, 4, 3, 5, 1, 9, 3, 6],
    c: 'Lagavulin\'s slow-distilled rich maritime smoke.',
    e: [
      ['Lagavulin 8', 96, 'light'],
      ['Lagavulin 11 Offerman Edition', 92, 'char'],
      ['Lagavulin Distillers Edition', 86, 'px'],
      ['Lagavulin 12 Cask Strength', 114.8, 'bp'],
      ['Lagavulin 16 The Distillers Edition', 86, 'px age16'],
    ],
  },
  {
    d: 'Bowmore', t: 'scotch',
    base: [5, 4, 4, 4, 3, 6, 3, 6, 3, 4],
    c: 'Bowmore\'s balanced tropical-fruit-and-smoke Islay middle path.',
    e: [
      ['Bowmore 12', 80, ''],
      ['Bowmore 15', 86, 'sherry age15'],
      ['Bowmore 18', 86, 'sherry age18'],
      ['Bowmore 25', 86, 'sherry age25'],
      ['Bowmore Darkest 15', 86, 'oloroso age15'],
    ],
  },
  {
    d: 'Bunnahabhain', t: 'scotch',
    base: [6, 4, 4, 4, 3, 7, 2, 2, 5, 4],
    c: 'Bunnahabhain\'s mostly-unpeated sherried Islay outlier.',
    e: [
      ['Bunnahabhain 12', 92.6, 'sherry coastal'],
      ['Bunnahabhain 18', 92.6, 'oloroso age18'],
      ['Bunnahabhain 25', 92.6, 'oloroso age25'],
      ['Bunnahabhain Stiùireadair', 92.6, 'sherry'],
      ['Bunnahabhain Toiteach A Dhà', 92.6, 'peat2 sherry'],
    ],
  },
  {
    d: 'Bruichladdich', t: 'scotch',
    base: [6, 3, 4, 4, 3, 6, 4, 0, 3, 4],
    c: 'Bruichladdich\'s terroir-obsessed unpeated Laddie spirit.',
    e: [
      ['Bruichladdich The Classic Laddie', 100, ''],
      ['Bruichladdich Islay Barley', 100, 'dry'],
      ['Port Charlotte 10', 100, 'peat3'],
      ['Port Charlotte Islay Barley', 100, 'peat3 dry'],
      ['Octomore 14.1', 118.8, 'peat3 bp'],
      ['Octomore 14.2', 114.8, 'peat3 sherry bp'],
      ['Octomore 14.3', 122.4, 'peat3 dry bp'],
    ],
  },
  {
    d: 'Caol Ila', t: 'scotch',
    base: [5, 3, 4, 3, 3, 5, 3, 7, 2, 4],
    c: 'Caol Ila\'s grilled-lemon oily Islay smoke.',
    e: [
      ['Caol Ila 12', 86, ''],
      ['Caol Ila Moch', 86, 'light'],
      ['Caol Ila 18', 86, 'age18'],
      ['Caol Ila Distillers Edition', 86, 'wine'],
    ],
  },
  {
    d: 'Kilchoman', t: 'scotch',
    base: [5, 3, 4, 3, 3, 5, 3, 7, 2, 5],
    c: 'Kilchoman\'s farm-distillery citrus-peat freshness.',
    e: [
      ['Kilchoman Machir Bay', 92, ''],
      ['Kilchoman Sanaig', 92, 'sherry'],
      ['Kilchoman Loch Gorm', 92, 'oloroso'],
      ['Kilchoman 100% Islay', 100, 'dry'],
    ],
  },
  {
    d: 'Ardnahoe', t: 'scotch',
    base: [5, 3, 4, 3, 3, 5, 3, 7, 2, 4],
    c: 'Ardnahoe\'s young worm-tub Islay newcomer.',
    e: [
      ['Ardnahoe Inaugural Release', 100, ''],
    ],
  },
  {
    d: 'Port Askaig', t: 'scotch',
    base: [5, 3, 4, 3, 3, 5, 3, 7, 2, 4],
    c: 'Port Askaig\'s independent-bottled Islay purity.',
    e: [
      ['Port Askaig 8', 91.6, ''],
      ['Port Askaig 100 Proof', 100, 'bp'],
    ],
  },
  {
    d: 'Talisker', t: 'scotch',
    base: [5, 4, 3, 3, 5, 5, 2, 7, 2, 5],
    c: 'Talisker\'s peppery Skye sea-spray power.',
    e: [
      ['Talisker 10', 91.6, ''],
      ['Talisker Storm', 91.6, 'char'],
      ['Talisker Distillers Edition', 91.6, 'sherry'],
      ['Talisker 18', 91.6, 'age18'],
      ['Talisker 57° North', 114, 'bp'],
    ],
  },
  {
    d: 'Highland Park', t: 'scotch',
    base: [6, 4, 4, 4, 3, 6, 4, 4, 3, 4],
    c: 'Highland Park\'s heather-honey Orkney smoke.',
    e: [
      ['Highland Park 15 Viking Heart', 88, 'age15'],
      ['Highland Park 18 Viking Pride', 86, 'sherry age18'],
      ['Highland Park 21', 92, 'sherry age21'],
      ['Highland Park Cask Strength', 118.4, 'bp'],
      ['Highland Park Dragon Legend', 86.8, 'char'],
    ],
  },
  {
    d: 'Scapa', t: 'scotch',
    base: [6, 3, 4, 4, 2, 6, 4, 1, 3, 3],
    c: 'Scapa\'s honeyed Lomond-still Orkney softness.',
    e: [
      ['Scapa Skiren', 80, 'honeyed'],
      ['Scapa Glansa', 80, 'peat1 honeyed'],
    ],
  },
  {
    d: 'Isle of Jura', t: 'scotch',
    base: [6, 3, 4, 4, 3, 6, 3, 2, 3, 3],
    c: 'Jura\'s soft island malt with a whisper of smoke.',
    e: [
      ['Jura 10', 80, ''],
      ['Jura 12', 80, 'sherry'],
      ['Jura Seven Wood', 84, 'virgin wine'],
      ['Jura 18', 88, 'wine age18'],
    ],
  },
  {
    d: 'Arran', t: 'scotch',
    base: [6, 3, 4, 4, 3, 7, 4, 0, 3, 2],
    c: 'Arran\'s bright citrus island vitality.',
    e: [
      ['Arran 10', 92, ''],
      ['Arran 14', 92, 'age14'],
      ['Arran Barrel Reserve', 86, 'light'],
      ['Arran Sherry Cask The Bodega', 111.8, 'sherry bp'],
      ['Arran Quarter Cask The Bothy', 112.2, 'virgin bp'],
      ['Arran Machrie Moor Peated', 92, 'peat2'],
    ],
  },
  {
    d: 'Tobermory', t: 'scotch',
    base: [6, 3, 4, 4, 3, 6, 4, 0, 3, 3],
    c: 'Tobermory\'s fruity unpeated Mull character.',
    e: [
      ['Tobermory 12', 92.6, ''],
      ['Ledaig 10', 92.6, 'peat3'],
      ['Ledaig 18', 92.6, 'peat3 sherry age18'],
      ['Ledaig Sinclair Rioja Finish', 92.6, 'peat2 wine'],
    ],
  },
  {
    d: 'Isle of Raasay', t: 'scotch',
    base: [5, 3, 4, 4, 3, 6, 3, 3, 3, 4],
    c: 'Raasay\'s young Hebridean lightly-peated newcomer.',
    e: [
      ['Isle of Raasay Signature', 92.4, 'peat1 wine'],
    ],
  },
  {
    d: 'Torabhaig', t: 'scotch',
    base: [5, 3, 4, 3, 3, 5, 3, 6, 2, 4],
    c: 'Torabhaig\'s new-wave Skye peat precision.',
    e: [
      ['Torabhaig Allt Gleann', 92, ''],
      ['Torabhaig The Legacy Series', 92, 'light'],
    ],
  },
  {
    d: 'Springbank', t: 'scotch',
    base: [5, 4, 4, 4, 4, 6, 3, 4, 3, 5],
    c: 'Springbank\'s funky oily Campbeltown legend.',
    e: [
      ['Springbank 10', 92, ''],
      ['Springbank 12 Cask Strength', 109.2, 'bp'],
      ['Springbank 15', 92, 'sherry age15'],
      ['Springbank 18', 92, 'sherry age18'],
      ['Springbank 21', 92, 'age21 rich'],
      ['Hazelburn 10', 92, 'light floral2'],
      ['Longrow Peated', 92, 'peat3'],
      ['Longrow Red', 103.4, 'peat3 wine'],
    ],
  },
  {
    d: 'Glengyle', t: 'scotch',
    base: [5, 4, 4, 4, 4, 6, 3, 3, 3, 4],
    c: 'Kilkerran\'s modern Campbeltown revival balance.',
    e: [
      ['Kilkerran 12', 92, ''],
      ['Kilkerran 8 Cask Strength', 112.8, 'bp'],
      ['Kilkerran 16', 92, 'age16'],
      ['Kilkerran Heavily Peated', 118.2, 'peat3 bp'],
    ],
  },
  {
    d: 'Glen Scotia', t: 'scotch',
    base: [5, 4, 4, 4, 3, 6, 3, 3, 3, 4],
    c: 'Glen Scotia\'s salty old-Campbeltown survivor.',
    e: [
      ['Glen Scotia Double Cask', 92, 'sherry'],
      ['Glen Scotia 15', 92, 'age15'],
      ['Glen Scotia Victoriana', 108.2, 'char bp'],
      ['Glen Scotia 18', 92, 'sherry age18'],
    ],
  },
  {
    d: 'Auchentoshan', t: 'scotch',
    base: [6, 3, 4, 4, 2, 6, 5, 0, 3, 1],
    c: 'Auchentoshan\'s triple-distilled Lowland lightness.',
    e: [
      ['Auchentoshan American Oak', 80, 'light'],
      ['Auchentoshan 12', 80, ''],
      ['Auchentoshan Three Wood', 86, 'oloroso px'],
      ['Auchentoshan 18', 86, 'age18'],
    ],
  },
  {
    d: 'Glenkinchie', t: 'scotch',
    base: [6, 3, 4, 3, 2, 6, 5, 0, 3, 2],
    c: 'Glenkinchie\'s grassy Edinburgh-garden Lowland.',
    e: [
      ['Glenkinchie 12', 86, ''],
      ['Glenkinchie Distillers Edition', 86, 'sherry'],
    ],
  },
  {
    d: 'Bladnoch', t: 'scotch',
    base: [6, 3, 4, 4, 2, 6, 5, 0, 3, 2],
    c: 'Bladnoch\'s revived Galloway Lowland grace.',
    e: [
      ['Bladnoch Vinaya', 93.2, ''],
      ['Bladnoch 11', 93.2, 'age11'],
      ['Bladnoch 14', 93.2, 'oloroso age14'],
    ],
  },
  {
    d: 'Kingsbarns', t: 'scotch',
    base: [6, 3, 4, 4, 2, 7, 4, 0, 3, 1],
    c: 'Kingsbarns\' fruity young Fife farm distillery.',
    e: [
      ['Kingsbarns Dream to Dram', 92, ''],
      ['Kingsbarns Doocot', 92, 'wine'],
    ],
  },
  {
    d: 'Lindores Abbey', t: 'scotch',
    base: [6, 3, 4, 4, 3, 6, 4, 0, 3, 2],
    c: 'Lindores Abbey\'s spiritual-home-of-scotch newcomer.',
    e: [
      ['Lindores Abbey MCDXCIV', 92, ''],
    ],
  },
  {
    d: 'Annandale', t: 'scotch',
    base: [6, 3, 4, 4, 3, 6, 3, 2, 3, 3],
    c: 'Annandale\'s born-again Borders distillery.',
    e: [
      ['Annandale Man O\'Words', 92, ''],
      ['Annandale Man O\'Sword', 92, 'peat2'],
    ],
  },
];
