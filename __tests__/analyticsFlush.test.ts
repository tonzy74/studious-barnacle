import { eventsEndpoint, postEvents } from '../src/lib/analyticsTransport';
import { AnalyticsEvent } from '../src/types';

describe('eventsEndpoint', () => {
  it('joins the base URL to the ingest path, trimming slashes', () => {
    expect(eventsEndpoint('https://api.example.com')).toBe('https://api.example.com/v1/events');
    expect(eventsEndpoint('https://api.example.com/')).toBe('https://api.example.com/v1/events');
  });
});

describe('postEvents', () => {
  const events: AnalyticsEvent[] = [{ name: 'app_opened', props: {}, anonId: 'a', at: 1 }];
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });

  it('POSTs a JSON batch to the events endpoint', async () => {
    const calls: { url: string; body: unknown }[] = [];
    global.fetch = (async (url: string, init: RequestInit) => {
      calls.push({ url, body: JSON.parse(String(init.body)) });
      return { ok: true, status: 200 } as Response;
    }) as typeof fetch;

    await postEvents('https://api.example.com', events);
    expect(calls[0].url).toBe('https://api.example.com/v1/events');
    expect(calls[0].body).toEqual({ events });
  });

  it('throws on a non-2xx response so the queue is retained', async () => {
    global.fetch = (async () => ({ ok: false, status: 500 }) as Response) as typeof fetch;
    await expect(postEvents('https://api.example.com', events)).rejects.toThrow(/500/);
  });
});
