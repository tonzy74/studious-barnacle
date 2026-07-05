'use strict';

/**
 * Wrap each product's retailer URLs in YOUR affiliate tracking link so a
 * tap-and-buy is attributed to you and earns commission. Configure via env:
 *
 *   IMPACT_PUBLISHER_ID   your Impact publisher/media-partner id
 *   AFFILIATE_SUBID       tag for attribution (default "whiskeyvault-app")
 *
 * Different networks build links differently; this shows the common pattern
 * (append your publisher + subId params). For programs that hand you a
 * pre-built deep-link template, put that template in the product feed instead
 * and this function will pass it through untouched.
 */

const PUBLISHER_ID = process.env.IMPACT_PUBLISHER_ID || '';
const SUBID = process.env.AFFILIATE_SUBID || 'whiskeyvault-app';

function withTracking(rawUrl) {
  if (typeof rawUrl !== 'string' || !/^https:\/\//i.test(rawUrl)) return null;
  // If the feed already gave a tracking link (irclickid / clickref present),
  // pass it through — don't double-wrap.
  if (/irclickid=|clickref=|[?&]u=/.test(rawUrl)) return rawUrl;
  try {
    const u = new URL(rawUrl);
    if (PUBLISHER_ID) u.searchParams.set('irpid', PUBLISHER_ID);
    u.searchParams.set('subId1', SUBID);
    return u.toString();
  } catch {
    return rawUrl;
  }
}

/** Build the validated, tracking-tagged offer list for a product. */
function buildOffers(product) {
  const out = [];
  for (const o of product.offers || []) {
    const url = withTracking(o.url);
    const price = typeof o.price === 'number' ? o.price : parseFloat(o.price);
    if (!url || !Number.isFinite(price) || price <= 0) continue;
    out.push({
      retailer: String(o.retailer || 'Retailer').slice(0, 60),
      price: Math.round(price * 100) / 100,
      url,
      currency: o.currency || 'USD',
      inStock: typeof o.inStock === 'boolean' ? o.inStock : undefined,
    });
  }
  out.sort((a, b) => a.price - b.price);
  return out.slice(0, 12);
}

module.exports = { buildOffers, withTracking };
