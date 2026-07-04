# Whiskey Vault — Privacy Policy

_Last updated: July 2026. This policy ships with the app and must be kept current with its
actual behavior. Host it at a public URL before App Store submission._

## The short version

Your whiskey collection lives **on your device**. We don't run servers, we don't see your
data, and nothing is shared with anyone unless you explicitly turn a sharing option on.
Every data practice below is opt-in and reversible in **Settings → Privacy & Data**.

## What the app stores, and where

| Data | Where it lives | Leaves your device? |
|---|---|---|
| Your bottle collection, learned library, preferences | On-device storage | Never, except as below |
| Your Anthropic API key (optional, for AI features) | iOS Keychain / Android Keystore | Sent only to Anthropic's API to authenticate your requests |
| Sign in with Apple profile (user ID, name, email if shared) | On-device; token in Keychain | Not today (will enable optional sync in a future version) |
| Anonymized usage analytics (only if you opt in) | On-device event queue | Not today; a future version may send them to our analytics service, and — only with your separate opt-in and iOS tracking permission — to partners |

## When data does leave your device

- **AI Sommelier & AI bottle profiling** (only if you add an API key): your collection's
  tasting metadata (bottle names, notes, flavor profiles, rarity, pricing estimates) is
  sent to **Anthropic** (anthropic.com/privacy) to generate responses, under your own key.
- **Barcode lookups**: the scanned barcode number is sent to **Open Food Facts**
  (openfoodfacts.org) to identify unknown bottles. No personal data accompanies it.

## Analytics & data sharing (both OFF by default)

- **Usage analytics** (opt-in): anonymous events like "bottle added (bourbon, B-tier)" —
  identified by a random ID, never your name, email, Apple ID, or bottle names.
- **Sharing/sale to partners** (separate opt-in + iOS tracking permission): covers only
  the anonymized analytics above. We honor "Do Not Sell or Share My Personal Information"
  (CCPA/CPRA) — the toggle in Settings is that right, and it defaults to off. Declining
  the iOS tracking prompt keeps sharing off regardless of the toggle.

## Your rights (all self-service in Settings → Privacy & Data)

- **Export**: "Export my data" produces a complete JSON copy (GDPR Art. 15 / CCPA access).
- **Delete**: "Delete all my data" permanently erases the collection, learned library,
  sign-in, analytics queue, and API key from the device and Keychain (GDPR Art. 17 /
  CCPA deletion / Apple account-deletion requirement).
- **Withdraw consent**: flip either toggle off at any time; it takes effect immediately.

## Age

Whiskey Vault catalogs alcoholic beverages and is intended for users of legal drinking
age in their jurisdiction (17+ App Store rating).

## Contact

Questions or requests: [ADD CONTACT EMAIL BEFORE PUBLISHING].
