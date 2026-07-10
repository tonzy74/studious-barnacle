'use strict';

/**
 * Whiskey Vault AI proxy — reference implementation.
 *
 * Holds YOUR Anthropic key server-side so users never paste one. Meters free
 * installs (monthly quota) and lets Pro installs through unlimited, then
 * forwards to the Anthropic Messages API. Zero dependencies (plain Node).
 *
 *   POST /v1/messages   (Anthropic Messages passthrough)
 *     headers: x-api-key: <APP_TOKEN>          (shared app secret, gates access)
 *              x-wv-install: <anon install id>  (for per-install metering)
 *              x-wv-pro: "1" when the user is Pro (unlimited)
 *     -> Anthropic response, plus X-WV-Quota-Remaining
 *     -> 402 { error, quota } when a free install is out of quota this month
 *   GET /health
 *
 * The app points the Anthropic SDK's baseURL here and sends APP_TOKEN as its
 * key, so no real key ever ships in the app. Production hardening: verify Pro
 * server-side via a RevenueCat webhook rather than trusting the x-wv-pro header,
 * and swap the in-memory usage map for a datastore.
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const { URL } = require('url');
const { evaluate } = require('./lib/quota');
const { applyEvent, isActive } = require('./lib/entitlement');
const { verifyAttestation } = require('./lib/attestation');

const PORT = process.env.PORT || 8790;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const APP_TOKEN = process.env.APP_TOKEN || '';
const FREE_MONTHLY_QUOTA = Number(process.env.FREE_MONTHLY_QUOTA || 15);
// Hard ceiling on FREE requests per UTC day across ALL installs — your spend
// guardrail. Pro requests are never limited by this. 0 disables the cap.
const MAX_FREE_PER_DAY = Number(process.env.MAX_FREE_PER_DAY || 1000);
// Optionally force free (non-Pro) requests onto a cheaper model to cap per-call
// cost; Pro keeps whatever the app requested. Empty = don't override.
const FREE_MODEL = process.env.FREE_MODEL || '';
const USAGE_FILE = process.env.USAGE_FILE || null;
const ANTHROPIC_VERSION = process.env.ANTHROPIC_VERSION || '2023-06-01';
// When set, Pro is verified server-side from RevenueCat webhooks (authoritative)
// instead of trusting the app's x-wv-pro header. Set this as the webhook's
// Authorization header value in the RevenueCat dashboard.
const RC_WEBHOOK_SECRET = process.env.RC_WEBHOOK_SECRET || '';

// Device attestation gate (anti-replay of the public APP_TOKEN). Off by default;
// set REQUIRE_ATTESTATION=1 + ATTESTATION_MODE and wire a real verifier before
// relying on it (see lib/attestation.js).
const REQUIRE_ATTESTATION = process.env.REQUIRE_ATTESTATION === '1';
const ATTESTATION_MODE = process.env.ATTESTATION_MODE || 'off';

/** appUserId (== install id) -> { active, expiresAt } from RevenueCat. */
const proStatus = new Map();

// Global free-request budget for the current UTC day.
let globalFree = { day: '', count: 0 };
function dayKey(now) {
  return new Date(now).toISOString().slice(0, 10);
}

// Only the models the app actually uses may be proxied (prevents abuse of your key).
const MODEL_ALLOWLIST = new Set([
  'claude-opus-4-8',
  'claude-sonnet-5',
  'claude-haiku-4-5-20251001',
]);

/** install -> { month, count } */
const usage = new Map();
if (USAGE_FILE && fs.existsSync(USAGE_FILE)) {
  try {
    for (const [k, v] of Object.entries(JSON.parse(fs.readFileSync(USAGE_FILE, 'utf8')))) usage.set(k, v);
  } catch {
    /* start fresh */
  }
}
function persist() {
  if (!USAGE_FILE) return;
  fs.writeFile(USAGE_FILE, JSON.stringify(Object.fromEntries(usage)), () => {});
}

function sendJson(res, status, body, extraHeaders = {}) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key, anthropic-version, x-wv-install, x-wv-pro, x-wv-attest',
    ...extraHeaders,
  });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > 8_000_000) reject(new Error('payload too large'));
      data += c;
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

