import * as Notifications from "expo-notifications";
import { SchedulableTriggerInputTypes } from "expo-notifications";
import { Platform } from "react-native";
import { loadJSON, removeKey, saveJSON } from "@/lib/storage";
import { requestNotificationPermission } from "@/lib/notifications";
import { fill, strings } from "@/lib/i18n";

/**
 * The one-off reminder set from the Tomorrow sheet on Today: a single notification at 7:00 the next morning, saying
 * tomorrow's pick is ready. It is separate from the daily reminder (its own id, its own key), so setting or clearing
 * it never touches that one.
 */

export const REMIND_HOUR = 7;
export const REMIND_LABEL = "7:00";
const KEY = "closer.tomorrow.reminder";

type Stored = { day: string; id: string };

export const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

/** The day (as a key) a reminder is set for, if one is still pending */
export async function tomorrowReminderDay(): Promise<string | null> {
  const s = await loadJSON<Stored>(KEY);
  return s?.day ?? null;
}

export async function setTomorrowReminder(title: string): Promise<"set" | "denied"> {
  if ((await requestNotificationPermission()) !== "granted") return "denied";
  await clearTomorrowReminder();
  const at = new Date();
  at.setDate(at.getDate() + 1);
  at.setHours(REMIND_HOUR, 0, 0, 0);
  const id = await Notifications.scheduleNotificationAsync({
    content: { title: "Closer", body: fill(strings().native.tomorrow.notification, { title }), data: { kind: "tomorrow", route: "/today" }, sound: "default" },
    trigger: { type: SchedulableTriggerInputTypes.DATE, date: at, ...(Platform.OS === "android" ? { channelId: "before-the-noise" } : {}) },
  });
  await saveJSON<Stored>(KEY, { day: dayKey(at), id });
  return "set";
}

export async function clearTomorrowReminder(): Promise<void> {
  const s = await loadJSON<Stored>(KEY);
  if (s?.id) await Notifications.cancelScheduledNotificationAsync(s.id).catch(() => {});
  await removeKey(KEY);
}
