'use strict';

/**
 * Impact product-catalog adapter (stub).
 *
 * Impact (impact.com) exposes approved partners' product catalogs via its
 * Catalog API. Once you're approved for merchant programs (e.g. Flaviar,
 * Wine.com, ReserveBar), set these env vars and implement the fetch below:
 *
 *   IMPACT_ACCOUNT_SID
 *   IMPACT_AUTH_TOKEN
 *   IMPACT_CATALOG_IDS   comma-separated catalog ids to pull
 *
 * Endpoint shape (see Impact docs):
 *   GET https://api.impact.com/Mediapartners/{AccountSID}/Catalogs/{CatalogId}/Items
 *   Authorization: Basic base64(AccountSID:AuthToken)
 *
 * Map each catalog item to the internal product shape:
 *   { name, upcs:[], msrp, secondary, imageUrl, offers:[{retailer,price,url,currency,inStock}] }
 *
 * Cache the result (this module is called at most hourly by index.js).
 */
async function fetchImpactCatalog() {
  const sid = process.env.IMPACT_ACCOUNT_SID;
  const token = process.env.IMPACT_AUTH_TOKEN;
  if (!sid || !token) {
    throw new Error('IMPACT_ACCOUNT_SID / IMPACT_AUTH_TOKEN not set — see adapters/impact.js');
  }

  const catalogIds = (process.env.IMPACT_CATALOG_IDS || '').split(',').filter(Boolean);
  const auth = Buffer.from(`${sid}:${token}`).toString('base64');
  const products = [];

  for (const catalogId of catalogIds) {
    const res = await fetch(
      `https://api.impact.com/Mediapartners/${sid}/Catalogs/${catalogId}/Items?PageSize=1000`,
      { headers: { Authorization: `Basic ${auth}`, Accept: 'application/json' } }
    );
    if (!res.ok) continue;
    const data = await res.json();
    for (const item of data.Items || []) {
      products.push({
        name: item.Name,
        upcs: [item.Gtin, item.Upc].filter(Boolean),
        msrp: parseFloat(item.OriginalPrice) || undefined,
        secondary: undefined, // Impact feeds are retail; secondary comes elsewhere.
        imageUrl: item.ImageUrl,
        offers: [
          {
            retailer: item.Manufacturer || item.CatalogName || 'Retailer',
            price: parseFloat(item.CurrentPrice) || undefined,
            url: item.Url, // already a tracking deep link from Impact
            currency: item.Currency || 'USD',
            inStock: item.StockAvailability !== 'OutOfStock',
          },
        ],
      });
    }
  }
  return products;
}

module.exports = { fetchImpactCatalog };
