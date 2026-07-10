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

/**
 * Build-time config via Expo public env vars (EXPO_PUBLIC_*). Defaults are
 * empty so the app stays fully local until you set them. Set in `.env`, the EAS
 * build profile env, or the shell before `expo`:
 *   EXPO_PUBLIC_ANALYTICS_URL   base URL of the analytics-service (enables flush)
 *   EXPO_PUBLIC_EAS_PROJECT_ID  EAS project id for push tokens (`eas init` sets it)
 */

/** Base URL of the analytics ingestion service. Empty = local-only (no flush). */
export const ANALYTICS_URL = process.env.EXPO_PUBLIC_ANALYTICS_URL ?? '';

/** EAS project id used to mint Expo push tokens. Empty = auto-detect in EAS builds. */
export const EAS_PROJECT_ID = process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? '';

/** Base URL of the push-service (token registry). Empty = don't register tokens. */
export const PUSH_URL = process.env.EXPO_PUBLIC_PUSH_URL ?? '';

/**
 * Base URL of the metered ai-proxy (server/ai-proxy). When set, the app routes
 * all AI through it — users never paste an Anthropic key, and free usage is
 * metered with Pro unlimited. Empty = fall back to a user-entered key (BYOK).
 */
export const AI_PROXY_URL = process.env.EXPO_PUBLIC_AI_PROXY_URL ?? '';

/** Shared app token the proxy checks (sent as the SDK's x-api-key). */
export const AI_PROXY_APP_TOKEN = process.env.EXPO_PUBLIC_AI_PROXY_APP_TOKEN ?? '';
