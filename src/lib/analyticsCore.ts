import { AnalyticsEvent } from '../types';

/**
 * Pure analytics helpers — no store or native imports so they're unit-testable
 * and auditable. Privacy-by-design rules enforced here:
 *  - allowlisted event names only
 *  - allowlisted, scalar, size-capped properties only (no free text = no PII)
 *  - events carry a random per-install ID, never identity
 */

export const ANALYTICS_EVENTS = [
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
  'sign_out',
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

/** Property keys that may ever leave the device. Everything else is dropped. */
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
]);

const MAX_STRING_PROP = 32;

export function sanitizeEventProps(
  props: Record<string, unknown>
): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(props)) {
    if (!ALLOWED_PROP_KEYS.has(key)) continue;
    if (typeof value === 'boolean' || (typeof value === 'number' && isFinite(value))) {
      out[key] = value;
    } else if (typeof value === 'string') {
      out[key] = value.slice(0, MAX_STRING_PROP);
    }
  }
  return out;
}

export function buildEvent(
  name: AnalyticsEventName,
  props: Record<string, unknown>,
  anonId: string
): AnalyticsEvent | undefined {
  if (!(ANALYTICS_EVENTS as readonly string[]).includes(name)) return undefined;
  return { name, props: sanitizeEventProps(props), anonId, at: Date.now() };
}

export function newAnonId(): string {
  return `anon-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Cap the on-device queue so it can't grow unbounded. */
export const MAX_QUEUED_EVENTS = 1000;
