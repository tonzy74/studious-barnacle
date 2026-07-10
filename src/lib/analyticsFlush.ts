import { ANALYTICS_URL } from '../config';
import { useStore } from '../store/useStore';
import { postEvents } from './analyticsTransport';
import { diag } from './diagnostics';

/**
 * Ships the consent-gated on-device event queue to the analytics-service. Stays
 * a complete no-op unless BOTH a backend URL is configured and the user has
 * opted in — so the default build never phones home. On success the flushed
 * events are dropped from the queue; on failure they're kept for next time.
 */

const FLUSH_BATCH = 200;
let flushing = false;

/**
 * Flush a batch if allowed. Safe to call on every app open — it self-gates on
 * config + consent, guards against concurrent runs, and only drops events the
 * backend actually accepted.
 */
export async function maybeFlushAnalytics(): Promise<void> {
  if (flushing || !ANALYTICS_URL) return;
  const state = useStore.getState();
  if (!state.consent.analytics) return; // opt-in only
  const batch = state.events.slice(0, FLUSH_BATCH);
  if (batch.length === 0) return;

  flushing = true;
  try {
    await postEvents(ANALYTICS_URL, batch);
    useStore.getState().dropSentEvents(batch.length);
    diag.info('analytics', `flushed ${batch.length} events`);
  } catch (err) {
    diag.warn('analytics', `flush failed, will retry: ${(err as Error).message}`);
  } finally {
    flushing = false;
  }
}
