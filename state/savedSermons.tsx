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
 * Saved sermons (bookmarks for the sermon vault).
 *
 * The user can tap "Save sermon" on the celebration screen at
 * the end of a sermon flow. Each saved entry is the catalog
 * `day` (1..90) of the moment they kept — that's the stable id
 * the moments catalog uses (see `lib/moments.ts`). Storing the
 * day instead of an opaque id means a fresh install reading the
 * same catalog still resolves the same sermon back.
 *
 * Persistence + shape mirrors `state/savedInsights.tsx` for
 * familiarity:
 *   • on-disk payload is an array of day numbers in save order
 *   • derived Set in memory for O(1) `isSaved` checks
 *   • UI consumes `saved` (most-recent-first) for rendering
 *
 * What this provider does NOT own:
 *   • The sermon CONTENT (in `assets/data/sermons.js`, exposed
 *     via `lib/moments.ts` / `state/moments.tsx`). This file is
 *     purely the user's bookmark list.
 *   • Read-progress for an individual saved sermon. If we ever
 *     want "you re-read this on May 3" timestamps, they live in
 *     their own provider.
 */

type SavedState = {
  /** Catalog day numbers (1..90), oldest → newest. */
  days: ReadonlyArray<number>;
};

type SavedSermonsContextValue = {
  /** Most-recent-first list — the order to render in the UI. */
  saved: ReadonlyArray<number>;
  /** O(1) membership test — used by the celebration toggle. */
  isSaved: (day: number) => boolean;
  /** Toggle saved/unsaved. Returns the new saved state for the day. */
  toggle: (day: number) => boolean;
  /** Idempotent — adds the day if not already present. */
  save: (day: number) => void;
  /** Idempotent — removes the day if present. */
  unsave: (day: number) => void;
  /** How many sermons the user has saved. */
  count: number;
  reset: () => void;
  /** True once persisted state has loaded (or no save existed). */
  hydrated: boolean;
};

const DEFAULT: SavedState = { days: [] };

const SavedSermonsContext =
  createContext<SavedSermonsContextValue | null>(null);

export function SavedSermonsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SavedState>(DEFAULT);

  // Defensive merge — `days` might be missing on a future
  // migration, and an older save shouldn't crash hydration.
  // We also coerce to numbers + filter out junk in case the
  // on-disk payload is corrupted (truncated AsyncStorage
  // write, etc.).
  const applyLoaded = useCallback((loaded: SavedState) => {
    const incoming = Array.isArray(loaded.days) ? loaded.days : [];
    const cleaned = incoming
      .map((n) => Number(n))
      .filter((n) => Number.isFinite(n) && n > 0);
    setState({ days: cleaned });
  }, []);

  const hydrated = usePersistence(
    STORAGE_KEYS.savedSermons,
    state,
    applyLoaded,
  );

  // Derived Set for the common case — "is THIS day already
  // bookmarked?" — called once per visible card on the Library
  // grid and once per render of the celebration toggle.
  const savedSet = useMemo(() => new Set(state.days), [state.days]);

  const isSaved = useCallback(
    (day: number) => savedSet.has(day),
    [savedSet],
  );

  const save = useCallback((day: number) => {
    setState((s) => {
      if (s.days.includes(day)) return s;
      return { days: [...s.days, day] };
    });
  }, []);

  const unsave = useCallback((day: number) => {
    setState((s) => {
      if (!s.days.includes(day)) return s;
      return { days: s.days.filter((d) => d !== day) };
    });
  }, []);

  const toggle = useCallback<SavedSermonsContextValue["toggle"]>((day) => {
    let nowSaved = false;
    setState((s) => {
      if (s.days.includes(day)) {
        nowSaved = false;
        return { days: s.days.filter((d) => d !== day) };
      }
      nowSaved = true;
      return { days: [...s.days, day] };
    });
    return nowSaved;
  }, []);

  const reset = useCallback(() => {
    setState(DEFAULT);
    removeKey(STORAGE_KEYS.savedSermons);
  }, []);

  // Most-recent-first for display in the Library rail.
  const savedDisplay = useMemo(
    () => [...state.days].reverse(),
    [state.days],
  );

  const value = useMemo<SavedSermonsContextValue>(
    () => ({
      saved: savedDisplay,
      isSaved,
      toggle,
      save,
      unsave,
      count: state.days.length,
      reset,
      hydrated,
    }),
    [
      savedDisplay,
      isSaved,
      toggle,
      save,
      unsave,
      state.days.length,
      reset,
      hydrated,
    ],
  );

  return (
    <SavedSermonsContext.Provider value={value}>
      {children}
    </SavedSermonsContext.Provider>
  );
}

export function useSavedSermons(): SavedSermonsContextValue {
  const ctx = useContext(SavedSermonsContext);
  if (!ctx) {
    throw new Error(
      "useSavedSermons must be used inside <SavedSermonsProvider>",
    );
  }
  return ctx;
}
