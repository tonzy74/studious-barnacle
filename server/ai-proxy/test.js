'use strict';

/* Zero-dependency tests: `node test.js`. */

const assert = require('assert');
const { monthKey, evaluate } = require('./lib/quota');
const { applyEvent, isActive, statusFromEvent } = require('./lib/entitlement');

let passed = 0;
const ok = (name, fn) => {
  fn();
  passed += 1;
  console.log(`  ✓ ${name}`);
};

const JAN = Date.UTC(2026, 0, 15);
const FEB = Date.UTC(2026, 1, 3);

ok('monthKey buckets by UTC month', () => {
  assert.strictEqual(monthKey(JAN), '2026-01');
  assert.strictEqual(monthKey(FEB), '2026-02');
});

ok('a fresh free install is allowed and counts up', () => {
  const r = evaluate(undefined, JAN, 3, false);
  assert.strictEqual(r.allowed, true);
  assert.strictEqual(r.remaining, 2);
  assert.strictEqual(r.record.count, 1);
});

ok('free install is blocked once quota is spent', () => {
  const spent = { month: '2026-01', count: 3 };
  const r = evaluate(spent, JAN, 3, false);
  assert.strictEqual(r.allowed, false);
  assert.strictEqual(r.remaining, 0);
});

ok('quota resets on a new month', () => {
  const spent = { month: '2026-01', count: 3 };
  const r = evaluate(spent, FEB, 3, false);
  assert.strictEqual(r.allowed, true);
  assert.strictEqual(r.record.month, '2026-02');
  assert.strictEqual(r.record.count, 1);
});

ok('Pro is unlimited and never counted', () => {
  const spent = { month: '2026-01', count: 999 };
  const r = evaluate(spent, JAN, 3, true);
  assert.strictEqual(r.allowed, true);
  assert.strictEqual(r.remaining, Infinity);
  assert.strictEqual(r.record.count, 999); // unchanged
});

const NOW = Date.UTC(2026, 5, 1);
const FUTURE = NOW + 30 * 86400000;
const PAST = NOW - 86400000;

ok('a purchase grants Pro until expiration', () => {
  const m = new Map();
  applyEvent(m, { type: 'INITIAL_PURCHASE', app_user_id: 'u1', expiration_at_ms: FUTURE }, NOW);
  assert.strictEqual(isActive(m.get('u1'), NOW), true);
});

ok('an expiration revokes Pro', () => {
  const m = new Map();
  applyEvent(m, { type: 'INITIAL_PURCHASE', app_user_id: 'u1', expiration_at_ms: FUTURE }, NOW);
  applyEvent(m, { type: 'EXPIRATION', app_user_id: 'u1', expiration_at_ms: PAST }, NOW);
  assert.strictEqual(isActive(m.get('u1'), NOW), false);
});

ok('cancellation keeps access until the period ends', () => {
  const m = new Map();
  applyEvent(m, { type: 'CANCELLATION', app_user_id: 'u1', expiration_at_ms: FUTURE }, NOW);
  assert.strictEqual(isActive(m.get('u1'), NOW), true);
});

ok('an elapsed expiration date is not active even if flagged', () => {
  assert.strictEqual(isActive({ active: true, expiresAt: PAST }, NOW), false);
});

ok('unknown event types are ignored', () => {
  assert.strictEqual(statusFromEvent({ type: 'TEST', app_user_id: 'u1' }, NOW), null);
});

console.log(`\n${passed} tests passed.`);
