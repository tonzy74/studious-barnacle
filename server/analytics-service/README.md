# Whiskey Vault — Analytics Service

Zero-dependency Node service that ingests the app's anonymized, consent-gated
event stream and computes the growth funnel (activation → paywall → purchase).

## Run

```bash
node index.js            # listens on :8788 (in-memory)
EVENTS_FILE=./events.jsonl node index.js   # + append-only persistence
node test.js             # run the test suite
```

## Endpoints

### `POST /v1/events`
Body: `{ "events": [{ "name": "...", "anonId": "...", "at": 1700000000000, "props": {} }] }`
Returns `{ "accepted": n, "rejected": m }`.

The app batches its on-device queue here **only when the user has opted in** to
analytics. Every event is re-validated server-side against the same allowlist as
the client (`lib/aggregate.js` mirrors `src/lib/analyticsCore.ts`): unknown event
names, unknown property keys, non-scalar values, and oversize strings are
dropped. Events carry a random per-install id and never any identity or free
text — so no PII can enter the store.

### `GET /v1/funnel`
Returns the computed funnel:

```json
{
  "users": 1200,
  "activated": 840,          "activationRate": 0.70,
  "onboarded": 900,
  "paywallViews": 300,
  "purchases": 45,           "paywallConversion": 0.15,
  "purchaseRate": 0.054,
  "sharers": 210,
  "bottlesAdded": 5400,
  "computedAt": "..."
}
```

These are the metrics the growth levers in `docs/GROWTH.md` are designed to
move: activation (onboarding + first bottle), paywall conversion (contextual
triggers + anchoring), and virality (share rate).

### `GET /health`
`{ "ok": true, "events": <count> }`

## Client wiring

`src/lib/funnel.ts` computes the same funnel on-device for an owner "Insights"
view; this service aggregates across all installs. Point the app's flush target
at `POST /v1/events` when you wire the backend (the on-device queue already
collects the events; today it stays local until a flush target is configured).

## Production notes

- Swap the in-memory array for a real datastore (Postgres/ClickHouse).
- Terminate TLS at your ingress; keep the allowlist as the last line of defense.
- Respect the client's consent + CCPA "Do Not Sell/Share" — only opted-in
  installs ever POST here.
