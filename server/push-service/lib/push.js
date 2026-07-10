'use strict';

/**
 * Pure helpers for the push service — validation + batching, no network — so
 * they're unit-testable. Expo push tokens look like `ExponentPushToken[xxx]`
 * (or `ExpoPushToken[xxx]`); the Expo Push API accepts at most 100 messages per
 * request, so we chunk.
 */

const TOKEN_RE = /^Expo(nent)?PushToken\[[^\]]+\]$/;

function isExpoPushToken(token) {
  return typeof token === 'string' && TOKEN_RE.test(token);
}

/** Split an array into fixed-size chunks (Expo caps at 100 per request). */
function chunk(arr, size = 100) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/** Build Expo push messages for a set of tokens. Drops invalid tokens. */
function buildMessages(tokens, { title, body, data }) {
  return (Array.isArray(tokens) ? tokens : [])
    .filter(isExpoPushToken)
    .map((to) => ({ to, title, body, sound: 'default', ...(data ? { data } : {}) }));
}

module.exports = { isExpoPushToken, chunk, buildMessages, TOKEN_RE };
