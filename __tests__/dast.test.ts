/**
 * DAST-style dynamic security tests.
 *
 * These drive the app's REAL runtime modules against hostile network peers —
 * no mocked app logic:
 *   - a malicious "Anthropic API" HTTP server that the real @anthropic-ai/sdk
 *     client connects to (redirected via ANTHROPIC_BASE_URL), returning
 *     attacker-controlled structured output
 *   - a poisoned Open Food Facts (global fetch stub) returning hostile
 *     product data
 *   - prototype-pollution payloads through every JSON.parse boundary
 *
 * We assert the app clamps/validates the data and that Object.prototype is
 * never polluted, regardless of what the "server" says.
 */
import http from 'http';
import { AddressInfo } from 'net';

import {
  estimateFlavorProfile,
  identifyBottlesFromPhoto,
  validateIdentifiedBottles,
} from '../src/lib/claude';
import { lookupBarcode } from '../src/lib/barcodeLookup';
import { FLAVOR_AXES } from '../src/data/whiskeyDatabase';

/** A fake Anthropic server that wraps an attacker string as the model's text output. */
function startMaliciousAnthropic(modelText: string): Promise<{ url: string; close: () => void }> {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      req.on('data', () => {});
      req.on('end', () => {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(
          JSON.stringify({
            id: 'msg_evil',
            type: 'message',
            role: 'assistant',
            model: 'claude-opus-4-8',
            content: [{ type: 'text', text: modelText }],
            stop_reason: 'end_turn',
            stop_sequence: null,
            usage: { input_tokens: 1, output_tokens: 1 },
          })
        );
      });
    });
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as AddressInfo;
      resolve({ url: `http://127.0.0.1:${port}`, close: () => server.close() });
    });
  });
}

const originalBaseUrl = process.env.ANTHROPIC_BASE_URL;
const originalFetch = global.fetch;

afterEach(() => {
  if (originalBaseUrl === undefined) delete process.env.ANTHROPIC_BASE_URL;
  else process.env.ANTHROPIC_BASE_URL = originalBaseUrl;
  global.fetch = originalFetch;
});

// C0/C1 control-character detector, built from escapes so source stays ASCII.
const CONTROL_CHARS = new RegExp('[\\u0000-\\u001f\\u007f-\\u009f]');

describe('DAST - hostile Anthropic API (AI profiling)', () => {
  it('clamps malicious numeric ranges and refuses prototype pollution', async () => {
    const evil = JSON.stringify({
      sweet: 9999,
      oak: -500,
      vanilla: 'DROP TABLE',
      caramel: Number.MAX_VALUE,
      spice: 5,
      fruit: 5,
      floral: 5,
      smoke: 5,
      nutty: 5,
      earthy: 5,
      notes: 'x'.repeat(100000),
      known: 'yes-please',
      rarity: 'SSS',
      msrp: -1,
      secondary: 1e308,
      __proto__: { polluted: true },
      constructor: { prototype: { polluted: true } },
    });
    const srv = await startMaliciousAnthropic(evil);
    process.env.ANTHROPIC_BASE_URL = srv.url;
    try {
      const result = await estimateFlavorProfile('sk-ant-test', {
        name: 'Evil Bourbon',
        type: 'bourbon',
      });
      for (const axis of FLAVOR_AXES) {
        expect(result.flavor[axis]).toBeGreaterThanOrEqual(0);
        expect(result.flavor[axis]).toBeLessThanOrEqual(10);
      }
      expect(typeof result.flavor.vanilla).toBe('number');
      expect(result.rarity).toBeUndefined();
      expect(result.msrp).toBeUndefined();
      if (result.secondary !== undefined) expect(Number.isFinite(result.secondary)).toBe(true);
      expect(result.known).toBe(false);
      expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    } finally {
      srv.close();
    }
  });

  it('does not crash when the model returns non-JSON in its text block', async () => {
    const srv = await startMaliciousAnthropic('<<< not json at all >>>');
    process.env.ANTHROPIC_BASE_URL = srv.url;
    try {
      await expect(
        estimateFlavorProfile('sk-ant-test', { name: 'X', type: 'bourbon' })
      ).rejects.toBeInstanceOf(Error);
    } finally {
      srv.close();
    }
  });
});

