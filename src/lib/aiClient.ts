import Anthropic from '@anthropic-ai/sdk';

import { AI_PROXY_APP_TOKEN, AI_PROXY_URL } from '../config';

/**
 * Central Anthropic client factory. Two modes:
 *  • Proxy (recommended): AI_PROXY_URL is set → the app talks to your metered
 *    ai-proxy, which holds the real key server-side. Users never paste a key;
 *    free installs get a monthly quota, Pro is unlimited. We pass the anon
 *    install id + Pro flag as headers so the proxy can meter.
 *  • BYOK (fallback/power-user): no proxy configured → use the user's own key
 *    entered in Settings (the original behavior).
 */

let ctx: { installId: string; isPro: boolean } = { installId: 'anon', isPro: false };

/** App calls this so the proxy can meter per install and honor Pro. */
export function setAiContext(next: Partial<typeof ctx>): void {
  ctx = { ...ctx, ...next };
}

/** True when AI is usable — a proxy is configured, or the user brought a key. */
export function aiEnabled(userKey: string | undefined): boolean {
  return !!AI_PROXY_URL || !!userKey;
}

/** Whether the app is using the managed proxy (vs the user's own key). */
export const usingProxy = (): boolean => !!AI_PROXY_URL;

/** Build a client for this request. */
export function makeClient(userKey: string): Anthropic {
  if (AI_PROXY_URL) {
    return new Anthropic({
      apiKey: AI_PROXY_APP_TOKEN || 'proxy',
      baseURL: AI_PROXY_URL,
      dangerouslyAllowBrowser: true,
      defaultHeaders: { 'x-wv-install': ctx.installId, 'x-wv-pro': ctx.isPro ? '1' : '0' },
    });
  }
  return new Anthropic({ apiKey: userKey, dangerouslyAllowBrowser: true });
}

/** True when an error is the proxy's "free monthly AI used up" signal (402). */
export function isQuotaError(err: unknown): boolean {
  return (err as { status?: number } | undefined)?.status === 402;
}
