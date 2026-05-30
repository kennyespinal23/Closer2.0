import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { removeKey, STORAGE_KEYS, usePersistence } from "@/lib/storage";

export type OnboardingAnswers = {
  name: string;
  /** What brings the user to Closer right now — one of the intent options. */
  intent?: string;
  // future steps will extend this shape, e.g.
  // notificationsEnabled?: boolean;
  // dailyReminderTime?: string;
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
