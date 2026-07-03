import Anthropic from '@anthropic-ai/sdk';

import { Bottle, ChatMsg, FlavorProfile, WhiskeyType } from '../types';
import { FLAVOR_AXES, FLAVOR_LABELS } from '../data/whiskeyDatabase';

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
  return [
    `- ${b.name} (${b.distillery}, ${b.type}, ${b.proof} proof, ${b.opened ? 'open' : 'sealed'})`,
    variant ? `  Variant: ${variant}` : '',
    `  Tasting notes: ${b.notes || 'n/a'}`,
    flavorSummary ? `  Dominant traits: ${flavorSummary}` : '',
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
  history: ChatMsg[]
): Promise<string> {
  const client = new Anthropic({
    apiKey,
    // The key is the user's own, stored on their own device — this is the
    // supported pattern for direct-from-app calls in React Native.
    dangerouslyAllowBrowser: true,
  });

  const response = await client.messages.create({
    model: 'claude-opus-4-8',
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
  },
  required: [...FLAVOR_AXES, 'notes', 'known'],
  additionalProperties: false,
} as const;

export interface EstimatedProfile {
  flavor: FlavorProfile;
  notes: string;
  known: boolean;
}

/**
 * Ask Claude to profile a bottle that isn't in the local reference database,
 * drawing on its knowledge of professional tasting notes. Returns a clamped
 * 10-axis flavor vector, a note summary, and whether the bottling was
 * actually recognized (vs. estimated from style).
 */
export async function estimateFlavorProfile(
  apiKey: string,
  bottle: { name: string; distillery?: string; type: WhiskeyType; proof?: number }
): Promise<EstimatedProfile> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

  const response = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 1024,
    system:
      'You are a whiskey expert. Rate flavor intensities on a 0-10 scale reflecting the ' +
      'consensus of professional reviews (Whisky Advocate, Breaking Bourbon, Distiller). ' +
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
  return {
    flavor,
    notes: typeof raw.notes === 'string' ? raw.notes : '',
    known: raw.known === true,
  };
}
