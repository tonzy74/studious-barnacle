'use strict';

/** Tiny smoke test — no framework. Run: `node test.js`. */
const assert = require('assert');
const { matchProduct, normKey } = require('./lib/catalog');
const { buildOffers, withTracking } = require('./lib/affiliate');

const catalog = [
  {
    name: 'Eagle Rare 10 Year',
    nameKey: normKey('Eagle Rare 10 Year'),
    upcs: ['088004021351'],
    msrp: 40,
    secondary: 70,
    imageUrl: 'https://x/e.jpg',
    offers: [
      { retailer: 'ReserveBar', price: 64.99, url: 'https://www.reservebar.com/p/eagle-rare' },
      { retailer: 'Evil', price: 10, url: 'javascript:alert(1)' },
      { retailer: 'Cheap', price: 59.99, url: 'https://wine.com/p/eagle-rare' },
    ],
  },
];

// UPC match wins.
assert.strictEqual(matchProduct(catalog, { upc: '088004021351' }).name, 'Eagle Rare 10 Year');
// Name match.
assert.strictEqual(matchProduct(catalog, { name: 'eagle rare 10' }).name, 'Eagle Rare 10 Year');
// Nonsense doesn't match.
assert.strictEqual(matchProduct(catalog, { name: 'zzz qqq' }), null);

// Offers: drop the javascript: url, sort by price, keep valid ones.
const offers = buildOffers(catalog[0]);
assert.strictEqual(offers.length, 2);
assert.strictEqual(offers[0].retailer, 'Cheap'); // cheapest first
assert.ok(offers.every((o) => o.url.startsWith('https://')));

// Tracking is appended (subId) when not already a tracking link.
const tracked = withTracking('https://www.reservebar.com/p/eagle-rare');
assert.ok(/subId1=/.test(tracked));
// Pre-tracked links pass through untouched.
assert.strictEqual(
  withTracking('https://x.com/p?irclickid=abc'),
  'https://x.com/p?irclickid=abc'
);

// eslint-disable-next-line no-console
console.log('affiliate-price-service: all smoke tests passed');
