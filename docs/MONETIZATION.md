# Whiskey Vault — Monetization

Four revenue streams, all wired in the app with clean seams. This maps what's
**built** vs. the **business setup** only you can do (accounts, approvals,
deploys).

## 1. Pro subscription (primary)

The biggest, most reliable stream — validated by Bourboneur ($3/mo).

- **Built:** entitlement state (`isPro`), paywall (`PaywallScreen`), feature
  gating (`src/lib/monetization.ts` + `useProGate`), plans (monthly/annual/
  lifetime) and a 7-day trial. A sandbox purchase unlocks Pro so you can test
  the gated UI in Expo Go today.
- **Business setup:**
  1. App Store Connect → create the auto-renewing subscription group
     (monthly, annual) + a non-consumable (lifetime).
  2. RevenueCat account → map products to a `pro` entitlement.
  3. On your **EAS/dev build**: `npx expo install react-native-purchases`,
     configure it, implement the three functions in `src/lib/purchases.ts`,
     and set `PURCHASES_READY = true`.
- **Free vs Pro** (`PRO_FEATURES`): free keeps unlimited collection, barcode
  scan, manual add, journal, trade analyzer, value estimates, random pour,
  guest match, achievements — *more* than competitors' free tiers. Pro unlocks
  the AI suite (bulk-add, sommelier, cocktails, releases, label scan),
  recommendations, portfolio history/export, and alerts.

## 2. Affiliate commerce

- **Built:** retailer "Where to buy" offers on each bottle (via the pricing
  backend), with your tracking links → commission on tap-and-buy. Plus a
  Flaviar club referral tile on Explore (pays up to ~60% on memberships).
- **Business setup:** join Impact + get approved (Flaviar, Wine.com,
  ReserveBar, Caskers…); deploy `server/affiliate-price-service`; set
  `REFERRALS.flaviar.url` and your `IMPACT_PUBLISHER_ID`.

## 3. Insurance referral

- **Built:** a collection-insurance referral card on Portfolio, shown once a
  value exists.
- **Business setup:** partner with a collectibles/spirits insurer (referral or
  affiliate) and set `REFERRALS.insurance.url`.

## 4. Anonymized data insights (B2B)

- **Built:** consent-gated analytics pipeline (opt-in, GDPR/CCPA-safe) already
  collects anonymized events.
- **Business setup:** aggregate + sell category/pricing/trend insights to
  brands/retailers. Requires a backend flush endpoint and clear consent copy
  (the consent framework is already in place).

## Positioning vs competitors

Your moat is **AI depth + complete experience**; the one place Bourboneur beats
you is **real secondary pricing data** (their Bourbon Blue Book). Close it by
licensing a secondary index or growing your own comps from accepted in-app
trades over time — the trade engine is already shaped for it. Meanwhile Pro +
affiliate monetize the AI/experience advantage that no competitor has.

## Suggested launch pricing

- Annual **$29.99/yr** (undercuts $3/mo on an annual basis), Monthly
  **$4.99/mo**, Lifetime **$99.99**, all after a **7-day free trial**.
- Tune in App Store Connect; the paywall reads live prices from RevenueCat.
