'use strict';

/**
 * Pure aggregation + validation for the analytics service. Zero dependencies.
 * Mirrors the client's privacy allowlist (src/lib/analyticsCore.ts) so the
 * server independently drops anything off-list — defense in depth. Events are
 * anonymous (per-install id only); no identity, no free text, so no PII.
 */

const EVENT_NAMES = new Set([
  'app_opened',
  'bottle_added',
  'bottle_removed',
  'scan_resolved',
  'pour_rolled',
  'chat_message_sent',
  'match_computed',
  'ai_profile_estimated',
  'sign_in',
  'bulk_add_completed',
  'trade_evaluated',
  'sign_out',
  'pour_logged',
  'label_scanned',
  'onboarding_completed',
  'paywall_shown',
  'pro_purchased',
  'vault_shared',
  'reminders_enabled',
]);

const ALLOWED_PROP_KEYS = new Set([
  'type',
  'rarity',
  'source',
  'flavorSource',
  'count',
  'matched',
  'known',
  'provider',
  'protectAllocated',
  'verdict',
  'trigger',
  'plan',
]);

const MAX_STRING_PROP = 32;

/** Validate + sanitize one incoming event; returns a clean event or null. */
function sanitizeEvent(raw) {
  if (!raw || typeof raw !== 'object') return null;
  if (!EVENT_NAMES.has(raw.name)) return null;
  if (typeof raw.anonId !== 'string' || !raw.anonId) return null;
  const at = Number(raw.at);
  const props = {};
  if (raw.props && typeof raw.props === 'object') {
    for (const [k, v] of Object.entries(raw.props)) {
      if (!ALLOWED_PROP_KEYS.has(k)) continue;
      if (typeof v === 'boolean' || (typeof v === 'number' && Number.isFinite(v))) props[k] = v;
      else if (typeof v === 'string') props[k] = v.slice(0, MAX_STRING_PROP);
    }
  }
  return {
    name: raw.name,
    anonId: String(raw.anonId).slice(0, 64),
    at: Number.isFinite(at) ? at : Date.now(),
    props,
  };
}

/** Sanitize a batch, returning the clean events and how many were rejected. */
function sanitizeBatch(events) {
  const clean = [];
  let rejected = 0;
  for (const e of Array.isArray(events) ? events : []) {
    const ok = sanitizeEvent(e);
    if (ok) clean.push(ok);
    else rejected += 1;
  }
  return { clean, rejected };
}

const distinct = (events, name) => {
  const s = new Set();
  for (const e of events) if (e.name === name) s.add(e.anonId);
  return s;
};
const ratio = (n, d) => (d > 0 ? n / d : 0);

/** Compute the acquisition→activation→monetization funnel from stored events. */
function computeFunnel(events) {
  const users = new Set();
  for (const e of events) users.add(e.anonId);
  const activated = distinct(events, 'bottle_added');
  const paywallViews = distinct(events, 'paywall_shown');
  const purchases = distinct(events, 'pro_purchased');
  const onboarded = distinct(events, 'onboarding_completed');
  const sharers = distinct(events, 'vault_shared');
  const bottlesAdded = events.filter((e) => e.name === 'bottle_added').length;

  return {
    users: users.size,
    activated: activated.size,
    activationRate: ratio(activated.size, users.size),
    onboarded: onboarded.size,
    paywallViews: paywallViews.size,
    purchases: purchases.size,
    paywallConversion: ratio(purchases.size, paywallViews.size),
    purchaseRate: ratio(purchases.size, activated.size),
    sharers: sharers.size,
    bottlesAdded,
  };
}

module.exports = { sanitizeEvent, sanitizeBatch, computeFunnel, EVENT_NAMES };
