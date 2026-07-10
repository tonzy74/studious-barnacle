/**
 * Copy + scheduling constants for local notifications, kept free of any native
 * import so the logic is unit-testable. The best re-engagement notifications
 * are specific and time-relevant, not generic "come back!" nags — so streak
 * reminders name the exact streak at stake (loss aversion) and evening timing
 * matches when whiskey drinkers actually pour.
 */

/** Evening — when enthusiasts settle in for a pour. */
export const DEFAULT_REMINDER_HOUR = 19; // 7pm local

export interface NotificationText {
  title: string;
  body: string;
}

/** The nightly streak-save reminder, tuned to the streak at risk. */
export function streakReminderCopy(streak: number): NotificationText {
  if (streak <= 0) {
    return {
      title: 'Pour something worth remembering 🥃',
      body: 'Log tonight’s pour and start a tasting streak.',
    };
  }
  if (streak === 1) {
    return {
      title: 'Keep it going 🔥',
      body: 'You opened Whiskey Vault yesterday — check in today to build your streak.',
    };
  }
  return {
    title: `Don’t break your ${streak}-day streak 🔥`,
    body: 'A quick check-in keeps the flame alive. What are you pouring tonight?',
  };
}

/** Weekly nudge to review the release calendar (chase-the-drop motivation). */
export function releaseDigestCopy(): NotificationText {
  return {
    title: 'New drops on the radar 📅',
    body: 'See which allocated and limited releases are coming up this week.',
  };
}
