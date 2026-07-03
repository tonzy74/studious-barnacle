import { FLAVOR_AXES, TYPE_DEFAULTS, WHISKEY_DB } from '../src/data/whiskeyDatabase';
import {
  averageProfiles,
  cosineSimilarity,
  findWhiskeyByBarcode,
  findWhiskeyByName,
  matchCollection,
  randomPour,
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

  it('has unique ids', () => {
    const ids = WHISKEY_DB.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
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
