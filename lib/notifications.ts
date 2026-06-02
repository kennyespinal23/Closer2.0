import * as Notifications from "expo-notifications";
import { SchedulableTriggerInputTypes } from "expo-notifications";
import { Platform } from "react-native";
import { loadJSON, removeKey, saveJSON, STORAGE_KEYS } from "@/lib/storage";

/**
 * "Before The Noise" — the daily notification ritual.
 *
 * One notification per day at the user's chosen time. Tap deep-links
 * into the existing sermon (`/sermon/intro` → "Drawing Near in the
 * Noise"). The notification is the product, not a reminder; the copy
 * is always:
 *
 *   "Your word for today is ready."
 *
 * Rules (from spec):
 *   • One notification per day, never more
 *   • Always fires at the user's chosen time
 *   • Deep-links directly into the sermon, not the home screen
 *   • Never says "Don't forget" / "You missed" — no guilt, no streak pressure
 *
 * This module owns:
 *   • Permission requests + permission-status readback
 *   • Foreground display handler (so the notification surfaces even
 *     when the app is open — it's the "your word is ready" beacon,
 *     and silencing it when foregrounded would dilute the ritual)
 *   • A single-id discipline: we persist the scheduled id and cancel
 *     it by id before scheduling a new one, so toggling the time
 *     never accumulates duplicate notifications
 *
 * What this module does NOT own:
 *   • Reading the user's chosen time — that lives on
 *     OnboardingAnswers.dailyReminderTime via state/onboarding.tsx.
 *     We accept it as a parameter so this module stays headless.
 *   • Deep-link routing on tap — handled by the root layout's
 *     notification response listener (see app/_layout.tsx). Keeping
 *     navigation out of this file means the scheduler can be tested
 *     without a router.
 */

// ─────────────────────────────────────────────────────────────────
// Foreground display handler
// ─────────────────────────────────────────────────────────────────

/**
 * Configure how iOS surfaces a notification while the app is in the
 * foreground. By default expo-notifications hides them entirely;
 * we override that because "Before The Noise" is the ritual trigger
 * — even if the user happens to have the app open, the daily beacon
 * should still announce itself with a banner + sound.
 *
 * Call this exactly once at the app root (in app/_layout.tsx).
 */
export function configureForegroundDisplay(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      // `shouldShowAlert` is the legacy combined flag (iOS ≤ 13).
      // From iOS 14+ Apple split it into "banner at the top of the
      // screen" and "row in Notification Center" — expo-notifications
      // mirrored that split as `shouldShowBanner` + `shouldShowList`
      // in SDK 53+. We surface both so the morning beacon appears
      // exactly the way the user expects on every supported OS.
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

// ─────────────────────────────────────────────────────────────────
// Permissions
// ─────────────────────────────────────────────────────────────────

export type NotificationPermissionStatus =
  | "granted"
  | "denied"
  | "undetermined";

/**
 * Ask the OS for notification permission. Resolves with the final
 * status (`granted` / `denied` / `undetermined`).
 *
 * On iOS this surfaces the system permission dialog the first time
 * it's called. Subsequent calls return the cached decision (the OS
 * remembers; we can't re-prompt without sending the user to
 * Settings.app). The caller is responsible for surfacing that
 * "go to Settings" affordance if `denied` comes back on first ask.
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionStatus> {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.status === "granted") return "granted";

  // Only prompt if the system thinks we can still prompt. iOS will
  // resolve the request immediately as the cached decision if the
  // user previously denied — which is fine; we treat that the same.
  if (existing.canAskAgain !== false) {
    const next = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowSound: true,
        allowBadge: false,
      },
    });
    if (next.status === "granted") return "granted";
    if (next.status === "denied") return "denied";
    return "undetermined";
  }

  if (existing.status === "denied") return "denied";
  return "undetermined";
}

/**
 * Read the current permission status without prompting. Useful for
 * settings screens that want to render the right CTA without
 * triggering the system dialog.
 */
export async function getNotificationPermission(): Promise<NotificationPermissionStatus> {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.status === "granted") return "granted";
  if (existing.status === "denied") return "denied";
  return "undetermined";
}

