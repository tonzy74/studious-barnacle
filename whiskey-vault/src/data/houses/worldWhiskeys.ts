import { HouseDef } from '../generator';

// Axis order: sweet, oak, vanilla, caramel, spice, fruit, floral, smoke, nutty, earthy

export const WORLD_WHISKEYS: HouseDef[] = [
  // ── Irish ───────────────────────────────────────────────────
  {
    d: 'Midleton (Jameson)', t: 'irish',
    base: [6, 3, 4, 4, 2, 5, 4, 0, 4, 1],
    c: 'Jameson\'s triple-distilled Irish approachability.',
    e: [
      ['Jameson Black Barrel', 80, 'char toast'],
      ['Jameson Caskmates Stout Edition', 80, 'stout'],
      ['Jameson Caskmates IPA Edition', 80, 'floral2'],
      ['Jameson Crested', 80, 'sherry'],
      ['Jameson 18 Bow Street', 110.6, 'age18 bp rich'],
      ['Powers Gold Label', 87.4, 'pot'],
      ["Powers John's Lane 12", 92, 'pot sherry age12'],
      ['Powers Three Swallow', 87.4, 'pot fruity2'],
      ['Midleton Very Rare', 80, 'rich floral2'],
    ],
  },
  {
    d: 'Midleton (Redbreast)', t: 'irish',
    base: [7, 5, 4, 5, 4, 8, 4, 0, 5, 2],
    c: 'Redbreast\'s benchmark sherried single pot still.',
    e: [
      ['Redbreast 12 Cask Strength', 111.4, 'pot bp'],
      ['Redbreast 15', 92, 'pot age15'],
      ['Redbreast 21', 92, 'pot age21'],
      ['Redbreast 27', 106.4, 'pot age27 wine'],
      ['Redbreast Lustau Edition', 92, 'pot oloroso'],
      ['Redbreast PX Edition', 92, 'pot px'],
    ],
  },
  {
    d: 'Midleton (Spots)', t: 'irish',
    base: [7, 4, 4, 4, 3, 7, 5, 0, 4, 2],
    c: 'The Spot family\'s green-apple pot-still heritage.',
    e: [
      ['Green Spot Château Léoville Barton', 92, 'pot wine'],
      ['Yellow Spot 12', 92, 'pot madeira age12'],
      ['Red Spot 15', 92, 'pot madeira sherry age15'],
      ['Blue Spot 7 Cask Strength', 117.4, 'pot madeira bp'],
      ['Gold Spot 9', 102.8, 'pot port bib'],
    ],
  },
  {
    d: 'Bushmills', t: 'irish',
    base: [6, 3, 4, 4, 2, 6, 4, 0, 4, 1],
    c: 'Bushmills\' malty Antrim triple-distillation.',
    e: [
      ['Bushmills Original', 80, 'light'],
      ['Bushmills Black Bush', 80, 'sherry'],
      ['Bushmills 10 Single Malt', 80, 'age10'],
      ['Bushmills 16 Single Malt', 80, 'port sherry age16'],
      ['Bushmills 21 Single Malt', 80, 'madeira age21'],
    ],
  },
  {
    d: 'Teeling', t: 'irish',
    base: [6, 3, 4, 4, 3, 6, 4, 0, 3, 2],
    c: 'Teeling\'s modern Dublin cask-finish energy.',
    e: [
      ['Teeling Small Batch Rum Cask', 92, 'rum'],
      ['Teeling Single Grain', 92, 'grain wine'],
      ['Teeling Single Malt', 92, 'wine fruity2'],
      ['Teeling Single Pot Still', 92, 'pot'],
      ['Teeling Blackpitts Peated', 92, 'peat2'],
    ],
  },
  {
    d: 'Tullamore D.E.W.', t: 'irish',
    base: [6, 3, 4, 4, 2, 5, 4, 0, 3, 1],
    c: 'Tullamore\'s gentle triple-blend balance.',
    e: [
      ['Tullamore D.E.W. Original', 80, 'light'],
      ['Tullamore D.E.W. 12 Special Reserve', 80, 'sherry age12'],
      ['Tullamore D.E.W. XO Rum Cask', 86, 'rum'],
    ],
  },
  {
    d: 'Cooley (Connemara)', t: 'irish',
    base: [5, 3, 4, 4, 3, 5, 3, 6, 3, 3],
    c: 'Connemara\'s rare peated Irish single malt.',
    e: [
      ['Connemara Original Peated', 80, ''],
      ['Connemara 12 Peated', 80, 'age12'],
    ],
  },
  {
    d: 'Kilbeggan', t: 'irish',
    base: [6, 3, 4, 4, 2, 5, 4, 0, 3, 2],
    c: 'Kilbeggan\'s historic small-pot Irish blend.',
    e: [
      ['Kilbeggan Traditional', 80, 'light'],
      ['Kilbeggan Single Grain', 86, 'grain'],
    ],
  },
  {
    d: 'Tyrconnell', t: 'irish',
    base: [6, 3, 4, 4, 2, 7, 4, 0, 3, 1],
    c: 'Tyrconnell\'s orchard-fruit double-distilled malt.',
    e: [
      ['The Tyrconnell Single Malt', 86, ''],
      ['The Tyrconnell 10 Madeira Cask', 92, 'madeira age10'],
      ['The Tyrconnell 10 Sherry Cask', 92, 'sherry age10'],
      ['The Tyrconnell 16', 92, 'age16'],
    ],
  },
  {
    d: 'Waterford', t: 'irish',
    base: [6, 3, 4, 3, 3, 6, 5, 0, 3, 3],
    c: 'Waterford\'s terroir-driven single-farm barley project.',
    e: [
      ['Waterford The Cuvée', 100, ''],
      ['Waterford Single Farm Origin', 100, 'dry'],
    ],
  },
  {
    d: 'Dingle', t: 'irish',
    base: [6, 3, 4, 4, 3, 6, 4, 0, 3, 2],
    c: 'Dingle\'s craft Kerry coastal freshness.',
    e: [
      ['Dingle Single Malt', 92.6, 'sherry'],
      ['Dingle Single Pot Still', 92.6, 'pot'],
    ],
  },
  {
    d: 'West Cork', t: 'irish',
    base: [6, 3, 4, 4, 2, 5, 4, 0, 3, 1],
    c: 'West Cork\'s friendly value Irish craft.',
    e: [
      ['West Cork Bourbon Cask', 80, 'light'],
      ['West Cork Black Cask', 80, 'char light'],
    ],
  },
  {
    d: 'Walsh Whiskey', t: 'irish',
    base: [6, 3, 4, 4, 2, 6, 4, 0, 4, 1],
    c: 'Writers\' Tears\' honeyed pot-and-malt marriage.',
    e: [
      ["Writers' Tears Copper Pot", 80, 'pot'],
      ["Writers' Tears Cask Strength", 106, 'pot bp'],
      ["Writers' Tears Double Oak", 92, 'pot cognac'],
      ['The Irishman Founder\'s Reserve', 80, 'pot light'],
    ],
  },
  {
    d: 'Method and Madness', t: 'irish',
    base: [6, 3, 4, 4, 3, 6, 4, 0, 4, 2],
    c: 'Midleton\'s experimental micro-distillery arm.',
    e: [
      ['Method and Madness Single Pot Still', 92, 'pot virgin'],
      ['Method and Madness Single Grain', 92, 'grain virgin'],
    ],
  },
  {
    d: 'Knappogue Castle', t: 'irish',
    base: [6, 3, 4, 4, 2, 6, 4, 0, 3, 1],
    c: 'Knappogue Castle\'s vintage-dated malt clarity.',
    e: [
      ['Knappogue Castle 12', 86, 'age12'],
      ['Knappogue Castle 14 Twin Wood', 92, 'sherry age14'],
      ['Knappogue Castle 16 Sherry Finish', 86, 'oloroso age16'],
    ],
  },
  {
    d: 'The Sexton', t: 'irish',
    base: [6, 3, 4, 4, 2, 6, 3, 0, 4, 1],
    c: 'The Sexton\'s all-sherry single malt in the black bottle.',
    e: [
      ['The Sexton Single Malt', 80, 'sherry light'],
    ],
  },
  {
    d: 'Slane', t: 'irish',
    base: [6, 4, 4, 5, 3, 5, 3, 0, 3, 1],
    c: 'Slane\'s triple-casked rock-castle blend.',
    e: [
      ['Slane Irish Whiskey', 80, 'virgin sherry light'],
    ],
  },
  {
    d: 'Roe & Co', t: 'irish',
    base: [6, 3, 5, 4, 2, 5, 4, 0, 3, 1],
    c: 'Roe & Co\'s velvety Dublin revival blend.',
    e: [
      ['Roe & Co Blended Irish', 90, ''],
    ],
  },
  {
    d: 'Clonakilty', t: 'irish',
    base: [6, 3, 4, 4, 2, 6, 4, 0, 3, 1],
    c: 'Clonakilty\'s ocean-warehouse Cork finishing.',
    e: [
      ['Clonakilty Port Cask', 87.2, 'port'],
      ['Clonakilty Double Oak', 86, 'virgin wine'],
    ],
  },
  {
    d: 'Egan\'s', t: 'irish',
    base: [6, 3, 4, 4, 2, 6, 4, 0, 3, 1],
    c: 'Egan\'s family-bottled Tullamore heritage.',
    e: [
      ["Egan's Vintage Grain", 92, 'grain'],
      ["Egan's Fortitude PX", 92, 'px'],
    ],
  },

  // ── Japanese ────────────────────────────────────────────────
  {
    d: 'Suntory', t: 'japanese',
    base: [6, 4, 4, 4, 2, 7, 5, 1, 3, 1],
    c: 'Suntory\'s harmony-first Japanese elegance.',
    e: [
      ['Hibiki 17', 86, 'age17 miz'],
      ['Hibiki 21', 86, 'age21 miz sherry'],
      ['Hibiki Blender\'s Choice', 86, 'wine'],
      ['Yamazaki Distiller\'s Reserve', 86, 'wine'],
      ['Yamazaki 18', 86, 'age18 sherry miz'],
      ['Yamazaki 25', 86, 'age25 sherry miz'],
      ['Hakushu Distiller\'s Reserve', 86, 'peat1 floral2'],
      ['Hakushu 12', 86, 'peat1'],
      ['Hakushu 18', 86, 'peat1 age18'],
      ['The Chita Single Grain', 86, 'grain honeyed'],
      ['Suntory Ao World Blend', 86, 'peat1 fruity2'],
      ['Toki Highball Blend', 86, 'light'],
    ],
  },
  {
    d: 'Nikka', t: 'japanese',
    base: [6, 4, 4, 5, 4, 6, 3, 2, 3, 2],
    c: 'Nikka\'s Scottish-soul Japanese craftsmanship.',
    e: [
      ['Nikka Coffey Grain', 90, 'grain honeyed'],
      ['Nikka Coffey Malt', 90, 'grain rich'],
      ['Nikka Days', 80, 'light'],
      ['Nikka Taketsuru Pure Malt', 86, 'sherry'],
      ['Nikka Yoichi Single Malt', 90, 'peat2 coastal'],
      ['Nikka Yoichi 10', 90, 'peat2 coastal age10'],
      ['Nikka Miyagikyo Single Malt', 90, 'sherry fruity2'],
      ['Nikka From the Barrel', 102.8, 'bp'],
      ['Nikka Session', 86, 'fruity2 light'],
    ],
  },
  {
    d: 'Mars Shinshu', t: 'japanese',
    base: [6, 3, 4, 4, 3, 6, 4, 1, 3, 2],
    c: 'Mars\' alpine Nagano softness.',
    e: [
      ['Mars Iwai Tradition', 80, 'sherry light'],
      ['Mars Iwai 45', 90, ''],
      ['Mars Komagatake Single Malt', 96, 'fruity2'],
      ['Mars Tsunuki Edition', 100, 'rich'],
    ],
  },
  {
    d: 'Chichibu', t: 'japanese',
    base: [6, 4, 4, 4, 3, 7, 4, 1, 3, 2],
    c: 'Chichibu\'s cult-status small-cask intensity.',
    e: [
      ['Ichiro\'s Malt Chichibu The First Ten', 101.4, 'age10'],
      ['Ichiro\'s Malt & Grain White Label', 92, 'grain'],
      ['Ichiro\'s Malt Wine Wood Reserve', 92, 'wine'],
      ['Ichiro\'s Malt Double Distilleries', 92, 'fruity2'],
    ],
  },
  {
    d: 'White Oak (Akashi)', t: 'japanese',
    base: [6, 3, 4, 4, 2, 5, 4, 0, 3, 1],
    c: 'Akashi\'s coastal sake-brewery restraint.',
    e: [
      ['Akashi White Oak Blended', 80, 'light'],
      ['Akashi Single Malt', 92, ''],
    ],
  },
  {
    d: 'Kanosuke', t: 'japanese',
    base: [6, 3, 5, 5, 3, 5, 3, 0, 3, 2],
    c: 'Kanosuke\'s shochu-cask Kagoshima roundness.',
    e: [
      ['Kanosuke Single Malt', 96, 'rich'],
    ],
  },
  {
    d: 'Fuji', t: 'japanese',
    base: [6, 3, 5, 5, 2, 6, 3, 0, 3, 1],
    c: 'Mt. Fuji\'s clean grain-whisky mastery.',
    e: [
      ['Fuji Single Grain', 92, 'grain fruity2'],
      ['Fuji Single Blended Japanese Whisky', 86, 'fruity2'],
    ],
  },
  {
    d: 'Kaiyō', t: 'japanese',
    base: [6, 4, 4, 4, 3, 6, 4, 0, 3, 1],
    c: 'Kaiyō\'s ocean-matured mizunara program.',
    e: [
      ['Kaiyō The Signature', 86, 'miz'],
      ['Kaiyō Cask Strength', 106, 'miz bp'],
      ['Kaiyō The Peated', 92, 'miz peat2'],
    ],
  },
  {
    d: 'Hatozaki', t: 'japanese',
    base: [6, 3, 4, 4, 2, 5, 4, 0, 3, 1],
    c: 'Hatozaki\'s lighthouse-label gentle blending.',
    e: [
      ['Hatozaki Finest Blended', 80, 'light'],
      ['Hatozaki Small Batch Pure Malt', 92, 'sherry miz'],
    ],
  },
  {
    d: 'Togouchi', t: 'japanese',
    base: [6, 3, 4, 4, 2, 5, 3, 1, 3, 1],
    c: 'Togouchi\'s tunnel-aged Hiroshima blending.',
    e: [
      ['Togouchi Premium', 80, 'light'],
    ],
  },
  {
    d: 'Ohishi', t: 'japanese',
    base: [7, 3, 4, 4, 2, 6, 3, 0, 3, 1],
    c: 'Ohishi\'s rice-whisky sherry-cask curiosity.',
    e: [
      ['Ohishi Sherry Cask', 83.2, 'sherry grain'],
      ['Ohishi Brandy Cask', 83.2, 'cognac grain'],
    ],
  },

  // ── Canadian ────────────────────────────────────────────────
  {
    d: 'Crown Royal', t: 'canadian',
    base: [7, 3, 5, 6, 3, 4, 3, 0, 2, 1],
    c: 'Crown Royal\'s plush Manitoba blending.',
    e: [
      ['Crown Royal Black', 90, 'char'],
      ['Crown Royal Reserve', 80, 'rich'],
      ['Crown Royal Northern Harvest Rye', 90, 'highrye'],
      ['Crown Royal XR', 80, 'rich age18'],
      ['Crown Royal XO Cognac Cask', 80, 'cognac'],
      ['Crown Royal Hand Selected Barrel', 103, 'sb bp'],
      ['Crown Royal 18', 80, 'age18 rich'],
    ],
  },
  {
    d: 'Hiram Walker', t: 'canadian',
    base: [5, 5, 5, 5, 8, 4, 3, 0, 3, 3],
    c: 'Hiram Walker\'s pot-still Canadian rye mastery.',
    e: [
      ['Lot No. 40 Cask Strength', 114, 'bp'],
      ['Lot No. 40 Dark Oak', 96, 'char virgin'],
      ['Pike Creek 10 Rum Barrel', 84, 'rum age10'],
      ['Gooderham & Worts Four Grain', 88.9, 'fourgrain'],
      ["J.P. Wiser's 10 Triple Barrel", 80, 'age10 light'],
      ["J.P. Wiser's 15", 80, 'age15'],
      ["J.P. Wiser's 18", 80, 'age18'],
      ["J.P. Wiser's Deluxe", 80, 'light'],
    ],
  },
  {
    d: 'Alberta Distillers', t: 'canadian',
    base: [5, 4, 5, 5, 8, 4, 3, 0, 3, 3],
    c: 'Alberta\'s 100%-rye prairie powerhouse.',
    e: [
      ['Alberta Premium', 80, 'light'],
      ['Alberta Premium Cask Strength Rye', 131.8, 'bp'],
    ],
  },
  {
    d: 'Forty Creek', t: 'canadian',
    base: [7, 4, 5, 6, 3, 5, 2, 0, 4, 1],
    c: 'Forty Creek\'s winemaker-built Ontario layering.',
    e: [
      ['Forty Creek Barrel Select', 80, 'light'],
      ['Forty Creek Copper Pot Reserve', 86, ''],
      ['Forty Creek Confederation Oak', 80, 'virgin'],
    ],
  },
  {
    d: 'Canadian Club', t: 'canadian',
    base: [6, 3, 5, 5, 4, 4, 2, 0, 2, 1],
    c: 'Canadian Club\'s historic Walkerville smoothness.',
    e: [
      ['Canadian Club 1858', 80, 'light'],
      ['Canadian Club Classic 12', 80, 'age12 light'],
      ['Canadian Club 100% Rye', 80, 'highrye light'],
      ['Canadian Club 40 Year', 90, 'age40 rich'],
    ],
  },
  {
    d: 'Caribou Crossing', t: 'canadian',
    base: [7, 4, 5, 6, 4, 4, 2, 0, 3, 1],
    c: 'Caribou Crossing\'s single-barrel Canadian rarity.',
    e: [
      ['Caribou Crossing Single Barrel', 80, 'sb'],
    ],
  },
  {
    d: 'Shelter Point', t: 'canadian',
    base: [6, 3, 4, 4, 3, 6, 4, 0, 3, 2],
    c: 'Shelter Point\'s Vancouver Island farm single malt.',
    e: [
      ['Shelter Point Single Malt', 92, ''],
      ['Shelter Point Cask Strength', 100, 'bp'],
    ],
  },
  {
    d: 'Stalk & Barrel', t: 'canadian',
    base: [6, 3, 4, 4, 5, 5, 3, 0, 3, 2],
    c: 'Still Waters\' small-batch Ontario craft.',
    e: [
      ['Stalk & Barrel Single Malt', 92, ''],
      ['Stalk & Barrel 100% Rye', 92, 'rye95'],
    ],
  },

  // ── World ───────────────────────────────────────────────────
  {
    d: 'Kavalan', t: 'other',
    base: [7, 4, 4, 5, 2, 8, 3, 0, 3, 1],
    c: 'Kavalan\'s tropical-fruit Taiwanese heat-accelerated maturation.',
    e: [
      ['Kavalan Classic Single Malt', 80, ''],
      ['Kavalan Concertmaster Port Cask', 80, 'port'],
      ['Kavalan Solist Ex-Bourbon', 115, 'bp honeyed'],
      ['Kavalan Solist Oloroso Sherry', 115, 'oloroso bp'],
      ['Kavalan Solist Vinho Barrique', 115, 'wine bp'],
      ['Kavalan King Car Conductor', 92, 'fruity2'],
    ],
  },
  {
    d: 'Amrut', t: 'other',
    base: [6, 4, 5, 5, 4, 6, 3, 1, 3, 2],
    c: 'Amrut\'s pioneering Bangalore tropical aging.',
    e: [
      ['Amrut Indian Single Malt', 92, ''],
      ['Amrut Fusion', 100, 'peat1'],
      ['Amrut Peated Indian Single Malt', 92, 'peat2'],
      ['Amrut Intermediate Sherry', 114.2, 'sherry bp'],
    ],
  },
  {
    d: 'Paul John', t: 'other',
    base: [6, 4, 5, 5, 3, 6, 3, 1, 3, 2],
    c: 'Paul John\'s Goan six-row-barley warmth.',
    e: [
      ['Paul John Brilliance', 92, ''],
      ['Paul John Bold', 92, 'peat2'],
      ['Paul John Nirvana', 80, 'light'],
      ['Paul John Peated Select Cask', 110.6, 'peat2 bp'],
      ['Paul John Christmas Edition', 92, 'sherry rich'],
    ],
  },
  {
    d: 'Rampur', t: 'other',
    base: [6, 4, 4, 5, 3, 6, 3, 0, 3, 1],
    c: 'Rampur\'s Himalayan-foothill Indian malt.',
    e: [
      ['Rampur Select', 86, ''],
      ['Rampur Double Cask', 90, 'sherry'],
    ],
  },
  {
    d: 'Indri', t: 'other',
    base: [6, 4, 5, 5, 3, 6, 3, 0, 3, 1],
    c: 'Indri\'s three-wood Indian single malt.',
    e: [
      ['Indri Trini Three Wood', 92, 'wine sherry'],
      ['Indri Dru Cask Strength', 114.6, 'bp honeyed'],
    ],
  },
  {
    d: 'Starward', t: 'other',
    base: [6, 3, 4, 4, 3, 7, 3, 0, 3, 1],
    c: 'Starward\'s red-wine-cask Melbourne modernism.',
    e: [
      ['Starward Nova', 82, 'wine'],
      ['Starward Solera', 86, 'sherry'],
      ['Starward Fortis', 100, 'wine bp'],
      ['Starward Two-Fold', 80, 'grain wine light'],
    ],
  },
  {
    d: 'Sullivans Cove', t: 'other',
    base: [6, 3, 4, 4, 3, 6, 4, 0, 4, 2],
    c: 'Sullivans Cove\'s awarded Tasmanian patience.',
    e: [
      ['Sullivans Cove American Oak', 95, ''],
      ['Sullivans Cove Double Cask', 80, 'port'],
    ],
  },
  {
    d: 'Milk & Honey', t: 'other',
    base: [6, 4, 4, 4, 3, 6, 3, 0, 3, 1],
    c: 'M&H\'s fast-aged Tel Aviv Mediterranean malt.',
    e: [
      ['Milk & Honey Classic', 92, ''],
      ['Milk & Honey Elements Sherry', 92, 'sherry'],
      ['Milk & Honey Elements Peated', 92, 'peat2'],
    ],
  },
  {
    d: 'Penderyn', t: 'other',
    base: [6, 3, 4, 4, 2, 6, 5, 0, 3, 1],
    c: 'Penderyn\'s Welsh Faraday-still delicacy.',
    e: [
      ['Penderyn Madeira', 92, 'madeira'],
      ['Penderyn Sherrywood', 92, 'sherry'],
      ['Penderyn Peated', 92, 'peat1'],
    ],
  },
  {
    d: 'Brenne', t: 'other',
    base: [7, 3, 4, 4, 2, 7, 5, 0, 3, 1],
    c: 'Brenne\'s cognac-country French single malt.',
    e: [
      ['Brenne Estate Cask', 80, 'cognac fruity2'],
      ['Brenne 10', 96, 'cognac age10'],
    ],
  },
  {
    d: 'Mackmyra', t: 'other',
    base: [6, 3, 4, 4, 3, 6, 4, 1, 3, 2],
    c: 'Mackmyra\'s Swedish-oak Nordic clarity.',
    e: [
      ['Mackmyra Svensk Ek', 92.6, 'virgin'],
      ['Mackmyra Brukswhisky', 82.6, 'light'],
    ],
  },
  {
    d: 'Kyrö', t: 'other',
    base: [5, 3, 4, 4, 7, 4, 3, 1, 3, 3],
    c: 'Kyrö\'s Finnish rye sauna spirit.',
    e: [
      ['Kyrö Malt Rye', 94.2, 'rye95'],
      ['Kyrö Wood Smoke', 94.2, 'rye95 peat1'],
    ],
  },
  {
    d: 'Nc\'nean', t: 'other',
    base: [6, 3, 4, 3, 2, 6, 5, 0, 3, 2],
    c: 'Nc\'nean\'s organic light-spirited West Highland (bottled as organic Scottish malt).',
    e: [
      ['Nc\'nean Organic Single Malt', 92, ''],
    ],
  },
  {
    d: 'The English Distillery', t: 'other',
    base: [6, 3, 4, 4, 2, 6, 4, 1, 3, 1],
    c: 'The English\'s Norfolk barley pioneering.',
    e: [
      ['The English Original', 86, ''],
      ['The English Smokey', 86, 'peat2'],
    ],
  },
  {
    d: 'Cotswolds', t: 'other',
    base: [6, 4, 4, 5, 2, 6, 4, 0, 3, 1],
    c: 'Cotswolds\' honeyed English-countryside malt.',
    e: [
      ['Cotswolds Signature Single Malt', 92, 'wine'],
      ['Cotswolds Founder\'s Choice', 121.4, 'wine bp'],
      ['Cotswolds Sherry Cask', 115.4, 'sherry bp'],
    ],
  },
  {
    d: 'The Lakes', t: 'other',
    base: [6, 4, 4, 4, 3, 7, 3, 0, 3, 1],
    c: 'The Lakes\' sherry-led Cumbrian whiskymaking.',
    e: [
      ['The Lakes Whiskymaker\'s Reserve', 104, 'sherry bp'],
      ['The Lakes The One Signature Blend', 93.4, 'light sherry'],
    ],
  },
  {
    d: 'Bimber', t: 'other',
    base: [6, 3, 5, 4, 2, 7, 4, 0, 3, 1],
    c: 'Bimber\'s hand-crafted London single malt.',
    e: [
      ['Bimber Ex-Bourbon Cask', 103.4, 'honeyed'],
    ],
  },
  {
    d: 'Puni', t: 'other',
    base: [6, 3, 4, 4, 3, 6, 4, 0, 3, 1],
    c: 'Puni\'s alpine Italian three-grain novelty.',
    e: [
      ['Puni Gold', 86, ''],
    ],
  },
  {
    d: 'Slyrs', t: 'other',
    base: [6, 3, 4, 4, 3, 6, 4, 0, 3, 2],
    c: 'Slyrs\' Bavarian-lake mountain malt.',
    e: [
      ['Slyrs Classic Single Malt', 86, ''],
    ],
  },
  {
    d: 'Teerenpeli', t: 'other',
    base: [6, 3, 4, 4, 2, 6, 4, 1, 3, 2],
    c: 'Teerenpeli\'s Finnish sauna-country malt.',
    e: [
      ['Teerenpeli Kaski Sherry Cask', 86, 'sherry'],
    ],
  },
];
