# Deploying Whiskey Vault

Everything here is infrastructure-as-code. The parts that need *your* accounts
(Expo, Apple/Google, a cloud host) are called out explicitly — those require
your credentials and can't be automated for you.

## Backend (one command locally, one click in the cloud)

Three zero-dependency Node services live in `server/`:

| Service | Port | Purpose |
|---|---|---|
| `affiliate-price-service` | 8787 | Retailer offers + affiliate links |
| `analytics-service` | 8788 | Event ingestion + growth funnel |
| `push-service` | 8789 | Expo push-token registry + sender |

### Local — Docker (all three at once)

```bash
cd server
ADMIN_TOKEN=$(openssl rand -hex 16) docker compose up --build
# pricing :8787 · analytics :8788 · push :8789 ; data persists in server/data/
```

### Local — plain Node (no Docker)

```bash
node server/analytics-service/index.js       # :8788
ADMIN_TOKEN=secret node server/push-service/index.js   # :8789
```

### Cloud — Render (one click)

1. Push this repo to GitHub (done).
2. Render dashboard → **New → Blueprint** → pick this repo. `render.yaml`
   provisions all three services and generates the push `ADMIN_TOKEN` secret.
3. Copy the resulting service URLs.

(Any host works — the Dockerfiles run anywhere: Fly.io `fly launch`, Railway,
Cloud Run, a VPS. Render is just the turnkey path.)

### Verify

```bash
curl $ANALYTICS/health && curl $PUSH/health
node server/analytics-service/test.js && node server/push-service/test.js
```

## Point the app at the backend

Set these as `EXPO_PUBLIC_*` env vars (in `.env`, or your EAS build profile's
`env`) — see `.env.example`:

```
EXPO_PUBLIC_ANALYTICS_URL=https://whiskey-vault-analytics.onrender.com
EXPO_PUBLIC_PUSH_URL=https://whiskey-vault-push.onrender.com
EXPO_PUBLIC_PRICING_URL=https://whiskey-vault-pricing.onrender.com
```

With these set, the app flushes its (consent-gated) event queue on launch and
registers push tokens automatically. Unset = fully local, no network calls.

## Mobile build & store (needs your accounts)

These require an **Expo account** and paid **Apple Developer / Google Play**
accounts, so you run them:

```bash
npm i -g eas-cli
eas login                 # your Expo account
eas init                  # writes extra.eas.projectId into app.json
eas build -p ios --profile production      # or preview for TestFlight
eas submit -p ios                          # uploads to App Store Connect
```

`eas.json` already defines `development` / `preview` / `production` profiles.
Remote push needs credentials once: `eas credentials` (APNs key / FCM).

## Sending a remote push

Once devices have registered tokens (they do so automatically when a user
enables reminders in an EAS build):

```bash
curl -X POST $PUSH/v1/push/send \
  -H "x-admin-token: $ADMIN_TOKEN" -H 'Content-Type: application/json' \
  -d '{"title":"New drop 📅","body":"BTAC is landing this week"}'
```

Wire this to a cron (release-calendar refresh, price-drop detection) to make it
automatic.

## What still needs you (can't be automated)

- Expo/Apple/Google account logins and the paid developer memberships.
- A cloud host account (Render/Fly/etc.) — the manifests are ready; the click
  and the billing are yours.
- RevenueCat product setup for real billing (`src/lib/purchases.ts` is wired to
  drop in).
- Affiliate program approvals (Impact/retailers) for real "buy" links.
