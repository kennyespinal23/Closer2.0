import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  type Moment,
  MOMENTS,
  findMomentByDay,
  localDateISO,
  momentPosition,
  nextMoment,
} from "@/lib/moments";
import { removeKey, STORAGE_KEYS, usePersistence } from "@/lib/storage";

/**
 * Daily moment provider.
 *
 * Owns one piece of persisted state: today's assignment, keyed by
 * the local date.
 *
 *   {
 *     dateISO: "2026-05-31",
 *     day: 1,        // 1-based catalog day
 *   }
 *
 * On the first launch of a new calendar day, the assignment
 * advances to the next moment in the catalog (wrapping at 90 → 1
 * after a full vault cycle). On the same day, the same moment is
 * reused — opening the app at 8am and again at 8pm always shows
 * the same sermon.
 *
 * Why no mood-check-in routing anymore?
 *   Earlier revisions used the user's most recent check-in mood
 *   to route into emotion-specific content pools. The current
 *   vault is a single sequence authored to be read in order, so
 *   the routing collapses to a straight "today is day N → show
 *   sermon N" rule. The check-in feature is still there for
 *   journaling — it just no longer changes the sermon.
 *
 * What this provider does NOT do:
 *   • Schedule notifications. The notification scheduler reads
 *     from this provider but firing logic lives in
 *     `lib/notifications.ts`.
 *   • Record completions. The sermon flow continues to call
 *     `useProgress().recordCompletion(typeId, { title, pastor })`
 *     — the title comes from `useMoments().todaysMoment.title`
 *     and the pastor field carries the moment's `voice`.
 */

// ─────────────────────────────────────────────────────────────────
// Persisted state shape
// ─────────────────────────────────────────────────────────────────

export type MomentsState = {
  /**
   * Last assignment we made, keyed by local date for idempotence.
   * `day` is the 1-based catalog day (1..90); persisting the
   * number rather than an opaque id makes the file readable + makes
   * cross-day advancement a simple `(day % total) + 1`.
   */
  assignment: {
    dateISO: string;
    day: number;
  } | null;
};

const EMPTY: MomentsState = {
  assignment: null,
};

// ─────────────────────────────────────────────────────────────────
// Context surface
// ─────────────────────────────────────────────────────────────────

type MomentsContextValue = {
  /**
   * Today's moment. Stable across re-renders within a day; flips
   * the moment the calendar date rolls over.
   *
   * Never null in normal operation — falls back to `MOMENTS[0]`
   * if the catalog is empty (e.g. asset bundling regression),
   * so consumers can render without null-guarding everywhere.
   */
  todaysMoment: Moment;
  /**
   * Position of `todaysMoment` in the catalog plus the total
   * count, e.g. `{ position: 14, total: 90 }`. Surfaced for the
   * dev "Next Sermon" pill so a content reviewer can see exactly
   * where they are during a walkthrough.
   */
  catalogPosition: { position: number; total: number };
  /**
   * Replace today's assignment with the NEXT moment in the
   * catalog (wrapping at the end). Dev-only — used by the home
   * screen's "Next Sermon" shortcut so a content reviewer can
   * walk through all 90 moments end-to-end without waiting for
   * the daily rollover.
   */
  advanceToNextMoment: () => void;
  /** True once persisted assignment has loaded. */
  hydrated: boolean;
  /** Wipe everything — dev reset + Settings "Delete my data". */
  reset: () => void;
};

const MomentsContext = createContext<MomentsContextValue | null>(null);

// ─────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────

export function MomentsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MomentsState>(EMPTY);

  // Merge loaded payload over defaults so a save from an older
  // version hydrates safely even if we add fields later. Old saves
  // from the pre-v2 schema (with `momentId: string` instead of
  // `day: number`) survive the merge as a no-op and the auto-roll
  // effect below re-rolls into the new shape on next mount.
  const applyLoaded = useCallback((loaded: MomentsState) => {
    const assignment = loaded.assignment;
    // Defensive: only carry forward an assignment whose `day`
    // parses as a real positive integer and matches a catalog
    // entry. Anything else (old string id, missing field, deleted
    // day) gets dropped so the effect picks a fresh moment.
    const validAssignment =
      assignment &&
      typeof assignment.dateISO === "string" &&
      typeof assignment.day === "number" &&
      Number.isInteger(assignment.day) &&
      findMomentByDay(assignment.day)
        ? assignment
        : null;
    setState({ ...EMPTY, assignment: validAssignment });
  }, []);

  const hydrated = usePersistence(
    STORAGE_KEYS.moments,
    state,
    applyLoaded,
  );

  // ─── Compute today's assignment ─────────────────────────────────
  //
  // Runs once hydration completes, and whenever the persisted
  // assignment changes (e.g. dev shortcut). The effect is pure:
  // builds the next state and lets React commit it; persistence
  // hook handles disk writes.
  useEffect(() => {
    if (!hydrated) return;
    if (MOMENTS.length === 0) return;

    const today = localDateISO();
    const existing = state.assignment;

    // Reuse the existing assignment if it's still valid for today.
    if (
      existing &&
      existing.dateISO === today &&
      findMomentByDay(existing.day)
    ) {
      return;
    }

    // Advance: if we had a yesterday-pick, walk forward one day
    // in the catalog. If we had nothing (first launch), start at
    // Day 1.
    const next = nextMoment(existing?.day ?? null);
    setState({
      assignment: { dateISO: today, day: next.day },
    });
    // We read `state.assignment` inside the effect but don't depend
    // on it directly — depending on it would create a feedback
    // loop where each setState re-triggers the assignment compute.
    // The effect is naturally re-triggered by `hydrated` flipping
    // true; the date rollover catches up on the next fresh mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  // ─── Selector: always-resolvable todaysMoment ───────────────────

  const todaysMoment = useMemo<Moment>(() => {
    if (state.assignment) {
      const m = findMomentByDay(state.assignment.day);
      if (m) return m;
    }
    // Hard fallback — the assignment effect hasn't run yet OR the
    // catalog is empty. `MOMENTS[0]` is the safest universal
    // default; an empty catalog would be a content-bundle bug.
    return MOMENTS[0]!;
  }, [state.assignment]);

  const catalogPosition = useMemo(
    () => momentPosition(todaysMoment.day),
    [todaysMoment.day],
  );

  const advanceToNextMoment = useCallback(() => {
    const current = state.assignment?.day ?? todaysMoment.day;
    const next = nextMoment(current);
    setState({
      assignment: { dateISO: localDateISO(), day: next.day },
    });
  }, [state.assignment?.day, todaysMoment.day]);

  const reset = useCallback(() => {
    setState(EMPTY);
    removeKey(STORAGE_KEYS.moments);
  }, []);

  const value = useMemo<MomentsContextValue>(
    () => ({
      todaysMoment,
      catalogPosition,
      advanceToNextMoment,
      hydrated,
      reset,
    }),
    [todaysMoment, catalogPosition, advanceToNextMoment, hydrated, reset],
  );

  return (
    <MomentsContext.Provider value={value}>
      {children}
    </MomentsContext.Provider>
  );
}

export function useMoments(): MomentsContextValue {
  const ctx = useContext(MomentsContext);
  if (!ctx) {
    throw new Error("useMoments must be used inside a <MomentsProvider>.");
  }
  return ctx;
}
