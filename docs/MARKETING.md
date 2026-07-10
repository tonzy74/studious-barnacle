# Go-To-Market & Activation Plan

Optimized for **minimal founder effort**: lead with channels whose targeting and
optimization are run by the platform's algorithm, layer a free ASO foundation,
and let the funnel data (Insights) decide where to scale. Benchmarks are
industry ranges (sources named) — validate against your own numbers.

## 1. Who we're targeting

American-whiskey enthusiasts & collectors: skew **male 28–55**, disposable
income, hobbyist/completionist, already spending on the hobby. They congregate
on Instagram/TikTok "whiskeytok/bourbontok", YouTube review channels, and Reddit
(r/bourbon ~600k, r/whiskey ~1M, r/Scotch). Intent signals: they search the App
Store for "whiskey collection", "bourbon inventory", "bar tracker".

## 2. Positioning (one line + proof)

**"Scan any bottle and instantly know what your collection is worth."**
Proof points that convert this audience: **valuation** (bragging + insurance),
**AI scanning** (magic/wow), **rarity/allocated tracking** (the chase),
**completeness** (lineups/levels). Lead creative with the *value reveal* — it's
the strongest hook.

## 3. Channel strategy (ranked for effort-adjusted ROI)

| Channel | Automation | Effort | Why / expected | Start? |
|---|---|---|---|---|
| **Apple Search Ads (Basic)** | Full (Apple optimizes) | ~15 min setup | App Store search = pure install intent; highest-converting install source; often the lowest effective CPI. Basic = set a monthly cap, Apple runs it. | ✅ Day 1 |
| **Meta Advantage+ App Campaign** | Full (auto audience+creative) | Low (needs 3–5 creatives) | Discovery/scale to the exact hobby demo; algo handles iOS/SKAN targeting. | ✅ Day 1 (small) |
| **ASO (organic)** | n/a | One-time | Free, compounding. Every paid install also lifts rank. | ✅ Day 0 |
| **Google App Campaign** | Full | Low | Cross-surface (YouTube/Search/Play) — useful if/when Android ships. | Later |
| **TikTok App/Spark Ads** | Med (needs UGC) | Med | whiskeytok is huge; UGC scanning demos go viral. Higher effort on creative. | Phase 2 |
| **Reddit promoted posts** | Low | Med (authenticity matters) | Laser-targeted subs; cheap CPMs; but the community punishes ads that aren't genuine. | Phase 2 |
| **Influencer / UGC seeding** | Manual | Med (batchable) | Micro-creators (10–100k) doing "scan my whole bar" demos — high trust, reusable as paid creative. | Phase 2 |

**The minimal-effort launch stack = ASO + Apple Search Ads Basic + one Meta
Advantage+ campaign.** All three run themselves after setup; you review weekly.

## 4. ASO — the free foundation (do this first)

- **Title/subtitle keywords**: whiskey collection, bourbon inventory, whiskey
  cellar/vault, bar tracker, scotch, tasting notes, collection value.
- **Screenshots**: #1 = the value reveal (collection worth). #2 = AI shelf scan.
  #3 = a bottle's rarity/value card. #4 = sommelier. #5 = releases calendar.
  First 2 screenshots drive ~90% of the install decision.
- **App Preview video** (15–30s): open app → scan shelf → bottles populate with
  values. The "wow" in motion.
- **Ratings**: the in-app review prompt (already built, fires at peak delight)
  compounds rank. Reply to reviews.
- **Localize** later; US-first now.

## 5. Creative angles (for paid + organic)

Test 4–6 short (6–15s) hooks; the algorithm finds the winner:
1. **"I scanned my whole bar in 30 seconds"** (speed/magic).
2. **"Turns out my collection is worth $______"** (value reveal — likely winner).
3. **"Which of these is the rarest?"** (rarity quiz → app answers).
4. **"What should I pour tonight?"** (sommelier).
5. **"The allocated drops coming this month"** (releases/FOMO).
6. **Before/after**: messy shelf photo → organized valued collection.

