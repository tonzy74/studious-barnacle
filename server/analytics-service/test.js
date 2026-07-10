'use strict';

/* Zero-dependency tests: `node test.js`. Exits non-zero on failure. */

const assert = require('assert');
const { sanitizeBatch, sanitizeEvent, computeFunnel } = require('./lib/aggregate');

let passed = 0;
const ok = (name, fn) => {
  fn();
  passed += 1;
  console.log(`  ✓ ${name}`);
};

ok('drops events with a disallowed name', () => {
  assert.strictEqual(sanitizeEvent({ name: 'steal_pii', anonId: 'a', at: 1 }), null);
});

ok('drops events with no anon id', () => {
  assert.strictEqual(sanitizeEvent({ name: 'app_opened', at: 1 }), null);
});

ok('strips non-allowlisted props (no PII can enter)', () => {
  const e = sanitizeEvent({
    name: 'bottle_added',
    anonId: 'a',
    at: 1,
    props: { type: 'bourbon', email: 'x@y.com', notes: 'secret' },
  });
  assert.deepStrictEqual(e.props, { type: 'bourbon' });
});

ok('caps string props and keeps scalars', () => {
  const e = sanitizeEvent({
    name: 'pro_purchased',
    anonId: 'a',
    at: 1,
    props: { plan: 'x'.repeat(100), count: 3, matched: true },
  });
  assert.strictEqual(e.props.plan.length, 32);
  assert.strictEqual(e.props.count, 3);
  assert.strictEqual(e.props.matched, true);
});

ok('sanitizeBatch counts rejects', () => {
  const { clean, rejected } = sanitizeBatch([
    { name: 'app_opened', anonId: 'a', at: 1 },
    { name: 'bogus', anonId: 'a', at: 1 },
    42,
  ]);
  assert.strictEqual(clean.length, 1);
  assert.strictEqual(rejected, 2);
});

ok('computeFunnel derives activation and conversion', () => {
  const events = [
    { name: 'app_opened', anonId: 'u1', at: 1, props: {} },
    { name: 'app_opened', anonId: 'u2', at: 1, props: {} },
    { name: 'app_opened', anonId: 'u3', at: 1, props: {} },
    { name: 'bottle_added', anonId: 'u1', at: 2, props: {} },
    { name: 'bottle_added', anonId: 'u2', at: 2, props: {} },
    { name: 'paywall_shown', anonId: 'u1', at: 3, props: {} },
    { name: 'paywall_shown', anonId: 'u2', at: 3, props: {} },
    { name: 'pro_purchased', anonId: 'u1', at: 4, props: { plan: 'annual' } },
  ];
  const f = computeFunnel(events);
  assert.strictEqual(f.users, 3);
  assert.strictEqual(f.activated, 2);
  assert.ok(Math.abs(f.activationRate - 2 / 3) < 1e-9);
  assert.strictEqual(f.paywallViews, 2);
  assert.strictEqual(f.purchases, 1);
  assert.strictEqual(f.paywallConversion, 0.5); // 1 of 2 viewers bought
  assert.strictEqual(f.purchaseRate, 0.5); // 1 of 2 activated bought
  assert.strictEqual(f.bottlesAdded, 2);
});

ok('deduplicates users across repeated events', () => {
  const events = [
    { name: 'bottle_added', anonId: 'u1', at: 1, props: {} },
    { name: 'bottle_added', anonId: 'u1', at: 2, props: {} },
  ];
  const f = computeFunnel(events);
  assert.strictEqual(f.activated, 1);
  assert.strictEqual(f.bottlesAdded, 2);
});

console.log(`\n${passed} tests passed.`);
