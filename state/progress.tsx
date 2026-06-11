import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { MILESTONE_DAYS } from "@/lib/journey";
import { removeKey, STORAGE_KEYS, usePersistence } from "@/lib/storage";

/**
 * In-memory progression store.
 *
 * Tracks two threads of engagement:
 *   1. Sermons completed (per type + total)
 *   2. Chapters read (deduplicated by book+chapter)
 *
 * Only sermon completions feed `engagedDates` — the source of truth
 * for streaks. Chapter reads are tracked separately for the reader's
 * own UI (Continue Reading, auto-mark logic, Library) but they do
 * NOT count toward the streak. The streak is intentionally tied to
 * the sermon as the daily anchor.
 *
 * Streak philosophy (deliberate, see help.tsx FAQ):
 *   • Encouraging, never shaming
 *   • A missed day breaks the streak — no automatic freezes for now
 *   • Longest streak is preserved so even after a break the user has
 *     something to be proud of
 *
 * State lives in React context and resets when the app is killed.
 * When AsyncStorage / a backend is wired, only this file changes;
 * every consumer keeps the same hook surface.
 */

export type ChapterRead = {
  bookId: string;
  chapter: number;
  /** ISO date (YYYY-MM-DD) when this chapter was marked read. */
  dateISO: string;
  /** Epoch ms — for finer-grained timeline ordering within a day. */
  completedAt: number;
};

/**
 * A single sermon-completion event. Captured at "Amen" tap on the
 * closing prayer screen. Carries enough detail that the Journey
 * timeline can render a meaningful card without re-fetching anything.
 */
export type SermonCompletion = {
  /** Stable id so React lists + tap targets have a unique key. */
  id: string;
  typeId: string;
  /** Sermon title at the time of completion (e.g. "Be Still"). */
  title: string;
  /** Pastor at the time of completion. */
  pastor: string;
  /** Epoch ms — drives within-day ordering on the timeline. */
  completedAt: number;
  /** ISO date (YYYY-MM-DD) for day-bucket grouping. */
  dateISO: string;
  /**
   * 1-based catalog `day` that was completed (the `day` field on the
   * Moment we recorded against). Persisted so the home card can ask
   * "did the user finish THIS specific moment today?" rather than
   * "did the user finish ANY moment today?" — without that
   * distinction, the dev "Next Sermon" pill would leave the card
   * stuck in its "Read again" state for the newly-shown moment
   * because the date-only check would still match.
   *
   * Nullable for forward-compat with completions persisted before
   * this field existed: legacy records hydrate without it, and the
   * `hasCompletedSermonForDay(day)` selector treats them as "we
   * don't know what was completed" → returns false for the lookup,
   * which self-heals the moment the user finishes a fresh sermon.
   */
  day: number | null;
};

/**
 * The most recently visited chapter — regardless of whether it was
 * marked as read. Drives the "Continue reading" entry point on the
 * home screen so the user can pick up exactly where they left off.
 */
export type LastVisited = {
  bookId: string;
  chapter: number;
  /** Epoch millis. */
  visitedAt: number;
};

export type ProgressState = {
  /** Map of sermonType.id -> completion count. */
  completionsByType: Readonly<Record<string, number>>;
  /** Total sermons completed, across all types. */
  totalCompletions: number;
  /** ISO date of the most recent sermon completion. */
  lastCompletionDateISO: string | null;

  /** Every chapter the user has marked as read, in the order it happened. */
  chaptersRead: ReadonlyArray<ChapterRead>;

  /** Every sermon completion, in the order it happened (oldest first). */
  sermonCompletions: ReadonlyArray<SermonCompletion>;

  /**
   * Sorted, unique list of ISO dates the user finished a sermon on.
   * The single source of truth for streaks and the weekly journey
   * dots. Tied specifically to sermons (not chapter reads) so the
   * streak rewards the daily anchor behavior the app is built around.
   */
  engagedDates: ReadonlyArray<string>;

  /** Last chapter the user opened in the reader (may or may not be read). */
  lastVisited: LastVisited | null;
};

