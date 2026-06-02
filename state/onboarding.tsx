import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { removeKey, STORAGE_KEYS, usePersistence } from "@/lib/storage";

/**
 * Time-of-day for the daily "Before The Noise" notification, stored
 * as 24-hour `hour` (0..23) and `minute` (0..59). We persist the
 * structured pair instead of an ISO string so the scheduler can pass
 * it straight to `Notifications.scheduleNotificationAsync`'s
 * `{hour, minute, repeats: true}` trigger without any parsing.
 */
export type DailyReminderTime = {
  hour: number;
  minute: number;
};

export type OnboardingAnswers = {
  name: string;
  /** What brings the user to Closer right now — one of the intent options. */
  intent?: string;
  /**
   * Whether the user accepted the daily "Before The Noise"
   * notification during onboarding (or later in settings).
   *
   *   true   → notification is scheduled
   *   false  → user deliberately turned it off
   *   undefined → not yet decided (pre-prompt state)
   *
   * The tri-state matters so settings can render "Off" vs "Not set
   * yet" differently without inferring it from time presence.
   */
  notificationsEnabled?: boolean;
  /**
   * When the daily notification fires. Defaults to 7:00 AM during
   * onboarding (curated as the early-morning anchor) but the user
   * can pick from a tight set of preset times or any custom time
   * via settings.
   */
  dailyReminderTime?: DailyReminderTime;
  /**
   * When the user wants to sit down with the Bible each day. Set on
   * the /onboarding/study screen and used to seed a "system" study
   * session via StudySessionsProvider.upsertSystemSession. Undefined
   * until the user reaches that step (or skips it).
   *
   * Persisted in onboarding answers (rather than only on the seeded
   * session) so re-running onboarding from a clean state can recover
   * the user's previous pick and pre-fill the picker — and so a
   * future "edit my onboarding answers" surface has something to
   * read from.
   */
  studyTime?: DailyReminderTime;
};

type OnboardingContextValue = {
  answers: OnboardingAnswers;
  setAnswer: <K extends keyof OnboardingAnswers>(
    key: K,
    value: OnboardingAnswers[K],
  ) => void;
  reset: () => void;
  /** True once the persisted answers have loaded (or no save existed). */
  hydrated: boolean;
};

const EMPTY: OnboardingAnswers = {
  name: "",
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [answers, setAnswers] = useState<OnboardingAnswers>(EMPTY);

  // Merge loaded data with defaults so a saved file missing newer
  // fields (e.g. a future `notificationsEnabled`) still hydrates
  // cleanly — the unknown defaults fill in.
  const applyLoaded = useCallback((loaded: OnboardingAnswers) => {
    setAnswers({ ...EMPTY, ...loaded });
  }, []);

  const hydrated = usePersistence(
    STORAGE_KEYS.onboarding,
    answers,
    applyLoaded,
  );

  const reset = useCallback(() => {
    setAnswers(EMPTY);
    // Also clear the persisted record so a "fresh install" feel from
    // the dev shortcut actually IS fresh, not just an in-memory wipe.
    removeKey(STORAGE_KEYS.onboarding);
  }, []);

  const value = useMemo<OnboardingContextValue>(
    () => ({
      answers,
      setAnswer: (key, value) =>
        setAnswers((prev) => ({ ...prev, [key]: value })),
      reset,
      hydrated,
    }),
    [answers, reset, hydrated],
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error("useOnboarding must be used inside <OnboardingProvider>");
  }
  return ctx;
}