/** Forward a Messages request to Anthropic and pipe the response back. */
function forwardToAnthropic(rawBody, res, remaining) {
  const upstream = https.request(
    {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': ANTHROPIC_VERSION,
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(rawBody),
      },
    },
    (up) => {
      res.writeHead(up.statusCode || 502, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'X-WV-Quota-Remaining': remaining === Infinity ? 'unlimited' : String(remaining),
      });
      up.pipe(res);
    }
  );
  upstream.on('error', (err) => sendJson(res, 502, { error: `upstream: ${err.message}` }));
  upstream.end(rawBody);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (req.method === 'OPTIONS') return sendJson(res, 204, {});
  if (url.pathname === '/health') return sendJson(res, 200, { ok: true, quota: FREE_MONTHLY_QUOTA });

  // RevenueCat subscription webhook → authoritative Pro status.
  if (req.method === 'POST' && url.pathname === '/v1/rc/webhook') {
    if (!RC_WEBHOOK_SECRET || req.headers['authorization'] !== `Bearer ${RC_WEBHOOK_SECRET}`) {
      return sendJson(res, 401, { error: 'unauthorized' });
    }
    try {
      const body = JSON.parse((await readBody(req)) || '{}');
      applyEvent(proStatus, body.event, Date.now());
      return sendJson(res, 200, { ok: true });
    } catch (err) {
      return sendJson(res, 400, { error: String(err.message || err) });
    }
  }

  if (req.method === 'POST' && url.pathname === '/v1/messages') {
    if (!ANTHROPIC_API_KEY) return sendJson(res, 500, { error: 'proxy missing ANTHROPIC_API_KEY' });
    if (!APP_TOKEN || req.headers['x-api-key'] !== APP_TOKEN) {
      return sendJson(res, 401, { error: 'unauthorized' });
    }
    if (REQUIRE_ATTESTATION) {
      const attested = await verifyAttestation(req.headers['x-wv-attest'], {
        mode: ATTESTATION_MODE,
        install: req.headers['x-wv-install'],
      });
      if (!attested) return sendJson(res, 401, { error: 'attestation_failed' });
    }
    const install = String(req.headers['x-wv-install'] || '').slice(0, 64) || 'anon';
    // Pro is authoritative from RevenueCat webhooks when configured; otherwise
    // (dev) fall back to the client-asserted header.
    const isPro = RC_WEBHOOK_SECRET
      ? isActive(proStatus.get(install), Date.now())
      : req.headers['x-wv-pro'] === '1';

    let body;
    try {
      const raw = await readBody(req);
      body = JSON.parse(raw || '{}');
      if (!MODEL_ALLOWLIST.has(body.model)) return sendJson(res, 400, { error: 'model not allowed' });

      const now = Date.now();

      // Global daily budget guard (free only) — your can't-overspend ceiling.
      if (!isPro && MAX_FREE_PER_DAY > 0) {
        const dk = dayKey(now);
        if (globalFree.day !== dk) globalFree = { day: dk, count: 0 };
        if (globalFree.count >= MAX_FREE_PER_DAY) {
          return sendJson(res, 402, { error: 'free_budget_reached', quota: FREE_MONTHLY_QUOTA }, {
            'X-WV-Quota-Remaining': '0',
          });
        }
      }

      const { allowed, remaining, record } = evaluate(usage.get(install), now, FREE_MONTHLY_QUOTA, isPro);
      if (!allowed) {
        return sendJson(res, 402, { error: 'free_quota_exceeded', quota: FREE_MONTHLY_QUOTA }, {
          'X-WV-Quota-Remaining': '0',
        });
      }
      usage.set(install, record);
      if (!isPro) globalFree.count += 1;
      persist();

      // Cap free-tier cost by forcing a cheaper model, if configured.
      if (!isPro && FREE_MODEL) {
        if (!MODEL_ALLOWLIST.has(FREE_MODEL)) return sendJson(res, 500, { error: 'bad FREE_MODEL' });
        body.model = FREE_MODEL;
      }
      return forwardToAnthropic(JSON.stringify(body), res, remaining);
    } catch (err) {
      return sendJson(res, 400, { error: String(err.message || err) });
    }
  }

  sendJson(res, 404, { error: 'not found' });
});

if (require.main === module) {
  server.listen(PORT, () => console.log(`ai-proxy listening on :${PORT} (free quota ${FREE_MONTHLY_QUOTA}/mo)`));
}

module.exports = { server };
