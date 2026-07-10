# Whiskey Vault — AI Proxy (metered)

Holds **your** Anthropic key server-side so users never paste one. Meters free
installs (monthly quota) and lets Pro installs through unlimited, then forwards
to the Anthropic Messages API. The app points the Anthropic SDK's `baseURL`
here and sends `APP_TOKEN` as its key.

## Run

```bash
ANTHROPIC_API_KEY=sk-ant-... APP_TOKEN=$(openssl rand -hex 16) node index.js   # :8790
node test.js
```

Point the app at it:

```
EXPO_PUBLIC_AI_PROXY_URL=https://your-proxy.onrender.com
EXPO_PUBLIC_AI_PROXY_APP_TOKEN=<same as APP_TOKEN>
```

## "Can I lose money on free users?" — No, if you set the caps.

Every free request is bounded three ways, all env-configurable:

| Env | Default | What it does |
|---|---|---|
| `FREE_MONTHLY_QUOTA` | 15 | Max AI actions per free install per month |
| `MAX_FREE_PER_DAY` | 1000 | **Hard ceiling on total free requests/day across everyone** — Pro is never limited by this |
| `FREE_MODEL` | (off) | Force free requests onto a cheaper model (e.g. `claude-haiku-4-5-20251001`) |

**The math.** A vision scan or sommelier reply costs roughly **$0.005–$0.02**.
So:

- One free user, worst case: `15 × $0.02 ≈ $0.30/month`. Realistically pennies.
- Your **whole free tier**, worst case: `MAX_FREE_PER_DAY × $0.02 × 30`. At the
  default 1000/day that's a **~$600/mo ceiling you set** — and it only bites if
  1000 people/day burn free AI without converting. Lower it to match your risk.
- A **Pro** user pays $30/yr and costs maybe **$1–3/yr** in AI → ~90%+ margin.

So you can't accidentally go negative: free spend is capped at a number *you*
choose, Pro is always profitable, and the paywall fires exactly when a free user
hits the quota (peak intent). Set `FREE_MODEL=claude-haiku-4-5-20251001` to make
free usage ~4–10× cheaper still, reserving the flagship model for Pro.

## Endpoints

- `POST /v1/messages` — Anthropic Messages passthrough. Headers: `x-api-key`
  (= APP_TOKEN), `x-wv-install` (anon id, for metering), `x-wv-pro: 1` for Pro.
  Returns the Anthropic response + `X-WV-Quota-Remaining`; `402` when a free
  install is out of quota or the daily budget is reached.
- `GET /health`

## Server-side Pro (RevenueCat webhook)

Set `RC_WEBHOOK_SECRET` to make Pro **authoritative from RevenueCat** instead of
trusting the app's `x-wv-pro` header (which a determined user could spoof).

1. In the app, configure RevenueCat with `appUserID = <the app's anon id>` (the
   same value it sends as `x-wv-install`).
2. In the RevenueCat dashboard → Integrations → Webhooks, point it at
   `POST https://your-proxy/v1/rc/webhook` and set the Authorization header to
   `Bearer <RC_WEBHOOK_SECRET>`.
3. The proxy folds `INITIAL_PURCHASE / RENEWAL / CANCELLATION / EXPIRATION / …`
   events into a per-user Pro status and checks it on every AI call. When the
   secret is set, the `x-wv-pro` header is ignored.

`POST /v1/rc/webhook` — RevenueCat events (Bearer-auth). Returns `{ ok: true }`.

## Production hardening

- Add device attestation (App Attest / Play Integrity) so the `APP_TOKEN` can't
  be lifted from the binary and abused.
- Swap the in-memory usage/pro maps for a datastore; keep `MODEL_ALLOWLIST` tight.
