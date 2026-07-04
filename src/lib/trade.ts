import { Rarity } from '../types';
import { fairPrice } from './pricing';

/**
 * Trade valuation engine (Phase 1: on-device analyzer).
 *
 * COMPLIANCE: Whiskey Vault is a valuation, negotiation, and record-keeping
 * tool. It does not process payments for bottles, arrange shipping, or act
 * as a marketplace — private alcohol transfers are regulated and are the
 * users' responsibility under their local laws. Cash amounts entered here
 * are part of the fairness math only; any settlement happens off-app.
 *
 * Phase 2 (backend) replaces the market anchor with time-decayed medians of
 * accepted in-app trades (comps) — the shapes below already carry a
 * `confidence` field for that.
 */

/** Opened bottles trade at a steep discount to sealed. */
export const OPENED_MULTIPLIER = 0.55;

/** Trades within ±10% of the larger side are considered fair. */
export const FAIRNESS_BAND = 0.1;

export type TradeConfidence = 'comps' | 'anchor';

export interface TradeValuation {
  value: number;
  confidence: TradeConfidence;
}

/**
 * A bottle's trade value: the rarity-aware fair-price anchor, discounted if
 * the bottle is open. Note: what the owner PAID is deliberately not an
 * input — cost basis is shown for gain/loss context, but the market doesn't
 * care what anyone paid.
 */
export function bottleTradeValue(b: {
  msrp?: number;
  secondary?: number;
  rarity?: Rarity;
  opened?: boolean;
}): TradeValuation | undefined {
  const anchor = fairPrice(b.msrp, b.secondary, b.rarity);
  if (anchor === undefined) return undefined;
  return {
    value: Math.round(anchor * (b.opened ? OPENED_MULTIPLIER : 1)),
    confidence: 'anchor',
  };
}

export type TradeVerdict = 'fair' | 'you-win' | 'they-win';

export interface TradeEvaluation {
  myTotal: number;
  theirTotal: number;
  /** theirSide − mySide: positive means you come out ahead. */
  delta: number;
  verdict: TradeVerdict;
  suggestion: string;
}

export function evaluateTrade(opts: {
  myBottleValues: number[];
  theirBottleValues: number[];
  /** Cash kicker each side adds (recorded for fairness math, settled off-app). */
  myCash?: number;
  theirCash?: number;
}): TradeEvaluation {
  const sum = (xs: number[]) => xs.reduce((a, b) => a + (Number.isFinite(b) ? Math.max(0, b) : 0), 0);
  const cash = (c?: number) => (Number.isFinite(c ?? 0) ? Math.max(0, c ?? 0) : 0);
  const myTotal = Math.round(sum(opts.myBottleValues) + cash(opts.myCash));
  const theirTotal = Math.round(sum(opts.theirBottleValues) + cash(opts.theirCash));
  const delta = theirTotal - myTotal;
  const band = Math.max(myTotal, theirTotal, 1) * FAIRNESS_BAND;

  if (Math.abs(delta) <= band) {
    return {
      myTotal,
      theirTotal,
      delta,
      verdict: 'fair',
      suggestion: 'Within the ±10% fair band — shake on it.',
    };
  }
  if (delta > 0) {
    return {
      myTotal,
      theirTotal,
      delta,
      verdict: 'you-win',
      suggestion: `You come out ahead by ~$${delta.toLocaleString('en-US')}. Adding ~$${delta.toLocaleString('en-US')} in cash or a comparable bottle on your side would even it up.`,
    };
  }
  return {
    myTotal,
    theirTotal,
    delta,
    verdict: 'they-win',
    suggestion: `They come out ahead by ~$${(-delta).toLocaleString('en-US')}. Ask for ~$${(-delta).toLocaleString('en-US')} in cash or another bottle to make it fair.`,
  };
}
