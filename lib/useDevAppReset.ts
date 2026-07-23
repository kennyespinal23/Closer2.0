import { useCallback } from "react";
import { useRouter } from "expo-router";
import { cancelDailyReminder } from "@/lib/notifications";
import { useAnnotations } from "@/state/annotations";
import { useCheckIns } from "@/state/checkIns";
import { useFocus } from "@/state/focus";
import { useMoments } from "@/state/moments";
import { useOnboarding } from "@/state/onboarding";
import { usePreferences } from "@/state/preferences";
import { useProgress } from "@/state/progress";
import { useReadingGoal } from "@/state/readingGoal";
import { useStudySessions } from "@/state/studySessions";

/**
 * Full app wipe used by internal QA shortcuts (Profile → Developer).
 * Clears every persistence-backed provider + on-disk AsyncStorage
 * entry, cancels OS-level reminders, then routes to a fresh entry.
 */
export function useDevAppReset() {
  const router = useRouter();
  const { reset: resetOnboarding } = useOnboarding();
  const { reset: resetPreferences } = usePreferences();
  const { reset: resetAnnotations } = useAnnotations();
  const { reset: resetCheckIns } = useCheckIns();
  const { reset: resetReadingGoal } = useReadingGoal();
  const { reset: resetMoments } = useMoments();
  const progress = useProgress();
  const { reset: resetFocus } = useFocus();
  const { reset: resetStudySessions } = useStudySessions();

  const wipeAllState = useCallback(() => {
    resetOnboarding();
    progress.reset();
    resetAnnotations();
    resetPreferences();
    resetCheckIns();
    resetReadingGoal();
    resetMoments();
    resetFocus();
    resetStudySessions().catch(() => {});
    cancelDailyReminder().catch(() => {});
  }, [
    resetOnboarding,
    progress,
    resetAnnotations,
    resetPreferences,
    resetCheckIns,
    resetReadingGoal,
    resetMoments,
    resetFocus,
    resetStudySessions,
  ]);

  const resetApp = useCallback(() => {
    wipeAllState();
    router.replace("/");
  }, [router, wipeAllState]);

  const restartApp = useCallback(() => {
    wipeAllState();
    router.replace("/onboarding/attribution");
  }, [router, wipeAllState]);

  return { resetApp, restartApp };
}
