/**
 * Scheduled App Blocks — native Screen Time monitors for study
 * sessions.
 *
 * Local notifications remind the user; DeviceActivity monitors
 * actually raise the OS shield at the configured time. Each
 * enabled session × weekday gets its own monitor (iOS caps at ~20).
 */

import {
  cleanUpAfterActivity,
  configureActions,
  getActivities,
  isShieldActive,
  startMonitoring,
  stopMonitoring,
  type DeviceActivitySchedule,
} from "react-native-device-activity";
import {
  configureCloserShieldUI,
  FOCUS_FAMILY_ACTIVITY_SELECTION_ID,
  isNativeScreenTimeAvailable,
  isScreenTimeShieldReady,
  startNativeScreenTimeShield,
  stopNativeScreenTimeShield,
} from "@/lib/deviceActivityShield";
import type { WeekdayIndex } from "@/lib/notifications";
import type { StudySession } from "@/state/studySessions";

const ACTIVITY_PREFIX = "closer-block-";
/** Default window when a routine has no durationMinutes. */
const DEFAULT_BLOCK_MINUTES = 60;
/** iOS DeviceActivity monitor budget — stay under this. */
const MAX_MONITORS = 20;

export function scheduledBlockActivityName(
  sessionId: string,
  weekday: number,
): string {
  return `${ACTIVITY_PREFIX}${sessionId}-d${weekday}`;
}

/** JS 0=Sun…6=Sat → Foundation weekday 1=Sun…7=Sat. */
function jsWeekdayToApple(weekday: number): number {
  return weekday + 1;
}

function addMinutes(
  hour: number,
  minute: number,
  deltaMin: number,
): { hour: number; minute: number } {
  const total = hour * 60 + minute + deltaMin;
  const wrapped = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  return { hour: Math.floor(wrapped / 60), minute: wrapped % 60 };
}

function buildSchedule(
  session: StudySession,
  weekday: number,
): DeviceActivitySchedule {
  const durationMin =
    typeof session.durationMinutes === "number" && session.durationMinutes > 0
      ? session.durationMinutes
      : DEFAULT_BLOCK_MINUTES;
  const startTotal = session.time.hour * 60 + session.time.minute;
  const endTotal = startTotal + durationMin;
  const crossesMidnight = endTotal >= 24 * 60;
  const endHM = addMinutes(session.time.hour, session.time.minute, durationMin);
  const endWeekday = crossesMidnight ? (weekday + 1) % 7 : weekday;

  return {
    intervalStart: {
      hour: session.time.hour,
      minute: session.time.minute,
      weekday: jsWeekdayToApple(weekday),
    },
    intervalEnd: {
      hour: endHM.hour,
      minute: endHM.minute,
      weekday: jsWeekdayToApple(endWeekday),
    },
    repeats: true,
  };
}

function ensureBlockActions(activityName: string): void {
  configureActions({
    activityName,
    callbackName: "intervalDidStart",
    actions: [
      {
        type: "blockSelection",
        familyActivitySelectionId: FOCUS_FAMILY_ACTIVITY_SELECTION_ID,
      },
    ],
  });
  configureActions({
    activityName,
    callbackName: "intervalDidEnd",
    actions: [
      {
        type: "unblockSelection",
        familyActivitySelectionId: FOCUS_FAMILY_ACTIVITY_SELECTION_ID,
      },
    ],
  });
}

function stopAllCloserBlockMonitors(): void {
  if (!isNativeScreenTimeAvailable()) return;
  const ours = getActivities().filter((name) => name.startsWith(ACTIVITY_PREFIX));
  if (ours.length === 0) return;
  stopMonitoring(ours);
  for (const name of ours) {
    cleanUpAfterActivity(name);
  }
}

function sessionShouldAutoBlock(session: StudySession): boolean {
  if (!session.enabled) return false;
  if (session.useFocusMode) return true;
  // User-created block times on the Blocks tab imply silencing even
  // when `useFocusMode` was false on legacy saves.
  return session.source === "user";
}

/** True when `now` falls inside a session's recurring block window. */
function isNowInsideBlockWindow(session: StudySession, now: Date): boolean {
  const weekday = now.getDay() as WeekdayIndex;
  if (!session.daysOfWeek.includes(weekday)) return false;

  const durationMin =
    typeof session.durationMinutes === "number" && session.durationMinutes > 0
      ? session.durationMinutes
      : DEFAULT_BLOCK_MINUTES;
  const startMin = session.time.hour * 60 + session.time.minute;
  const endMin = startMin + durationMin;
  const nowMin = now.getHours() * 60 + now.getMinutes();

  if (endMin <= 24 * 60) {
    return nowMin >= startMin && nowMin < endMin;
  }
  // Window crosses midnight.
  const endWrapped = endMin % (24 * 60);
  return nowMin >= startMin || nowMin < endWrapped;
}

