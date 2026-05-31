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
 * Saved insights (bookmarks).
 *
 * Tracks which articles in `constants/insights.ts` the user has
 * tapped Save on. Persisted across launches so the Saved rail on
 * the Insights index reflects everything they've kept.
 *
 * Design notes:
 *   • Stored as an array of insight ids in save order (most-recent
 *     last in the array, displayed most-recent-first in the UI).
 *     A Set would be more efficient for membership checks, but
 *     AsyncStorage serializes JSON only — keeping the on-disk
 *     payload an array avoids a hydration custom-converter.
 *   • We hold a derived `set` in state for O(1) `isSaved` checks
 *     without forcing every render of every InsightCard to scan
 *     the array.
 *   • No timestamps yet. If we ever want to show "Saved 2 days ago"
 *     we can swap the payload to `Record<id, { savedAt }>` with a
 *     bumped storage key + migration.
 *
 * What it does NOT own:
 *   • The catalog of insights — that's static, in constants/insights.ts
 *   • Read-progress for an article (in-progress / finished). If we
 *     add that, it's its own provider so opt-in vs read state stay
 *     orthogonal.
 */

type SavedState = {
  /** Insight ids, oldest → newest. */
  ids: ReadonlyArray<string>;
};

type SavedInsightsContextValue = {
  /** Most-recent-first list — the order to render in the UI. */
  saved: ReadonlyArray<string>;
  /** O(1) membership test for an individual card's save state. */
  isSaved: (id: string) => boolean;
  /** Toggle saved/unsaved. Returns the new saved state for the id. */
  toggle: (id: string) => boolean;
  /** Idempotent — adds the id if not already present. */
  save: (id: string) => void;
  /** Idempotent — removes the id if present. */
  unsave: (id: string) => void;
  /** How many insights the user has saved. */
  count: number;
  reset: () => void;
  /** True once persisted state has loaded (or no save existed). */
  hydrated: boolean;
};

const DEFAULT: SavedState = { ids: [] };

const SavedInsightsContext =
  createContext<SavedInsightsContextValue | null>(null);

export function SavedInsightsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SavedState>(DEFAULT);

  // Defensive merge in case a future migration adds new fields.
  const applyLoaded = useCallback((loaded: SavedState) => {
    setState({
      ids: Array.isArray(loaded.ids) ? loaded.ids : [],
    });
  }, []);

  const hydrated = usePersistence(
    STORAGE_KEYS.savedInsights,
    state,
    applyLoaded,
  );

  // Derived Set for the most common operation — checking whether a
  // specific id is saved (called once per visible card on every
  // render of the index screen).
  const savedSet = useMemo(() => new Set(state.ids), [state.ids]);

  const isSaved = useCallback(
    (id: string) => savedSet.has(id),
    [savedSet],
  );

  const save = useCallback((id: string) => {
    setState((s) => {
      if (s.ids.includes(id)) return s;
      return { ids: [...s.ids, id] };
    });
  }, []);

  const unsave = useCallback((id: string) => {
    setState((s) => {
      if (!s.ids.includes(id)) return s;
      return { ids: s.ids.filter((i) => i !== id) };
    });
  }, []);

  const toggle = useCallback<SavedInsightsContextValue["toggle"]>(
    (id) => {
      let nowSaved = false;
      setState((s) => {
        if (s.ids.includes(id)) {
          nowSaved = false;
          return { ids: s.ids.filter((i) => i !== id) };
        }
        nowSaved = true;
        return { ids: [...s.ids, id] };
      });
      return nowSaved;
    },
    [],
  );

  const reset = useCallback(() => {
    setState(DEFAULT);
    removeKey(STORAGE_KEYS.savedInsights);
  }, []);

  // Most-recent-first for display.
  const savedDisplay = useMemo(
    () => [...state.ids].reverse(),
    [state.ids],
  );

  const value = useMemo<SavedInsightsContextValue>(
    () => ({
      saved: savedDisplay,
      isSaved,
      toggle,
      save,
      unsave,
      count: state.ids.length,
      reset,
      hydrated,
    }),
    [savedDisplay, isSaved, toggle, save, unsave, state.ids.length, reset, hydrated],
  );

  return (
    <SavedInsightsContext.Provider value={value}>
      {children}
    </SavedInsightsContext.Provider>
  );
}

export function useSavedInsights(): SavedInsightsContextValue {
  const ctx = useContext(SavedInsightsContext);
  if (!ctx) {
    throw new Error(
      "useSavedInsights must be used inside <SavedInsightsProvider>",
    );
  }
  return ctx;
}
