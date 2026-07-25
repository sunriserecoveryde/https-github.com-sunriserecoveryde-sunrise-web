import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications appear when the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const DAILY_REMINDER_IDENTIFIER = 'grow_daily_reminder';

const REMINDER_MESSAGES = [
  "Time for your daily check-in. How are you feeling today?",
  "Your streak is waiting. Take a moment to check in.",
  "A small step every day builds lasting change. Open Grow to check in.",
  "Your recovery journey continues today. Tap to open Grow.",
  "One day at a time. Your check-in is ready.",
  "You're doing great. Keep the streak alive — check in now.",
  "A gentle nudge: your daily Grow check-in is ready.",
];

function getReminderBody(): string {
  const day = new Date().getDay();
  return REMINDER_MESSAGES[day % REMINDER_MESSAGES.length];
}

/**
 * Request notification permission. Returns true if granted.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Schedule (or reschedule) a daily reminder at the given hour/minute.
 * Cancels any previously scheduled reminder first.
 */
export async function scheduleDailyReminder(hour: number, minute: number): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const granted = await requestNotificationPermission();
  if (!granted) return false;

  // Cancel existing reminder
  await cancelDailyReminder();

  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_REMINDER_IDENTIFIER,
    content: {
      title: "Grow — Daily Check-In",
      body: "Time for your daily check-in. How are you feeling today?",
      data: { screen: '/(tabs)' },
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  return true;
}

/**
 * Ensure the daily reminder is scheduled. If it is already present in the
 * OS schedule it is left untouched; otherwise it is (re)scheduled. Call this
 * on cold start after loading persisted settings so a force-quit or app
 * upgrade cannot silently drop the reminder.
 */
export async function ensureDailyReminderScheduled(hour: number, minute: number): Promise<void> {
  if (Platform.OS === 'web') return;

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const exists = scheduled.some((n) => n.identifier === DAILY_REMINDER_IDENTIFIER);
  if (!exists) {
    await scheduleDailyReminder(hour, minute);
  }
}

/**
 * Cancel the daily reminder.
 */
export async function cancelDailyReminder(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_IDENTIFIER);
  } catch {
    // Ignore if it didn't exist
  }
}

/**
 * Format hour/minute as a human-readable string, e.g. "8:00 AM"
 */
export function formatReminderTime(hour: number, minute: number): string {
  const period = hour < 12 ? 'AM' : 'PM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const displayMinute = minute.toString().padStart(2, '0');
  return `${displayHour}:${displayMinute} ${period}`;
}
