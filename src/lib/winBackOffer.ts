/**
 * Win-back offer for users who had Pro (trial or paid) and lapsed. A targeted,
 * time-boxed discount to returning users is a standard, honest lifecycle lever —
 * it's a real discount to a real churned user, not a trick. Eligibility is
 * bounded so it carries genuine (not fake) urgency, and it clears the moment
 * they re-subscribe.
 */

export const WIN_BACK_WINDOW_DAYS = 60;
export const WIN_BACK_DISCOUNT_LABEL = '50% off your first year back';

export interface WinBackInput {
  isPro: boolean;
  /** When Pro access lapsed (undefined if never had it or currently active). */
  proLapsedAt?: number;
  now: number;
}

export interface WinBackState {
  eligible: boolean;
  discountLabel: string;
  /** Days left in the win-back window (0 when not eligible). */
  daysLeft: number;
}

export function winBackState(input: WinBackInput): WinBackState {
  if (input.isPro || !input.proLapsedAt) {
    return { eligible: false, discountLabel: '', daysLeft: 0 };
  }
  const windowMs = WIN_BACK_WINDOW_DAYS * 86_400_000;
  const msLeft = input.proLapsedAt + windowMs - input.now;
  if (msLeft <= 0) return { eligible: false, discountLabel: '', daysLeft: 0 };
  return {
    eligible: true,
    discountLabel: WIN_BACK_DISCOUNT_LABEL,
    daysLeft: Math.ceil(msLeft / 86_400_000),
  };
}
