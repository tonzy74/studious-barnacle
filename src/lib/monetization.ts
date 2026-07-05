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
}

/**
 * Plans shown on the paywall. Priced to undercut/á-la-Bourboneur ($3/mo) on
 * annual while capturing more on monthly, with a lifetime option for whales.
 * Actual prices come from App Store Connect / RevenueCat at runtime; these are
 * display defaults.
 */
export const PRO_PLANS: ProPlan[] = [
  { id: 'annual', label: 'Annual', price: '$29.99/yr', sub: 'Best value — under $2.50/mo', packageId: '$rc_annual', best: true },
  { id: 'monthly', label: 'Monthly', price: '$4.99/mo', sub: 'Cancel anytime', packageId: '$rc_monthly' },
  { id: 'lifetime', label: 'Lifetime', price: '$99.99', sub: 'Pay once, own forever', packageId: '$rc_lifetime' },
];

export const FREE_TRIAL_DAYS = 7;

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
