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
 * Daily reading-goal tracker.
 *
 * Closer's reading-goal is measured in MINUTES of in-reader time, not
 * in chapters completed. It's the gentle, Apple-Books-style "spend X
 * minutes near scripture today" rhythm — independent of the
 * sermon-streak system (which lives in state/progress.tsx).
 *
 * Why minutes, not chapters?
 *   • Chapter lengths vary wildly (Psalm 117: 2 verses; Psalm 119: 176)
 *   • Sitting with a few verses for ten quiet minutes is closer to the
 *     posture we want to reward than blasting through five short
 *     chapters in two minutes
 *   • Minutes also map nicely to a passive "we'll just notice you
 *     reading" UX — no extra taps required
 *
 * What this provider owns:
 *   • The daily target (default 10 minutes; user-tunable in settings)
 *   • A per-day ledger of minutes accumulated
 *   • An `addMinutes()` mutator the reader calls on a 1-second tick
 *   • A `goalCrossed` return flag the reader uses to fire the
 *     in-reader celebration toast exactly once per day
 *
 * What it does NOT own:
 *   • Streaks (sermons / engagedDates) — see state/progress.tsx
 *   • Reading-time estimates per chapter — see lib/readingTime.ts
 */

/** ISO date string (local time) — YYYY-MM-DD. */
type DateISO = string;

export type ReadingGoalState = {
  /** Daily target, in minutes. */
  goalMinutes: number;
  /** Per-day ledger: ISO date → minutes accumulated that day. */
  byDate: Readonly<Record<DateISO, number>>;
};

/**
 * Result of an addMinutes() call. Callers (the reader) use this to
 * decide whether to fire the goal-achieved toast — exactly once per
 * day, the moment the user crosses the threshold while reading.
 */
export type AddMinutesResult = {
  /** Total minutes accumulated today AFTER this addition. */
  totalToday: number;
  /** The current daily target (echoed for caller convenience). */
  goalMinutes: number;
  /**
   * True iff THIS call was the one that pushed today's total across
   * the goal. Re-runs on later increments same-day return false so
   * the celebration toast doesn't keep retriggering.
   */
  goalCrossed: boolean;
};

type ReadingGoalContextValue = ReadingGoalState & {
  /** Minutes the user has logged so far today. */
  todayMinutes: number;
  /** Convenience: todayMinutes >= goalMinutes. */
  reachedToday: boolean;
  /**
   * Add some fractional minutes to today's ledger. Returns the new
   * total + whether this call crossed the goal threshold.
   *
   * Designed to be safe to call at ~1Hz from the reader — passing
   * `1/60` once per second yields one tracked minute per minute on
   * the wall clock. Negative or NaN values are coerced to 0.
   */
  addMinutes: (delta: number) => AddMinutesResult;
  /** Replace the daily goal. Clamped to a sensible 1–120 min window. */
  setGoalMinutes: (n: number) => void;
  reset: () => void;
  /** True once persisted state has loaded (or no save existed). */
  hydrated: boolean;
};

/** Sensible defaults. 10 min is the Apple-Books default for a reason. */
const DEFAULT: ReadingGoalState = {
  goalMinutes: 10,
  byDate: {},
};

/** Min/max guardrails on the goal-picker. */
export const MIN_GOAL_MINUTES = 1;
export const MAX_GOAL_MINUTES = 120;

const ReadingGoalContext = createContext<ReadingGoalContextValue | null>(null);

export function ReadingGoalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ReadingGoalState>(DEFAULT);

  // Merge loaded payload over defaults so a save from an older
  // version (e.g. before this provider existed) hydrates safely.
  const applyLoaded = useCallback((loaded: ReadingGoalState) => {
    setState({
      goalMinutes: clampGoal(loaded.goalMinutes ?? DEFAULT.goalMinutes),
      byDate: loaded.byDate ?? {},
    });
  }, []);

  const hydrated = usePersistence(
    STORAGE_KEYS.readingGoal,
    state,
    applyLoaded,
  );

  const addMinutes = useCallback<ReadingGoalContextValue["addMinutes"]>(
    (delta) => {
      // Coerce defensively — the reader is the only caller today but
      // we don't want a stray NaN to corrupt the ledger.
      const safeDelta = Number.isFinite(delta) && delta > 0 ? delta : 0;
      const today = todayISO();

      // Compute the result against the CURRENT state synchronously so
      // the caller gets back accurate "did we just cross?" info even
      // before React commits the setState below.
      const prevToday = state.byDate[today] ?? 0;
      const nextToday = prevToday + safeDelta;
      const goalCrossed =
        prevToday < state.goalMinutes && nextToday >= state.goalMinutes;

      // Skip the state update for sub-millisecond increments that
      // happen before hydration — avoids overwriting the saved value
      // with a default ledger on the first tick.
      if (safeDelta === 0) {
        return {
          totalToday: prevToday,
          goalMinutes: state.goalMinutes,
          goalCrossed: false,
        };
      }

      setState((s) => {
        const sToday = s.byDate[today] ?? 0;
        return {
          ...s,
          byDate: { ...s.byDate, [today]: sToday + safeDelta },
        };
      });

      return {
        totalToday: nextToday,
        goalMinutes: state.goalMinutes,
        goalCrossed,
      };
    },
    [state.byDate, state.goalMinutes],
  );

  const setGoalMinutes = useCallback((n: number) => {
    setState((s) => ({ ...s, goalMinutes: clampGoal(n) }));
  }, []);

  const reset = useCallback(() => {
    setState(DEFAULT);
    removeKey(STORAGE_KEYS.readingGoal);
  }, []);

  const todayMinutes = useMemo(
    () => state.byDate[todayISO()] ?? 0,
    [state.byDate],
  );
  const reachedToday = todayMinutes >= state.goalMinutes;

  const value = useMemo<ReadingGoalContextValue>(
    () => ({
      ...state,
      todayMinutes,
      reachedToday,
      addMinutes,
      setGoalMinutes,
      reset,
      hydrated,
    }),
    [
      state,
      todayMinutes,
      reachedToday,
      addMinutes,
      setGoalMinutes,
      reset,
      hydrated,
    ],
  );

  return (
    <ReadingGoalContext.Provider value={value}>
      {children}
    </ReadingGoalContext.Provider>
  );
}

export function useReadingGoal(): ReadingGoalContextValue {
  const ctx = useContext(ReadingGoalContext);
  if (!ctx) {
    throw new Error(
      "useReadingGoal must be used inside <ReadingGoalProvider>",
    );
  }
  return ctx;
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function clampGoal(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT.goalMinutes;
  return Math.max(MIN_GOAL_MINUTES, Math.min(MAX_GOAL_MINUTES, Math.round(n)));
}

function todayISO(): string {
  // Local-time ISO so a late-night reader sees their minutes counted
  // against the right day. Mirrors progress.tsx's todayISO().
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
