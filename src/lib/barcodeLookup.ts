import { findWhiskeyByBarcode } from './flavor';

export interface BarcodeLookupResult {
  name?: string;
  brand?: string;
  /** ID of a matched reference-database record, when the barcode is known. */
  refId?: string;
  source: 'local' | 'openfoodfacts' | 'none';
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
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=product_name,brands`,
      { headers: { 'User-Agent': 'WhiskeyVault/1.0 (personal inventory app)' } }
    );
    if (res.ok) {
      const data = (await res.json()) as {
        status?: number;
        product?: { product_name?: string; brands?: string };
      };
      if (data.status === 1 && data.product?.product_name) {
        return {
          name: data.product.product_name,
          brand: data.product.brands?.split(',')[0]?.trim(),
          source: 'openfoodfacts',
        };
      }
    }
  } catch {
    // Offline or API unavailable — fall through to manual entry.
  }

  return { source: 'none' };
}
