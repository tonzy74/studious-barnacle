import { HouseDef } from '../generator';

// Axis order: sweet, oak, vanilla, caramel, spice, fruit, floral, smoke, nutty, earthy

export const EXTRA_HOUSES: HouseDef[] = [
  // ── More Scotland ───────────────────────────────────────────
  {
    d: 'Glen Grant', t: 'scotch',
    base: [6, 3, 4, 3, 2, 7, 5, 0, 3, 1],
    c: 'Glen Grant\'s crisp orchard-bright Rothes style.',
    e: [
      ['Glen Grant Arboralis', 80, 'light'],
      ['Glen Grant 10', 80, ''],
      ['Glen Grant 12', 86, ''],
      ['Glen Grant 15 Batch Strength', 100, 'bp'],
      ['Glen Grant 18 Rare Edition', 86, 'age18'],
    ],
  },
  {
    d: 'Glenglassaugh', t: 'scotch',
    base: [6, 3, 4, 4, 3, 7, 4, 1, 3, 2],
    c: 'Glenglassaugh\'s coastal sandy-cove revival.',
    e: [
      ['Glenglassaugh Revival', 92, 'sherry'],
      ['Glenglassaugh Evolution', 100, 'virgin'],
      ['Glenglassaugh Sandend', 101.4, 'sherry coastal'],
      ['Glenglassaugh Portsoy', 98.4, 'port peat1 coastal'],
      ['Glenglassaugh 12', 90, 'sherry wine'],
    ],
  },
  {
    d: 'Ben Nevis', t: 'scotch',
    base: [6, 4, 4, 4, 4, 6, 2, 2, 4, 5],
    c: 'Ben Nevis\'s funky old-school Fort William weight.',
    e: [
      ['Ben Nevis 10', 92, ''],
    ],
  },
  {
    d: 'Ardnamurchan', t: 'scotch',
    base: [5, 3, 4, 4, 3, 6, 3, 4, 3, 4],
    c: 'Ardnamurchan\'s peninsula-wild half-peated newcomer.',
    e: [
      ['Ardnamurchan AD Single Malt', 93.2, ''],
      ['Ardnamurchan Sherry Cask Release', 100, 'sherry'],
    ],
  },
  {
    d: 'Glasgow Distillery', t: 'scotch',
    base: [6, 3, 4, 4, 3, 6, 4, 1, 3, 2],
    c: 'Glasgow 1770\'s urban single-malt revival.',
    e: [
      ['Glasgow 1770 Signature', 92, ''],
      ['Glasgow 1770 Peated', 92, 'peat2'],
      ['Glasgow 1770 Triumph', 92, 'sherry'],
    ],
  },
  {
    d: 'The Glenturret', t: 'scotch',
    base: [6, 4, 4, 4, 3, 6, 3, 1, 4, 3],
    c: 'Glenturret\'s hand-mashed oldest-working-distillery craft.',
    e: [
      ['The Glenturret Triple Wood', 88, 'sherry'],
      ['The Glenturret 10 Peat Smoked', 100, 'peat2'],
      ['The Glenturret 12', 92, 'sherry'],
    ],
  },
  {
    d: 'Isle of Harris', t: 'scotch',
    base: [5, 3, 4, 4, 3, 6, 3, 3, 3, 3],
    c: "Harris's Hebridean social-distillery debut.",
    e: [
      ['The Hearach Single Malt', 92, ''],
    ],
  },
  {
    d: 'Glen Elgin', t: 'scotch',
    base: [6, 3, 4, 4, 2, 7, 4, 0, 3, 2],
    c: 'Glen Elgin\'s honeyed blender\'s-gem Speyside.',
    e: [
      ['Glen Elgin 12', 86, 'honeyed'],
    ],
  },
  {
    d: 'Dailuaine', t: 'scotch',
    base: [6, 4, 4, 4, 3, 6, 2, 0, 4, 3],
    c: 'Dailuaine\'s rich meaty Flora & Fauna Speyside.',
    e: [
      ['Dailuaine 16 Flora & Fauna', 86, 'sherry age16'],
    ],
  },
  {
    d: 'Benrinnes', t: 'scotch',
    base: [6, 4, 4, 4, 3, 6, 2, 0, 4, 3],
    c: 'Benrinnes\' partially-triple-distilled mountain malt.',
    e: [
      ['Benrinnes 15 Flora & Fauna', 86, 'sherry age15'],
    ],
  },
  {
    d: 'Linkwood', t: 'scotch',
    base: [6, 3, 4, 3, 2, 7, 5, 0, 3, 2],
    c: 'Linkwood\'s pretty floral blender\'s favorite.',
    e: [
      ['Linkwood 12 Flora & Fauna', 86, 'floral2'],
    ],
  },
  {
    d: 'Inchgower', t: 'scotch',
    base: [6, 3, 4, 4, 3, 6, 3, 1, 3, 3],
    c: 'Inchgower\'s salty Buckie coastal Speyside.',
    e: [
      ['Inchgower 14 Flora & Fauna', 86, 'coastal age14'],
    ],
  },
  {
    d: 'Auchroisk', t: 'scotch',
    base: [6, 3, 4, 4, 3, 6, 3, 0, 4, 2],
    c: 'Auchroisk\'s nutty malty workhorse Speyside.',
    e: [
      ['Auchroisk 10 Flora & Fauna', 86, ''],
    ],
  },
  {
    d: 'Blair Athol', t: 'scotch',
    base: [6, 4, 4, 4, 3, 6, 2, 0, 4, 3],
    c: 'Blair Athol\'s nutty sherried Pitlochry malt.',
    e: [
      ['Blair Athol 12 Flora & Fauna', 86, 'sherry'],
    ],
  },
  {
    d: 'The Deveron', t: 'scotch',
    base: [6, 3, 4, 4, 2, 6, 4, 0, 3, 2],
    c: 'The Deveron\'s gentle Macduff coastal Highland.',
    e: [
      ['The Deveron 12', 80, 'light'],
    ],
  },
  {
    d: 'Tamnavulin', t: 'scotch',
    base: [6, 3, 4, 4, 2, 6, 4, 0, 3, 1],
    c: 'Tamnavulin\'s soft supermarket-friendly Speyside.',
    e: [
      ['Tamnavulin Double Cask', 80, 'sherry light'],
      ['Tamnavulin Sherry Cask Edition', 80, 'sherry'],
    ],
  },
  {
    d: 'Tomintoul (Peated)', t: 'scotch',
    base: [5, 3, 4, 3, 3, 5, 3, 6, 3, 3],
    c: 'Old Ballantruan\'s peated Speyside curveball.',
    e: [
      ['Old Ballantruan Peated', 100, ''],
      ['Tomintoul Peaty Tang', 80, 'light'],
    ],
  },
  {
    d: 'Loch Lomond (Island styles)', t: 'scotch',
    base: [6, 3, 4, 4, 3, 6, 4, 1, 3, 2],
    c: 'Loch Lomond\'s single-estate style range.',
    e: [
      ['Inchmurrin 12', 92, 'fruity2'],
      ['Inchmoan 12 Peated', 92, 'peat2'],
    ],
  },
  {
    d: 'Ian Macleod (Islay indie)', t: 'scotch',
    base: [5, 3, 4, 3, 3, 4, 2, 8, 2, 5],
    c: 'Independent-bottled big Islay smoke.',
    e: [
      ['Smokehead Islay Single Malt', 86, ''],
      ['Smokehead High Voltage', 116, 'bp'],
      ['Finlaggan Old Reserve', 80, 'light'],
      ['Finlaggan Eilean Mor', 92, ''],
      ['The Ileach Peated Islay Malt', 80, 'light'],
    ],
  },
  {
    d: 'Compass Box (Grain & blends II)', t: 'scotch',
    base: [6, 3, 5, 4, 2, 5, 4, 1, 3, 1],
    c: 'Modern transparent blending, second shelf.',
    e: [
      ['Great King Street Artist\'s Blend', 86, 'fruity2'],
      ['Great King Street Glasgow Blend', 86, 'peat1 sherry'],
    ],
  },
  {
    d: 'Wemyss Malts', t: 'scotch',
    base: [6, 3, 4, 4, 3, 6, 4, 1, 3, 2],
    c: 'Wemyss\'s flavour-named blended malts.',
    e: [
      ['Wemyss The Hive', 92, 'honeyed'],
      ['Wemyss Spice King', 92, 'coastal'],
      ['Wemyss Peat Chimney', 92, 'peat2'],
    ],
  },
  {
    d: 'Copper Dog', t: 'scotch',
    base: [6, 3, 4, 4, 2, 6, 4, 0, 3, 1],
    c: 'Copper Dog\'s Speyside-pub blended malt.',
    e: [
      ['Copper Dog Blended Malt', 80, 'light'],
    ],
  },
  {
    d: 'Spencerfield (Ian Macleod)', t: 'scotch',
    base: [6, 3, 4, 4, 3, 6, 3, 1, 3, 2],
    c: 'Character-label blended malts with rustic charm.',
    e: [
      ['Sheep Dip Blended Malt', 80, 'light'],
      ['Pig\'s Nose Blended Scotch', 80, 'grain light'],
    ],
  },
  {
    d: 'Pràban na Linne', t: 'scotch',
    base: [6, 3, 4, 4, 3, 5, 3, 3, 3, 3],
    c: 'Gaelic-label island blending from Skye.',
    e: [
      ['Té Bheag Blended Scotch', 80, ''],
    ],
  },
  {
    d: 'Black Bottle', t: 'scotch',
    base: [5, 3, 4, 4, 3, 5, 2, 4, 3, 3],
    c: 'Black Bottle\'s Islay-leaning value blend.',
    e: [
      ['Black Bottle Blended Scotch', 80, 'light'],
    ],
  },

  // ── More America ────────────────────────────────────────────
  {
    d: "Heaven's Door", t: 'tennessee',
    base: [6, 5, 6, 6, 4, 4, 2, 1, 3, 2],
    c: 'Heaven\'s Door\'s Dylan-backed Tennessee polish.',
    e: [
      ["Heaven's Door Straight Bourbon", 84, 'light'],
      ["Heaven's Door Double Barrel", 100, 'virgin'],
      ["Heaven's Door Revelation", 99, 'sherry'],
      ["Heaven's Door 10 Year", 100, 'age10'],
    ],
  },
  {
    d: 'Redwood Empire', t: 'bourbon',
    base: [6, 5, 6, 6, 6, 4, 3, 0, 3, 3],
    c: 'Redwood Empire\'s California blending of tall-tree ryes and bourbons.',
    e: [
      ['Redwood Empire Lost Monarch', 90, 'highrye'],
      ['Redwood Empire Pipe Dream Bourbon', 90, ''],
      ['Redwood Empire Emerald Giant Rye', 90, 'rye95'],
      ['Redwood Empire Grizzly Beast Bottled in Bond', 100, 'bib'],
      ['Redwood Empire Haystack Needle 10 Year', 105, 'age10 rich'],
    ],
  },
  {
    d: 'Breckenridge', t: 'bourbon',
    base: [6, 5, 6, 6, 5, 4, 2, 0, 3, 2],
    c: 'Breckenridge\'s high-altitude Colorado blending.',
    e: [
      ['Breckenridge Bourbon', 86, ''],
      ['Breckenridge High Proof', 105, 'bp'],
      ['Breckenridge PX Cask Finish', 90, 'px'],
    ],
  },
  {
    d: 'Laws Whiskey House', t: 'bourbon',
    base: [6, 5, 5, 5, 6, 4, 3, 0, 3, 3],
    c: 'Laws\' four-grain Colorado terroir sourcing-free craft.',
    e: [
      ['Laws Four Grain Straight Bourbon', 95, 'fourgrain'],
      ['Laws Four Grain Bottled in Bond', 100, 'fourgrain bib'],
      ['Laws San Luis Valley Straight Rye', 95, 'rye95'],
      ['Laws Henry Road Straight Malt', 95, 'rich'],
    ],
  },
  {
    d: 'Hudson Whiskey', t: 'bourbon',
    base: [6, 5, 6, 6, 4, 4, 2, 0, 4, 3],
    c: 'Hudson\'s pioneering New York small-barrel craft.',
    e: [
      ['Hudson Bright Lights, Big Bourbon', 92, ''],
      ['Hudson Do The Rye Thing', 92, 'rye95'],
      ['Hudson Back Room Deal Peated Rye', 92, 'rye95 peat1'],
    ],
  },
  {
    d: '291 Colorado', t: 'bourbon',
    base: [6, 6, 5, 6, 6, 3, 1, 2, 3, 4],
    c: '291\'s aspen-stave-finished rugged Colorado intensity.',
    e: [
      ['291 Colorado Bourbon Small Batch', 100.8, ''],
      ['291 Colorado Rye Small Batch', 101.7, 'rye95'],
      ['291 Colorado Bourbon Barrel Proof', 129, 'bp'],
    ],
  },
  {
    d: 'McKenzie', t: 'bourbon',
    base: [6, 5, 5, 6, 5, 4, 2, 0, 4, 3],
    c: 'McKenzie\'s Finger Lakes grain-to-glass character.',
    e: [
      ['McKenzie Bottled in Bond Bourbon', 100, 'bib'],
      ['McKenzie Straight Rye', 91, 'highrye'],
    ],
  },
  {
    d: 'Blue Note', t: 'bourbon',
    base: [6, 5, 6, 6, 5, 4, 2, 0, 3, 2],
    c: 'Blue Note\'s Memphis jazz-label Tennessee sourcing.',
    e: [
      ['Blue Note Juke Joint Uncut', 116, 'bp'],
      ['Blue Note Crossroads', 100, 'toast'],
    ],
  },
  {
    d: 'Nashville Barrel Company', t: 'bourbon',
    base: [6, 5, 6, 6, 6, 4, 2, 0, 3, 2],
    c: 'Nashville Barrel Co\'s single-barrel picker energy.',
    e: [
      ['Nashville Barrel Co Small Batch Bourbon', 105.9, 'bp'],
      ['Nashville Barrel Co Single Barrel Rye', 114, 'rye95 sb bp'],
    ],
  },
  {
    d: 'Hard Truth', t: 'rye',
    base: [5, 5, 5, 5, 8, 4, 3, 0, 3, 3],
    c: 'Hard Truth\'s sweet-mash Indiana rye focus.',
    e: [
      ['Hard Truth Sweet Mash Rye', 97, ''],
      ['Hard Truth Sweet Mash Rye Cask Strength', 118.6, 'bp'],
    ],
  },
  {
    d: 'Ben Holladay', t: 'bourbon',
    base: [6, 5, 6, 6, 5, 4, 2, 0, 4, 2],
    c: 'Holladay\'s revived Missouri bottled-in-bond tradition.',
    e: [
      ['Ben Holladay Bottled in Bond', 100, 'bib'],
      ['Ben Holladay Rickhouse Proof', 115, 'bp'],
      ['Ben Holladay Soft Red Wheat', 100, 'wheat bib'],
    ],
  },
  {
    d: 'Middle West Spirits', t: 'bourbon',
    base: [7, 5, 6, 6, 4, 4, 2, 0, 4, 2],
    c: 'Middle West\'s Ohio dark-pumpernickel richness.',
    e: [
      ['Middle West Michelone Reserve', 96, 'fourgrain'],
      ['Middle West Straight Wheat Whiskey', 96, 'wheat grain'],
      ['Middle West Cask Strength Wheat', 115, 'wheat bp'],
    ],
  },
  {
    d: 'Found North', t: 'canadian',
    base: [6, 5, 5, 6, 7, 4, 2, 0, 4, 3],
    c: 'Found North\'s cask-strength aged-Canadian blending for whiskey nerds.',
    e: [
      ['Found North Batch Release', 116, 'bp age15'],
      ['Found North Range Blend', 110, 'bp grain'],
    ],
  },
  {
    d: 'Rare Character', t: 'bourbon',
    base: [6, 6, 6, 6, 5, 4, 2, 0, 3, 2],
    c: 'Rare Character\'s single-barrel negociant curation.',
    e: [
      ['Rare Character Single Barrel Bourbon', 115, 'sb bp'],
      ['Rare Character Single Barrel Rye', 112, 'sb bp highrye'],
    ],
  },
  {
    d: 'Fortuna', t: 'bourbon',
    base: [6, 5, 6, 6, 5, 4, 2, 0, 3, 2],
    c: 'Rare Character\'s pre-Prohibition Fortuna revival label.',
    e: [
      ['Fortuna Bourbon', 102, ''],
    ],
  },
  {
    d: 'Old Soul', t: 'bourbon',
    base: [6, 5, 6, 6, 5, 4, 2, 0, 3, 2],
    c: 'Cathead\'s Mississippi blending of MGP stocks.',
    e: [
      ['Old Soul Small Batch Bourbon', 90, ''],
    ],
  },
  {
    d: 'Watershed', t: 'bourbon',
    base: [6, 5, 5, 6, 5, 4, 2, 0, 4, 2],
    c: 'Watershed\'s Columbus four-grain apple-brandy-cask notes.',
    e: [
      ['Watershed Straight Bourbon', 90, 'fourgrain'],
    ],
  },
  {
    d: 'Dry Fly', t: 'other',
    base: [7, 4, 5, 5, 3, 4, 3, 0, 3, 2],
    c: 'Dry Fly\'s Washington wheat-whiskey specialty.',
    e: [
      ['Dry Fly Straight Wheat Whiskey', 90, 'wheat grain'],
    ],
  },
  {
    d: 'Bhakta', t: 'other',
    base: [6, 5, 4, 5, 4, 6, 3, 0, 4, 3],
    c: 'Bhakta\'s armagnac-soaked global blending curiosities.',
    e: [
      ['Bhakta 2013 Bourbon Armagnac Cask', 100.4, 'cognac'],
    ],
  },

  // ── More Ireland ────────────────────────────────────────────
  {
    d: 'Powerscourt', t: 'irish',
    base: [6, 3, 4, 4, 3, 6, 4, 0, 3, 1],
    c: 'Fercullen\'s Wicklow-garden Irish craft.',
    e: [
      ['Fercullen 10 Single Grain', 80, 'grain'],
      ['Fercullen Falls Blended Irish', 80, 'light'],
    ],
  },
  {
    d: 'J.J. Corry', t: 'irish',
    base: [6, 3, 4, 4, 2, 6, 4, 0, 3, 1],
    c: 'J.J. Corry\'s revived Irish whiskey-bonder craft.',
    e: [
      ['J.J. Corry The Gael', 92, 'fruity2'],
      ['J.J. Corry The Hanson', 92, 'grain'],
    ],
  },
  {
    d: 'The Busker', t: 'irish',
    base: [6, 3, 4, 4, 2, 5, 4, 0, 3, 1],
    c: 'The Busker\'s marsala-touched Royal Oak value.',
    e: [
      ['The Busker Triple Cask Triple Smooth', 80, 'light'],
      ['The Busker Single Grain', 89.2, 'grain'],
      ['The Busker Single Malt', 89.2, 'sherry'],
      ['The Busker Single Pot Still', 89.2, 'pot'],
    ],
  },
  {
    d: 'Glendalough', t: 'irish',
    base: [6, 3, 4, 4, 3, 6, 4, 0, 3, 2],
    c: 'Glendalough\'s Wicklow-mountain finishing craft.',
    e: [
      ['Glendalough Double Barrel', 84, 'grain'],
      ['Glendalough Pot Still Irish Oak', 86, 'pot virgin'],
      ['Glendalough 7 Year Mizunara', 92, 'miz'],
    ],
  },
  {
    d: 'Lambay', t: 'irish',
    base: [6, 3, 4, 4, 2, 6, 4, 0, 3, 1],
    c: 'Lambay\'s cognac-cask island blending.',
    e: [
      ['Lambay Small Batch Blend', 80, 'cognac light'],
      ['Lambay Single Malt', 80, 'cognac'],
    ],
  },
  {
    d: 'Hinch', t: 'irish',
    base: [6, 3, 4, 4, 2, 5, 4, 0, 3, 1],
    c: 'Hinch\'s County Down double-wood newcomers.',
    e: [
      ['Hinch 5 Year Double Wood', 86, 'light'],
      ['Hinch Peated Single Malt', 86, 'peat1'],
    ],
  },
  {
    d: 'Grace O\'Malley', t: 'irish',
    base: [6, 3, 4, 4, 2, 6, 4, 0, 3, 1],
    c: 'Grace O\'Malley\'s rum-touched maritime blend.',
    e: [
      ['Grace O\'Malley Blended Irish', 80, 'rum light'],
    ],
  },
  {
    d: 'Limavady', t: 'irish',
    base: [6, 3, 4, 4, 2, 6, 4, 0, 3, 1],
    c: 'Limavady\'s single-barrel Irish single malt.',
    e: [
      ['Limavady Single Barrel Single Malt', 92, 'sb px'],
    ],
  },
  {
    d: 'Two Stacks', t: 'irish',
    base: [6, 3, 4, 4, 2, 5, 4, 0, 3, 1],
    c: 'Two Stacks\' blender-first modern Irish outfit.',
    e: [
      ['Two Stacks The First Cut', 86, 'grain'],
      ['Two Stacks Dram in a Can', 86, 'light'],
    ],
  },

  // ── More Japan & world ──────────────────────────────────────
  {
    d: 'Kirin', t: 'japanese',
    base: [6, 3, 5, 4, 2, 6, 4, 0, 3, 1],
    c: 'Kirin\'s Fuji-foothill estate blending.',
    e: [
      ['Kirin Fuji-Sanroku Signature Blend', 100, ''],
      ['Kirin Riku The Japanese Whisky', 100, 'grain light'],
    ],
  },
  {
    d: 'Akkeshi', t: 'japanese',
    base: [5, 3, 4, 3, 3, 5, 3, 6, 3, 4],
    c: 'Akkeshi\'s Hokkaido Islay-style peat project.',
    e: [
      ['Akkeshi Sarorunkamuy', 110, ''],
      ['Akkeshi Seasonal Series Single Malt', 110, 'sherry'],
    ],
  },
  {
    d: 'Shizuoka', t: 'japanese',
    base: [6, 3, 4, 4, 3, 6, 4, 1, 3, 2],
    c: 'Shizuoka\'s wood-fired mountain-forest stills.',
    e: [
      ['Shizuoka Prologue K', 110.6, ''],
      ['Shizuoka Contact S', 110.6, 'fruity2'],
    ],
  },
  {
    d: 'Kujira', t: 'japanese',
    base: [6, 3, 4, 4, 2, 6, 3, 0, 3, 1],
    c: 'Kujira\'s Okinawan rice-whisky character.',
    e: [
      ['Kujira Ryukyu 5 Year', 86, 'grain'],
    ],
  },
  {
    d: 'Pendleton', t: 'canadian',
    base: [7, 3, 5, 6, 3, 4, 2, 0, 2, 1],
    c: 'Pendleton\'s rodeo-smooth Canadian import.',
    e: [
      ['Pendleton Blended Canadian', 80, 'light'],
      ['Pendleton 1910 12 Year Rye', 80, 'highrye age12 light'],
    ],
  },
  {
    d: 'Black Velvet', t: 'canadian',
    base: [6, 3, 5, 5, 3, 4, 2, 0, 2, 1],
    c: 'Black Velvet\'s easy-going Alberta blending.',
    e: [
      ['Black Velvet Original', 80, 'light'],
    ],
  },
  {
    d: 'Seagram\'s', t: 'canadian',
    base: [6, 3, 5, 5, 3, 4, 2, 0, 2, 1],
    c: 'Seagram\'s VO heritage Canadian blend.',
    e: [
      ["Seagram's VO", 80, 'light'],
    ],
  },
  {
    d: 'Canadian Mist', t: 'canadian',
    base: [6, 3, 5, 5, 2, 4, 2, 0, 2, 1],
    c: 'Canadian Mist\'s featherweight mixer blend.',
    e: [
      ['Canadian Mist', 80, 'light'],
    ],
  },
  {
    d: 'Collingwood', t: 'canadian',
    base: [7, 3, 5, 5, 3, 4, 3, 0, 3, 1],
    c: 'Collingwood\'s maplewood-mellowed roundness.',
    e: [
      ['Collingwood Canadian Whisky', 80, 'maple light'],
    ],
  },
  {
    d: 'Bearface', t: 'canadian',
    base: [6, 4, 5, 5, 3, 5, 2, 0, 3, 2],
    c: 'Bearface\'s elementally-aged triple-oak experiment.',
    e: [
      ['Bearface Triple Oak 7 Year', 85, 'virgin wine'],
    ],
  },
];
