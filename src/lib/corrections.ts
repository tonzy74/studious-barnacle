import { IdentifiedBottle } from './claude';
import { Correction, WhiskeyType } from '../types';

/**
 * Self-improving identification: the app remembers when a user fixes an AI
 * misread and applies that fix automatically to future identifications.
 */

/** Normalized key for matching an identification to a stored correction. */
export function correctionKey(name: string, distillery = ''): string {
  return `${name} ${distillery}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Apply stored corrections to a fresh set of AI identifications. Any bottle
 * the AI reads the same way a user has corrected before is rewritten to the
 * corrected identity and promoted to high confidence (a human verified it).
 */
export function applyCorrections(
  identified: IdentifiedBottle[],
  corrections: Correction[]
): IdentifiedBottle[] {
  if (corrections.length === 0) return identified;
  const byKey = new Map(corrections.map((c) => [c.from, c]));
  return identified.map((b) => {
    const hit = byKey.get(correctionKey(b.name, b.distillery));
    if (!hit) return b;
    return {
      ...b,
      name: hit.name,
      distillery: hit.distillery,
      type: hit.type,
      proof: hit.proof ?? b.proof,
      confidence: 'high',
    };
  });
}

/**
 * Record (or reinforce) a correction from the AI's original read to the
 * user's fixed identity. Returns a new list — pure, so the store stays simple.
 * A no-op when nothing actually changed.
 */
export function upsertCorrection(
  list: Correction[],
  original: { name: string; distillery: string },
  fixed: { name: string; distillery: string; type: WhiskeyType; proof?: number },
  now: number = Date.now()
): Correction[] {
  const from = correctionKey(original.name, original.distillery);
  if (!from) return list;
  // Nothing changed — don't store a correction that maps a bottle to itself.
  if (
    correctionKey(fixed.name, fixed.distillery) === from &&
    correctionKey(original.name, original.distillery) === from &&
    original.name.trim() === fixed.name.trim() &&
    original.distillery.trim() === fixed.distillery.trim()
  ) {
    return list;
  }
  const next = list.filter((c) => c.from !== from);
  const existing = list.find((c) => c.from === from);
  next.push({
    from,
    name: fixed.name.trim(),
    distillery: fixed.distillery.trim(),
    type: fixed.type,
    proof: fixed.proof,
    count: (existing?.count ?? 0) + 1,
    at: now,
  });
  // Cap the table so it can't grow without bound.
  return next.slice(-500);
}
