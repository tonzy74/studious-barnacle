/**
 * The Fresh-Start Effect (Dai, Milkman & Riis, 2014): people are most motivated
 * to pursue goals at temporal landmarks — a new year, month, or season. Surfacing
 * a gentle "fresh start" nudge on those days lifts re-engagement and new adds. We
 * fire only on the 1st of a month (bounded, non-spammy) and key each moment so it
 * shows once.
 */

export interface FreshStart {
  /** Stable key so the nudge shows once per landmark. */
  key: string;
  label: string;
  sub: string;
}

const SEASON_MONTHS = [2, 5, 8, 11]; // Mar / Jun / Sep / Dec starts

/** The fresh-start moment for `now`, or undefined on a non-landmark day. */
export function freshStartMoment(now: number = Date.now()): FreshStart | undefined {
  const d = new Date(now);
  if (d.getDate() !== 1) return undefined; // only the 1st of a month
  const year = d.getFullYear();
  const month = d.getMonth();
  if (month === 0) {
    return { key: `fs-${year}-year`, label: 'New year, fresh vault', sub: 'Set the tone — add a bottle or chase a new release.' };
  }
  if (SEASON_MONTHS.includes(month)) {
    return { key: `fs-${year}-${month}-season`, label: 'New season, new pours', sub: 'A fresh season is a great excuse to level up your bar.' };
  }
  return { key: `fs-${year}-${month}-month`, label: 'New month — keep building', sub: 'Add a bottle or complete a lineup this month.' };
}
