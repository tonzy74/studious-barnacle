# Pricing Strategy — research-backed

Goal: maximize **LTV** (not just conversion) for a niche hobby audience with
disposable income and low price sensitivity. Everything below is grounded in
published pricing research and mobile-subscription benchmarks, then applied to
Whiskey Vault. Benchmarks are industry ranges (sources named) — directional, not
guarantees; validate with the Insights funnel once live.

## 1. The behavioral principles we price on

- **Charm / left-digit effect** (Anderson & Simester 2003; Thomas & Morwitz
  2005): $29.99 reads meaningfully cheaper than $30 because the brain anchors on
  the left digit. Keep `.99` endings.
- **Anchoring & the decoy effect** (Ariely, *Predictably Irrational*; Huber
  1982): a high option (lifetime) and a deliberately weak option (monthly) make
  the target (annual) look like the smart buy. The monthly plan's real job is to
  be the decoy, not the seller.
- **Default effect** (Johnson & Goldstein 2003): most people accept the
  pre-selected option. Annual is pre-selected — this alone lifts annual mix.
- **"Pennies-a-day" reframing** (Gourville 1998): "$2.50/mo, billed yearly"
  feels far smaller than "$29.99/yr" even though it's identical. Lead with the
  per-month figure on annual.
- **Rule of 100** (Berger, *Contagious*): for prices under $100, a **percentage**
  discount ("SAVE 50%") beats an absolute one ("$30 off") in perceived value.
  Above $100, flip to absolute. Our discounts are under $100 → use %.
- **Price–quality heuristic**: too-cheap signals low quality. Undercutting to the
  floor can *reduce* perceived value for a premium hobby product.
- **Loss-aversion trials** (Kahneman & Tversky): a free trial creates an
  endowment users don't want to lose; a pre-bill reminder lowers risk and lifts
  trial starts without hurting conversion.

## 2. Subscription benchmarks (mobile, consumer)

Sources: RevenueCat *State of Subscription Apps 2023/2024*, AppsFlyer, Business
of Apps.

- **Free → paid** (freemium): typically **1–5%**; median consumer app ~1.5–2.5%.
  Well-targeted niche apps with a strong "aha" run higher.
- **Trial → paid**: consumer **~15–35%**; utility/productivity **30–45%** when
  there's a reminder + clear value. Whiskey Vault is utility-flavored (valuation,
  inventory) → aim 25–40%.
- **Plan mix**: annual usually **50–70%** of subscribers when pre-selected;
  annual buyers have the highest LTV and lowest churn.
- **Monthly churn**: consumer subs often **5–8%/mo**; annual retains far better —
  another reason to steer to annual.
- **Median consumer subscription price**: ~$5–10/mo, ~$30–50/yr.

## 3. Recommended tier structure

Current app: Annual $29.99 (best/default), Monthly $4.99, Lifetime $99.99,
7-day trial, Founder $17.99 first week.

Recommendation — **keep the shape, widen the spread, test a higher annual:**

| Plan | Was | Now (shipped) | Rationale |
|---|---|---|---|
| Monthly | $4.99 | **$6.99** ✅ | Widens the annual gap → annual reads "SAVE 64%". Captures impulse/monthly payers at higher ARPU. Its job is decoy, not volume. |
| **Annual** (default) | $29.99 | **A/B: $29.99 vs $39.99** ✅ | Hobby buyers are price-insensitive; a 33% lift often barely dents conversion. Live 50/50 split (`annual_price_v1`) — the upside is pure margin. Keeps `.99`, pre-selected, leads with the per-month figure. |
| Lifetime | $99.99 | **$99.99** (test $129.99 next) | Whale anchor + one-time cash. Makes annual look reasonable. |
| Founder intro | $17.99/wk1 | **40% off the arm price** ✅ | Genuine, enforced launch urgency. Now derived from whichever annual arm the user is in ($17.99 or $23.99). |

**Implemented** in `src/lib/monetization.ts` (`buildProPlans`) + `src/lib/experiments.ts`
(`ANNUAL_PRICE_EXPERIMENT`). Every savings badge / anchor / per-month figure is
*derived from the real price* so the math can't drift from what's charged. The
assigned arm is stamped onto `paywall_shown` and `pro_purchased` events
(`annual_variant`) for read-out. **Wire two annual packages in RevenueCat**
(`$rc_annual` = $29.99, `$rc_annual_39` = $39.99) so the arm the user sees is the
one billed; ship the winner and collapse the split.

Why not race Bourboneur to $3/mo: the price–quality heuristic + the fact that
your AI depth is a real differentiator. Compete on *value shown*, not on being
cheapest. Undercutting leaves money on the table with this audience.

## 4. Freemium line (what's free vs Pro)

Keep the **metered-AI** model (already built):
- **Free:** ~15 AI actions/mo (scan, sommelier, releases) — enough to feel the
  magic; the wall hits at peak intent. Plus unlimited manual tracking + value.
- **Pro:** unlimited AI, portfolio history/export, price alerts, recommendations.
- **Never** gate the core "add a bottle → see its value" loop — that's the hook
  that sells Pro. Gate *unlimited* and *power features*, not access.

## 5. Trial strategy

- 7-day free trial, annual default, explicit "reminder before it bills" +
  "cancel anytime" (all built). This is the single biggest conversion lever.
- Test **hard paywall on the AI-quota wall** (trial offer at the moment of
  desire) vs a softer prompt — the contextual-paywall engine already fires here.
- **3-day trial A/B** ✅ *live* (`trial_length_v1`, 7-day vs 3-day): shorter
  trials can lift paid conversion for impulse categories (less time to forget the
  value); 7-day suits considered purchases. Assigned per install via
  `resolveTrial(anonId)`; the paywall and the Explore teaser both read the same
  arm so the promised length always matches, and `trial_variant` is stamped onto
  `paywall_shown` / `pro_purchased`. **Wire both intro offers in App Store
  Connect / RevenueCat** so the arm shown is the one actually granted.

## 6. A/B test roadmap (in priority order)

Run one variable at a time; ship the winner. Measure with the Insights funnel
(paywall_shown → pro_purchased).

1. **Annual $29.99 vs $39.99** — likely the biggest ARPU lever. ✅ *live* (`annual_price_v1`).
2. **Trial 7-day vs 3-day** — conversion timing. ✅ *live* (`trial_length_v1`).
3. ~~Monthly $4.99 vs $6.99~~ — resolved: shipped at **$6.99** as the decoy.
4. **Paywall copy**: value-reframe ("one bottle you don't overpay for…") vs
   feature-list-first.
5. **Founder discount 40% vs 30%** — urgency vs margin.

RevenueCat Experiments (or your own remote-config flag) makes these no-code once
billing is wired.

## 7. Unit economics — the number that governs ad spend

```
LTV ≈ (annual price × gross margin) × avg years retained
     + monthly cohort contribution
```

At Annual $29.99, ~90%+ margin (AI cost ~$1–3/user/yr via the metered proxy),
and ~1.5–2.5 yr average retention, **LTV ≈ $40–65** per paying user.

Blended LTV per *install* = payer-LTV × conversion. At 3% install→paid:
`$50 × 0.03 ≈ $1.50/install`. **That's your allowable CAC ceiling** (before
payback-period tolerance). Anything cheaper than ~$1.50 CPI (adjusted for
conversion) is profitable to scale. See `docs/MARKETING.md` for hitting it.

**Bottom line:** keep the annual-default freemium shape, widen the monthly gap,
and A/B the annual price upward — the audience will bear it, and it flows almost
entirely to margin.
