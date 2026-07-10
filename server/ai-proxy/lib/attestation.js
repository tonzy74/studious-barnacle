'use strict';

/**
 * Device-attestation seam.
 *
 * Verifying that a request comes from a genuine, unmodified install is THE
 * mitigation for the public APP_TOKEN being lifted from the app binary and
 * replayed to burn your Anthropic budget. Real verification needs a native
 * attestation SDK on the client plus provider verification here; this module is
 * the pluggable gate that the rest of the proxy calls.
 *
 * ⚠️ THE DEFAULT IS A NO-OP (returns true) so nothing breaks until you wire a
 * real verifier. It is NOT protection on its own. Before relying on it, set
 * ATTESTATION_MODE + REQUIRE_ATTESTATION=1 and implement one of:
 *   - Apple App Attest (DeviceCheck)        → iOS
 *   - Google Play Integrity                 → Android
 *   - Firebase App Check (RS256 JWT vs JWKS) → cross-platform
 * by passing a `verifier` (see index.js) or replacing the branch below.
 *
 * Fail-closed: when attestation is required but no real verifier is wired, this
 * returns false rather than silently allowing.
 */
async function verifyAttestation(token, opts = {}) {
  const mode = opts.mode || 'off';
  // Disabled — explicit opt-in required. Must be replaced before it's a control.
  if (mode === 'off') return true;
  if (!token) return false;
  // A real provider verifier can be injected (keeps this module dependency-free
  // and unit-testable). Absent one, fail closed.
  if (typeof opts.verifier === 'function') {
    try {
      return !!(await opts.verifier(token, opts));
    } catch {
      return false;
    }
  }
  return false;
}

module.exports = { verifyAttestation };
