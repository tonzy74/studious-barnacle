import Anthropic from '@anthropic-ai/sdk';

import { Bottle, ChatMsg, FlavorProfile, Rarity, WhiskeyType } from '../types';
import { FLAVOR_AXES, FLAVOR_LABELS } from '../data/whiskeyDatabase';
import { DEFAULT_MODEL } from './models';
import { fairPrice, formatUsd } from './pricing';

function describeBottle(b: Bottle): string {
  const flavorSummary = (Object.keys(FLAVOR_LABELS) as (keyof typeof FLAVOR_LABELS)[])
    .filter((axis) => b.flavor[axis] >= 6)
    .map((axis) => FLAVOR_LABELS[axis].toLowerCase())
    .join(', ');
  const variant = [
    b.batch ? `batch ${b.batch}` : '',
    b.pickName ? `${b.pickName} pick` : '',
    b.barrelNo ? `barrel #${b.barrelNo}` : '',
  ]
    .filter(Boolean)
    .join(', ');
  const fair = fairPrice(b.msrp, b.secondary, b.rarity);
  const value =
    b.msrp !== undefined || b.secondary !== undefined
      ? `  Value: retail ~${formatUsd(b.msrp)}, secondary ~${formatUsd(b.secondary)}, fair ~${formatUsd(fair)}`
      : '';
  return [
    `- ${b.name} (${b.distillery}, ${b.type}, ${b.proof} proof, ${b.opened ? 'open' : 'sealed'}${
      b.rarity ? `, rarity tier ${b.rarity}` : ''
    })`,
    variant ? `  Variant: ${variant}` : '',
    `  Tasting notes: ${b.notes || 'n/a'}`,
    flavorSummary ? `  Dominant traits: ${flavorSummary}` : '',
    value,
  ]
    .filter(Boolean)
    .join('\n');
}

function buildSystemPrompt(collection: Bottle[]): string {
  const inventory =
    collection.length > 0
      ? collection.map(describeBottle).join('\n')
      : '(The collection is currently empty.)';

  return `You are the in-app whiskey sommelier for Whiskey Vault, a personal whiskey collection app.

You help the owner pair whiskeys from THEIR collection with food, cigars, desserts, occasions, and moods, and you recommend which bottle to pour. Your recommendations must be grounded in the aggregate professional tasting notes provided for each bottle below — cite the specific flavor notes that drive each pairing.

Rules:
- Recommend bottles from the collection whenever possible. If nothing in the collection fits, say so honestly and suggest what style would fit.
- Explain WHY a pairing works using the tasting notes (e.g. "the dark caramel and baking spice in Old Forester 1920 stands up to charred ribeye").
- Keep answers conversational and reasonably short (2-4 paragraphs max). Offer one primary pick and one alternate when it makes sense.
- If asked for a random or surprise pour, pick one and build a little ritual around it.
- You may discuss general whiskey knowledge, but always tie back to the collection.
- Respect rarity tiers: S and A bottles are allocated treasures — suggest them for milestones and special guests, not casual weeknight pours, unless the owner insists. C/D bottles are the everyday workhorses.
- You may reference value (retail vs secondary) when it's relevant, e.g. suggesting an affordable pour for a big party vs a trophy pour for an occasion.

Current collection:
${inventory}`;
}

export interface ClaudeError extends Error {
  status?: number;
}

/**
 * Send the pairing-chat conversation to Claude and return the reply text.
 * The API key is the user's own, entered in Settings and stored on-device.
 */
