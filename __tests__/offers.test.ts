import { parsePricingResponse } from '../src/lib/offers';

describe('parsePricingResponse', () => {
  it('keeps valid https offers, sorted by price', () => {
    const r = parsePricingResponse({
      msrp: 40,
      secondary: 70,
      offers: [
        { retailer: 'ReserveBar', price: 55, url: 'https://reservebar.com/x?aff=me', currency: 'USD', inStock: true },
        { retailer: 'Wine.com', price: 45, url: 'https://wine.com/y?u=me', currency: 'USD' },
      ],
      updatedAt: '2026-07-05T00:00:00Z',
    });
    expect(r).toBeDefined();
    expect(r!.offers.map((o) => o.retailer)).toEqual(['Wine.com', 'ReserveBar']);
    expect(r!.msrp).toBe(40);
  });

  it('drops offers with non-https or dangerous urls', () => {
    const r = parsePricingResponse({
      offers: [
        { retailer: 'Evil', price: 10, url: 'javascript:alert(1)', currency: 'USD' },
        { retailer: 'AlsoEvil', price: 10, url: 'http://insecure.com', currency: 'USD' },
        { retailer: 'Good', price: 10, url: 'https://good.com/p', currency: 'USD' },
      ],
    });
    expect(r!.offers).toHaveLength(1);
    expect(r!.offers[0].retailer).toBe('Good');
  });

  it('rejects non-finite, negative, and absurd prices', () => {
    const r = parsePricingResponse({
      offers: [
        { retailer: 'A', price: -5, url: 'https://a.com' },
        { retailer: 'B', price: 1e9, url: 'https://b.com' },
        { retailer: 'C', price: 'not a number', url: 'https://c.com' },
        { retailer: 'D', price: 49.99, url: 'https://d.com' },
      ],
    });
    expect(r!.offers.map((o) => o.retailer)).toEqual(['D']);
  });

  it('sanitizes control chars and caps retailer length', () => {
    const ctrl = String.fromCharCode(0) + String.fromCharCode(27);
    const r = parsePricingResponse({
      offers: [{ retailer: `Big${ctrl}Retailer${'X'.repeat(200)}`, price: 30, url: 'https://x.com' }],
    });
    const name = r!.offers[0].retailer;
    expect(name.length).toBeLessThanOrEqual(60);
    expect(new RegExp('[\\u0000-\\u001f]').test(name)).toBe(false);
  });

  it('caps the number of offers', () => {
    const many = Array.from({ length: 50 }, (_, i) => ({
      retailer: `R${i}`,
      price: 10 + i,
      url: `https://r${i}.com`,
    }));
    const r = parsePricingResponse({ offers: many });
    expect(r!.offers.length).toBeLessThanOrEqual(12);
  });

  it('returns undefined when nothing usable comes back', () => {
    expect(parsePricingResponse({ offers: [] })).toBeUndefined();
    expect(parsePricingResponse({})).toBeUndefined();
    expect(parsePricingResponse(null)).toBeUndefined();
    expect(parsePricingResponse('nope')).toBeUndefined();
  });

  it('ignores prototype-pollution payloads', () => {
    const r = parsePricingResponse(
      JSON.parse('{"offers":[{"retailer":"X","price":10,"url":"https://x.com","__proto__":{"polluted":true}}]}')
    );
    expect(r!.offers).toHaveLength(1);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
});