export type RecordResult = {
  /** New count for this sermon type. */
  typeCount: number;
  /** New total across all types. */
  totalCount: number;
  /** True iff this was the user's first completion ever, of any type. */
  isFirstEver: boolean;
  /** True iff this was the user's first completion of this type. */
  isFirstOfType: boolean;
  /** Current streak length AFTER this completion is applied. */
  newStreak: number;
  /**
   * True iff this completion actually bumped the streak — i.e. the
   * first sermon completion of the day. Re-completions on a day the
   * user already finished a sermon ("Read again" same-day) return
   * false. The sermon flow uses this to decide whether to route
   * into the streak update screen.
   */
  streakAdvanced: boolean;
  /**
   * If this completion pushed the streak across a milestone
   * threshold (3, 7, 14, …), the threshold value. Otherwise null.
   * Used by the streak screen to render an extra "X-day milestone"
   * badge over the normal streak fire layout.
   */
  crossedMilestone: number | null;
};

/**
 * Extra detail the sermon flow passes in when it records a
 * completion. Required when present, but defaulted on the read
 * side so the older zero-arg style still compiles (we just lose
 * the rich title/pastor on the timeline for legacy callers).
 *
 * `day` is the 1-based catalog day the sermon was authored as. It
 * gets stamped onto the persisted SermonCompletion so the home
 * card can ask "did the user finish THIS specific day?" instead
 * of just "did the user finish anything today?" — see the
 * `hasCompletedSermonForDay` selector below for the bug this
 * field fixes.
 */
export type SermonCompletionDetails = {
  title: string;
  pastor: string;
  day: number;
};

type ProgressContextValue = ProgressState & {
  recordCompletion: (
    typeId: string,
    details?: SermonCompletionDetails,
  ) => RecordResult;
  recordChapterRead: (bookId: string, chapter: number) => void;
  /** True iff (bookId, chapter) has been marked read at any point. */
  hasReadChapter: (bookId: string, chapter: number) => boolean;
  /**
   * Mark a chapter as "currently being read" — called by the reader
   * on mount so we can surface a "Continue reading" entry on the home
   * screen. Cheap: only updates state if the chapter actually
   * changed.
   */
  recordChapterVisit: (bookId: string, chapter: number) => void;
  /**
   * True iff the user has completed a sermon on ANY day today. Kept
   * for the streak / engagement signals that don't care which moment
   * was finished (e.g. ActiveFocusHero's "apps unlocked because the
   * user did their daily reading" gate — the daily anchor is
   * fulfilled regardless of whether the dev tool advanced to a
   * different catalog moment).
   *
   * For the home sermon card use `hasCompletedSermonForDay(day)`
   * instead — that question needs to be moment-specific so the dev
   * "Next Sermon" pill doesn't leave the new moment stuck reading
   * as "Read again" when the user hasn't actually heard it.
   */
  hasCompletedSermonToday: boolean;
  /**
   * Did the user complete the sermon for catalog `day` today?
   *
   * Filters today's completions and looks for a `day === day` match.
   * Returns `false` for legacy completions that hydrate without a
   * `day` field — the home card just shows the pre-completion CTA
   * until the user finishes a fresh sermon, which self-heals.
   *
   * This is the function the home sermon card should consult when
   * picking between Begin / Read Again. The bare
   * `hasCompletedSermonToday` is too coarse for that decision
   * because it goes true the moment ANY sermon is finished today
   * — including ones that were swapped in by the dev shortcut
   * AFTER the user finished a different moment earlier.
   */
  hasCompletedSermonForDay: (day: number) => boolean;
  /** Derived streak info — recomputed on every state change. */
  streak: StreakInfo;
  reset: () => void;
  /** True once persisted progress has loaded (or no save existed). */
  hydrated: boolean;
};

