'use strict';

/**
 * Whiskey Vault push service — reference implementation.
 *
 * Zero dependencies: runs on plain Node (`node index.js`). Endpoints:
 *
 *   POST /v1/push/register  body { token, anonId? }         -> { ok }
 *   POST /v1/push/send      body { title, body, data?, tokens? }
 *                           header x-admin-token: <ADMIN_TOKEN>  -> { sent, invalid, tickets }
 *   GET  /health            -> { ok, tokens }
 *
 * Devices register their Expo push token (obtained via
 * notifications.registerForPushToken in the app). An operator (or a scheduled
 * job) calls /v1/push/send to fan out a message to all — or specific — tokens
 * through the Expo Push API. /send requires the ADMIN_TOKEN so it can't be used
 * as an open relay.
 *
 * Storage is in-memory with optional JSONL persistence (TOKENS_FILE); swap in a
 * real datastore for production.
 */

const http = require('http');
const fs = require('fs');
const { URL } = require('url');
const { isExpoPushToken, chunk, buildMessages } = require('./lib/push');

const PORT = process.env.PORT || 8789;
const TOKENS_FILE = process.env.TOKENS_FILE || null;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
const EXPO_PUSH_URL = process.env.EXPO_PUSH_URL || 'https://exp.host/--/api/v2/push/send';

/** token -> { anonId, at } */
const tokens = new Map();

if (TOKENS_FILE && fs.existsSync(TOKENS_FILE)) {
  for (const line of fs.readFileSync(TOKENS_FILE, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try {
      const r = JSON.parse(line);
      if (isExpoPushToken(r.token)) tokens.set(r.token, { anonId: r.anonId, at: r.at });
    } catch {
      /* skip */
    }
  }
}

function sendJson(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-admin-token',
  });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > 1_000_000) reject(new Error('payload too large'));
      data += c;
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function persistToken(token, rec) {
  if (!TOKENS_FILE) return;
  fs.appendFile(TOKENS_FILE, JSON.stringify({ token, ...rec }) + '\n', () => {});
}

/** Fan messages out to the Expo Push API in chunks; returns ticket arrays. */
async function sendViaExpo(messages) {
  const tickets = [];
  for (const batch of chunk(messages, 100)) {
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(batch),
    });
    const json = await res.json().catch(() => ({}));
    if (Array.isArray(json.data)) tickets.push(...json.data);
  }
  return tickets;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (req.method === 'OPTIONS') return sendJson(res, 204, {});
  if (url.pathname === '/health') return sendJson(res, 200, { ok: true, tokens: tokens.size });

  if (req.method === 'POST' && url.pathname === '/v1/push/register') {
    try {
      const body = JSON.parse((await readBody(req)) || '{}');
      if (!isExpoPushToken(body.token)) return sendJson(res, 400, { error: 'invalid token' });
      const rec = { anonId: typeof body.anonId === 'string' ? body.anonId.slice(0, 64) : undefined, at: Date.now() };
      tokens.set(body.token, rec);
      persistToken(body.token, rec);
      return sendJson(res, 200, { ok: true });
    } catch (err) {
      return sendJson(res, 400, { error: String(err.message || err) });
    }
  }

  if (req.method === 'POST' && url.pathname === '/v1/push/send') {
    if (!ADMIN_TOKEN || req.headers['x-admin-token'] !== ADMIN_TOKEN) {
      return sendJson(res, 401, { error: 'unauthorized' });
    }
    try {
      const body = JSON.parse((await readBody(req)) || '{}');
      if (!body.title || !body.body) return sendJson(res, 400, { error: 'title and body required' });
      const targets = Array.isArray(body.tokens) && body.tokens.length ? body.tokens : [...tokens.keys()];
      const messages = buildMessages(targets, { title: body.title, body: body.body, data: body.data });
      const invalid = targets.length - messages.length;
      const tickets = messages.length ? await sendViaExpo(messages) : [];
      return sendJson(res, 200, { sent: messages.length, invalid, tickets });
    } catch (err) {
      return sendJson(res, 502, { error: String(err.message || err) });
    }
  }

  sendJson(res, 404, { error: 'not found' });
});

if (require.main === module) {
  server.listen(PORT, () => console.log(`push-service listening on :${PORT}`));
}

module.exports = { server };