/** True when `now` falls inside any enabled block-time window. */
export function isInsideAnyActiveBlockWindow(
  sessions: ReadonlyArray<StudySession>,
  now: Date = new Date(),
): boolean {
  return sessions.some(
    (session) =>
      sessionShouldAutoBlock(session) && isNowInsideBlockWindow(session, now),
  );
}

/**
 * Raise or lower the OS shield to match the current clock vs block
 * schedules. Called from ScheduledBlockGuard on a timer + foreground.
 */
export async function syncScheduledBlockShieldState(
  sessions: ReadonlyArray<StudySession>,
  options?: {
    focusSessionActive?: boolean;
    /** When true, today's sermon unlock loop is satisfied — keep
     *  apps open even inside a scheduled block window. */
    sermonUnlockSatisfied?: boolean;
  },
): Promise<void> {
  if (!isNativeScreenTimeAvailable() || !isScreenTimeShieldReady()) {
    return;
  }

  if (options?.focusSessionActive) {
    return;
  }

  if (options?.sermonUnlockSatisfied) {
    if (isShieldActive()) {
      stopNativeScreenTimeShield();
    }
    return;
  }

  const inWindow = isInsideAnyActiveBlockWindow(sessions);
  if (inWindow) {
    const raised = await startNativeScreenTimeShield();
    if (!raised && __DEV__) {
      // eslint-disable-next-line no-console
      console.warn("[scheduledAppBlocks] shield did not activate in block window");
    }
    return;
  }

  if (isShieldActive()) {
    stopNativeScreenTimeShield();
  }
}

/** @deprecated Use syncScheduledBlockShieldState */
export async function reapplyShieldDuringActiveBlockWindows(
  sessions: ReadonlyArray<StudySession>,
): Promise<void> {
  await syncScheduledBlockShieldState(sessions);
}

function collectSchedulableSlots(
  sessions: ReadonlyArray<StudySession>,
): { session: StudySession; weekday: number }[] {
  const slots: { session: StudySession; weekday: number }[] = [];
  for (const session of sessions) {
    if (!sessionShouldAutoBlock(session)) continue;
    for (const weekday of session.daysOfWeek) {
      slots.push({ session, weekday });
    }
  }
  return slots;
}

/**
 * Reconcile native monitors with the persisted study-session list.
 * Safe to call after hydration, CRUD, or Screen Time picker saves.
 */
export async function syncAllScheduledAppBlocks(
  sessions: ReadonlyArray<StudySession>,
): Promise<void> {
  if (!isNativeScreenTimeAvailable()) return;

  if (!isScreenTimeShieldReady()) {
    stopAllCloserBlockMonitors();
    return;
  }

  configureCloserShieldUI();

  const slots = collectSchedulableSlots(sessions);
  const capped = slots.slice(0, MAX_MONITORS);
  if (slots.length > MAX_MONITORS && __DEV__) {
    // eslint-disable-next-line no-console
    console.warn(
      `[scheduledAppBlocks] ${slots.length} slots exceed iOS monitor cap (${MAX_MONITORS}); some blocks won't auto-shield`,
    );
  }

  const wanted = new Set(
    capped.map(({ session, weekday }) =>
      scheduledBlockActivityName(session.id, weekday),
    ),
  );

  const existing = getActivities().filter((name) => name.startsWith(ACTIVITY_PREFIX));
  const toStop = existing.filter((name) => !wanted.has(name));
  if (toStop.length > 0) {
    stopMonitoring(toStop);
    for (const name of toStop) {
      cleanUpAfterActivity(name);
    }
  }

  for (const { session, weekday } of capped) {
    const activityName = scheduledBlockActivityName(session.id, weekday);
    try {
      if (existing.includes(activityName)) {
        stopMonitoring([activityName]);
      }
      ensureBlockActions(activityName);
      await startMonitoring(
        activityName,
        buildSchedule(session, weekday),
        [],
      );
    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.warn(
          `[scheduledAppBlocks] startMonitoring failed for ${activityName}`,
          error,
        );
      }
    }
  }

  await syncScheduledBlockShieldState(sessions);
}
