import { findWhiskeyByBarcode } from './flavor';

export interface BarcodeLookupResult {
  name?: string;
  brand?: string;
  /** ID of a matched reference-database record, when the barcode is known. */
  refId?: string;
  /** Product image (https) from the lookup source, when available. */
  imageUrl?: string;
  source: 'local' | 'upcitemdb' | 'openfoodfacts' | 'none';
}

/** Accept only https image URLs (no http/data/javascript), capped in length. */
export function cleanHttpsUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!/^https:\/\/[^\s]+$/i.test(trimmed)) return undefined;
  return trimmed.slice(0, 2048);
}

/**
 * Sanitize a string from an external, publicly editable source (Open Food
 * Facts) before it enters the learned library: strip control characters,
 * collapse whitespace, and cap the length.
 */
export function cleanExternalText(value: unknown, maxLength = 120): string | undefined {
  if (typeof value !== 'string') return undefined;
  const cleaned = value
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
  return cleaned || undefined;
}

/**
 * Resolve a scanned UPC/EAN to a product name. Checks the built-in whiskey
 * database first, then falls back to the free Open Food Facts API. Anything
 * unresolved drops the user into manual entry with the barcode pre-filled.
 */
export async function lookupBarcode(barcode: string): Promise<BarcodeLookupResult> {
  const local = findWhiskeyByBarcode(barcode);
  if (local) {
    return { name: local.name, brand: local.distillery, refId: local.id, source: 'local' };
  }

  // UPCitemdb has far better spirits coverage than Open Food Facts (which is
  // a food database and rarely has whiskey), so try it first.
  const upc = await lookupUpcItemDb(barcode);
  if (upc.name) return upc;

  const off = await lookupOpenFoodFacts(barcode);
  if (off.name) return off;

  return { source: 'none' };
}

/** General product database with strong consumer/spirits coverage (free trial tier). */
async function lookupUpcItemDb(barcode: string): Promise<BarcodeLookupResult> {
  try {
    const res = await fetch(
      `https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(barcode)}`,
      { headers: { accept: 'application/json' } }
    );
    if (!res.ok) return { source: 'none' };
    const data = (await res.json()) as {
      items?: { title?: string; brand?: string; images?: string[] }[];
    };
    const item = data.items?.[0];
    const name = cleanExternalText(item?.title);
    if (!name) return { source: 'none' };
    const image = Array.isArray(item?.images)
      ? item!.images.map(cleanHttpsUrl).find(Boolean)
      : undefined;
    return {
      name: stripBottleSize(name),
      brand: cleanExternalText(item?.brand, 60),
      imageUrl: image,
      source: 'upcitemdb',
    };
  } catch {
    return { source: 'none' };
  }
}

/** Open Food Facts — thin on spirits, kept as a secondary fallback. */
async function lookupOpenFoodFacts(barcode: string): Promise<BarcodeLookupResult> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=product_name,brands,image_front_url,image_url`,
      { headers: { 'User-Agent': 'WhiskeyVault/1.0 (personal inventory app)' } }
    );
    if (!res.ok) return { source: 'none' };
    const data = (await res.json()) as {
      status?: number;
      product?: { product_name?: string; brands?: string; image_front_url?: string; image_url?: string };
    };
    const name = cleanExternalText(data.product?.product_name);
    if (data.status !== 1 || !name) return { source: 'none' };
    return {
      name: stripBottleSize(name),
      brand: cleanExternalText(data.product?.brands?.split(',')[0], 60),
      imageUrl:
        cleanHttpsUrl(data.product?.image_front_url) ?? cleanHttpsUrl(data.product?.image_url),
      source: 'openfoodfacts',
    };
  } catch {
    return { source: 'none' };
  }
}

/** Trim trailing size/volume noise ("750ml", "1L", "1.75 L") from a title. */
export function stripBottleSize(name: string): string {
  return name
    .replace(/\b\d+(\.\d+)?\s?(ml|l|liter|litre|oz|cl|pt)\b\.?/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
