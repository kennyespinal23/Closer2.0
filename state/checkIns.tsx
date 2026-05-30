import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { MoodId, MoodVerse } from "@/constants/moods";
import { verseKey as moodVerseKey } from "@/constants/moods";
import { removeKey, STORAGE_KEYS, usePersistence } from "@/lib/storage";

/**
 * Daily check-in store.
 *
 * Tracks every mood the user has logged + the verse the app
 * delivered in response. Lightweight: a single ordered list, oldest
 * first. The journey timeline + insights tab both read off this list.
 *
 * Why an array instead of a per-day map: a user can check in
 * multiple times in a single day (e.g., morning + evening) and we
 * want to preserve all of them. The array also makes the "most
 * recent N verses" query (used to avoid repeats) trivial.
 *
 * Persistence: piggybacks on the same usePersistence hook every
 * other provider uses, keyed by `STORAGE_KEYS.checkIns`.
 */

export type CheckIn = {
  /** Stable id for React lists + journey rows. */
  id: string;
  /** Which mood the user picked. */
  moodId: MoodId;
  /** Verse delivered in response (full snapshot — see verseSnippet). */
  verse: MoodVerse;
  /** Epoch ms when the check-in completed. */
  createdAt: number;
  /** YYYY-MM-DD bucket for the journey timeline. */
  dateISO: string;
  /**
   * Optional journal entry the user wrote after receiving the
   * verse. Captured separately from notes (which are tied to
   * specific verses across the whole bible) — this is reflection
   * tied to a moment in time + a feeling.
   */
  journalText?: string;
  /** Epoch ms of the last journal edit. */
  journalUpdatedAt?: number;
};

export type CheckInsState = {
  /** Oldest first. */
  log: ReadonlyArray<CheckIn>;
};

type CheckInsContextValue = CheckInsState & {
  /**
   * Append a new check-in to the log. Returns the created entry
   * (with id + timestamps populated) so the delivery screen can
   * navigate using its id if needed.
   */
  record: (input: { moodId: MoodId; verse: MoodVerse }) => CheckIn;
  /**
   * Attach or update the journal entry on an existing check-in.
   * Passing an empty (or whitespace-only) string clears the entry
   * entirely — readers should treat `undefined` and "" the same.
   */
  updateJournal: (checkInId: string, text: string) => void;
  /**
   * Remove a single check-in from the log (used by the detail page
   * when the user explicitly deletes one). No-op if the id can't
   * be found.
   */
  remove: (checkInId: string) => void;
  /** Convenience lookup by id — undefined if it's no longer in the log. */
  findById: (checkInId: string) => CheckIn | undefined;
  /**
   * Last N verse keys delivered, newest first. Used by the mood
   * selector to bias the verse pick toward fresher scripture (the
   * `pickVerseForMood` helper takes this as input).
   */
  recentVerseKeys: (n: number) => string[];
  /** Wipe everything (dev reset + Settings "Delete my data"). */
  reset: () => void;
  /** True once persisted check-ins have loaded (or no save existed). */
  hydrated: boolean;
};

const EMPTY: CheckInsState = {
  log: [],
};

const CheckInsContext = createContext<CheckInsContextValue | null>(null);

export function CheckInsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CheckInsState>(EMPTY);

  // Merge loaded payload over defaults so a save from an older
  // version hydrates safely even if we add new fields later.
  const applyLoaded = useCallback((loaded: CheckInsState) => {
    setState({ ...EMPTY, ...loaded });
  }, []);

  const hydrated = usePersistence(
    STORAGE_KEYS.checkIns,
    state,
    applyLoaded,
  );

  const record = useCallback(
    (input: { moodId: MoodId; verse: MoodVerse }): CheckIn => {
      const now = Date.now();
      const entry: CheckIn = {
        id: makeCheckInId(),
        moodId: input.moodId,
        verse: input.verse,
        createdAt: now,
        dateISO: todayISO(),
      };
      setState((prev) => ({ log: [...prev.log, entry] }));
      return entry;
    },
    [],
  );

  const updateJournal = useCallback(
    (checkInId: string, text: string) => {
      const trimmed = text.trim();
      setState((prev) => ({
        log: prev.log.map((c) => {
          if (c.id !== checkInId) return c;
          // Empty string ⇒ strip the field entirely so the JSON
          // payload doesn't bloat with empty values over time.
          if (trimmed.length === 0) {
            const { journalText, journalUpdatedAt, ...rest } = c;
            // Reference both destructured fields so the linter
            // doesn't flag them as unused.
            void journalText;
            void journalUpdatedAt;
            return rest;
          }
          return {
            ...c,
            journalText: trimmed,
            journalUpdatedAt: Date.now(),
          };
        }),
      }));
    },
    [],
  );

  const remove = useCallback((checkInId: string) => {
    setState((prev) => ({
      log: prev.log.filter((c) => c.id !== checkInId),
    }));
  }, []);

  const findById = useCallback(
    (checkInId: string): CheckIn | undefined => {
      return state.log.find((c) => c.id === checkInId);
    },
    [state.log],
  );

  const recentVerseKeys = useCallback(
    (n: number) => {
      // Walk the log backwards so we get newest first.
      const out: string[] = [];
      for (let i = state.log.length - 1; i >= 0 && out.length < n; i--) {
        out.push(moodVerseKey(state.log[i]!.verse));
      }
      return out;
    },
    [state.log],
  );

  const reset = useCallback(() => {
    setState(EMPTY);
    removeKey(STORAGE_KEYS.checkIns);
  }, []);

  const value = useMemo<CheckInsContextValue>(
    () => ({
      ...state,
      record,
      updateJournal,
      remove,
      findById,
      recentVerseKeys,
      reset,
      hydrated,
    }),
    [
      state,
      record,
      updateJournal,
      remove,
      findById,
      recentVerseKeys,
      reset,
      hydrated,
    ],
  );

  return (
    <CheckInsContext.Provider value={value}>
      {children}
    </CheckInsContext.Provider>
  );
}

export function useCheckIns(): CheckInsContextValue {
  const ctx = useContext(CheckInsContext);
  if (!ctx) {
    throw new Error("useCheckIns must be used inside a <CheckInsProvider>.");
  }
  return ctx;
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function makeCheckInId(): string {
  return `ci_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function todayISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
