'use strict';

/**
 * Release-watch job: fetch the upcoming-releases list, diff it against the last
 * snapshot, and broadcast a push for anything genuinely new. The orchestration
 * is dependency-injected (fetchReleases / getTokens / send) so it's unit-testable
 * without network, and the same function powers both the on-demand admin
 * endpoint and the internal interval.
 */

/** Stable key for a release so we can diff across runs. */
function releaseKey(r) {
  return String((r && r.name) || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

/** Releases in `next` whose key isn't in the `seen` set. */
function diffNewReleases(seen, next) {
  return (Array.isArray(next) ? next : []).filter((r) => {
    const k = releaseKey(r);
    return k && !seen.has(k);
  });
}

/** Compose the push copy for a set of new releases. */
function releasePushBody(fresh) {
  const first = fresh[0].name;
  return fresh.length === 1 ? `${first} is on the radar.` : `${first} + ${fresh.length - 1} more just added.`;
}

/**
 * Run one release check.
 * @param {object} deps
 *   - seen: Set<string> of previously-seen release keys (mutated with new keys)
 *   - fetchReleases: () => Promise<Array<{name}>>
 *   - getTokens: () => string[]
 *   - send: (message:{title,body,data}, tokens:string[]) => Promise<any>
 * @returns {Promise<{newCount:number, sent:number}>}
 */
async function runReleaseCheck({ seen, fetchReleases, getTokens, send }) {
  const next = await fetchReleases();
  const fresh = diffNewReleases(seen, next);
  for (const r of next) {
    const k = releaseKey(r);
    if (k) seen.add(k);
  }
  if (fresh.length === 0) return { newCount: 0, sent: 0 };
  const tokens = getTokens();
  if (tokens.length === 0) return { newCount: fresh.length, sent: 0 };
  await send(
    { title: 'New whiskey drops 📅', body: releasePushBody(fresh), data: { screen: 'Releases' } },
    tokens
  );
  return { newCount: fresh.length, sent: tokens.length };
}

module.exports = { releaseKey, diffNewReleases, releasePushBody, runReleaseCheck };
