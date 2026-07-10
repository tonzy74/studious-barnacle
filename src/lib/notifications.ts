import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { EAS_PROJECT_ID, PUSH_URL } from '../config';
import { diag } from './diagnostics';
import {
  DEFAULT_REMINDER_HOUR,
  releaseDigestCopy,
  streakReminderCopy,
} from './notificationCopy';

/**
 * Local notifications for re-engagement — no server required. Scheduled on
 * device, so this is the retention lever that works without a remote push
 * backend (that would need an EAS build + push credentials). Every native call
 * is guarded so a permission denial or Expo Go limitation degrades gracefully
 * instead of crashing.
 */

const STREAK_ID = 'daily-streak-reminder';
const RELEASE_ID = 'weekly-release-digest';

let configured = false;

/** Install the foreground handler + Android channel. Idempotent. */
export function configureNotifications(): void {
  if (configured) return;
  configured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('reminders', {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    }).catch(() => {});
  }
}

/** Current permission status without prompting. */
export async function notificationsAllowed(): Promise<boolean> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/**
 * Ask for permission (best practice: call this from a value-framed prompt, not
 * on cold launch). Returns whether it was granted.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (err) {
    diag.warn('notifications', `permission request failed: ${(err as Error).message}`);
    return false;
  }
}

/**
 * (Re)schedule the nightly streak-save reminder for the given streak, at the
 * user's chosen hour. Called on app open so the copy always reflects the live
 * streak. Silently no-ops without permission.
 */
export async function scheduleStreakReminder(
  streak: number,
  hour: number = DEFAULT_REMINDER_HOUR
): Promise<void> {
  if (!(await notificationsAllowed())) return;
  try {
    configureNotifications();
    await Notifications.cancelScheduledNotificationAsync(STREAK_ID).catch(() => {});
    const { title, body } = streakReminderCopy(streak);
    await Notifications.scheduleNotificationAsync({
      identifier: STREAK_ID,
      content: { title, body },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute: 0,
      },
    });
  } catch (err) {
    diag.warn('notifications', `streak schedule failed: ${(err as Error).message}`);
  }
}

/** Weekly release-digest nudge (Thursdays, when weekend buying is planned). */
export async function scheduleReleaseDigest(hour: number = DEFAULT_REMINDER_HOUR): Promise<void> {
  if (!(await notificationsAllowed())) return;
  try {
    configureNotifications();
    await Notifications.cancelScheduledNotificationAsync(RELEASE_ID).catch(() => {});
    const { title, body } = releaseDigestCopy();
    await Notifications.scheduleNotificationAsync({
      identifier: RELEASE_ID,
      content: { title, body },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: 5, // Thursday (1 = Sunday)
        hour,
        minute: 0,
      },
    });
  } catch (err) {
    diag.warn('notifications', `release digest schedule failed: ${(err as Error).message}`);
  }
}

/**
 * Obtain this device's Expo push token so a backend can send remote pushes
 * (server-driven price-drop / release alerts). Returns undefined on simulators,
 * without permission, or in Expo Go (remote push needs an EAS build). Ship the
 * returned token to your backend and send via the Expo Push API. The projectId
 * is auto-detected in EAS builds; EXPO_PUBLIC_EAS_PROJECT_ID overrides it.
 */
export async function registerForPushToken(): Promise<string | undefined> {
  if (!Device.isDevice) return undefined;
  if (!(await notificationsAllowed())) return undefined;
  try {
    const token = await Notifications.getExpoPushTokenAsync(
      EAS_PROJECT_ID ? { projectId: EAS_PROJECT_ID } : undefined
    );
    return token.data;
  } catch (err) {
    diag.warn('notifications', `push token unavailable: ${(err as Error).message}`);
    return undefined;
  }
}

/** Turn everything off (user toggled reminders off / data wipe). */
export async function cancelAllReminders(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    /* nothing scheduled */
  }
}

/**
 * Enable the full reminder suite: prompt for permission, then schedule the
 * streak + release reminders. Returns whether it ended up enabled.
 */
export async function enableReminders(
  streak: number,
  hour: number = DEFAULT_REMINDER_HOUR,
  anonId?: string
): Promise<boolean> {
  const granted = await requestNotificationPermission();
  if (!granted) return false;
  await scheduleStreakReminder(streak, hour);
  await scheduleReleaseDigest(hour);
  // Warm the push token and, if a push backend is configured, register it so
  // remote alerts can be sent (no-op in Expo Go / simulators / without URL).
  const token = await registerForPushToken();
  if (token) await registerTokenWithBackend(token, anonId);
  return true;
}

/** Send this device's push token to the push-service registry (best-effort). */
export async function registerTokenWithBackend(token: string, anonId?: string): Promise<void> {
  if (!PUSH_URL) return;
  try {
    await fetch(`${PUSH_URL.replace(/\/+$/, '')}/v1/push/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, anonId }),
    });
    diag.info('notifications', 'push token registered with backend');
  } catch (err) {
    diag.warn('notifications', `token register failed: ${(err as Error).message}`);
  }
}