UGC (a real person, phone-shot) outperforms polished ads for this audience and
is cheap to source. Reuse the best-performing organic clips as paid creative.

## 6. Influencer / community playbook (batchable, low ongoing effort)

- Seed **20–40 micro-influencers** (whiskey IG/TikTok/YouTube, 10–100k) with a
  "scan your collection" ask + your **referral code** (already built — they earn
  a free month, so it's a gift, not a pitch). One outreach batch, ongoing payoff.
- Post authentically in r/bourbon/r/whiskey once there's genuine value to share
  (e.g., "I built a free app that values your collection") — disclose you're the
  maker; Reddit rewards honesty and punishes stealth ads.
- Partner with a whiskey newsletter/podcast for a sponsored mention (flat fee,
  one email, measurable via a promo/referral code).

## 7. Measurement & attribution (so scaling is data-driven)

- iOS: rely on **SKAdNetwork** + **Apple Search Ads** native attribution.
- Add a lightweight **MMP** (AppsFlyer / Adjust / Singular have free/low tiers)
  or **RevenueCat + Branch** to attribute installs → trials → purchases.
- Your **Insights funnel** (already built) is the source of truth for
  activation → paywall → purchase. Wire the analytics backend so ad platforms
  can optimize toward *purchase* events, not just installs (this ~2–3× ad
  efficiency).
- North-star to optimize campaigns toward: **trial start** (early) → **paid**
  (true).

## 8. Budget & scaling rules (governed by unit economics)

From `docs/PRICING.md`: allowable CAC ≈ **payer-LTV ($40–65) × conversion**.
At 3% install→paid that's ~**$1.20–2.00 per install** you can pay and stay
profitable (with a reasonable payback window).

- **Launch (Weeks 1–2):** ~$30–50/day. Split ~60% Apple Search Ads / 40% Meta
  Advantage+. Goal: learn CPI + install→trial→paid, not scale.
- **Rule to scale:** if `effective CPI < allowable CAC` on a channel for ~1 week,
  **double** its budget; if not, cut creative/keywords and retest. Never scale a
  channel that's above your CAC ceiling.
- **Benchmarks to expect** (US iOS, vary widely): ASA CPI often **$1–3** with
  high intent; Meta app-install CPI **$3–7**; blended install→paid the gate.
- Keep the **founder discount** live during launch for urgency (already built).

## 9. 30-day launch calendar (low-touch)

- **Day −7 → 0:** finalize ASO (title, screenshots, preview video); submit build;
  set up Apple Search Ads Basic + one Meta Advantage+ campaign (paused).
- **Day 0 (launch):** flip campaigns on at $30–50/day; post the founder story in
  1–2 communities honestly; send the influencer seeding batch.
- **Week 1:** watch install→trial→paid daily in Insights; kill dead creatives.
- **Week 2:** scale the winning channel per the rule above; add 2 new creatives.
- **Week 3:** turn on TikTok/Reddit test if CAC has headroom; ask happy users to
  share (review prompt + referral already automate this).
- **Week 4:** review LTV:CAC by channel; set the ongoing monthly budget at the
  level where LTV:CAC ≥ 3:1.

## 10. KPIs & guardrails (weekly, 15-min review)

- **Acquisition:** CPI by channel, install→trial, trial→paid, blended CAC.
- **Product (from Insights):** activation rate (first bottle in session 1),
  D1/D7/D30 retention, paywall view→purchase, share/referral rate.
- **Economics:** LTV:CAC (target ≥ 3:1), payback period (target < 12 mo).
- **Guardrail:** pause any channel above the CAC ceiling for a week; reallocate
  to the winner. Let the algorithm + the funnel do the work — this is the
  "minimal intervention" loop.

## What needs you (unavoidable, but one-time / weekly)

- Accounts: Apple Search Ads, Meta Business, (later) TikTok/Google Ads — your
  identity + billing.
- 3–5 short creative clips (phone-shot UGC is fine and better).
- ~15 min/week reviewing the KPI dashboard and moving budget to the winner.

Everything else — targeting, bidding, creative rotation, retargeting, review
requests, referral rewards — is automated by the platforms and the app.
