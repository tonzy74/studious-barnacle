import { UpcomingRelease } from './claude';

/**
 * The release windows we get are approximate ("Fall 2026", "October 2026",
 * "Q4 2026") — that's the most that's compliantly knowable without scraping a
 * retailer calendar. This turns those fuzzy strings into a real, sortable
 * calendar: each release is bucketed into a season of a year so the UI can show
 * an ordered timeline instead of a flat AI list.
 */

export interface CalendarGroup {
  /** Stable key for React and grouping, e.g. "2026-2" (year-seasonIndex). */
  key: string;
  /** Human header, e.g. "Fall 2026" or "Date TBD". */
  label: string;
  /** Chronological sort rank (smaller = sooner). */
  rank: number;
  releases: UpcomingRelease[];
}

const SEASONS = ['Winter', 'Spring', 'Summer', 'Fall'];

// Season / quarter / month keywords → a representative month index (0–11).
const KEYWORD_MONTH: Array<[RegExp, number]> = [
  [/\bwinter\b/, 0],
  [/\bspring\b/, 3],
  [/\bsummer\b/, 6],
  [/\b(fall|autumn)\b/, 9],
  [/\b(holiday|christmas)\b/, 11],
  [/\bq1\b/, 1],
  [/\bq2\b/, 4],
  [/\bq3\b/, 7],
  [/\bq4\b/, 10],
];

const MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

/** Parse a fuzzy window into { year, month } — either may be undefined. */
export function parseWindow(window: string): { year?: number; month?: number } {
  const lower = window.toLowerCase();
  const yearMatch = lower.match(/\b(?:19|20)\d{2}\b/);
  const year = yearMatch ? parseInt(yearMatch[0], 10) : undefined;

  let month: number | undefined;
  for (let i = 0; i < MONTHS.length; i++) {
    if (lower.includes(MONTHS[i])) {
      month = i;
      break;
    }
  }
  if (month === undefined) {
    for (const [re, m] of KEYWORD_MONTH) {
      if (re.test(lower)) {
        month = m;
        break;
      }
    }
  }
  return { year, month };
}

/** Season index 0–3 (Winter…Fall) for a month, or undefined. */
const seasonOf = (month?: number) => (month === undefined ? undefined : Math.min(3, Math.floor(month / 3)));

/**
 * Group releases into chronological calendar sections. Dated windows sort
 * first (by year, then season); a year-only window sorts after that year's
 * seasons; anything undated collects into a trailing "Date TBD" group.
 */
export function buildCalendar(releases: UpcomingRelease[]): CalendarGroup[] {
  const groups = new Map<string, CalendarGroup>();

  for (const r of releases) {
    const { year, month } = parseWindow(r.window);
    let key: string;
    let label: string;
    let rank: number;

    if (year === undefined) {
      key = 'tbd';
      label = 'Date TBD';
      rank = Number.MAX_SAFE_INTEGER;
    } else {
      const season = seasonOf(month);
      if (season === undefined) {
        key = `${year}-x`;
        label = String(year);
        rank = year * 10 + 9; // after that year's seasons
      } else {
        key = `${year}-${season}`;
        label = `${SEASONS[season]} ${year}`;
        rank = year * 10 + season;
      }
    }

    const existing = groups.get(key);
    if (existing) existing.releases.push(r);
    else groups.set(key, { key, label, rank, releases: [r] });
  }

  return [...groups.values()].sort((a, b) => a.rank - b.rank);
}
