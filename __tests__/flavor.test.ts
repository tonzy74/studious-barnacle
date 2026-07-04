import { FLAVOR_AXES, TYPE_DEFAULTS, WHISKEY_DB } from '../src/data/whiskeyDatabase';
import {
  averageProfiles,
  cosineSimilarity,
  findWhiskeyByBarcode,
  findWhiskeyByName,
  findWhiskeyCandidates,
  matchCollection,
  randomPour,
  scaleProfileForProof,
  toVector,
} from '../src/lib/flavor';
import { cleanExternalText } from '../src/lib/barcodeLookup';
import { buildLearnedRecord } from '../src/lib/library';
import { fairPrice } from '../src/lib/pricing';
import { Bottle } from '../src/types';

function bottleFrom(recordId: string, overrides: Partial<Bottle> = {}): Bottle {
  const record = WHISKEY_DB.find((r) => r.id === recordId)!;
  return {
    id: recordId,
    name: record.name,
    distillery: record.distillery,
    type: record.type,
    proof: record.proof,
    refId: record.id,
    flavor: { ...record.flavor },
    notes: record.notes,
    opened: false,
    quantity: 1,
    addedAt: 0,
    ...overrides,
  };
}

describe('whiskey database', () => {
  it('has expanded to a large catalog', () => {
    const byType: Record<string, number> = {};
    for (const r of WHISKEY_DB) byType[r.type] = (byType[r.type] ?? 0) + 1;
    console.log(`WHISKEY_DB total: ${WHISKEY_DB.length}`, byType);
    expect(WHISKEY_DB.length).toBeGreaterThanOrEqual(1000);
  });

  it('has valid flavor values on every record', () => {
    for (const record of WHISKEY_DB) {
      for (const axis of FLAVOR_AXES) {
        expect(record.flavor[axis]).toBeGreaterThanOrEqual(0);
        expect(record.flavor[axis]).toBeLessThanOrEqual(10);
      }
      expect(record.notes.length).toBeGreaterThan(20);
      expect(record.proof).toBeGreaterThan(0);
    }
  });

  it('has unique ids and no duplicate names', () => {
    const ids = WHISKEY_DB.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    const names = WHISKEY_DB.map((r) => r.name.toLowerCase().replace(/[^a-z0-9]+/g, ''));
    expect(new Set(names).size).toBe(names.length);
  });

  it('resolves a broad set of popular bottles by casual name', () => {
    const expectations: [string, string][] = [
      ['weller full proof', 'W.L. Weller Full Proof'],
      ['stagg', 'Stagg'],
      ['george t stagg', 'George T. Stagg'],
      ['pappy 15', 'Pappy Van Winkle 15 Year'],
      ['larceny barrel proof', 'Larceny Barrel Proof'],
      ['old grand dad 114', 'Old Grand-Dad 114'],
      ['rare breed', 'Wild Turkey Rare Breed'],
      ['old forester 1910', 'Old Forester 1910 Old Fine Whisky'],
      ['makers cask strength', "Maker's Mark Cask Strength"],
      ['michters toasted bourbon', "Michter's Toasted Barrel Finish Bourbon"],
      ['smoke wagon uncut', 'Smoke Wagon Uncut Unfiltered'],
      ['whistlepig boss hog', 'WhistlePig The Boss Hog'],
      ['glenfiddich 15', 'Glenfiddich 15 Solera'],
      ['macallan 18', 'The Macallan 18 Sherry Oak'],
      ['abunadh', "Aberlour A'bunadh"],
      ['octomore', 'Octomore 14.1'],
      ['springbank 10', 'Springbank 10'],
      ['redbreast 15', 'Redbreast 15'],
      ['yamazaki 18', 'Yamazaki 18'],
      ['nikka coffey grain', 'Nikka Coffey Grain'],
      ['lot 40 cask strength', 'Lot No. 40 Cask Strength'],
      ['kavalan solist sherry', 'Kavalan Solist Oloroso Sherry'],
    ];
    for (const [query, expected] of expectations) {
      expect(findWhiskeyByName(query)?.name).toBe(expected);
    }
  });

  it('has defaults for every whiskey type', () => {
    expect(Object.keys(TYPE_DEFAULTS).sort()).toEqual(
      ['bourbon', 'canadian', 'irish', 'japanese', 'other', 'rye', 'scotch', 'tennessee'].sort()
    );
  });
});

describe('cosineSimilarity', () => {
  it('is 1 for identical vectors', () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1);
  });

  it('is 0 for orthogonal vectors', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
  });

  it('handles zero vectors without NaN', () => {
    expect(cosineSimilarity([0, 0], [1, 2])).toBe(0);
  });
});

