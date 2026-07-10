/**
 * A genuine, time-boxed launch discount ("Founder's offer"). Urgency is one of
 * the strongest conversion levers — but only *real* urgency is legitimate. The
 * deadline here is tied to the user's first open and is actually enforced: when
 * it passes, the offer is gone and does NOT silently reset. That's the honest
 * line between persuasion and a dark pattern (fake/looping countdowns are what
 * the FTC and App Store penalize).
 *
 * The displayed intro price must map to a real RevenueCat intro-offer package so
 * the discount is genuinely charged — the countdown never promises a price the
 * store won't honor.
 */

export const INTRO_WINDOW_DAYS = 7;

export interface IntroOfferState {
  /** Whether the founder's offer is currently live for this user. */
  active: boolean;
  /** Epoch ms when it ends. */
  endsAt: number;
  /** Milliseconds remaining (0 once expired). */
  msLeft: number;
}

/** Resolve the founder-offer window from the user's first-open time. */
export function introOfferState(
  firstOpenAt: number | undefined,
  now: number,
  windowDays: number = INTRO_WINDOW_DAYS
): IntroOfferState {
  if (!firstOpenAt) return { active: false, endsAt: 0, msLeft: 0 };
  const endsAt = firstOpenAt + windowDays * 86_400_000;
  const msLeft = Math.max(0, endsAt - now);
  return { active: msLeft > 0, endsAt, msLeft };
}

/** Human countdown like "2d 4h", "5h 12m", or "8m". */
export function formatCountdown(msLeft: number): string {
  const totalMin = Math.max(0, Math.floor(msLeft / 60_000));
  const d = Math.floor(totalMin / 1440);
  const h = Math.floor((totalMin % 1440) / 60);
  const m = totalMin % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
