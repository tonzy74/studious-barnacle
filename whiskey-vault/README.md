# 🥃 Whiskey Vault

A mobile app (iOS + Android, built with Expo / React Native) for managing a personal whiskey
collection:

- **Scan & inventory** — scan a bottle's UPC/EAN barcode with the camera. Known bottles are
  identified from a built-in reference database (with professional-review-aggregated tasting
  notes and flavor profiles); unknown barcodes are looked up on Open Food Facts, with manual
  entry as a fallback. Everything persists on-device.
- **Random pour** — can't decide? Filter by style / open-bottles-only and let the app pick
  tonight's pour.
- **AI Sommelier (Pair tab)** — an in-app chatbot powered by the Claude API that recommends
  pairings (food, cigars, desserts, occasions) from *your* collection, grounded in each
  bottle's aggregate tasting notes.
- **Guest Match** — type in the bourbons/whiskeys a friend loves and every bottle in your bar
  gets a match % based on flavor-profile similarity (cosine similarity over a 10-axis flavor
  vector).

## Running it

```bash
cd whiskey-vault
npm install
npx expo start
```

Then scan the QR code with the [Expo Go](https://expo.dev/go) app on your phone (camera
scanning requires a real device, not a simulator).

## Enabling the AI Sommelier

The pairing chat calls the Claude API directly from your device using your own key:

1. Create an API key at [console.anthropic.com](https://console.anthropic.com)
2. In the app: **Bar tab → ⚙︎ → paste key → Save**

The key is stored only on your device (AsyncStorage) and sent only to Anthropic's API.

## How matching works

Each whiskey in the reference database (~55 widely reviewed bottlings) carries a 10-axis
flavor vector — sweetness, oak, vanilla, caramel, spice, fruit, floral, smoke, nutty,
earthy — distilled from the common language of professional reviews. Guest Match averages
the vectors of the favorites you enter and ranks your collection by cosine similarity.
Bottles not in the database get a style-typical default profile, which you can see flagged
on the bottle's detail page.

## Tests

```bash
npm test        # unit tests for the flavor/match engine
npm run typecheck
```
