import { Bottle } from '../types';
import { collectorLevel } from './collectorLevel';
import { fairPrice, formatUsd } from './pricing';
import { rarityRank } from './rarity';

/**
 * Compose a braggable, share-ready summary of a collection. Collectors love
 * showing off their bar, so a one-tap share is a low-cost viral acquisition
 * loop (word-of-mouth K-factor) that compounds every other retention lever.
 * Value is opt-in so a private user can share stats without a dollar figure.
 */
export function buildVaultShareText(
  bottles: Bottle[],
  opts: { includeValue?: boolean } = {}
): string {
  if (bottles.length === 0) {
    return 'I’m starting my whiskey collection on Whiskey Vault — scan a bottle and it tells you what it’s worth. 🥃';
  }

  const units = bottles.reduce((n, b) => n + Math.max(1, b.quantity), 0);
  const styles = new Set(bottles.map((b) => b.type)).size;
  const value = bottles.reduce(
    (sum, b) => sum + (fairPrice(b.msrp, b.secondary, b.rarity) ?? 0) * Math.max(1, b.quantity),
    0
  );
  const level = collectorLevel(bottles, value);

  // Rarest bottle: best rarity tier, breaking ties by fair value.
  const rarest = [...bottles].sort((a, b) => {
    const r = rarityRank(a.rarity) - rarityRank(b.rarity);
    if (r !== 0) return r;
    return (fairPrice(b.msrp, b.secondary, b.rarity) ?? 0) - (fairPrice(a.msrp, a.secondary, a.rarity) ?? 0);
  })[0];

  const lines = [
    `🥃 ${level.title} (Level ${level.level}) on Whiskey Vault.`,
    `${units} bottle${units === 1 ? '' : 's'} across ${styles} style${styles === 1 ? '' : 's'}.`,
  ];

  if (opts.includeValue && value > 0) {
    lines.push(`Estimated value: ${formatUsd(value)}.`);
  }

  if (rarest) lines.push(`Crown jewel: ${rarest.name}.`);
  lines.push('Tracked with Whiskey Vault.');

  return lines.join('\n');
}
