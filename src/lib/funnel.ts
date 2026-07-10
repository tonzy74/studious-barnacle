import { AnalyticsEvent } from '../types';

/**
 * Turns a raw event stream into the funnel metrics an analytics dashboard shows.
 * Pure and dependency-free so it runs identically on-device (for the owner's
 * Insights view) and on the server (aggregating all installs). Everything is
 * keyed by the anonymous per-install id — never identity.
 */

export interface FunnelMetrics {
  /** Distinct installs seen in the window. */
  users: number;
  /** Installs that added at least one bottle (activation). */
  activated: number;
  activationRate: number;
  /** Installs that finished onboarding. */
  onboarded: number;
  /** Installs shown the paywall at least once. */
  paywallViews: number;
  /** Installs that purchased Pro. */
  purchases: number;
  /** Paywall view → purchase conversion. */
  paywallConversion: number;
  /** Purchases ÷ activated users — the headline monetization rate. */
  purchaseRate: number;
  /** Installs that shared their vault (virality signal). */
  sharers: number;
  /** Total bottles added across the window. */
  bottlesAdded: number;
}

const distinctUsers = (events: AnalyticsEvent[], name: string): Set<string> => {
  const s = new Set<string>();
  for (const e of events) if (e.name === name && e.anonId) s.add(e.anonId);
  return s;
};

const ratio = (num: number, den: number) => (den > 0 ? num / den : 0);

/** Compute the acquisition→activation→monetization funnel from an event log. */
export function computeFunnel(events: AnalyticsEvent[]): FunnelMetrics {
  const users = distinctUsers(events, 'app_opened');
  // Fold in any install that produced events without an explicit app_opened.
  for (const e of events) if (e.anonId) users.add(e.anonId);

  const activated = distinctUsers(events, 'bottle_added');
  const onboarded = distinctUsers(events, 'onboarding_completed');
  const paywallViews = distinctUsers(events, 'paywall_shown');
  const purchases = distinctUsers(events, 'pro_purchased');
  const sharers = distinctUsers(events, 'vault_shared');
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

/** Day-by-day active installs (DAU), for a retention curve. */
export function dailyActiveUsers(events: AnalyticsEvent[]): { day: string; users: number }[] {
  const byDay = new Map<string, Set<string>>();
  for (const e of events) {
    if (!e.anonId) continue;
    const day = new Date(e.at).toISOString().slice(0, 10);
    (byDay.get(day) ?? byDay.set(day, new Set()).get(day)!).add(e.anonId);
  }
  return [...byDay.entries()]
    .map(([day, set]) => ({ day, users: set.size }))
    .sort((a, b) => a.day.localeCompare(b.day));
}