export type StreakInfo = {
  /** Consecutive days ending in today or yesterday. 0 if broken. */
  current: number;
  /** Best streak the user has ever had. */
  longest: number;
  /**
   * The last 7 days as booleans (oldest first). Used by the home
   * screen's "Your Journey" card to render the weekly dot row.
   */
  lastSevenDays: ReadonlyArray<{ dateISO: string; engaged: boolean }>;
  /**
   * Whether today's date is in the engagedDates list — equivalent
   * to "the user finished today's sermon".
   */
  honoredToday: boolean;
};

const EMPTY: ProgressState = {
  completionsByType: {},
  totalCompletions: 0,
  lastCompletionDateISO: null,
  chaptersRead: [],
  sermonCompletions: [],
  engagedDates: [],
  lastVisited: null,
};

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProgressState>(EMPTY);

  // Merge loaded payload over defaults so a save from an older
  // version (missing fields like `lastVisited`) hydrates safely.
  // Arrays/objects from the save replace the empty defaults
  // wholesale.
  const applyLoaded = useCallback((loaded: ProgressState) => {
    setState({ ...EMPTY, ...loaded });
  }, []);

  const hydrated = usePersistence(
    STORAGE_KEYS.progress,
    state,
    applyLoaded,
  );

  /**
   * Add today's date to the engaged set if it isn't already there.
   * Idempotent — calling it twice in a day is a no-op.
   */
  const withTodayEngaged = useCallback(
    (prev: ReadonlyArray<string>): ReadonlyArray<string> => {
      const today = todayISO();
      if (prev.includes(today)) return prev;
      // Sorted insert keeps engagedDates ascending so the streak
      // calculation can rely on the order without re-sorting.
      return [...prev, today].sort();
    },
    [],
  );

  const recordCompletion = useCallback(
    (typeId: string, details?: SermonCompletionDetails): RecordResult => {
      const prevTypeCount = state.completionsByType[typeId] ?? 0;
      const newTypeCount = prevTypeCount + 1;
      const newTotalCount = state.totalCompletions + 1;
      const isFirstEver = state.totalCompletions === 0;
      const isFirstOfType = prevTypeCount === 0;

      // Log the discrete completion event so the Journey timeline
      // can show "you finished [sermon] at [time]". Falls back to
      // empty strings for legacy callers that don't pass details.
      // `day` falls back to null for callers that haven't been
      // updated to pass it — the day-specific selector treats
      // null-day records as "unknown" so the home card simply
      // shows Begin until a fresh completion lands.
      const now = Date.now();
      const completion: SermonCompletion = {
        id: makeEventId("sermon"),
        typeId,
        title: details?.title ?? "",
        pastor: details?.pastor ?? "",
        completedAt: now,
        dateISO: todayISO(),
        day: details?.day ?? null,
      };

      // Compute streak BEFORE and AFTER this completion so callers
      // can tell (a) whether the streak actually advanced (first
      // completion of the day) and (b) whether it crossed a
      // milestone threshold. If today was already engaged (e.g.
      // "Read again" same-day), prev and new are equal — no
      // advance, no milestone.
      const wasEngagedToday = state.engagedDates.includes(todayISO());
      const prevStreak = computeStreak(state.engagedDates).current;
      const newEngagedDates = withTodayEngaged(state.engagedDates);
      const newStreak = computeStreak(newEngagedDates).current;
      const streakAdvanced = !wasEngagedToday;
      const crossedMilestone =
        MILESTONE_DAYS.find(
          (threshold) => prevStreak < threshold && newStreak >= threshold,
        ) ?? null;

      setState({
        ...state,
        completionsByType: {
          ...state.completionsByType,
          [typeId]: newTypeCount,
        },
        totalCompletions: newTotalCount,
        lastCompletionDateISO: todayISO(),
        sermonCompletions: [...state.sermonCompletions, completion],
        engagedDates: newEngagedDates,
      });

      return {
        typeCount: newTypeCount,
        totalCount: newTotalCount,
        isFirstEver,
        isFirstOfType,
        newStreak,
        streakAdvanced,
        crossedMilestone,
      };
    },
    [state, withTodayEngaged],
  );

  const recordChapterRead = useCallback(
    (bookId: string, chapter: number) => {
      // Idempotent on (bookId, chapter): re-marking a chapter never
      // duplicates the entry. Intentionally does NOT touch
      // engagedDates — streaks are tied to the daily sermon, not to
      // chapter reads (see file-level doc).
      const alreadyRead = state.chaptersRead.some(
        (c) => c.bookId === bookId && c.chapter === chapter,
      );
      if (alreadyRead) return;
      setState({
        ...state,
        chaptersRead: [
          ...state.chaptersRead,
          {
            bookId,
            chapter,
            dateISO: todayISO(),
            completedAt: Date.now(),
          },
        ],
      });
    },
    [state],
  );

  const hasReadChapter = useCallback(
    (bookId: string, chapter: number) =>
      state.chaptersRead.some(
        (c) => c.bookId === bookId && c.chapter === chapter,
      ),
    [state.chaptersRead],
  );

  const recordChapterVisit = useCallback(
    (bookId: string, chapter: number) => {
      setState((s) => {
        // Avoid a redundant re-render when the user re-opens the same
        // chapter within a few seconds — checking value equality is
        // cheaper than letting React diff a fresh object reference.
        const current = s.lastVisited;
        if (
          current &&
          current.bookId === bookId &&
          current.chapter === chapter
        ) {
          return s;
        }
        return {
          ...s,
          lastVisited: { bookId, chapter, visitedAt: Date.now() },
        };
      });
    },
    [],
  );

  const reset = useCallback(() => {
    setState(EMPTY);
    removeKey(STORAGE_KEYS.progress);
  }, []);

  const streak = useMemo<StreakInfo>(
    () => computeStreak(state.engagedDates),
    [state.engagedDates],
  );

  // Has the user completed A sermon today (any catalog day)? Used
  // by surfaces that only care about the daily-engagement signal —
  // e.g. the focus-hero's "apps unlocked because you did your
  // reading today" gate. Cheap date compare against the most
  // recent completion.
  const hasCompletedSermonToday = useMemo(
    () => state.lastCompletionDateISO === todayISO(),
    [state.lastCompletionDateISO],
  );

  // Has the user completed the sermon for THIS catalog day today?
  // The home sermon card asks this so the dev "Next Sermon" pill
  // can advance the moment without leaving the card stuck reading
  // as "Read Again" for a moment the user hasn't actually heard.
  //
  // We walk today's completions (typically 1 entry, very rarely
  // more) and check for a matching `day`. Legacy completions that
  // hydrate with `day: null` never match — the card shows Begin
  // and self-heals on the next completion.
  const hasCompletedSermonForDay = useCallback(
    (day: number): boolean => {
      const today = todayISO();
      for (const c of state.sermonCompletions) {
        if (c.dateISO === today && c.day === day) return true;
      }
      return false;
    },
    [state.sermonCompletions],
  );

  const value = useMemo<ProgressContextValue>(
    () => ({
      ...state,
      recordCompletion,
      recordChapterRead,
      hasReadChapter,
      recordChapterVisit,
      hasCompletedSermonToday,
      hasCompletedSermonForDay,
      streak,
      reset,
      hydrated,
    }),
    [
      state,
      recordCompletion,
      recordChapterRead,
      hasReadChapter,
      recordChapterVisit,
      hasCompletedSermonToday,
      hasCompletedSermonForDay,
      streak,
      reset,
      hydrated,
    ],
  );

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) {
    throw new Error("useProgress must be used inside <ProgressProvider>");
  }
  return ctx;
}

