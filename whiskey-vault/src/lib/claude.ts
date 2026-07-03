import Anthropic from '@anthropic-ai/sdk';

import { Bottle, ChatMsg } from '../types';
import { FLAVOR_LABELS } from '../data/whiskeyDatabase';

function describeBottle(b: Bottle): string {
  const flavorSummary = (Object.keys(FLAVOR_LABELS) as (keyof typeof FLAVOR_LABELS)[])
    .filter((axis) => b.flavor[axis] >= 6)
    .map((axis) => FLAVOR_LABELS[axis].toLowerCase())
    .join(', ');
  return [
    `- ${b.name} (${b.distillery}, ${b.type}, ${b.proof} proof, ${b.opened ? 'open' : 'sealed'})`,
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
