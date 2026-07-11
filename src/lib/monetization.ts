/**
 * Monetization configuration — the single source of truth for what's free,
 * what's Pro, subscription plans, and referral/affiliate revenue surfaces.
 *
 * Revenue streams (see docs/MONETIZATION.md):
 *   1. Pro subscription  — the primary stream (IAP via RevenueCat/StoreKit).
 *   2. Affiliate commerce — retailer "where to buy" offers (built) + club
 *                           referrals below (Flaviar pays up to ~60%).
 *   3. Insurance referral — collection-value → insurer referral.
 *   4. Anonymized data    — consent-gated aggregate insights (B2B).
 */

import type { AnnualPriceVariant } from './experiments';

/** Feature keys that can be gated behind Pro. */
export type ProFeature =
  | 'ai-bulk-add'
  | 'ai-sommelier'
  | 'ai-cocktails'
  | 'ai-releases'
  | 'ai-label-scan'
  | 'recommendations'
  | 'portfolio-history'
  | 'portfolio-export'
  | 'price-alerts';

/**
 * The free/Pro split.
 *
 * IMPORTANT: the AI features run on the user's OWN Anthropic API key — they
 * already pay for that usage directly — so we do NOT gate them behind Pro
 * (that would double-charge and block real use). Pro instead unlocks the
 * on-device power features and analytics that cost us nothing per-use, plus
 * (future) hosted AI so users don't need their own key. The free tier stays
 * generous — unlimited collection, scanning, journal, trade analyzer, value
 * estimates, achievements, and all BYO-key AI — beating competitors on
 * acquisition.
 */
export const PRO_FEATURES: ProFeature[] = [
  'recommendations',
  'portfolio-history',
  'portfolio-export',
  'price-alerts',
];

export function isLocked(feature: ProFeature, isPro: boolean): boolean {
  return !isPro && PRO_FEATURES.includes(feature);
}

/** Human copy for each gated feature, used on the paywall / lock cards. */
export const FEATURE_COPY: Record<ProFeature, string> = {
  'ai-bulk-add': 'Add your whole shelf from one photo',
  'ai-sommelier': 'Unlimited AI sommelier & pairings',
  'ai-cocktails': 'AI cocktail recipes for any bottle',
  'ai-releases': 'AI “Releases to Watch” radar',
  'ai-label-scan': 'In-store label scan & instant valuation',
  recommendations: 'Personalized “For You” recommendations',
  'portfolio-history': 'Portfolio value history & trends',
  'portfolio-export': 'CSV / insurance export',
  'price-alerts': 'Price-drop & release alerts',
};

export interface ProPlan {
  id: string;
  label: string;
  price: string;
  sub: string;
  /** RevenueCat package identifier to purchase (wired on the EAS build). */
  packageId: string;
  best?: boolean;
  /** Struck-through anchor price (e.g. annualized monthly cost) for contrast. */
  anchor?: string;
  /** Short savings/urgency badge, e.g. "SAVE 64%". Derived from real prices. */
  badge?: string;
  /** Discounted price shown only while the genuine founder offer is live. */
  introPrice?: string;
  /** Sub-label for the intro price. */
  introSub?: string;
}

/** Label for the enforced, time-boxed launch discount. */
export const FOUNDER_BADGE = 'FOUNDER OFFER';
/** The founder discount, applied to the annual price. Real and enforced. */
export const FOUNDER_DISCOUNT = 0.4;

/**
 * Price tiers (see docs/PRICING.md). Monthly is deliberately priced as a decoy
 * — its job is to widen the annual gap so the annual (pre-selected default)
 * reads as the obvious buy, not to drive volume. Lifetime is the whale anchor.
 * Actual charges come from App Store Connect / RevenueCat at runtime; these are
 * the display defaults, kept in sync with the packages there.
 */
const MONTHLY_PRICE = 6.99;
const LIFETIME_PRICE = 99.99;

/** Annual arms for the price A/B (docs/PRICING.md §6, top ARPU lever). */
const ANNUAL_ARMS: Record<AnnualPriceVariant, { priceNum: number; packageId: string }> = {
  a29: { priceNum: 29.99, packageId: '$rc_annual' },
  b39: { priceNum: 39.99, packageId: '$rc_annual_39' },
};

const usd = (n: number) => `$${n.toFixed(2)}`;

/**
 * Build the paywall plans for a given annual-price variant. Anchor, savings
 * badge, per-month sub, and the founder intro price are all *derived* from the
 * real numbers so the math is always honest (no hand-typed "SAVE X%" that could
 * drift from the actual price) — App Store review and the FTC both penalize
 * inflated savings claims.
 */
export function buildProPlans(annualVariant: AnnualPriceVariant): ProPlan[] {
  const { priceNum, packageId } = ANNUAL_ARMS[annualVariant];
  const anchorNum = MONTHLY_PRICE * 12; // what a year of monthly would cost — the honest anchor
  const savingsPct = Math.round((1 - priceNum / anchorNum) * 100);
  const perMonth = priceNum / 12;
  const introNum = priceNum * (1 - FOUNDER_DISCOUNT);
  return [
    {
      id: 'annual',
      label: 'Annual',
      price: `${usd(priceNum)}/yr`,
      sub: `Just ${usd(perMonth)}/mo, billed yearly`,
      anchor: usd(anchorNum), // 12 × the monthly price — backs the savings claim
      badge: `SAVE ${savingsPct}%`,
      // Genuine, enforced launch discount — shown only while introOfferState is
      // active. Maps to a real RevenueCat intro-offer package so it's truly charged.
      introPrice: `${usd(introNum)}/yr`,
      introSub: 'Founder’s price — your first week only',
      packageId,
      best: true,
    },
    { id: 'monthly', label: 'Monthly', price: `${usd(MONTHLY_PRICE)}/mo`, sub: 'Billed monthly, cancel anytime', packageId: '$rc_monthly' },
    { id: 'lifetime', label: 'Lifetime', price: usd(LIFETIME_PRICE), sub: 'Pay once, yours forever', packageId: '$rc_lifetime' },
  ];
}

/** Default plans (control arm) for any non-paywall consumer. */
export const PRO_PLANS: ProPlan[] = buildProPlans('a29');

export const FREE_TRIAL_DAYS = 7;

/**
 * Value-anchor line for the paywall: reframes the price against what the app
 * saves a collector (avoiding one overpriced secondary bottle). Honest framing,
 * no fabricated stats — App Store review prohibits fake social proof.
 */
export const PRO_VALUE_LINE =
  'One bottle you don’t overpay for covers years of Pro.';

/**
 * Referral / affiliate revenue surfaces. Replace the URLs with YOUR tracking
 * links once approved (Impact/affiliate networks). Empty = hidden.
 */
export const REFERRALS = {
  /** Spirits club — pays up to ~60% on memberships (highest payout). */
  flaviar: {
    title: 'Join a premium bottle club',
    subtitle: 'Rare pours delivered — members get allocated access',
    cta: 'Explore Flaviar',
    url: '', // set to your Flaviar/Impact affiliate link
  },
  /** Collection insurance referral. */
  insurance: {
    title: 'Insure your collection',
    subtitle: 'Protect your bottles against loss, theft, and breakage',
    cta: 'Get a quote',
    url: '', // set to your insurance-partner referral link
  },
};

export function hasReferral(url: string): boolean {
  return /^https:\/\//.test(url);
}
