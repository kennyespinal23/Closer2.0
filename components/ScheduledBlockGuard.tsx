import { useCallback, useEffect } from "react";
import { AppState } from "react-native";
import { onDeviceActivityMonitorEvent } from "react-native-device-activity";
import { syncScheduledBlockShieldState } from "@/lib/scheduledAppBlocks";
import { useFocus } from "@/state/focus";
import { useProgress } from "@/state/progress";
import { useStudySessions } from "@/state/studySessions";

/**
 * Keeps the OS shield in sync with recurring block times.
 *
 * iOS DeviceActivity monitors (background extension) are unreliable —
 * they often miss `intervalDidStart` when the app is killed or in low
 * power mode. This guard runs in the main app and:
 *   • applies the shield the moment a block window opens
 *   • removes it when the window closes (unless a focus session is live)
 *   • re-checks on foreground + every 30s while the app is open
 *   • listens for extension callbacks when they do fire
 */
export function ScheduledBlockGuard() {
  const { sessions } = useStudySessions();
  const { session: focusSession } = useFocus();
  const { hasCompletedSermonToday } = useProgress();

  const reconcile = useCallback(() => {
    void syncScheduledBlockShieldState(sessions, {
      focusSessionActive: focusSession !== null,
      sermonUnlockSatisfied: hasCompletedSermonToday,
    });
  }, [sessions, focusSession, hasCompletedSermonToday]);

  useEffect(() => {
    reconcile();
  }, [reconcile]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") reconcile();
    });
    return () => sub.remove();
  }, [reconcile]);

  useEffect(() => {
    const id = setInterval(reconcile, 30_000);
    return () => clearInterval(id);
  }, [reconcile]);

  useEffect(() => {
    const sub = onDeviceActivityMonitorEvent((event) => {
      if (
        event.callbackName === "intervalDidStart" ||
        event.callbackName === "intervalDidEnd"
      ) {
        reconcile();
      }
    });
    return () => sub.remove();
  }, [reconcile]);

  return null;
}