// ─────────────────────────────────────────────────────────────────
// Scheduling
// ─────────────────────────────────────────────────────────────────

/**
 * Notification payload constants. Centralized so settings preview
 * copy + the actual fired notification stay 1:1.
 *
 * `data.route` is the deep-link target. The root layout's notif
 * response listener reads this and routes accordingly.
 */
export const BEFORE_THE_NOISE = {
  title: "Closer",
  body: "Your word for today is ready.",
  /** Route to push when tapped. See app/_layout.tsx response listener. */
  route: "/sermon/intro" as const,
} as const;

export type DailyReminderTime = {
  hour: number;
  minute: number;
};

/**
 * Schedule (or re-schedule) the daily "Before The Noise" reminder.
 *
 * Always cancels the previously-scheduled instance first so we never
 * end up with two notifications fighting at different times. The
 * cancellation is by id (persisted to AsyncStorage), not a blanket
 * `cancelAllScheduledNotificationsAsync()`, so future notification
 * types (verse-of-day, weekly-reflection, etc.) won't get clobbered.
 *
 * Returns the new notification id so the caller can verify success
 * if desired; the id is also persisted automatically.
 *
 * Caller is responsible for ensuring permission is granted — calling
 * this without permission will silently no-op on iOS (the API call
 * doesn't throw, just queues a notification that the OS will refuse
 * to deliver).
 */
export async function scheduleDailyReminder(
  time: DailyReminderTime,
): Promise<string> {
  await cancelDailyReminder();

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: BEFORE_THE_NOISE.title,
      body: BEFORE_THE_NOISE.body,
      // `data` is opaque to the OS but available on the notification
      // response — this is how the deep-link handler knows where to
      // route on tap. We pass an explicit route string instead of a
      // synthetic id so the routing logic stays readable.
      data: {
        kind: "before-the-noise",
        route: BEFORE_THE_NOISE.route,
      },
      // No sound override → uses the system default. On iOS this is
      // the default alert tone, which is what we want for a calm
      // morning beacon (avoids the "you got a chat message" sound).
      sound: "default",
    },
    trigger: {
      // SDK 53+ requires an explicit trigger `type` discriminator.
      // DAILY repeats at the given hour/minute every day — exactly
      // what "Before The Noise" needs. No `repeats: true` required;
      // DAILY is inherently repeating.
      type: SchedulableTriggerInputTypes.DAILY,
      hour: clampHour(time.hour),
      minute: clampMinute(time.minute),
      // Android also accepts a channelId — see ensureAndroidChannel.
      ...(Platform.OS === "android"
        ? { channelId: ANDROID_CHANNEL_ID }
        : {}),
    },
  });

  await saveJSON(STORAGE_KEYS.beforeNoiseNotificationId, id);
  return id;
}

/**
 * Cancel the currently-scheduled "Before The Noise" reminder, if
 * any. Safe to call multiple times. No-op when nothing is scheduled.
 *
 * Used by:
 *   • scheduleDailyReminder (before scheduling the replacement)
 *   • Settings toggle when the user turns the notification off
 *   • Onboarding reset / dev "Reset App" path
 */
export async function cancelDailyReminder(): Promise<void> {
  const existingId = await loadJSON<string>(
    STORAGE_KEYS.beforeNoiseNotificationId,
  );
  if (!existingId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(existingId);
  } catch {
    // Notification may have already been delivered or cancelled
    // out-of-band (user wiped the app, etc.). Either way we just
    // want our local id cleared.
  }
  await removeKey(STORAGE_KEYS.beforeNoiseNotificationId);
}

/**
 * Get the persisted notification id, if any. Mostly useful for
 * settings UI that wants to render a "scheduled / not scheduled"
 * cue without re-reading the OS state.
 */
export async function getScheduledReminderId(): Promise<string | null> {
  return await loadJSON<string>(STORAGE_KEYS.beforeNoiseNotificationId);
}

