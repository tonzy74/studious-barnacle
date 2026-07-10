'use strict';

/* Zero-dependency tests: `node test.js`. */

const assert = require('assert');
const { isExpoPushToken, chunk, buildMessages } = require('./lib/push');

let passed = 0;
const ok = (name, fn) => {
  fn();
  passed += 1;
  console.log(`  ✓ ${name}`);
};

ok('accepts valid Expo push tokens', () => {
  assert.ok(isExpoPushToken('ExponentPushToken[abc123]'));
  assert.ok(isExpoPushToken('ExpoPushToken[abc123]'));
});

ok('rejects junk tokens', () => {
  assert.ok(!isExpoPushToken('not-a-token'));
  assert.ok(!isExpoPushToken(''));
  assert.ok(!isExpoPushToken(null));
});

ok('chunks into batches of at most 100', () => {
  const arr = Array.from({ length: 250 }, (_, i) => i);
  const chunks = chunk(arr, 100);
  assert.strictEqual(chunks.length, 3);
  assert.strictEqual(chunks[0].length, 100);
  assert.strictEqual(chunks[2].length, 50);
});

ok('buildMessages drops invalid tokens and shapes valid ones', () => {
  const msgs = buildMessages(['ExponentPushToken[a]', 'bad', 'ExpoPushToken[b]'], {
    title: 'Hi',
    body: 'There',
    data: { screen: 'Releases' },
  });
  assert.strictEqual(msgs.length, 2);
  assert.deepStrictEqual(msgs[0], {
    to: 'ExponentPushToken[a]',
    title: 'Hi',
    body: 'There',
    sound: 'default',
    data: { screen: 'Releases' },
  });
});

console.log(`\n${passed} tests passed.`);
