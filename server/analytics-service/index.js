'use strict';

/**
 * Whiskey Vault analytics backend — reference implementation.
 *
 * Zero dependencies: runs on plain Node (`node index.js`). Endpoints:
 *
 *   POST /v1/events   body { events:[{name,anonId,at,props}] }
 *                     -> { accepted, rejected }
 *   GET  /v1/funnel   -> funnel metrics (activation, paywall conversion, …)
 *   GET  /health      -> { ok:true }
 *
 * The client only sends events when the user has opted in (consent-gated), and
 * every event is anonymous (random per-install id, no identity, no free text).
 * The server independently re-validates against the same allowlist, so nothing
 * off-list is ever stored — privacy by design, defense in depth.
 *
 * Storage here is in-memory with optional JSONL append (EVENTS_FILE) so the
 * reference runs immediately; swap in a real datastore for production.
 */

const http = require('http');
const fs = require('fs');
const { URL } = require('url');
const { sanitizeBatch, computeFunnel } = require('./lib/aggregate');

const PORT = process.env.PORT || 8788;
const EVENTS_FILE = process.env.EVENTS_FILE || null;
const MAX_BATCH = 500;

/** @type {Array<{name:string,anonId:string,at:number,props:object}>} */
const events = [];

// Warm-start from the JSONL file if configured.
if (EVENTS_FILE && fs.existsSync(EVENTS_FILE)) {
  for (const line of fs.readFileSync(EVENTS_FILE, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try {
      events.push(JSON.parse(line));
    } catch {
      /* skip malformed line */
    }
  }
}

function sendJson(res, status, body) {
  const json = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(json);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > 1_000_000) reject(new Error('payload too large'));
      data += chunk;
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function persist(clean) {
  if (!EVENTS_FILE || clean.length === 0) return;
  fs.appendFile(EVENTS_FILE, clean.map((e) => JSON.stringify(e)).join('\n') + '\n', () => {});
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'OPTIONS') return sendJson(res, 204, {});
  if (url.pathname === '/health') return sendJson(res, 200, { ok: true, events: events.length });

  if (req.method === 'POST' && url.pathname === '/v1/events') {
    try {
      const body = JSON.parse((await readBody(req)) || '{}');
      const incoming = Array.isArray(body.events) ? body.events.slice(0, MAX_BATCH) : [];
      const { clean, rejected } = sanitizeBatch(incoming);
      for (const e of clean) events.push(e);
      persist(clean);
      return sendJson(res, 200, { accepted: clean.length, rejected });
    } catch (err) {
      return sendJson(res, 400, { error: String(err.message || err) });
    }
  }

  if (req.method === 'GET' && url.pathname === '/v1/funnel') {
    return sendJson(res, 200, { ...computeFunnel(events), computedAt: new Date().toISOString() });
  }

  sendJson(res, 404, { error: 'not found' });
});

if (require.main === module) {
  server.listen(PORT, () => console.log(`analytics-service listening on :${PORT}`));
}

module.exports = { server };