describe('findWhiskeyByName', () => {
  it('matches exact names', () => {
    expect(findWhiskeyByName('Buffalo Trace')?.id).toBe('buffalo-trace');
  });

  it('matches partial and casual names', () => {
    expect(findWhiskeyByName('weller special reserve')?.id).toBe('weller-sb');
    expect(findWhiskeyByName("blanton's")?.id).toBe('blantons');
    expect(findWhiskeyByName('eagle rare')?.id).toBe('eagle-rare-10');
    expect(findWhiskeyByName('laphroaig')?.id).toBe('laphroaig-10');
  });

  it('rejects nonsense', () => {
    expect(findWhiskeyByName('zzzz qqqq')).toBeUndefined();
    expect(findWhiskeyByName('')).toBeUndefined();
    expect(findWhiskeyByName('some random whiskey')).toBeUndefined();
  });

  it('ignores batch codes and pick vocabulary', () => {
    expect(findWhiskeyByName('elijah craig barrel proof C923')?.name).toBe(
      'Elijah Craig Barrel Proof'
    );
    expect(findWhiskeyByName("blanton's total wine pick")?.id).toBe('blantons');
    expect(findWhiskeyByName('four roses single barrel store pick')?.name).toBe(
      'Four Roses Single Barrel'
    );
  });

  it('expands collector shorthand aliases', () => {
    expect(findWhiskeyByName('ecbp')?.name).toBe('Elijah Craig Barrel Proof');
    expect(findWhiskeyByName('gts')?.name).toBe('George T. Stagg');
    expect(findWhiskeyByName('wlw')?.name).toBe('William Larue Weller');
    expect(findWhiskeyByName('sftb')?.name).toBe("Blanton's Straight From The Barrel");
  });
});

describe('findWhiskeyCandidates', () => {
  it('returns a ranked list, best match first', () => {
    const c = findWhiskeyCandidates('weller');
    expect(c.length).toBeGreaterThan(1);
    // Sorted by descending score.
    for (let i = 1; i < c.length; i++) {
      expect(c[i - 1].score).toBeGreaterThanOrEqual(c[i].score);
    }
    // The single-best helper agrees with candidates[0].
    expect(findWhiskeyByName('weller')?.id).toBe(c[0].record.id);
  });

  it('offers multiple Weller expressions to correct a wrong guess', () => {
    const ids = findWhiskeyCandidates('weller').map((c) => c.record.id);
    expect(new Set(ids).size).toBe(ids.length); // no duplicates
    expect(ids.length).toBeGreaterThanOrEqual(2);
  });

  it('respects the limit and rejects nonsense', () => {
    expect(findWhiskeyCandidates('bourbon', [], 3).length).toBeLessThanOrEqual(3);
    expect(findWhiskeyCandidates('zzzz qqqq')).toHaveLength(0);
    expect(findWhiskeyCandidates('')).toHaveLength(0);
  });
});

describe('scaleProfileForProof', () => {
  const base = WHISKEY_DB.find((r) => r.id === 'ecbp')!;

  it('intensifies oak/spice/caramel for hotter picks', () => {
    const scaled = scaleProfileForProof(base.flavor, 124, 134);
    expect(scaled.oak).toBeGreaterThan(base.flavor.oak);
    expect(scaled.spice).toBeGreaterThan(base.flavor.spice);
    expect(scaled.caramel).toBeGreaterThan(base.flavor.caramel);
    expect(scaled.fruit).toBe(base.flavor.fruit);
  });

  it('softens for lower-proof variants and clamps to range', () => {
    const scaled = scaleProfileForProof(base.flavor, 124, 94);
    expect(scaled.oak).toBeLessThan(base.flavor.oak);
    for (const axis of FLAVOR_AXES) {
      expect(scaled[axis]).toBeGreaterThanOrEqual(0);
      expect(scaled[axis]).toBeLessThanOrEqual(10);
    }
  });

  it('is a no-op for equal proof', () => {
    expect(scaleProfileForProof(base.flavor, 124, 124)).toEqual(base.flavor);
  });
});

describe('findWhiskeyByBarcode', () => {
  it('resolves a known UPC', () => {
    expect(findWhiskeyByBarcode('080244009963')?.id).toBe('buffalo-trace');
  });

  it('returns undefined for unknown codes', () => {
    expect(findWhiskeyByBarcode('000000000000')).toBeUndefined();
  });
});