export async function askSommelier(
  apiKey: string,
  collection: Bottle[],
  history: ChatMsg[],
  model: string = DEFAULT_MODEL
): Promise<string> {
  const client = new Anthropic({
    apiKey,
    // The key is the user's own, stored on their own device — this is the
    // supported pattern for direct-from-app calls in React Native.
    dangerouslyAllowBrowser: true,
  });

  const response = await client.messages.create({
    model,
    max_tokens: 1024,
    system: buildSystemPrompt(collection),
    messages: history.map((m) => ({
      role: m.role,
      content: m.text,
    })),
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();

  return text || "I couldn't come up with a response — try rephrasing that.";
}

const PROFILE_SCHEMA = {
  type: 'object',
  properties: {
    ...Object.fromEntries(
      FLAVOR_AXES.map((axis) => [
        axis,
        { type: 'number', description: `${FLAVOR_LABELS[axis]} intensity 0-10` },
      ])
    ),
    notes: {
      type: 'string',
      description:
        'Two-sentence tasting-note summary reflecting the consensus of professional reviews',
    },
    known: {
      type: 'boolean',
      description:
        'true if you recognize this specific bottling; false if you are estimating from its style',
    },
    rarity: {
      type: 'string',
      enum: ['S', 'A', 'B', 'C', 'D'],
      description:
        'Allocation/rarity tier: S=lottery-only unicorn, A=allocated, B=limited/semi-allocated, C=shelf, D=bottom-shelf staple',
    },
    msrp: {
      type: 'number',
      description: 'Approximate US retail price (MSRP) in dollars',
    },
    secondary: {
      type: 'number',
      description:
        'Approximate US secondary-market price in dollars (equal to msrp if it trades at retail)',
    },
  },
  required: [...FLAVOR_AXES, 'notes', 'known', 'rarity', 'msrp', 'secondary'],
  additionalProperties: false,
} as const;

export interface EstimatedProfile {
  flavor: FlavorProfile;
  notes: string;
  known: boolean;
  rarity?: Rarity;
  msrp?: number;
  secondary?: number;
}

/**
 * Ask Claude to profile a bottle that isn't in the local reference database,
 * drawing on its knowledge of professional tasting notes. Returns a clamped
 * 10-axis flavor vector, a note summary, and whether the bottling was
 * actually recognized (vs. estimated from style).
 */
export async function estimateFlavorProfile(
  apiKey: string,
  bottle: { name: string; distillery?: string; type: WhiskeyType; proof?: number },
  model: string = DEFAULT_MODEL
): Promise<EstimatedProfile> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

  const response = await client.messages.create({
    model,
    max_tokens: 1024,
    system:
      'You are a whiskey expert. Rate flavor intensities on a 0-10 scale reflecting the ' +
      'consensus of professional reviews (Whisky Advocate, Breaking Bourbon, Distiller). ' +
      'Calibrate conservatively and use the FULL range: 0-2 = absent/trace, 3-4 = subtle, ' +
      '5-6 = clearly present, 7-8 = prominent, 9-10 = dominant/intense. Most notes on most ' +
      'whiskeys are in the 2-6 range; reserve 8+ for a defining characteristic (e.g. peat on ' +
      'an Islay, rye spice on a barrel-proof rye). Do not rate everything mid-high. ' +
      'If you do not recognize the exact bottling, estimate from its distillery house style, ' +
      'category, and proof, and set "known" to false.',
    messages: [
      {
        role: 'user',
        content: `Profile this whiskey: ${bottle.name}${
          bottle.distillery ? ` from ${bottle.distillery}` : ''
        } (${bottle.type}${bottle.proof ? `, ${bottle.proof} proof` : ''}).`,
      },
    ],
    output_config: {
      format: { type: 'json_schema', schema: PROFILE_SCHEMA },
    },
  });

  const text = response.content.find(
    (block): block is Anthropic.TextBlock => block.type === 'text'
  )?.text;
  if (!text) throw new Error('Empty response from profile estimation');

  const raw = JSON.parse(text) as Record<string, unknown>;
  const flavor = {} as FlavorProfile;
  for (const axis of FLAVOR_AXES) {
    const v = typeof raw[axis] === 'number' ? (raw[axis] as number) : 5;
    flavor[axis] = Math.round(Math.min(10, Math.max(0, v)) * 10) / 10;
  }
  const rarity =
    typeof raw.rarity === 'string' && ['S', 'A', 'B', 'C', 'D'].includes(raw.rarity)
      ? (raw.rarity as Rarity)
      : undefined;
  return {
    flavor,
    notes: typeof raw.notes === 'string' ? raw.notes : '',
    known: raw.known === true,
    rarity,
    msrp: typeof raw.msrp === 'number' && raw.msrp > 0 ? Math.round(raw.msrp) : undefined,
    secondary:
      typeof raw.secondary === 'number' && raw.secondary > 0
        ? Math.round(raw.secondary)
        : undefined,
  };
}

// ── Bulk add: identify bottles from a shelf photo ─────────────────────────

const WHISKEY_TYPES: WhiskeyType[] = [
  'bourbon',
  'rye',
  'tennessee',
  'scotch',
  'irish',
  'japanese',
  'canadian',
  'other',
];

export interface IdentifiedBottle {
  name: string;
  distillery: string;
  type: WhiskeyType;
  proof?: number;
  confidence: 'high' | 'medium' | 'low';
  /** Best-guess from the image: sealed vs opened/poured. Undefined = unclear. */
  opened?: boolean;
}

const SHELF_SCHEMA = {
  type: 'object',
  properties: {
    bottles: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Exact bottling name as it would appear on a menu, e.g. "Eagle Rare 10 Year"',
          },
          distillery: { type: 'string', description: 'Producer/distillery, empty string if unknown' },
          type: { type: 'string', enum: WHISKEY_TYPES },
          proof: {
            type: 'number',
            description: 'Proof if readable on the label or known for this bottling; 0 if unknown',
          },
          confidence: {
            type: 'string',
            enum: ['high', 'medium', 'low'],
            description: 'high = label clearly readable; medium = mostly sure; low = guessing from bottle shape/partial label',
          },
          opened: {
            type: 'boolean',
            description:
              'From the image: true if the bottle looks opened/poured (fill line below the shoulder/neck, or seal/cap clearly broken), false if it looks sealed and full. Guess conservatively.',
          },
        },
        required: ['name', 'distillery', 'type', 'proof', 'confidence', 'opened'],
        additionalProperties: false,
      },
    },
  },
  required: ['bottles'],
  additionalProperties: false,
} as const;

