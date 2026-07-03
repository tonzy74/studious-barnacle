# Security Architecture — Whiskey Vault

This document codifies the security posture of the app today and the non-negotiable rules
for its planned evolution (user accounts, payments). Treat it as binding for future PRs.

## Current model (client-only app)

- **No secrets in source, config, or the repo — ever.** CI-verifiable: `git grep -iE
  'sk-ant|api[_-]?key\s*[:=]' -- '*.ts' '*.tsx' '*.json'` must return only variable names,
  never values. The app ships with zero embedded credentials.
- **User's Anthropic API key** is BYO, entered in Settings, stored **only in the iOS
  Keychain / Android Keystore** (`expo-secure-store`), never in AsyncStorage (the zustand
  persist layer `partialize`s it out; legacy plaintext keys are migrated to the Keychain
  and scrubbed on first launch). It is transmitted only to `api.anthropic.com` via the
  official SDK.
- **All network traffic is HTTPS** with default iOS App Transport Security (no ATS
  exceptions declared). The app talks to exactly two hosts: `api.anthropic.com` and
  `world.openfoodfacts.org`.
- **Untrusted inputs** (barcode contents, Open Food Facts fields, AI output) are treated
  as hostile: URL components are encoded, external text is control-char-stripped and
  length-capped before persistence (`cleanExternalText`), AI JSON is schema-constrained
  and field-validated/clamped, and everything renders through inert React Native `<Text>`
  (no WebView, no deep-link scheme, no `eval`-like patterns).
- **Data residency:** the collection lives on-device. Chat/profiling sends collection
  metadata to Anthropic under the user's own key; that must be disclosed in the privacy
  policy.

## Rules for user accounts (when added)

1. **Never roll our own auth.** Use a managed provider (Supabase Auth, Firebase Auth,
   Auth0, or Clerk): they own password hashing, token rotation, MFA, and breach response.
2. **Sign in with Apple is mandatory** on iOS the moment any third-party sign-in (Google,
   Facebook, etc.) is offered — App Store Review Guideline 4.8.
3. **Tokens live in the Keychain** (same `expo-secure-store` pattern as the API key),
   never AsyncStorage. Short-lived access tokens + refresh rotation.
4. **Authorization is server-side only.** The client is untrusted; the sync backend
   enforces per-user data isolation (e.g. Postgres row-level security in Supabase). No
   client-supplied user IDs are ever trusted.
5. **Once accounts exist, the AI calls move server-side** behind the user's session, and
   the Anthropic key becomes a server secret — the BYO-key flow is retired. This is also
   the cost-control and abuse-moderation point.
6. Collect the minimum: email + credential. The collection data itself should be
   encrypted in transit (TLS) and at rest (provider-managed), and deletable on request
   (GDPR/CCPA + App Store account-deletion requirement — Guideline 5.1.1(v)).

## Rules for payments (Apple Pay / PCI DSS)

**Decision tree first — Apple decides the rails, not us:**

- **Digital features** (premium tiers, subscriptions, AI credits) **must use Apple
  In-App Purchase / StoreKit.** Apple Pay is not permitted for digital content — apps get
  rejected for this. IAP means Apple processes the payment; **no cardholder data ever
  exists in our system → PCI DSS does not apply to us at all** for those flows.
- **Physical goods/services** (e.g. a future bottle marketplace) use **Apple Pay backed by
  a PCI Level 1 processor** (Stripe, Adyen, Braintree).

**PCI DSS posture for the Apple Pay + processor path** (targeting the smallest possible
scope, SAQ A):

1. **Cardholder data never touches our code or servers.** No card-number fields, ever.
   Apple Pay hands the app a network-tokenized, encrypted payload (DPAN — the real PAN is
   never present on the device) which is passed **only** to the processor's SDK; our
   backend sees a processor token (`tok_…`/`pm_…`), charges by token, and stores only the
   token + last4/brand for display.
2. **Never log, persist, or transmit** the Apple Pay payload anywhere except the
   processor. No card data in analytics, crash reports, or support tooling.
3. **TLS 1.2+ everywhere**, HSTS on any web endpoints, certificates from a managed CA.
4. **Secure SDLC evidence** (this repo already practices it): dependency scanning
   (`npm audit` in CI), code review on every change, no secrets in source, and this
   document kept current — SAQ A still requires attestation of practices like these.
5. **Webhooks from the processor are signature-verified** (e.g. Stripe signing secret)
   before any fulfillment.
6. Re-run a security review (SAST + DAST against the backend) **before** the first
   payment flow ships; payments changes require it thereafter.

## Standing verification

- `npm audit` on every dependency change (build-toolchain-only advisories tracked, runtime
  advisories block release).
- Unit tests cover adversarial inputs (hostile names, batch codes, malformed barcodes,
  missing pricing data). Extend them with any new input surface.
- Any new network destination, permission, or storage location requires updating this
  document in the same PR.