// ─────────────────────────────────────────────────────────────────
// Streak derivation
// ─────────────────────────────────────────────────────────────────

/**
 * Compute streak info from a sorted, deduplicated list of engaged
 * ISO dates. Pure function — testable in isolation, no Date side
 * effects beyond reading `todayISO()`.
 *
 *   current      — consecutive days ending in today OR yesterday.
 *                  0 if the user didn't engage in either.
 *   longest      — longest consecutive run in history.
 *   lastSevenDays — calendar window for the weekly journey card.
 *   honoredToday  — convenience flag for the UI.
 */
export function computeStreak(
  engagedDates: ReadonlyArray<string>,
): StreakInfo {
  const today = todayISO();
  const yesterday = addDays(today, -1);
  const dateSet = new Set(engagedDates);

  // Longest streak — walk through the sorted dates and count runs.
  let longest = 0;
  let runLen = 0;
  let prevDate: string | null = null;
  for (const d of engagedDates) {
    if (prevDate && isNextDay(prevDate, d)) {
      runLen++;
    } else {
      runLen = 1;
    }
    if (runLen > longest) longest = runLen;
    prevDate = d;
  }

  // Current streak — must "land" on today or yesterday to be alive.
  let current = 0;
  let cursor: string | null = null;
  if (dateSet.has(today)) cursor = today;
  else if (dateSet.has(yesterday)) cursor = yesterday;

  if (cursor) {
    current = 1;
    let walker = addDays(cursor, -1);
    while (dateSet.has(walker)) {
      current++;
      walker = addDays(walker, -1);
    }
  }

  // Last seven days for the weekly dot row.
  const lastSevenDays = Array.from({ length: 7 }, (_, i) => {
    // i=0 is six days ago, i=6 is today
    const dateISO = addDays(today, i - 6);
    return { dateISO, engaged: dateSet.has(dateISO) };
  });

  return {
    current,
    longest,
    lastSevenDays,
    honoredToday: dateSet.has(today),
  };
}

