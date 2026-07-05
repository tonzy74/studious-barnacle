# Affiliate Price Service (reference backend)

This is the **backend** the app talks to for live retailer pricing and
"where to buy" links. The app never calls retailers directly — that would
breach their terms and Apple's review rules. Instead:

```
Whiskey Vault app  ──►  THIS service  ──►  affiliate networks' product feeds
                        (you deploy)        (Impact / Rakuten / AWIN / CJ)
```

## How you actually get paid

Affiliate revenue works like this:

1. **Join affiliate networks** and get approved for merchant programs. For
   spirits, the merchants that actually run affiliate programs are mostly
   online sellers: **ReserveBar, Wine.com, Flaviar, Caskers, Drinks.com,
   The Whisky Exchange**, etc. (Total Wine / Bottle King are brick-and-mortar
   first and generally do **not** offer open affiliate programs.)
   - [Impact](https://impact.com), [Rakuten Advertising](https://rakutenadvertising.com),
     [AWIN](https://awin.com), [CJ](https://cj.com).
2. Each approved program gives you a **product feed** (name, UPC, price,
   availability, image) and a way to build **tracking deep links** that carry
   your publisher ID (and an optional **SubId** you set — use it to tag that
   the click came from the app, e.g. `subId=app-bottledetail`).
3. This service ingests those feeds on a schedule, matches rows to a bottling
   by **UPC first, then normalized name**, wraps each product URL in your
   tracking deep link, and serves them to the app.
4. When a user taps an offer and buys, the network attributes the sale to your
   publisher ID and **you earn the commission**. The SubId lets you see that
   Whiskey Vault drove it.

The app already:
- opens the exact `url` this service returns (so put your tracking link there),
- shows the FTC-required affiliate disclosure and a 21+ notice,
- lets the user set the lowest offer as the bottle's retail anchor.

So "getting paid" = deploy this service, enroll in the programs, and return
your tracking deep links in the `url` field. No app change needed.

## The contract the app expects

```
GET /v1/prices?name=<bottling name>&upc=<optional UPC>
Accept: application/json
```

Response (`200`):

```json
{
  "msrp": 39.99,
  "secondary": 72.0,
  "offers": [
    {
      "retailer": "ReserveBar",
      "price": 44.99,
      "url": "https://reservebar.com/products/xyz?irclickid=...&subId=app-bottledetail",
      "currency": "USD",
      "inStock": true
    }
  ],
  "updatedAt": "2026-07-05T00:00:00Z"
}
```

The app validates everything defensively: only `https` URLs are opened,
prices must be finite and positive, strings are sanitized, and the list is
capped. Return whatever you have — omit fields you don't.

## Wiring the app to this service

Set `PRICING_API_BASE_URL` in `src/config.ts` to this service's origin
(must be `https://` in production). Until you do, the app shows no offers and
falls back to its built-in curated / AI-estimated pricing.

## Compliance checklist

- **FTC**: affiliate relationship must be disclosed (the app does this on the
  offer list). Keep it.
- **Apple**: affiliate links to **physical** goods are allowed. Don't route
  digital goods through them.
- **Alcohol**: 21+ gating is the retailer's responsibility at checkout; the
  app shows a 21+ notice. Keep advertising within each network's alcohol
  policy.
- **Licensing**: only serve feeds from programs you're approved for. Never
  scrape retailer HTML.

See `index.js` for a minimal, deployable reference implementation.

## Run it now (works out of the box)

```bash
cd server/affiliate-price-service
node index.js          # serves on :8787 from sample-catalog.json
node test.js           # smoke tests

curl "http://localhost:8787/v1/prices?name=eagle%20rare%2010"
```

Then point the app at it: set `PRICING_API_BASE_URL` in `src/config.ts` to
your server's origin (e.g. `https://api.yourdomain.com`). The bottle page's
"Where to buy" section and reference images light up immediately.

## Deploy

Zero dependencies, so it runs anywhere Node 18+ runs:

- **Render / Railway / Fly.io**: point at this folder, start command `node index.js`.
- **A small VPS**: `node index.js` behind nginx/Caddy for TLS.
- **Vercel/Netlify**: wrap `server` from `index.js` in a serverless function.

Set `PORT` if the host requires it. Production must be `https`.

## Plugging in real feeds

The sample catalog is demo data. For live pricing + licensed images + paid
tracking links:

1. **Join a network + get approved for merchant programs.** The spirits
   merchants that actually run affiliate programs are online sellers:
   - **Flaviar** (via Impact) — up to 60% on memberships, ~5% retail
   - **Wine.com** — ~5%
   - **ReserveBar**, **Caskers**, **Spirit Hub**, **Drizly/Uber** — retail rates
2. Set the adapter env vars (see `adapters/impact.js`) and
   `FEED_SOURCE=impact`. Implement the item→product mapping for your catalogs.
3. Set `IMPACT_PUBLISHER_ID` / `AFFILIATE_SUBID` so every offer URL carries
   your tracking (see `lib/affiliate.js`).

### About secondary-market pricing

Affiliate feeds give you **retail** prices and images. They do **not** give
**secondary-market** values — that's a licensed data asset (this is exactly
Bourboneur's "Bourbon Blue Book" moat). Options to fill the `secondary`
field: license a secondary index, or grow your own comps from accepted in-app
trades over time (the app's trade engine is already shaped for this). Leave
`secondary` null until then; the app falls back to its estimate.