/**
 * Fire a notification immediately — used by the __DEV__ test-fire
 * button so we can verify the deep link end-to-end without waiting
 * for the trigger time. Production code never calls this.
 */
export async function fireTestReminderNow(): Promise<string> {
  return await Notifications.scheduleNotificationAsync({
    content: {
      title: BEFORE_THE_NOISE.title,
      body: BEFORE_THE_NOISE.body,
      data: {
        kind: "before-the-noise",
        route: BEFORE_THE_NOISE.route,
      },
      sound: "default",
    },
    // 2-second delay so the user has time to background the app and
    // see the banner / lock-screen behavior, not just an in-app toast.
    trigger: {
      type: SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2,
    },
  });
}

// ─────────────────────────────────────────────────────────────────
// Bible study sessions — recurring weekly notifications
// ─────────────────────────────────────────────────────────────────

/**
 * Study-session payload constants. Same single-source-of-truth
 * shape as BEFORE_THE_NOISE so settings preview copy and the actual
 * fired notification stay 1:1. Title/body are templated per-session
 * with the user's chosen name.
 *
 * `route` resolves to a dynamic route — the deep-link handler
 * substitutes the session id at tap-time so a single notification
 * lands the user on the correct study landing page even if they
 * scheduled multiple recurring sessions.
 */
export const STUDY_SESSION = {
  title: "Closer",
  /** Build the notification body from the session's name. */
  body: (name: string) => `Time for ${name}.`,
  /** Build the deep-link route for a given session id. */
  route: (sessionId: string): `/study/${string}` => `/study/${sessionId}`,
} as const;

/** Day-of-week index using JS conventions: 0 = Sunday … 6 = Saturday. */
export type WeekdayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Minimal shape `scheduleStudySession` needs. Kept here (rather than
 * importing from state/) so this module stays free of React-land
 * dependencies and can be tested in isolation.
 */
export type SchedulableStudySession = {
  id: string;
  name: string;
  time: DailyReminderTime;
  daysOfWeek: WeekdayIndex[];
  enabled: boolean;
};

/**
 * Schedule a recurring local notification for each active day of a
 * study session. Returns the list of notification ids the OS handed
 * back so the caller can persist them and cancel precisely later.
 *
 * iOS calendar triggers only repeat WEEKLY per (weekday, hour,
 * minute) tuple — there's no "repeat on Mon+Wed+Fri" in a single
 * trigger. So if the session covers three days we schedule three
 * separate notifications, each with `weekday` set and `repeats: true`.
 * This burns a few notification slots per session but stays within
 * the 64-pending-notifications iOS cap by a comfortable margin
 * (a user would need ~9 daily sessions to bump into it).
 *
 * If the session is disabled or has no active days, we return an
 * empty array and schedule nothing. Caller is responsible for
 * ensuring permission is granted; without it the OS silently
 * refuses delivery.
 */
export async function scheduleStudySession(
  session: SchedulableStudySession,
): Promise<string[]> {
  if (!session.enabled) return [];
  if (session.daysOfWeek.length === 0) return [];

  const hour = clampHour(session.time.hour);
  const minute = clampMinute(session.time.minute);
  const ids: string[] = [];

  for (const day of session.daysOfWeek) {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: STUDY_SESSION.title,
        body: STUDY_SESSION.body(session.name || "your study"),
        data: {
          // `kind` is the discriminator the deep-link handler keys
          // off. Distinct from "before-the-noise" so the two
          // notification types route independently.
          kind: "study-session",
          sessionId: session.id,
          route: STUDY_SESSION.route(session.id),
        },
        sound: "default",
      },
      trigger: {
        // SDK 53+ trigger discriminator. WEEKLY fires once per week
        // on the chosen weekday at hour:minute and is inherently
        // repeating (no `repeats: true` needed). One trigger per
        // active day — iOS still has no "multi-weekday in a single
        // trigger" primitive.
        type: SchedulableTriggerInputTypes.WEEKLY,
        // iOS weekday uses 1=Sunday…7=Saturday; JS Date.getDay()
        // uses 0=Sunday…6=Saturday. Bridge at the boundary so the
        // rest of the codebase can stay on JS conventions.
        weekday: jsWeekdayToIOSWeekday(day),
        hour,
        minute,
        ...(Platform.OS === "android"
          ? { channelId: STUDY_ANDROID_CHANNEL_ID }
          : {}),
      },
    });
    ids.push(id);
  }

  return ids;
}