describe('matchCollection', () => {
  const collection = [
    bottleFrom('weller-sb'),
    bottleFrom('makers-mark'),
    bottleFrom('laphroaig-10'),
    bottleFrom('rittenhouse'),
  ];

  it('ranks similar-profile bottles above dissimilar ones', () => {
    // Someone who loves soft wheated bourbons should match Weller/Maker's
    // far above a peated Islay scotch.
    const { results, unrecognized } = matchCollection(
      ["Blanton's", 'Eagle Rare'],
      collection
    );
    expect(unrecognized).toHaveLength(0);
    expect(results).toHaveLength(4);
    const names = results.map((r) => r.bottle.refId);
    expect(names.indexOf('weller-sb')).toBeLessThan(names.indexOf('laphroaig-10'));
    expect(results[results.length - 1].bottle.refId).toBe('laphroaig-10');
    for (const r of results) {
      expect(r.percent).toBeGreaterThanOrEqual(0);
      expect(r.percent).toBeLessThanOrEqual(100);
    }
  });

  it('reports unrecognized favorites without failing', () => {
    const { results, unrecognized, recognized } = matchCollection(
      ['Buffalo Trace', 'xyzzy fake whiskey'],
      collection
    );
    expect(recognized.map((r) => r.id)).toEqual(['buffalo-trace']);
    expect(unrecognized).toEqual(['xyzzy fake whiskey']);
    expect(results).toHaveLength(4);
  });

  it('returns nothing when no favorites are recognized', () => {
    const { results, unrecognized } = matchCollection(['xyzzy'], collection);
    expect(results).toHaveLength(0);
    expect(unrecognized).toEqual(['xyzzy']);
  });

  it('gives a peat lover the peated bottle', () => {
    const { results } = matchCollection(['Ardbeg 10', 'Lagavulin 16'], collection);
    expect(results[0].bottle.refId).toBe('laphroaig-10');
  });
});

describe('randomPour', () => {
  const collection = [
    bottleFrom('buffalo-trace', { opened: true }),
    bottleFrom('rittenhouse', { opened: false }),
    bottleFrom('laphroaig-10', { opened: false, quantity: 0 }),
  ];

  it('respects the openedOnly filter', () => {
    for (let i = 0; i < 20; i++) {
      expect(randomPour(collection, { openedOnly: true })?.refId).toBe('buffalo-trace');
    }
  });

  it('respects the type filter', () => {
    for (let i = 0; i < 20; i++) {
      expect(randomPour(collection, { type: 'rye' })?.refId).toBe('rittenhouse');
    }
  });

  it('never picks zero-quantity bottles', () => {
    for (let i = 0; i < 50; i++) {
      expect(randomPour(collection)?.refId).not.toBe('laphroaig-10');
    }
  });

  it('returns undefined when nothing matches', () => {
    expect(randomPour(collection, { type: 'japanese' })).toBeUndefined();
    expect(randomPour([])).toBeUndefined();
  });
});

describe('averageProfiles / toVector', () => {
  it('averages element-wise', () => {
    const a = WHISKEY_DB[0].flavor;
    const avg = averageProfiles([a, a]);
    expect(toVector(avg)).toEqual(toVector(a));
  });
});

describe('rarity tiers', () => {
  it('assigns every record a tier', () => {
    for (const r of WHISKEY_DB) {
      expect(['S', 'A', 'B', 'C', 'D']).toContain(r.rarity);
    }
  });

  it('assigns allocation-aware tiers', () => {
    const byName = (q: string) => findWhiskeyByName(q)?.rarity;
    expect(byName('Pappy Van Winkle 15 Year')).toBe('S');
    expect(byName('George T. Stagg')).toBe('S');
    expect(byName('William Larue Weller')).toBe('S');
    expect(byName("Blanton's Original Single Barrel")).toBe('A');
    expect(byName('W.L. Weller 12 Year')).toBe('A');
    expect(byName('E.H. Taylor Small Batch')).toBe('A');
    expect(byName('Elijah Craig Barrel Proof')).toBe('B');
    expect(byName('Buffalo Trace')).toBe('B');
    expect(byName('Woodford Reserve')).toBe('C');
    expect(byName('Jim Beam White Label')).toBe('D');
    expect(byName('Old Crow')).toBe('D');
  });

  it('protects allocated bottles in random pours', () => {
    const collection = [
      bottleFrom('pappy-van-winkle-15-year', { rarity: 'S' }),
      bottleFrom('buffalo-trace', { rarity: 'B' }),
    ];
    for (let i = 0; i < 30; i++) {
      expect(randomPour(collection, { protectAllocated: true })?.rarity).toBe('B');
    }
    // Without protection, both can come up.
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) {
      seen.add(randomPour(collection)!.rarity!);
    }
    expect(seen.has('S')).toBe(true);
  });
});

