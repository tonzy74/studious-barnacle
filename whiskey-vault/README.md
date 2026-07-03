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

## The reference database (1,100+ bottlings)

The reference database covers **1,100+ real bottlings** across bourbon, rye, Tennessee,
scotch, Irish, Japanese, Canadian, and world whiskeys. It's built in two layers
(`src/data/`):

- **Curated flagships** (~55) with individually written tasting-note summaries.
- **A house/expression generator**: every distillery gets a hand-written base flavor
  profile and house-character line; each of its real expressions is listed compactly with
  modifiers (barrel proof, sherry/port/PX/rum/wine/mizunara casks, wheated/high-rye
  mashbills, peat levels, toasted barrels, age statements…) that adjust the base vector.
  Tasting notes are synthesized from the resulting profile using a professional-review
  descriptor vocabulary.

Adding a missing bottle is a one-line change in the relevant `src/data/houses/*.ts` file.

## Store picks, batches, and missing bottles

**Store picks & batch variants** are first-class: every bottle can carry a batch code
("C923"), a store/club pick name, and a barrel number — shown throughout the app and fed
to the AI Sommelier. When your pick or batch runs at a different proof than the base
expression, the flavor profile is automatically scaled (hotter picks skew oakier and
spicier). The name matcher ignores batch codes and pick vocabulary, and understands
collector shorthand (ECBP, GTS, WLW, SFTB…), so "ECBP batch C923" resolves to Elijah
Craig Barrel Proof.

**When a bottle isn't in the database**, there are three fallbacks, and the app always
shows you which one produced the profile:

1. **AI profiling** — one tap asks Claude to build the 10-axis profile and tasting notes
   from its knowledge of professional reviews (it reports whether it recognized the exact
   bottling or estimated from style). Requires your API key.
2. **Style-typical default** — a sensible profile for the whiskey's category.
3. **Your palate** — every profile is hand-editable on the bottle page ("Adjust"), and
   Guest Match uses your adjusted values.

## How matching works

Each whiskey carries a 10-axis flavor vector — sweetness, oak, vanilla, caramel, spice,
fruit, floral, smoke, nutty, earthy. Guest Match averages the vectors of the favorites you
enter and ranks your collection by cosine similarity. Bottles not in the database get a
style-typical default profile, which you can see flagged on the bottle's detail page.

## Tests

```bash
npm test        # unit tests for the flavor/match engine
npm run typecheck
```