/** Validate/normalize the vision output: exported separately for testing. */
export function validateIdentifiedBottles(raw: unknown): IdentifiedBottle[] {
  const bottles = (raw as { bottles?: unknown }).bottles;
  if (!Array.isArray(bottles)) return [];
  const seen = new Set<string>();
  const out: IdentifiedBottle[] = [];
  for (const item of bottles) {
    if (typeof item !== 'object' || item === null) continue;
    const b = item as Record<string, unknown>;
    const name = typeof b.name === 'string' ? b.name.trim().slice(0, 120) : '';
    if (!name) continue;
    const key = name.toLowerCase().replace(/[^a-z0-9]+/g, '');
    if (seen.has(key)) continue;
    seen.add(key);
    const type = WHISKEY_TYPES.includes(b.type as WhiskeyType) ? (b.type as WhiskeyType) : 'other';
    const proofNum = typeof b.proof === 'number' && b.proof > 1 && b.proof <= 200 ? b.proof : undefined;
    const confidence =
      b.confidence === 'high' || b.confidence === 'medium' || b.confidence === 'low'
        ? b.confidence
        : 'low';
    out.push({
      name,
      distillery: typeof b.distillery === 'string' ? b.distillery.trim().slice(0, 80) : '',
      type,
      proof: proofNum,
      confidence,
      opened: typeof b.opened === 'boolean' ? b.opened : undefined,
    });
    if (out.length >= 40) break;
  }
  return out;
}

/**
 * Read a shelf/bar photo and identify every whiskey bottle visible.
 * Returns a validated, deduplicated list (max 40) for user review —
 * nothing is added to the collection without confirmation.
 */
