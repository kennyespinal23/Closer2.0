import { useCallback, useState } from "react";
import { DEFAULT_REMINDER_TIME, formatReminderTime, requestNotificationPermission, scheduleDailyReminder, type DailyReminderTime } from "@/lib/notifications";
import { useOnboarding } from "@/state/onboarding";

/**
 * The morning reminder as one value you can nudge. Moving the time turns the
 * reminder on (asking for permission the first time) and reschedules it.
 */
export function useReminder() {
  const { answers, setAnswer } = useOnboarding();
  const [busy, setBusy] = useState(false);
  const enabled = answers.notificationsEnabled ?? false;
  const time = answers.dailyReminderTime ?? DEFAULT_REMINDER_TIME;
  const setTime = useCallback(async (next: DailyReminderTime) => {
    setAnswer("dailyReminderTime", next);
    if (busy) return;
    setBusy(true);
    try {
      if (!enabled) {
        if (await requestNotificationPermission() !== "granted") return;
        setAnswer("notificationsEnabled", true);
      }
      await scheduleDailyReminder(next);
    } finally { setBusy(false); }
  }, [busy, enabled, setAnswer]);
  const nudge = useCallback((minutes: number) => {
    const total = ((time.hour * 60 + time.minute + minutes) % 1440 + 1440) % 1440;
    void setTime({ hour: Math.floor(total / 60), minute: total % 60 });
  }, [time, setTime]);
  return { enabled, time, label: formatReminderTime(time), nudge, setTime, busy };
}