/**
 * Cancel a set of previously-scheduled study-session notifications.
 * Each id is cancelled independently — failures are swallowed
 * because a notification may have already been delivered or
 * cancelled out-of-band (user wiped the app, OS pruning, etc).
 */
export async function cancelStudySession(
  notificationIds: readonly string[],
): Promise<void> {
  for (const id of notificationIds) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch {
      /* notification may have been delivered / cancelled already */
    }
  }
}

/**
 * Fire a study-session notification immediately. Used by the
 * __DEV__ "Test fire" affordance on the editor so we can verify
 * the deep link end-to-end without waiting for the next trigger.
 */
export async function fireTestStudySessionNow(
  session: SchedulableStudySession,
): Promise<string> {
  return await Notifications.scheduleNotificationAsync({
    content: {
      title: STUDY_SESSION.title,
      body: STUDY_SESSION.body(session.name || "your study"),
      data: {
        kind: "study-session",
        sessionId: session.id,
        route: STUDY_SESSION.route(session.id),
      },
      sound: "default",
    },
    trigger: {
      type: SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2,
    },
  });
}

function jsWeekdayToIOSWeekday(jsDay: WeekdayIndex): number {
  return jsDay + 1;
}

// ─────────────────────────────────────────────────────────────────
// Android channels
// ─────────────────────────────────────────────────────────────────

const ANDROID_CHANNEL_ID = "before-the-noise";
const STUDY_ANDROID_CHANNEL_ID = "study-sessions";

/**
 * Android requires every notification to be associated with a
 * channel. Channels are user-tunable (sound, vibration, importance)
 * via system Settings, so we make one dedicated to each notification
 * kind and label them accordingly.
 *
 * Safe to call multiple times — creating an existing channel is a
 * no-op. iOS callers can invoke this freely; it's gated internally.
 */
export async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: "Before The Noise",
    description:
      "Your daily word — one notification per day at the time you chose.",
    importance: Notifications.AndroidImportance.HIGH,
    sound: "default",
    enableVibrate: true,
  });
  await Notifications.setNotificationChannelAsync(STUDY_ANDROID_CHANNEL_ID, {
    name: "Bible study sessions",
    description:
      "Reminders for the study times you scheduled. Tap to begin focused reading.",
    importance: Notifications.AndroidImportance.HIGH,
    sound: "default",
    enableVibrate: true,
  });
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function clampHour(h: number): number {
  if (!Number.isFinite(h)) return 7;
  return Math.max(0, Math.min(23, Math.floor(h)));
}

function clampMinute(m: number): number {
  if (!Number.isFinite(m)) return 0;
  return Math.max(0, Math.min(59, Math.floor(m)));
}

/**
 * Format a `DailyReminderTime` as the human-readable 12-hour clock
 * label we use in copy ("7:30 AM"). Centralized so onboarding,
 * settings, and any future surfaces all format the same way.
 */
export function formatReminderTime(time: DailyReminderTime): string {
  const h = clampHour(time.hour);
  const m = clampMinute(time.minute);
  const period = h < 12 ? "AM" : "PM";
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display}:${String(m).padStart(2, "0")} ${period}`;
}

/**
 * Default daily reminder time used when the user enables the
 * notification without picking one. 7:00 AM is the morning anchor
 * that lands "before the noise" for most readers — late enough to
 * not catch night-shift workers, early enough to beat the social
 * feed scroll for the typical 22–32 audience.
 */
export const DEFAULT_REMINDER_TIME: DailyReminderTime = {
  hour: 7,
  minute: 0,
};