// ─────────────────────────────────────────────────────────────────
// Copy helpers
// ─────────────────────────────────────────────────────────────────

/**
 * Returns whether the user has completed a SERMON today (as opposed
 * to having engaged in any way). Kept for backward compatibility
 * with the few call sites that specifically want the sermon flag.
 *
 * Prefer `useProgress().streak.honoredToday` for the broader notion
 * of "engaged today" used by the streak system.
 */
export function didCompleteToday(
  state: Pick<ProgressState, "lastCompletionDateISO">,
): boolean {
  return state.lastCompletionDateISO === todayISO();
}

/**
 * Copy-friendly ordinal phrase for a completion count.
 *   1 → "first"      (spelled out — discovery moment)
 *   2 → "2nd" / 3 → "3rd" / 4 → "4th" / ...
 *
 * The first time deserves words. Everything after is rhythm — and
 * rhythm reads better as digits.
 */
export function completionOrdinal(n: number): string {
  if (n === 1) return "first";
  return numericOrdinal(n);
}

function numericOrdinal(n: number): string {
  const lastTwo = Math.abs(n) % 100;
  if (lastTwo >= 11 && lastTwo <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

// ─────────────────────────────────────────────────────────────────
// Event id minting
// ─────────────────────────────────────────────────────────────────

/**
 * Cheap unique id for events (sermon completions, future event
 * types). Time + random suffix is plenty for per-device storage.
 * Pattern matches makeNoteId in annotations.tsx so future tooling
 * can recognize event ids by prefix.
 */
function makeEventId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

// ─────────────────────────────────────────────────────────────────
// Date utilities — local-timezone ISO strings (YYYY-MM-DD)
// ─────────────────────────────────────────────────────────────────

export function todayISO(): string {
  return toISO(new Date());
}

function toISO(d: Date): string {
  // Local time so a user finishing at 11:50pm sees it counted against
  // today, not pushed to tomorrow by UTC.
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function fromISO(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function addDays(iso: string, delta: number): string {
  const d = fromISO(iso);
  d.setDate(d.getDate() + delta);
  return toISO(d);
}

function isNextDay(prev: string, next: string): boolean {
  return addDays(prev, 1) === next;
}