export async function identifyBottlesFromPhoto(
  apiKey: string,
  base64Image: string,
  mediaType: 'image/jpeg' | 'image/png' = 'image/jpeg',
  model: string = DEFAULT_MODEL
): Promise<IdentifiedBottle[]> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

  const response = await client.messages.create({
    model,
    max_tokens: 4096,
    system:
      'You are a whiskey identification expert. Identify every distinct whiskey bottle ' +
      'visible in the photo from its label, bottle shape, and any readable text. Use exact ' +
      'bottling names (e.g. "Elijah Craig Barrel Proof", not "Elijah Craig"). Skip bottles ' +
      'that are not whiskey (wine, gin, mixers). If a label is partially hidden, still ' +
      'identify it when reasonably confident and mark confidence accordingly. Do not invent ' +
      'bottles that are not visible. For each bottle, also judge from the image whether it looks ' +
      'opened/poured — set "opened" true if the liquid line sits below the shoulder/neck or the ' +
      'seal/cap is clearly broken, false if it looks sealed and full; guess conservatively.',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64Image },
          },
          {
            type: 'text',
            text: 'Identify all whiskey bottles on this shelf/bar.',
          },
        ],
      },
    ],
    output_config: { format: { type: 'json_schema', schema: SHELF_SCHEMA } },
  });

  const text = response.content.find(
    (block): block is Anthropic.TextBlock => block.type === 'text'
  )?.text;
  if (!text) return [];
  return validateIdentifiedBottles(JSON.parse(text));
}

export type ReleaseCategory = 'annual' | 'limited' | 'seasonal' | 'core' | 'other';

export interface UpcomingRelease {
  name: string;
  distillery: string;
  category: ReleaseCategory;
  /** Approximate release window, e.g. "Fall 2026". */
  window: string;
  rarity?: Rarity;
  note: string;
}

const RELEASE_CATEGORIES: ReleaseCategory[] = ['annual', 'limited', 'seasonal', 'core', 'other'];

const RELEASES_SCHEMA = {
  type: 'object',
  properties: {
    releases: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          distillery: { type: 'string' },
          category: { type: 'string', enum: RELEASE_CATEGORIES },
          window: { type: 'string', description: 'Approximate window, e.g. "Fall 2026"' },
          rarity: { type: 'string', enum: ['S', 'A', 'B', 'C', 'D'] },
          note: { type: 'string', description: 'One sentence on why collectors want it' },
        },
        required: ['name', 'distillery', 'category', 'window', 'note'],
        additionalProperties: false,
      },
    },
  },
  required: ['releases'],
  additionalProperties: false,
} as const;

/** Validate/normalize the releases output: exported separately for testing. */
export function validateReleases(raw: unknown): UpcomingRelease[] {
  const releases = (raw as { releases?: unknown })?.releases;
  if (!Array.isArray(releases)) return [];
  const seen = new Set<string>();
  const out: UpcomingRelease[] = [];
  for (const item of releases) {
    if (typeof item !== 'object' || item === null) continue;
    const r = item as Record<string, unknown>;
    const name = typeof r.name === 'string' ? r.name.trim().slice(0, 120) : '';
    if (!name) continue;
    const key = name.toLowerCase().replace(/[^a-z0-9]+/g, '');
    if (seen.has(key)) continue;
    seen.add(key);
    const category = RELEASE_CATEGORIES.includes(r.category as ReleaseCategory)
      ? (r.category as ReleaseCategory)
      : 'other';
    const rarity =
      r.rarity === 'S' || r.rarity === 'A' || r.rarity === 'B' || r.rarity === 'C' || r.rarity === 'D'
        ? (r.rarity as Rarity)
        : undefined;
    out.push({
      name,
      distillery: typeof r.distillery === 'string' ? r.distillery.trim().slice(0, 80) : '',
      category,
      window: typeof r.window === 'string' ? r.window.trim().slice(0, 40) : '',
      rarity,
      note: typeof r.note === 'string' ? r.note.trim().slice(0, 200) : '',
    });
    if (out.length >= 30) break;
  }
  return out;
}

/**
 * Ask Claude for notable upcoming / annually-recurring desirable American
 * whiskey releases collectors watch for. This is a compliant alternative to
 * scraping release calendars: it draws on the model's knowledge of real,
 * well-known release programs rather than copying any site's content. Windows
 * are approximate and clearly labeled as such in the UI.
 */
