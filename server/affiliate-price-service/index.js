'use strict';

/**
 * Whiskey Vault pricing backend — reference implementation.
 *
 * Zero dependencies: runs on plain Node (`node index.js`). Implements the
 * exact contract the app calls:
 *
 *   GET /v1/prices?name=<bottling>&upc=<optional>
 *   -> { msrp, secondary, imageUrl, offers:[{retailer,price,url,currency,inStock}], updatedAt }
 *
 * It matches a request to a product in the catalog (UPC first, then a
 * normalized-name score), wraps each retailer URL in your affiliate tracking
 * link, and returns offers + a licensed product image.
 *
 * Out of the box it serves from sample-catalog.json so you can point the app
 * at it immediately. Swap in a real feed by implementing an adapter in
 * ./adapters and setting FEED_SOURCE (see README).
 */

const http = require('http');
const { URL } = require('url');
const { loadCatalog, matchProduct } = require('./lib/catalog');
const { buildOffers } = require('./lib/affiliate');

const PORT = process.env.PORT || 8787;

let catalog = [];
let catalogLoadedAt = null;

async function ensureCatalog() {
  // Refresh at most hourly; a real feed adapter would pull on a schedule.
  if (!catalogLoadedAt || Date.now() - catalogLoadedAt > 3_600_000) {
    catalog = await loadCatalog();
    catalogLoadedAt = Date.now();
  }
  return catalog;
}

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json',
    'access-control-allow-origin': '*',
    'cache-control': 'public, max-age=300',
  });
  res.end(payload);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${PORT}`);

    if (url.pathname === '/health') {
      return sendJson(res, 200, { ok: true, catalog: catalog.length });
    }

    if (url.pathname === '/v1/prices') {
      const name = (url.searchParams.get('name') || '').trim();
      const upc = (url.searchParams.get('upc') || '').trim();
      if (!name && !upc) return sendJson(res, 400, { error: 'name or upc required' });

      const list = await ensureCatalog();
      const product = matchProduct(list, { name, upc });
      if (!product) return sendJson(res, 404, { error: 'not found' });

      return sendJson(res, 200, {
        msrp: product.msrp ?? null,
        secondary: product.secondary ?? null,
        imageUrl: product.imageUrl ?? null,
        offers: buildOffers(product),
        updatedAt: new Date(product.updatedAt || Date.now()).toISOString(),
      });
    }

    sendJson(res, 404, { error: 'unknown route' });
  } catch (err) {
    sendJson(res, 500, { error: 'internal error', detail: String(err && err.message) });
  }
});

if (require.main === module) {
  ensureCatalog().then(() => {
    server.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`whiskey-vault pricing backend on :${PORT} (${catalog.length} products)`);
    });
  });
}

module.exports = { server };