describe('pricing', () => {
  it('anchors famous bottles', () => {
    const pappy = findWhiskeyByName('Pappy Van Winkle 15 Year')!;
    expect(pappy.msrp).toBeDefined();
    expect(pappy.secondary).toBeGreaterThan(pappy.msrp!);
    const bt = findWhiskeyByName('Buffalo Trace')!;
    expect(bt.msrp).toBeLessThan(50);
  });

  it('computes fair price by rarity drift', () => {
    // Shelf bottle: fair ≈ MSRP.
    expect(fairPrice(30, 40, 'C')).toBe(31);
    // Allocated: drifts toward secondary.
    expect(fairPrice(100, 1100, 'S')).toBe(650);
    expect(fairPrice(50, 280, 'A')).toBe(142);
    // Secondary below retail: retail wins.
    expect(fairPrice(100, 80, 'A')).toBe(100);
    // Missing data degrades gracefully.
    expect(fairPrice(undefined, undefined, 'C')).toBeUndefined();
    expect(fairPrice(undefined, 200, 'A')).toBe(200);
    expect(fairPrice(40, undefined, 'C')).toBe(40);
  });
});

describe('learned library', () => {
  it('builds a full record from partial info without an API key', async () => {
    const record = await buildLearnedRecord({
      name: 'Mystery Craft Kentucky Straight Bourbon',
      brand: 'Mystery Distilling',
      barcode: '012345678905',
    });
    expect(record.learned).toBe(true);
    expect(record.type).toBe('bourbon');
    expect(record.barcodes).toEqual(['012345678905']);
    expect(record.rarity).toBe('C');
    expect(record.flavor.sweet).toBeGreaterThan(0);
  });

  it('guesses types from names', async () => {
    expect((await buildLearnedRecord({ name: 'Foobar Straight Rye Whiskey' })).type).toBe('rye');
    expect((await buildLearnedRecord({ name: 'Glen Foobar Islay Single Malt Scotch' })).type).toBe(
      'scotch'
    );
    expect((await buildLearnedRecord({ name: 'Foobar Irish Whiskey' })).type).toBe('irish');
  });

  it('searches learned records alongside the built-in DB', () => {
    const learned = [
      {
        id: 'learned-mystery',
        name: 'Mystery Craft Bourbon Deluxe',
        distillery: 'Mystery Distilling',
        type: 'bourbon' as const,
        proof: 100,
        flavor: WHISKEY_DB[0].flavor,
        notes: 'A learned record.',
        barcodes: ['099999999999'],
        learned: true,
      },
    ];
    expect(findWhiskeyByName('mystery craft deluxe', learned)?.id).toBe('learned-mystery');
    expect(findWhiskeyByBarcode('099999999999', learned)?.id).toBe('learned-mystery');
    expect(findWhiskeyByBarcode('099999999999')).toBeUndefined();
  });
});

describe('trade engine', () => {
  const { bottleTradeValue, evaluateTrade, OPENED_MULTIPLIER } = require('../src/lib/trade');

  it('values sealed bottles at the fair-price anchor and discounts opened ones', () => {
    const sealed = bottleTradeValue({ msrp: 100, secondary: 1100, rarity: 'S', opened: false });
    const opened = bottleTradeValue({ msrp: 100, secondary: 1100, rarity: 'S', opened: true });
    expect(sealed).toEqual({ value: 650, confidence: 'anchor' });
    expect(opened!.value).toBe(Math.round(650 * OPENED_MULTIPLIER));
  });

  it('returns undefined without pricing data', () => {
    expect(bottleTradeValue({ rarity: 'B' })).toBeUndefined();
  });

  it('judges fairness within a ±10% band', () => {
    expect(
      evaluateTrade({ myBottleValues: [100], theirBottleValues: [105] }).verdict
    ).toBe('fair');
    expect(
      evaluateTrade({ myBottleValues: [100], theirBottleValues: [200] }).verdict
    ).toBe('you-win');
    expect(
      evaluateTrade({ myBottleValues: [200], theirBottleValues: [100] }).verdict
    ).toBe('they-win');
  });

  it('cash kickers rebalance a lopsided trade', () => {
    // Their Blanton's ($110) for my Weller 12 ($148) is unfair...
    const without = evaluateTrade({ myBottleValues: [148], theirBottleValues: [110] });
    expect(without.verdict).toBe('they-win');
    // ...until they add $40 cash.
    const withCash = evaluateTrade({
      myBottleValues: [148],
      theirBottleValues: [110],
      theirCash: 40,
    });
    expect(withCash.verdict).toBe('fair');
  });

  it('ignores negative cash and non-finite values', () => {
    const evaln = evaluateTrade({
      myBottleValues: [100, NaN],
      theirBottleValues: [100],
      myCash: -50,
    });
    expect(evaln.myTotal).toBe(100);
    expect(evaln.verdict).toBe('fair');
  });

  it('cannot be tricked into a fair verdict with Infinity cash', () => {
    const evaln = evaluateTrade({
      myBottleValues: [1800], // your Pappy 15
      theirBottleValues: [40], // their Buffalo Trace
      theirCash: Infinity, // "just paste this value, bro"
    });
    expect(evaln.theirTotal).toBe(40);
    expect(evaln.verdict).toBe('they-win');
    expect(Number.isFinite(evaln.delta)).toBe(true);
  });
});

