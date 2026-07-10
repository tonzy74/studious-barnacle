import { AnalyticsEvent } from '../types';

/**
 * Network transport for the analytics flush — kept free of any store/native
 * import so it's unit-testable in isolation.
 */

/** Normalize the ingest endpoint from a configured base URL. */
export function eventsEndpoint(baseUrl: string): string {
  return `${baseUrl.replace(/\/+$/, '')}/v1/events`;
}

/** POST a batch of events; throws on a non-2xx response. */
export async function postEvents(baseUrl: string, events: AnalyticsEvent[]): Promise<void> {
  const res = await fetch(eventsEndpoint(baseUrl), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ events }),
  });
  if (!res.ok) throw new Error(`analytics flush HTTP ${res.status}`);
}
