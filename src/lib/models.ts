/**
 * Single source of truth for which Claude model the app calls. Surfaced in
 * Settings so the user always knows what they're on, and selectable so they
 * can fall back to a cheaper/higher-limit model if their API tier rate-limits
 * or gates the flagship.
 *
 * Vision accuracy (shelf photo, label reading) is best on the flagship Opus
 * model, so that's the default. Sonnet is a strong, cheaper, higher-limit
 * alternative; Haiku is the cheapest and fastest for text-only use.
 */
export interface ClaudeModelOption {
  id: string;
  label: string;
  note: string;
}

export const CLAUDE_MODELS: ClaudeModelOption[] = [
  {
    id: 'claude-opus-4-8',
    label: 'Opus 4.8',
    note: 'Most accurate vision — best for shelf photos & label reading',
  },
  {
    id: 'claude-sonnet-5',
    label: 'Sonnet 5',
    note: 'Strong vision, cheaper, higher rate limits — good fallback',
  },
  {
    id: 'claude-haiku-4-5-20251001',
    label: 'Haiku 4.5',
    note: 'Cheapest & fastest — best for text (sommelier chat)',
  },
];

/** Default: the most accurate vision engine. */
export const DEFAULT_MODEL = 'claude-opus-4-8';

/**
 * Fast model for text-only tasks (releases, cocktails) where flagship vision
 * accuracy isn't needed — Haiku is several times quicker and much cheaper, so
 * these screens feel snappy instead of waiting on Opus.
 */
export const FAST_MODEL = 'claude-haiku-4-5-20251001';

/** Human label for a model id (falls back to the raw id if unknown). */
export function modelLabel(id: string): string {
  return CLAUDE_MODELS.find((m) => m.id === id)?.label ?? id;
}