describe('validateIdentifiedBottles (shelf-photo vision output)', () => {
  const { validateIdentifiedBottles } = require('../src/lib/claude');

  it('normalizes valid entries and dedupes', () => {
    const out = validateIdentifiedBottles({
      bottles: [
        { name: 'Eagle Rare 10 Year', distillery: 'Buffalo Trace', type: 'bourbon', proof: 90, confidence: 'high' },
        { name: 'Eagle Rare 10 Year!', distillery: 'Buffalo Trace', type: 'bourbon', proof: 90, confidence: 'high' },
        { name: 'Laphroaig 10', distillery: 'Laphroaig', type: 'scotch', proof: 0, confidence: 'medium' },
      ],
    });
    expect(out).toHaveLength(2);
    expect(out[0].name).toBe('Eagle Rare 10 Year');
    expect(out[1].proof).toBeUndefined();
  });

  it('rejects malformed entries, bad types, and absurd proofs', () => {
    const out = validateIdentifiedBottles({
      bottles: [
        { name: '', distillery: 'X', type: 'bourbon', proof: 90, confidence: 'high' },
        { name: 'Okay Bottle', distillery: 'X', type: 'vodka', proof: 900, confidence: 'wat' },
        'not-an-object',
        null,
      ],
    });
    expect(out).toHaveLength(1);
    expect(out[0]).toEqual({
      name: 'Okay Bottle',
      distillery: 'X',
      type: 'other',
      proof: undefined,
      confidence: 'low',
    });
  });

  it('handles garbage payloads and caps at 40', () => {
    expect(validateIdentifiedBottles({})).toEqual([]);
    expect(validateIdentifiedBottles({ bottles: 'nope' })).toEqual([]);
    const many = {
      bottles: Array.from({ length: 60 }, (_, i) => ({
        name: `Bottle ${i}`,
        distillery: 'D',
        type: 'bourbon',
        proof: 90,
        confidence: 'high',
      })),
    };
    expect(validateIdentifiedBottles(many)).toHaveLength(40);
  });
});

describe('analytics privacy rules', () => {
  const { buildEvent, sanitizeEventProps } = require('../src/lib/analyticsCore');

  it('drops non-allowlisted properties (no PII can enter events)', () => {
    const props = sanitizeEventProps({
      type: 'bourbon',
      rarity: 'A',
      name: 'Secret Bottle Name',
      email: 'user@example.com',
      notes: 'personal tasting notes',
      count: 3,
    });
    expect(props).toEqual({ type: 'bourbon', rarity: 'A', count: 3 });
  });

  it('caps string lengths and rejects non-scalar values', () => {
    const props = sanitizeEventProps({ type: 'x'.repeat(200), source: { evil: true } });
    expect((props.type as string).length).toBe(32);
    expect(props.source).toBeUndefined();
  });

  it('rejects unknown event names', () => {
    expect(buildEvent('exfiltrate_everything', {}, 'anon-1')).toBeUndefined();
    expect(buildEvent('bottle_added', { type: 'rye' }, 'anon-1')?.name).toBe('bottle_added');
  });
});

describe('cleanExternalText', () => {
  it('strips control characters and collapses whitespace', () => {
    expect(cleanExternalText('Evil Name \n\n  Bourbon')).toBe('Evil Name Bourbon');
  });

  it('caps length and rejects non-strings', () => {
    expect(cleanExternalText('x'.repeat(500))!.length).toBe(120);
    expect(cleanExternalText(42)).toBeUndefined();
    expect(cleanExternalText('   ')).toBeUndefined();
    expect(cleanExternalText(undefined)).toBeUndefined();
  });
});
