import { findWhiskeyByBarcode } from './flavor';

export interface BarcodeLookupResult {
  name?: string;
  brand?: string;
  /** ID of a matched reference-database record, when the barcode is known. */
  refId?: string;
  /** Product image (https) from Open Food Facts, when available. */
  imageUrl?: string;
  source: 'local' | 'openfoodfacts' | 'none';
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

  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=product_name,brands,image_front_url,image_url`,
      { headers: { 'User-Agent': 'WhiskeyVault/1.0 (personal inventory app)' } }
    );
    if (res.ok) {
      const data = (await res.json()) as {
        status?: number;
        product?: {
          product_name?: string;
          brands?: string;
          image_front_url?: string;
          image_url?: string;
        };
      };
      const name = cleanExternalText(data.product?.product_name);
      if (data.status === 1 && name) {
        return {
          name,
          brand: cleanExternalText(data.product?.brands?.split(',')[0], 60),
          imageUrl:
            cleanHttpsUrl(data.product?.image_front_url) ?? cleanHttpsUrl(data.product?.image_url),
          source: 'openfoodfacts',
        };
      }
    }
  } catch {
    // Offline or API unavailable — fall through to manual entry.
  }

  return { source: 'none' };
}
