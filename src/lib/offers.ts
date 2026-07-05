import { PRICING_API_BASE_URL, hasPricingBackend } from '../config';
import { cleanExternalText } from './barcodeLookup';

/**
 * Live retailer pricing via the app's own backend.
 *
 * The backend ingests retailer affiliate product feeds (Impact / Rakuten /
 * AWIN etc.), normalizes them, and serves offers for a given bottling. The
 * app calls the backend only — never a retailer directly — so we stay within
 * each affiliate program's license and Apple's guidelines.
 *
 * Everything coming back is treated as untrusted external data and is
 * validated/sanitized here (prices clamped finite & positive, URLs required
 * to be https, strings stripped of control chars and capped, list length
 * capped) before it can reach the UI.
 */

/** A single retailer's offer for a bottling, with an affiliate deep link. */
export interface RetailerOffer {
  retailer: string;
  price: number;
  /** Affiliate deep link (https) to the product page. */
  url: string;
  currency: string;
  inStock?: boolean;
}

export interface PricingResult {
  msrp?: number;
  secondary?: number;
  offers: RetailerOffer[];
  /** Licensed product image (https) from the affiliate feed, when available. */
  imageUrl?: string;
  /** ISO timestamp of when the backend last refreshed these offers. */
  updatedAt?: string;
  source: 'backend';
}

const MAX_OFFERS = 12;
const MAX_PRICE = 1_000_000;

function validPrice(v: unknown): number | undefined {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? parseFloat(v) : NaN;
  if (!Number.isFinite(n) || n <= 0 || n > MAX_PRICE) return undefined;
  return Math.round(n * 100) / 100;
}

function validHttpsUrl(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined;
  const trimmed = v.trim();
  // Only https links may be opened — no javascript:, http:, data:, etc.
  if (!/^https:\/\/[^\s]+$/i.test(trimmed)) return undefined;
  return trimmed.slice(0, 2048);
}

/** Validate one raw offer object from the backend; returns undefined if unusable. */
function validateOffer(raw: unknown): RetailerOffer | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  const retailer = cleanExternalText(o.retailer, 60);
  const price = validPrice(o.price);
  const url = validHttpsUrl(o.url);
  if (!retailer || price === undefined || !url) return undefined;
  const currency = cleanExternalText(o.currency, 4) ?? 'USD';
  return {
    retailer,
    price,
    url,
    currency,
    inStock: typeof o.inStock === 'boolean' ? o.inStock : undefined,
  };
}

/** Parse and sanitize a backend pricing response. */
export function parsePricingResponse(raw: unknown): PricingResult | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;
  const rawOffers = Array.isArray(r.offers) ? r.offers : [];
  const offers: RetailerOffer[] = [];
  for (const item of rawOffers.slice(0, MAX_OFFERS)) {
    const offer = validateOffer(item);
    if (offer) offers.push(offer);
  }
  offers.sort((a, b) => a.price - b.price);
  const updatedAt = cleanExternalText(r.updatedAt, 40);
  const result: PricingResult = {
    msrp: validPrice(r.msrp),
    secondary: validPrice(r.secondary),
    offers,
    imageUrl: validHttpsUrl(r.imageUrl),
    updatedAt,
    source: 'backend',
  };
  // Nothing usable came back.
  if (
    result.msrp === undefined &&
    result.secondary === undefined &&
    offers.length === 0 &&
    !result.imageUrl
  ) {
    return undefined;
  }
  return result;
}

/**
 * Fetch live retailer offers for a bottling from the configured backend.
 * Returns undefined when no backend is configured, on any network/parse
 * error, or when nothing usable comes back — callers fall back to the
 * built-in curated/AI pricing.
 */
export async function fetchRetailerOffers(query: {
  name: string;
  upc?: string;
}): Promise<PricingResult | undefined> {
  if (!hasPricingBackend() || !query.name.trim()) return undefined;
  const params = new URLSearchParams({ name: query.name.trim() });
  if (query.upc) params.set('upc', query.upc);
  const url = `${PRICING_API_BASE_URL.replace(/\/+$/, '')}/v1/prices?${params.toString()}`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      headers: { accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return undefined;
    const json = await res.json();
    return parsePricingResponse(json);
  } catch {
    return undefined;
  }
}
