import { WhiskeyRecord, WhiskeyType } from '../types';
import { lookupBarcode } from './barcodeLookup';
import { estimateFlavorProfile } from './claude';
import { defaultProfileFor, findWhiskeyByBarcode, findWhiskeyByName } from './flavor';
import { fairPrice, lookupPricing } from './pricing';
import { assignRarity } from './rarity';
import { slugify } from '../data/generator';

export interface ResolveResult {
  /** Fully resolved record (built-in, learned, or freshly learned). */
  record?: WhiskeyRecord;
  /** Partial info when we got a name but couldn't build a full profile. */
  name?: string;
  brand?: string;
  /** Where the resolution came from. */
  source: 'db' | 'learned' | 'learned-new' | 'openfoodfacts' | 'none';
}

function guessType(name: string, brand?: string): WhiskeyType {
  const s = `${name} ${brand ?? ''}`.toLowerCase();
  if (/\brye\b/.test(s)) return 'rye';
  if (/scotch|speyside|islay|highland/.test(s)) return 'scotch';
  if (/irish/.test(s)) return 'irish';
  if (/japan/.test(s)) return 'japanese';
  if (/canad/.test(s)) return 'canadian';
  if (/tennessee/.test(s)) return 'tennessee';
  if (/bourbon/.test(s)) return 'bourbon';
  return 'other';
}

/**
 * Build a full library record for a bottle we've never seen: AI-profile it
 * when a key is available, otherwise fall back to style defaults, and attach
 * any known pricing anchors and a rarity estimate.
 */
export async function buildLearnedRecord(
  info: { name: string; brand?: string; type?: WhiskeyType; proof?: number; barcode?: string },
  apiKey?: string,
  model?: string
): Promise<WhiskeyRecord> {
  const type = info.type ?? guessType(info.name, info.brand);
  const base: WhiskeyRecord = {
    id: `learned-${slugify(info.name)}`,
    name: info.name,
    distillery: info.brand ?? 'Unknown',
    type,
    proof: info.proof ?? 80,
    flavor: defaultProfileFor(type),
    notes: '',
    barcodes: info.barcode ? [info.barcode] : undefined,
    rarity: assignRarity({ name: info.name, distillery: info.brand ?? '' }),
    learned: true,
    ...(lookupPricing(info.name) ?? {}),
  };

  if (apiKey) {
    try {
      const est = await estimateFlavorProfile(
        apiKey,
        {
          name: info.name,
          distillery: info.brand,
          type,
          proof: info.proof,
        },
        model
      );
      base.flavor = est.flavor;
      base.notes = est.notes;
      if (est.rarity) base.rarity = est.rarity;
      if (est.msrp !== undefined) base.msrp = est.msrp;
      if (est.secondary !== undefined) base.secondary = est.secondary;
    } catch {
      // Offline or API error — keep the style-default record; it can be
      // re-profiled or hand-adjusted later.
    }
  }
  return base;
}

/**
 * Resolve a scanned barcode through every layer, learning as we go:
 * 1. Built-in reference database (instant)
 * 2. On-device learned library (instant)
 * 3. Open Food Facts, live (name/brand) → AI profiling → saved to the
 *    learned library with the barcode, so the next scan is instant.
 */
export async function resolveBarcodeAndLearn(
  barcode: string,
  opts: {
    learned: WhiskeyRecord[];
    apiKey?: string;
    model?: string;
    onLearn: (record: WhiskeyRecord) => void;
  }
): Promise<ResolveResult> {
  const builtIn = findWhiskeyByBarcode(barcode, []);
  if (builtIn) return { record: builtIn, source: 'db' };

  const known = opts.learned.find((r) => r.barcodes?.includes(barcode));
  if (known) return { record: known, source: 'learned' };

  const off = await lookupBarcode(barcode);
  if (!off.name) return { source: 'none' };

  // The product name might actually be a bottling we already know — if so,
  // learn the barcode mapping onto the existing record.
  const byName = findWhiskeyByName(off.name, opts.learned);
  if (byName) {
    opts.onLearn({
      ...byName,
      id: byName.learned ? byName.id : `learned-${byName.id}`,
      barcodes: [...new Set([...(byName.barcodes ?? []), barcode])],
      learned: true,
    });
    return { record: byName, source: 'learned-new' };
  }

  const record = await buildLearnedRecord(
    { name: off.name, brand: off.brand, barcode },
    opts.apiKey,
    opts.model
  );
  opts.onLearn(record);
  return { record, source: 'learned-new', name: off.name, brand: off.brand };
}
