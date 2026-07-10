import { Ionicons } from '@expo/vector-icons';

import { FlavorProfile } from '../types';

/**
 * Taste-onboarding: a quick "what do you love?" quiz that seeds a palate before
 * the user owns a single bottle. This kills the recommendation cold-start (the
 * engine averages your collection — empty collection, no recs), and — via
 * commitment & consistency (Cialdini) plus mere personalization — makes the
 * app feel tailored from second one, which lifts activation and Pro intent.
 */

export interface TasteProfile {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  blurb: string;
  profile: FlavorProfile;
}

const fp = (
  sweet: number,
  oak: number,
  vanilla: number,
  caramel: number,
  spice: number,
  fruit: number,
  floral: number,
  smoke: number,
  nutty: number,
  earthy: number
): FlavorProfile => ({ sweet, oak, vanilla, caramel, spice, fruit, floral, smoke, nutty, earthy });

/** Preference archetypes the quiz offers; each maps to a seed flavor profile. */
export const TASTE_PROFILES: TasteProfile[] = [
  {
    id: 'sweet-smooth',
    label: 'Sweet & Smooth',
    icon: 'ice-cream',
    blurb: 'Vanilla, caramel, easy sipping (think wheated bourbon)',
    profile: fp(8, 4, 8, 8, 2, 4, 2, 0, 3, 1),
  },
  {
    id: 'bold-spicy',
    label: 'Bold & Spicy',
    icon: 'flame',
    blurb: 'High-rye heat, pepper, and baking spice',
    profile: fp(4, 7, 4, 5, 9, 3, 2, 1, 3, 3),
  },
  {
    id: 'rich-oaky',
    label: 'Rich & Oaky',
    icon: 'layers',
    blurb: 'Deep barrel char, tannin, dark fruit — older pours',
    profile: fp(4, 9, 5, 7, 5, 5, 2, 2, 6, 4),
  },
  {
    id: 'smoky-peated',
    label: 'Smoky & Peated',
    icon: 'bonfire',
    blurb: 'Campfire, brine, and earth (Islay-style Scotch)',
    profile: fp(2, 5, 2, 3, 4, 3, 3, 9, 3, 7),
  },
  {
    id: 'bright-fruity',
    label: 'Bright & Fruity',
    icon: 'flower',
    blurb: 'Orchard fruit, honey, floral — lighter and lively',
    profile: fp(7, 4, 5, 4, 3, 9, 7, 0, 3, 2),
  },
];

/** Average the chosen archetypes into a single seed palate. */
export function seedFromTastes(ids: string[]): FlavorProfile | undefined {
  const chosen = TASTE_PROFILES.filter((t) => ids.includes(t.id));
  if (chosen.length === 0) return undefined;
  const keys = Object.keys(chosen[0].profile) as (keyof FlavorProfile)[];
  const out = {} as FlavorProfile;
  for (const k of keys) {
    out[k] = Math.round((chosen.reduce((s, t) => s + t.profile[k], 0) / chosen.length) * 10) / 10;
  }
  return out;
}
