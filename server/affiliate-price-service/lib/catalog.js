'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Load the product catalog. FEED_SOURCE selects where products come from:
 *   - "sample" (default): bundled sample-catalog.json — works out of the box.
 *   - "impact":  pull from an Impact product-feed adapter (needs credentials).
 * Add your own adapter under ./adapters and wire it here.
 */
async function loadCatalog() {
  const source = process.env.FEED_SOURCE || 'sample';
  if (source === 'impact') {
    const { fetchImpactCatalog } = require('../adapters/impact');
    return normalize(await fetchImpactCatalog());
  }
  const file = path.join(__dirname, '..', 'sample-catalog.json');
  return normalize(JSON.parse(fs.readFileSync(file, 'utf8')));
}

function normKey(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Ensure every product has the fields the matcher/offer builder expect. */
function normalize(products) {
  return (Array.isArray(products) ? products : []).map((p) => ({
    name: String(p.name || ''),
    nameKey: normKey(p.name),
    upcs: Array.isArray(p.upcs) ? p.upcs.map(String) : [],
    msrp: numOrNull(p.msrp),
    secondary: numOrNull(p.secondary),
    imageUrl: httpsOrNull(p.imageUrl),
    updatedAt: p.updatedAt || Date.now(),
    offers: Array.isArray(p.offers) ? p.offers : [],
  }));
}

function numOrNull(v) {
  const n = typeof v === 'number' ? v : parseFloat(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function httpsOrNull(v) {
  return typeof v === 'string' && /^https:\/\//i.test(v.trim()) ? v.trim() : null;
}

/**
 * Match a request to a product: exact UPC wins; otherwise score by shared
 * significant words (same idea as the app's on-device matcher) and require a
 * solid match to avoid nonsense.
 */
function matchProduct(catalog, { name, upc }) {
  if (upc) {
    const byUpc = catalog.find((p) => p.upcs.includes(upc));
    if (byUpc) return byUpc;
  }
  const qWords = normKey(name).split(' ').filter((w) => w.length > 1);
  if (qWords.length === 0) return null;

  let best = null;
  let bestScore = 0;
  for (const p of catalog) {
    const targetWords = new Set(p.nameKey.split(' '));
    let score = 0;
    for (const w of qWords) if (targetWords.has(w)) score += 2;
    if (p.nameKey.includes(normKey(name)) || normKey(name).includes(p.nameKey)) score += 3;
    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }
  return bestScore >= 4 ? best : null;
}

module.exports = { loadCatalog, matchProduct, normKey };
