'use strict';

/**
 * Server-side Pro entitlement derived from RevenueCat webhooks. This makes Pro
 * authoritative on the server so the app's x-wv-pro header can't be spoofed to
 * get unlimited AI for free. Pure + dependency-free for unit testing.
 *
 * Match works because the app configures RevenueCat with appUserID = its anon
 * install id, which is the same id it sends as x-wv-install — so the proxy can
 * look up Pro status by install.
 */

/** Event types that grant/continue access. */
const GRANTING = new Set([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'PRODUCT_CHANGE',
  'UNCANCELLATION',
  'NON_RENEWING_PURCHASE',
  'SUBSCRIPTION_EXTENDED',
  'TEMPORARY_ENTITLEMENT_GRANT',
]);

/** Is a stored status record currently active (and not expired)? */
function isActive(record, now) {
  if (!record) return false;
  if (record.expiresAt && record.expiresAt <= now) return false;
  return !!record.active;
}

/** Derive a status record from a RevenueCat event, or null to ignore it. */
function statusFromEvent(event, now) {
  if (!event || typeof event !== 'object') return null;
  const type = event.type;
  const expiresAt = Number(event.expiration_at_ms) || undefined;
  if (type === 'EXPIRATION') return { active: false, expiresAt };
  // Cancellation keeps access until the paid period ends.
  if (type === 'CANCELLATION' || GRANTING.has(type)) {
    return { active: expiresAt ? expiresAt > now : true, expiresAt };
  }
  return null; // TEST / TRANSFER / others: no status change here
}

/** Fold a webhook event into the appUserId → status map. Returns the map. */
function applyEvent(map, event, now) {
  const uid = event && event.app_user_id;
  if (!uid) return map;
  const st = statusFromEvent(event, now);
  if (st) map.set(String(uid), st);
  return map;
}

module.exports = { isActive, statusFromEvent, applyEvent, GRANTING };
