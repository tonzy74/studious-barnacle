'use strict';

/**
 * Fetch upcoming whiskey releases from Claude using the OPERATOR's API key
 * (ANTHROPIC_API_KEY) — independent of any user's key — so the release-watch
 * cron is self-contained. Returns [] when no key is set or on any error, so the
 * scheduler simply does nothing rather than failing.
 */

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

async function fetchUpcomingReleases(apiKey, model = 'claude-haiku-4-5-20251001') {
  if (!apiKey) return [];
  const today = new Date().toISOString().slice(0, 10);
  const year = new Date().getFullYear();
  try {
    const res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: 2048,
        system:
          `Today is ${today} (year ${year}). List up to 12 notable, real, upcoming or ` +
          `annually-recurring American whiskey releases collectors watch for. Only windows in ` +
          `${year} or later. Respond as a JSON array of {"name","distillery","window"} — no prose.`,
        messages: [{ role: 'user', content: 'What releases should collectors watch for?' }],
      }),
    });
    const json = await res.json();
    const text = (json.content || [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('');
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    if (start === -1 || end === -1) return [];
    const parsed = JSON.parse(text.slice(start, end + 1));
    return Array.isArray(parsed) ? parsed.filter((r) => r && r.name) : [];
  } catch {
    return [];
  }
}

module.exports = { fetchUpcomingReleases };
