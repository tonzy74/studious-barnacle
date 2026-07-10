# Growth, Retention & Monetization Strategy

Whiskey Vault's revenue is a function of **activation → habit → investment →
conversion → LTV**. This doc records the behavioral science behind each lever
and how it's implemented, so future changes stay grounded rather than guessed.

## Ethics: persuasion, not manipulation (this is the higher-earning path)

Every mechanic here is **honest**. We use evidence-based persuasion — framing,
progress, status, well-timed prompts — but never dark patterns: no fake
scarcity/countdowns, no fabricated "N people viewing", no hidden fees, no
hard-to-cancel traps, no confirmshaming. That's a deliberate revenue decision,
not just an ethical one:

- Dark patterns trigger **App Store rejection**, **FTC/EU fines** (active
  enforcement since 2023), **chargebacks and refunds**, and **1-star reviews** —
  all of which destroy LTV and can pull the app.
- Durable revenue compounds from **genuine value + trust**: retention,
  renewals, referrals, and App-Store featuring. Honest persuasion maximizes the
  metric that actually matters (lifetime value), not just first-tap conversion.

If a change can't be stated plainly to the user without them feeling tricked, we
don't ship it.

## Who we optimize for

American-whiskey enthusiasts and collectors: predominantly 30–55, disposable
income, hobbyist/completionist mindset, motivated by valuation, rarity,
"chasing" allocated bottles, and bragging rights. They already spend on the
hobby — the app's job is to become the daily home for it.

## 1. Daily habit — streaks (`engagement.ts`, Home "Today")

- **Loss aversion** (Kahneman & Tversky, 1979): a running streak becomes
  something the user doesn't want to *lose*, a stronger motivator than an
  equivalent gain.
- **The Hooked model** (Eyal, 2014): trigger → action → **variable reward** →
  investment. The streak + a daily-rotating "Tonight's Pour" supply the
  variable reward and a concrete reason to open the app every day.
- **Habit formation** (Lally et al., 2010): habits take ~66 days of repetition;
  a visible streak counter scaffolds that repetition.
- Implementation: `registerVisit` folds one visit/day into a streak; Home shows
  a flame + count and dims when the streak is at risk (recoverable within a day).

## 2. Investment & completeness — milestones (`nextMilestone`)

- **Goal-gradient effect** (Kivetz, Urminsky & Zheng, 2006): effort accelerates
  as a goal nears. We always surface the *closest* unmet goal (bottles, value,
  or styles) with a progress bar.
- **Endowed progress** (Nunes & Drèze, 2006): progress already made pulls people
  toward completion — the bar reframes an empty task as a half-done one.
- **Zeigarnik effect**: incomplete tasks stay mentally "open," so a partially
  filled progress bar nags pleasantly toward the next add.
- **IKEA effect / investment**: every bottle, note, and rating raises switching
  cost. More stored data ⇒ higher retention ⇒ higher LTV.

## 3. Micro-education — daily tip (`tipOfTheDay`)

Small, offline, rotating knowledge nuggets add session value and a low-cost
reason to return (variable content), without any API cost or compliance risk.

## 4. Identity & status — Collector Levels (`collectorLevel.ts`)

A single overall rank (Novice → Legend) derived from collection depth,
diversity, rarity, and value — all the user's own data.

- **Self-signaling / identity** (Bodner & Prelec, 2003): people act to confirm a
  self-image. Becoming "a Curator" makes whiskey collecting part of who they
  are, which sustains the behavior far longer than a streak alone.
- **Goal-setting theory** (Locke & Latham, 2002): a specific, slightly
  out-of-reach next rank drives more effort than "collect more". We always show
  the exact points to the next title.
- **Peak-end rule** (Kahneman): a level-up fires a one-time celebration the
  moment it happens, ending sessions on a high and creating a memorable peak.
- The rank appears in the **share text**, so status-signaling doubles as
  viral acquisition (people share ranks they're proud of).

## 5. Conversion — the paywall (`PaywallScreen`, `monetization.ts`)

- **Price anchoring & the decoy effect** (Ariely, *Predictably Irrational*): the
  annual plan shows a struck-through `$59.88` anchor (12× the monthly price) and
  a `SAVE 50%` badge; lifetime sits above as a high anchor that makes annual feel
  reasonable.
- **Default effect**: annual is pre-selected — most users accept the default.
- **Risk reversal / free-trial framing**: a 7-day trial with an explicit
  "reminder before it bills" and "cancel anytime" lowers perceived risk, the
  single biggest driver of trial starts.
- **Value reframing**: "One bottle you don't overpay for covers years of Pro"
  anchors price against the hobby's own spend, not against other apps.
- **Genuine, enforced urgency** (`introOffer.ts`): a Founder's offer (40% off
  annual) tied to the user's first-open, with a live countdown. The deadline is
  *real* — when it passes the offer is gone and does **not** silently reset, and
  the intro price maps to a real RevenueCat intro-offer package so it's actually
  charged. This is the honest line: real limited-time offers convert; fake or
  looping countdowns are the dark pattern the FTC/App Store penalize, so we
  don't ship those.
- **Compliance**: no fabricated review counts or testimonials — App Store review
  prohibits fake social proof, so every claim here is honest math or a real
  feature. AI features are *not* gated (they run on the user's own key); Pro
  gates only on-device power features that cost us nothing per use.

## 6. Viral & lifecycle loops (`referral.ts`, `winBackOffer.ts`)

- **Double-sided referral** (Dropbox's engine): both the referrer and the new
  user get a free month of Pro. Two-sided rewards convert far better than
  one-sided because the sharer isn't asking a favor — they're giving a gift
  (reciprocity, Cialdini). Self-referral and double-apply are blocked; rewards
  are granted as real promotional Pro access.
- **Win-back** for lapsed members: a genuine, **time-bounded** discount (50% off
  the first year back, 60-day window) shown only to users who actually had Pro
  and churned. Reactivating a known user is cheaper than acquiring a new one,
  and a real deadline supplies honest urgency — it clears the instant they
  re-subscribe and expires for good after the window (no fake reset).

## 7. Where the money comes from

1. **Pro subscriptions** — annual-primary, monthly for the impatient, lifetime
   for whales.
2. **Affiliate** — buy-links on bottle/label/release screens (see
   `docs/MONETIZATION.md`).
3. **LTV compounding** — habit + investment raise retention, which multiplies
   both subscription renewals and affiliate volume.

## Measurement (when analytics backend lands)

Track: D1/D7/D30 retention, streak length distribution, activation rate (first
bottle added in session 1), paywall view→trial→paid funnel, and affiliate CTR.
The consent-gated event queue (`analyticsCore.ts`) already captures the events;
wiring a backend turns them into the dashboard these levers should move.