export async function upcomingReleases(
  apiKey: string,
  model: string = DEFAULT_MODEL
): Promise<UpcomingRelease[]> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  const response = await client.messages.create({
    model,
    max_tokens: 2048,
    system:
      'You are a whiskey release expert. List notable upcoming or annually-recurring, ' +
      'highly-desirable American whiskey releases that collectors watch for (e.g. Buffalo ' +
      'Trace Antique Collection, Pappy Van Winkle, Four Roses Limited Edition, Old Forester ' +
      'Birthday Bourbon, Wild Turkey Master\'s Keep, Michter\'s 20/25). Use real, well-known ' +
      'release programs only — never invent products. Give an APPROXIMATE window (season + ' +
      'year) since exact dates and prices are not fixed. Focus on American whiskey. Return ' +
      '15-25 releases spanning allocated unicorns to attainable limited editions.',
    messages: [
      {
        role: 'user',
        content: 'What notable American whiskey releases should I be watching for?',
      },
    ],
    output_config: { format: { type: 'json_schema', schema: RELEASES_SCHEMA } },
  });
  const text = response.content.find(
    (block): block is Anthropic.TextBlock => block.type === 'text'
  )?.text;
  if (!text) return [];
  return validateReleases(JSON.parse(text));
}

export interface CocktailSuggestion {
  name: string;
  /** Short "how to make it" line. */
  recipe: string;
  /** Why it suits this bottle. */
  note: string;
}

const COCKTAIL_SCHEMA = {
  type: 'object',
  properties: {
    cocktails: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          recipe: { type: 'string', description: 'Concise build: measures + method' },
          note: { type: 'string', description: 'One sentence on why it suits this bottle' },
        },
        required: ['name', 'recipe', 'note'],
        additionalProperties: false,
      },
    },
  },
  required: ['cocktails'],
  additionalProperties: false,
} as const;

/** Validate the cocktail suggestions defensively; exported for testing. */
export function validateCocktails(raw: unknown): CocktailSuggestion[] {
  const list = (raw as { cocktails?: unknown })?.cocktails;
  if (!Array.isArray(list)) return [];
  const out: CocktailSuggestion[] = [];
  for (const item of list) {
    if (typeof item !== 'object' || item === null) continue;
    const c = item as Record<string, unknown>;
    const name = typeof c.name === 'string' ? c.name.trim().slice(0, 80) : '';
    if (!name) continue;
    out.push({
      name,
      recipe: typeof c.recipe === 'string' ? c.recipe.trim().slice(0, 400) : '',
      note: typeof c.note === 'string' ? c.note.trim().slice(0, 200) : '',
    });
    if (out.length >= 6) break;
  }
  return out;
}

/**
 * Suggest cocktails (and how to build them) that suit a specific bottle —
 * great for opened or everyday bottles. Draws on the bottle's style and proof.
 */
export async function cocktailsForBottle(
  apiKey: string,
  bottle: { name: string; type: WhiskeyType; proof?: number },
  model: string = DEFAULT_MODEL
): Promise<CocktailSuggestion[]> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  const response = await client.messages.create({
    model,
    max_tokens: 1024,
    system:
      'You are a whiskey bartender. Suggest 3-5 cocktails that genuinely suit the given ' +
      'bottle, considering its style and proof. Prefer classics and simple builds. For rare, ' +
      'high-end sippers, it is fine to suggest drinking it neat or with a drop of water and to ' +
      'say so. Give concise measures and method.',
    messages: [
      {
        role: 'user',
        content: `Bottle: ${bottle.name} (${bottle.type}${bottle.proof ? `, ${bottle.proof} proof` : ''}). What should I make with it?`,
      },
    ],
    output_config: { format: { type: 'json_schema', schema: COCKTAIL_SCHEMA } },
  });
  const text = response.content.find(
    (block): block is Anthropic.TextBlock => block.type === 'text'
  )?.text;
  if (!text) return [];
  return validateCocktails(JSON.parse(text));
}
