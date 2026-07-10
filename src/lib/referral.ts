/**
 * Double-sided referral mechanics. Both sides get a reward (referrer and new
 * user), which is what makes referral programs compound — the classic Dropbox
 * engine. Honest by construction: the reward is real (a free month of Pro,
 * granted via RevenueCat promotional entitlements) and self-referral is blocked.
 *
 * Pure + dependency-free so it's unit-testable; the store holds the applied code
 * and a screen handles share/redeem.
 */

/** What each side earns — surfaced in copy and granted on the backend. */
export const REFERRAL_REWARD = 'a free month of Pro';
const LINK_BASE = 'https://whiskeyvault.app/r/';

/** Deterministic, shareable code from a stable per-install seed (anonId). */
export function makeReferralCode(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  // 6 chars, unambiguous alphabet (no 0/O/1/I).
  const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  let n = h || 1;
  for (let i = 0; i < 6; i++) {
    code += ALPHABET[n % ALPHABET.length];
    n = Math.floor(n / ALPHABET.length) + (i + 1) * 7;
  }
  return code;
}

/** A shareable link for a code. */
export function referralLink(code: string): string {
  return `${LINK_BASE}${code}`;
}

/**
 * Extract a referral code from a pasted link, a `code=` param, or a raw code.
 * Returns an uppercased code or undefined if nothing valid is found.
 */
export function parseReferralCode(input: string): string | undefined {
  if (!input) return undefined;
  const s = input.trim();
  const fromPath = s.match(/\/r\/([A-Za-z0-9]{4,12})/);
  if (fromPath) return fromPath[1].toUpperCase();
  const fromParam = s.match(/[?&]code=([A-Za-z0-9]{4,12})/);
  if (fromParam) return fromParam[1].toUpperCase();
  const raw = s.match(/^[A-Za-z0-9]{4,12}$/);
  if (raw) return s.toUpperCase();
  return undefined;
}

/** Invite copy that leads with the mutual reward and includes the link. */
export function referralShareText(code: string): string {
  return [
    `I'm tracking my whiskey collection with Whiskey Vault — it scans bottles and tells you what they're worth. 🥃`,
    `Use my code ${code} and we both get ${REFERRAL_REWARD}:`,
    referralLink(code),
  ].join('\n');
}

/** Whether an incoming code can be applied (valid, not the user's own). */
export function canApplyReferral(
  incoming: string | undefined,
  ownCode: string,
  alreadyApplied: string | undefined
): boolean {
  if (!incoming) return false;
  if (alreadyApplied) return false;
  return incoming.toUpperCase() !== ownCode.toUpperCase();
}
