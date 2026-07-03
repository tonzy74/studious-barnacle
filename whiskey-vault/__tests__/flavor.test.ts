import { FLAVOR_AXES, TYPE_DEFAULTS, WHISKEY_DB } from '../src/data/whiskeyDatabase';
import {
  averageProfiles,
  cosineSimilarity,
  findWhiskeyByBarcode,
  findWhiskeyByName,
  matchCollection,
  randomPour,
  scaleProfileForProof,
  toVector,
} from '../src/lib/flavor';
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
