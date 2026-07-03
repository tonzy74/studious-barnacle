import { HouseDef } from '../generator';

// Axis order: sweet, oak, vanilla, caramel, spice, fruit, floral, smoke, nutty, earthy

export const SCOTCH_BLENDS: HouseDef[] = [
  {
    d: 'Johnnie Walker', t: 'scotch',
    base: [6, 4, 4, 4, 3, 5, 2, 4, 3, 3],
    c: 'Johnnie Walker\'s smooth smoke-threaded blending.',
    e: [
      ['Johnnie Walker Red Label', 80, 'light'],
      ['Johnnie Walker Double Black', 80, 'char'],
      ['Johnnie Walker Green Label 15', 86, 'age15 fruity2'],
      ['Johnnie Walker Gold Label Reserve', 80, 'honeyed light'],
      ['Johnnie Walker Aged 18', 80, 'age18'],
      ['Johnnie Walker Blue Label', 80, 'rich light'],
    ],
  },
  {
    d: 'Chivas Regal', t: 'scotch',
    base: [7, 3, 4, 4, 2, 6, 4, 1, 3, 1],
    c: 'Chivas\' honeyed apple-and-cream blending.',
    e: [
      ['Chivas Regal 12', 80, 'light'],
      ['Chivas Regal 15 XV', 80, 'cognac age15'],
      ['Chivas Regal 18', 80, 'age18'],
      ['Chivas Regal Mizunara', 80, 'miz light'],
    ],
  },
  {
    d: "Dewar's", t: 'scotch',
    base: [7, 3, 4, 4, 2, 5, 4, 1, 3, 1],
    c: 'Dewar\'s double-aged heather-honey smoothness.',
    e: [
      ["Dewar's White Label", 80, 'light'],
      ["Dewar's 12 The Ancestor", 80, ''],
      ["Dewar's 15", 80, 'age15'],
      ["Dewar's 18", 80, 'age18'],
      ["Dewar's Portuguese Smooth", 80, 'port light'],
    ],
  },
  {
    d: 'Compass Box', t: 'scotch',
    base: [6, 4, 5, 4, 3, 6, 4, 1, 3, 2],
    c: 'Compass Box\'s art-of-blending transparency.',
    e: [
      ['Compass Box The Spice Tree', 92, 'virgin'],
      ['Compass Box The Peat Monster', 92, 'peat3'],
      ['Compass Box Oak Cross', 86, 'virgin light'],
      ['Compass Box Hedonism', 86, 'grain honeyed'],
      ['Compass Box Orchard House', 92, 'fruity2'],
      ['Compass Box The Story of the Spaniard', 86, 'sherry wine'],
      ['Compass Box Glasgow Blend', 86, 'peat1 sherry'],
    ],
  },
  {
    d: 'Ballantine\'s', t: 'scotch',
    base: [6, 3, 4, 4, 2, 5, 4, 1, 3, 1],
    c: 'Ballantine\'s soft European-favorite blending.',
    e: [
      ["Ballantine's Finest", 80, 'light'],
      ["Ballantine's 12", 80, ''],
      ["Ballantine's 17", 80, 'age17'],
    ],
  },
  {
    d: 'The Famous Grouse', t: 'scotch',
    base: [6, 3, 4, 4, 2, 5, 3, 1, 3, 1],
    c: 'The Famous Grouse\'s sherried session blend.',
    e: [
      ['The Famous Grouse', 80, 'light'],
      ['The Famous Grouse Smoky Black', 80, 'peat1 light'],
    ],
  },
  {
    d: 'Grant\'s', t: 'scotch',
    base: [6, 3, 4, 4, 2, 5, 3, 1, 3, 1],
    c: 'Grant\'s triple-wood family blending.',
    e: [
      ["Grant's Triple Wood", 80, 'light'],
    ],
  },
  {
    d: 'Buchanan\'s', t: 'scotch',
    base: [7, 3, 4, 4, 2, 6, 3, 1, 3, 1],
    c: 'Buchanan\'s creamy orange-chocolate blending.',
    e: [
      ["Buchanan's DeLuxe 12", 80, 'light'],
      ["Buchanan's Master", 80, ''],
      ["Buchanan's 18 Special Reserve", 80, 'age18'],
    ],
  },
  {
    d: 'Old Parr', t: 'scotch',
    base: [6, 4, 4, 4, 2, 6, 3, 1, 3, 2],
    c: 'Old Parr\'s sherried Latin-market classic.',
    e: [
      ['Old Parr 12', 80, 'light'],
    ],
  },
  {
    d: 'Monkey Shoulder', t: 'scotch',
    base: [7, 3, 5, 5, 3, 6, 4, 0, 3, 1],
    c: 'Monkey Shoulder\'s malt-forward mixability.',
    e: [
      ['Monkey Shoulder Smokey Monkey', 86, 'peat1'],
    ],
  },
  {
    d: 'Douglas Laing', t: 'scotch',
    base: [6, 3, 4, 4, 3, 6, 3, 2, 3, 3],
    c: 'Douglas Laing\'s regional Remarkable Malts series.',
    e: [
      ['Big Peat', 92, 'peat3'],
      ['Timorous Beastie', 93.4, 'honeyed'],
      ['Scallywag', 92, 'sherry'],
      ['Rock Island', 93.4, 'coastal peat2'],
      ['The Epicurean', 93.2, 'floral2 light'],
    ],
  },
  {
    d: 'Isle of Skye Blend', t: 'scotch',
    base: [6, 3, 4, 4, 3, 5, 3, 3, 3, 3],
    c: 'Ian Macleod\'s peat-touched island blending.',
    e: [
      ['Isle of Skye 8', 80, ''],
    ],
  },
  {
    d: 'Shackleton', t: 'scotch',
    base: [6, 3, 4, 4, 2, 5, 3, 2, 3, 2],
    c: 'The Shackleton expedition-replica highland blend.',
    e: [
      ['Shackleton Blended Malt', 80, 'light'],
    ],
  },
  {
    d: 'Naked Malt', t: 'scotch',
    base: [7, 3, 4, 4, 2, 6, 3, 0, 3, 1],
    c: 'Naked Malt\'s first-fill-sherry blended malt.',
    e: [
      ['Naked Malt', 80, 'sherry light'],
    ],
  },
  {
    d: 'Cutty Sark', t: 'scotch',
    base: [6, 2, 4, 3, 2, 5, 3, 0, 2, 1],
    c: 'Cutty Sark\'s pale easy-highball blending.',
    e: [
      ['Cutty Sark Original', 80, 'light'],
      ['Cutty Sark Prohibition', 100, 'bib'],
    ],
  },
  {
    d: 'Teacher\'s', t: 'scotch',
    base: [5, 4, 4, 4, 3, 4, 2, 3, 3, 3],
    c: 'Teacher\'s high-malt Ardmore-smoked value.',
    e: [
      ["Teacher's Highland Cream", 80, 'light'],
    ],
  },
  {
    d: 'White Horse', t: 'scotch',
    base: [5, 3, 4, 4, 3, 4, 2, 4, 3, 3],
    c: 'White Horse\'s Lagavulin-kissed old blend.',
    e: [
      ['White Horse Blended Scotch', 80, 'light'],
    ],
  },
];