describe('DAST - hostile Anthropic API (shelf-photo vision)', () => {
  it('validates and caps an oversized/hostile bottle list', async () => {
    const evilBottles = {
      bottles: [
        ...Array.from({ length: 500 }, (_, i) => ({
          name: `Bottle ${i}`,
          distillery: 'D',
          type: 'bourbon',
          proof: 90,
          confidence: 'high',
        })),
        {
          name: 'x'.repeat(5000),
          distillery: 'y'.repeat(5000),
          type: 'vodka',
          proof: 99999,
          confidence: 'hack',
        },
        {
          __proto__: { polluted: true },
          name: 'Proto',
          distillery: '',
          type: 'bourbon',
          proof: 90,
          confidence: 'high',
        },
      ],
    };
    const srv = await startMaliciousAnthropic(JSON.stringify(evilBottles));
    process.env.ANTHROPIC_BASE_URL = srv.url;
    try {
      const out = await identifyBottlesFromPhoto('sk-ant-test', 'ZmFrZQ==');
      expect(out.length).toBeLessThanOrEqual(40);
      for (const b of out) {
        expect(b.name.length).toBeLessThanOrEqual(120);
        expect(b.distillery.length).toBeLessThanOrEqual(80);
        expect([
          'bourbon',
          'rye',
          'tennessee',
          'scotch',
          'irish',
          'japanese',
          'canadian',
          'other',
        ]).toContain(b.type);
        if (b.proof !== undefined) {
          expect(b.proof).toBeGreaterThan(1);
          expect(b.proof).toBeLessThanOrEqual(200);
        }
        expect(['high', 'medium', 'low']).toContain(b.confidence);
      }
      expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    } finally {
      srv.close();
    }
  });
});

describe('DAST - prototype pollution through validateIdentifiedBottles', () => {
  it('ignores __proto__/constructor keys in every entry', () => {
    const payload = JSON.parse(
      '{"bottles":[{"name":"A","distillery":"B","type":"bourbon","proof":90,"confidence":"high","__proto__":{"polluted":true}}]}'
    );
    const out = validateIdentifiedBottles(payload);
    expect(out).toHaveLength(1);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect((Object.prototype as Record<string, unknown>).polluted).toBeUndefined();
  });
});

describe('DAST - poisoned Open Food Facts', () => {
  function stubOFF(body: unknown, ok = true) {
    global.fetch = (async () =>
      ({
        ok,
        json: async () => body,
      }) as unknown as Response) as typeof fetch;
  }

  it('sanitizes control chars and caps length from a poisoned product name', async () => {
    // Control characters built from char codes so the source stays ASCII.
    const ctrl = String.fromCharCode(0) + String.fromCharCode(7) + String.fromCharCode(27);
    stubOFF({
      status: 1,
      product: {
        product_name: `Evil Bourbon${ctrl}${'A'.repeat(1000)}`,
        brands: `Brand ${'B'.repeat(1000)}`,
      },
    });
    const result = await lookupBarcode('012345678905');
    expect(result.source).toBe('openfoodfacts');
    expect(result.name!.length).toBeLessThanOrEqual(120);
    expect(result.brand!.length).toBeLessThanOrEqual(60);
    expect(CONTROL_CHARS.test(result.name!)).toBe(false);
  });

  it('handles a prototype-pollution payload and missing fields without crashing', async () => {
    stubOFF(JSON.parse('{"status":1,"product":{"__proto__":{"polluted":true}}}'));
    const result = await lookupBarcode('000000000000');
    expect(result.source).toBe('none');
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it('treats a network failure as an unresolved lookup, not a crash', async () => {
    global.fetch = (async () => {
      throw new Error('ECONNREFUSED');
    }) as typeof fetch;
    const result = await lookupBarcode('999999999999');
    expect(result.source).toBe('none');
  });
});
