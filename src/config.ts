/**
 * Runtime configuration.
 *
 * PRICING_API_BASE_URL points at YOUR pricing backend (the service that
 * ingests retailer affiliate product feeds and serves normalized offers —
 * see server/affiliate-price-service). It is intentionally empty by default:
 * with no backend configured, the app falls back to the built-in curated /
 * AI-estimated pricing and shows no "where to buy" offers.
 *
 * The app must NEVER call retailer sites directly — that would breach their
 * terms of service and Apple's review guidelines. All live pricing flows
 * through this backend, which is where the licensed affiliate feeds live.
 *
 * Set it to e.g. "https://api.yourdomain.com" once your backend is deployed.
 * Must be https in production.
 */
export const PRICING_API_BASE_URL = '';

/** Whether a live pricing backend is configured. */
export function hasPricingBackend(): boolean {
  return /^https:\/\//.test(PRICING_API_BASE_URL);
}
