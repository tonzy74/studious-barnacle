import { fairPrice } from './pricing';
import { Bottle, Correction, Pour, WhiskeyType } from '../types';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  /** Ionicons glyph name. */
  icon: string;
  current: number;
  goal: number;
  earned: boolean;
}

function tier(
  id: string,
  title: string,
  description: string,
  icon: string,
  current: number,
  goal: number
): Achievement {
  return { id, title, description, icon, current: Math.min(current, goal), goal, earned: current >= goal };
}

/** Compute the full badge set with progress from the user's data. */
export function computeAchievements(input: {
  bottles: Bottle[];
  pours: Pour[];
  corrections: Correction[];
}): Achievement[] {
  const { bottles, pours, corrections } = input;
  const count = bottles.reduce((n, b) => n + Math.max(1, b.quantity), 0);
  const types = new Set<WhiskeyType>(bottles.map((b) => b.type));
  const ryes = bottles.filter((b) => b.type === 'rye').length;
  const scotch = bottles.filter((b) => b.type === 'scotch').length;
  const hasS = bottles.some((b) => b.rarity === 'S');
  const hasA = bottles.some((b) => b.rarity === 'A');
  const topValue = Math.max(
    0,
    ...bottles.map((b) => fairPrice(b.msrp, b.secondary, b.rarity) ?? 0)
  );
  const totalValue = bottles.reduce(
    (sum, b) => sum + (fairPrice(b.msrp, b.secondary, b.rarity) ?? 0) * Math.max(1, b.quantity),
    0
  );
  const rated = pours.filter((p) => typeof p.rating === 'number').length;

  return [
    tier('collector-1', 'First Pour', 'Add your first bottle', 'wine', count, 1),
    tier('collector-10', 'Shelf Started', 'Own 10 bottles', 'library', count, 10),
    tier('collector-25', 'Serious Collector', 'Own 25 bottles', 'library', count, 25),
    tier('collector-50', 'Cabinet Master', 'Own 50 bottles', 'library', count, 50),
    tier('collector-100', 'Vault Keeper', 'Own 100 bottles', 'lock-closed', count, 100),
    tier('explorer', 'Style Explorer', 'Collect all 8 whiskey types', 'compass', types.size, 8),
    tier('rye', 'Rye Rebel', 'Own 5 ryes', 'leaf', ryes, 5),
    tier('scotch', 'Scotch Scholar', 'Own 5 Scotches', 'earth', scotch, 5),
    tier('unicorn', 'Unicorn Hunter', 'Own an S-tier bottle', 'sparkles', hasS ? 1 : 0, 1),
    tier('allocated', 'Allocation Winner', 'Own an A-tier bottle', 'star', hasA ? 1 : 0, 1),
    tier('highroller', 'High Roller', 'Own a bottle worth $500+', 'diamond', topValue >= 500 ? 1 : 0, 1),
    tier('cellar-1k', 'Five-Figure Cellar', 'Collection worth $1,000+', 'trending-up', Math.min(totalValue, 1000), 1000),
    tier('cellar-5k', 'Blue-Chip Cellar', 'Collection worth $5,000+', 'trophy', Math.min(totalValue, 5000), 5000),
    tier('journal-1', 'Journal Keeper', 'Log your first pour', 'book', pours.length, 1),
    tier('journal-10', 'Note Taker', 'Log 10 pours', 'book', pours.length, 10),
    tier('journal-50', 'Devoted Taster', 'Log 50 pours', 'book', pours.length, 50),
    tier('critic', 'The Critic', 'Rate 10 pours', 'star-half', rated, 10),
    tier('curator', 'Curator', 'Fix 5 AI misreads', 'construct', corrections.length, 5),
  ];
}

export function earnedCount(list: Achievement[]): number {
  return list.filter((a) => a.earned).length;
}
