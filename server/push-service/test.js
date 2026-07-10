'use strict';

/* Zero-dependency tests: `node test.js`. */

const assert = require('assert');
const { isExpoPushToken, chunk, buildMessages } = require('./lib/push');
const { diffNewReleases, releasePushBody, runReleaseCheck } = require('./lib/scheduler');

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

ok('diffNewReleases returns only unseen releases', () => {
  const seen = new Set(['btac']);
  const fresh = diffNewReleases(seen, [{ name: 'BTAC' }, { name: 'Pappy 15' }]);
  assert.strictEqual(fresh.length, 1);
  assert.strictEqual(fresh[0].name, 'Pappy 15');
});

ok('releasePushBody summarizes one vs many', () => {
  assert.match(releasePushBody([{ name: 'BTAC' }]), /BTAC is on the radar/);
  assert.match(releasePushBody([{ name: 'BTAC' }, { name: 'Pappy' }]), /BTAC \+ 1 more/);
});

ok('runReleaseCheck sends only for new releases and updates the snapshot', async () => {
  const seen = new Set();
  const sent = [];
  const deps = {
    seen,
    fetchReleases: async () => [{ name: 'BTAC' }, { name: 'Pappy 15' }],
    getTokens: () => ['ExponentPushToken[a]'],
    send: async (msg, toks) => sent.push({ msg, toks }),
  };
  const first = await runReleaseCheck(deps);
  assert.strictEqual(first.newCount, 2);
  assert.strictEqual(first.sent, 1);
  assert.strictEqual(sent.length, 1);
  // Second run with the same list → nothing new, no send.
  const second = await runReleaseCheck(deps);
  assert.strictEqual(second.newCount, 0);
  assert.strictEqual(sent.length, 1);
});

ok('runReleaseCheck does not send when there are no tokens', async () => {
  const r = await runReleaseCheck({
    seen: new Set(),
    fetchReleases: async () => [{ name: 'New Thing' }],
    getTokens: () => [],
    send: async () => assert.fail('should not send'),
  });
  assert.strictEqual(r.newCount, 1);
  assert.strictEqual(r.sent, 0);
});

console.log(`\n${passed} tests passed.`);
