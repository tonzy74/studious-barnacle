'use strict';

/**
 * Pure metering helpers for the AI proxy. Free installs get a monthly quota;
 * Pro installs are unlimited. Zero dependencies so it's unit-testable.
 */

/** Calendar-month bucket key (UTC) for resetting the free quota monthly. */
function monthKey(now) {
  const d = new Date(now);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/**
 * Decide whether a request is allowed and how much quota remains, given the
 * install's current usage record. Pro is always allowed and uncounted.
 * @returns {{ allowed:boolean, remaining:number, record:{month:string,count:number} }}
 */
function evaluate(record, now, quota, isPro) {
  const mk = monthKey(now);
  let rec = record && record.month === mk ? record : { month: mk, count: 0 };
  if (isPro) return { allowed: true, remaining: Infinity, record: rec };
  if (rec.count >= quota) return { allowed: false, remaining: 0, record: rec };
  // Count optimistically on allow.
  rec = { month: mk, count: rec.count + 1 };
  return { allowed: true, remaining: Math.max(0, quota - rec.count), record: rec };
}

module.exports = { monthKey, evaluate };
