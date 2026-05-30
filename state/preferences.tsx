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
 * App-wide user preferences.
 *
 * Two things live here today; more will likely move in over time:
 *   1. Bible translation — which version the reader fetches
 *   2. Reading text size  — scales scripture (and any other "long-read"
 *                            surfaces) up or down without touching the
 *                            chrome of the rest of the app
 *
 * State is in-memory for the moment. When AsyncStorage / a backend is
 * wired, only this file changes; everything else just keeps calling
 * `usePreferences()`.
 */

// ─────────────────────────────────────────────────────────────────
// Translations
//
// bible-api.com supports these English translations (and a handful of
// non-English ones we intentionally don't surface yet). The slugs
// MUST match the API's `?translation=` parameter.
// ─────────────────────────────────────────────────────────────────

export type TranslationId =
  | "web"
  | "kjv"
  | "bbe"
  | "oeb-cw"
  | "webbe";

export type Translation = {
  id: TranslationId;
  /** Short label, used in lists and the profile row. */
  name: string;
  /** Long marketing-y label for selection screens. */
  fullName: string;
  /** One-line description of voice/tone. */
  description: string;
  /** Two-letter tag for the "compare" / verse-action affordances. */
  tag: string;
};

export const TRANSLATIONS: ReadonlyArray<Translation> = [
  {
    id: "web",
    name: "WEB",
    fullName: "World English Bible",
    description: "Modern, readable, public domain. The Closer default.",
    tag: "WEB",
  },
  {
    id: "kjv",
    name: "KJV",
    fullName: "King James Version",
    description: "The classic 1611 English voice. Reverent, lyrical.",
    tag: "KJV",
  },
  {
    id: "bbe",
    name: "BBE",
    fullName: "Bible in Basic English",
    description: "Plain language. Useful when meaning matters more than poetry.",
    tag: "BBE",
  },
  {
    id: "oeb-cw",
    name: "OEB",
    fullName: "Open English Bible",
    description: "A contemporary open-license translation.",
    tag: "OEB",
  },
  {
    id: "webbe",
    name: "WEBBE",
    fullName: "World English Bible — British Edition",
    description: "Familiar British spelling and rhythm.",
    tag: "WEBBE",
  },
];

export function findTranslation(
  id: TranslationId,
): Translation {
  return TRANSLATIONS.find((t) => t.id === id) ?? TRANSLATIONS[0];
}

// ─────────────────────────────────────────────────────────────────
// Text size
//
// Scale factor multiplies every "long-read" font size. A scale of 1
// is the base UI size; smaller numbers shrink, larger numbers grow.
// We deliberately keep the range narrow — too far in either direction
// breaks the typography rhythm of the rest of the app.
// ─────────────────────────────────────────────────────────────────

export type TextSizeId = "small" | "default" | "large" | "x-large";

export type TextSize = {
  id: TextSizeId;
  /** Short label for the picker rows. */
  name: string;
  /** Multiplier applied to base reader font sizes. */
  scale: number;
};

export const TEXT_SIZES: ReadonlyArray<TextSize> = [
  { id: "small",    name: "Small",        scale: 0.88 },
  { id: "default",  name: "Default",      scale: 1.00 },
  { id: "large",    name: "Large",        scale: 1.15 },
  { id: "x-large",  name: "Extra Large",  scale: 1.32 },
];

export function findTextSize(id: TextSizeId): TextSize {
  return TEXT_SIZES.find((t) => t.id === id) ?? TEXT_SIZES[1];
}

// ─────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────

export type PreferencesState = {
  translationId: TranslationId;
  textSizeId: TextSizeId;
};

type PreferencesContextValue = PreferencesState & {
  translation: Translation;
  textSize: TextSize;
  setTranslation: (id: TranslationId) => void;
  setTextSize: (id: TextSizeId) => void;
  reset: () => void;
  /** True once persisted prefs have loaded (or no save existed). */
  hydrated: boolean;
};

const DEFAULT: PreferencesState = {
  translationId: "web",
  textSizeId: "default",
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PreferencesState>(DEFAULT);

  // Defensive merge — if a future version of the app adds a new
  // preference field, an old saved payload won't have it; defaults
  // fill in. Also guards against a saved translationId we no longer
  // recognize (e.g. removed from TRANSLATIONS).
  const applyLoaded = useCallback((loaded: PreferencesState) => {
    const safeTranslation =
      loaded.translationId &&
      TRANSLATIONS.some((t) => t.id === loaded.translationId)
        ? loaded.translationId
        : DEFAULT.translationId;
    const safeTextSize =
      loaded.textSizeId &&
      TEXT_SIZES.some((t) => t.id === loaded.textSizeId)
        ? loaded.textSizeId
        : DEFAULT.textSizeId;
    setState({
      translationId: safeTranslation,
      textSizeId: safeTextSize,
    });
  }, []);

  const hydrated = usePersistence(
    STORAGE_KEYS.preferences,
    state,
    applyLoaded,
  );

  const setTranslation = useCallback((id: TranslationId) => {
    setState((s) => ({ ...s, translationId: id }));
  }, []);

  const setTextSize = useCallback((id: TextSizeId) => {
    setState((s) => ({ ...s, textSizeId: id }));
  }, []);

  const reset = useCallback(() => {
    setState(DEFAULT);
    removeKey(STORAGE_KEYS.preferences);
  }, []);

  const value = useMemo<PreferencesContextValue>(
    () => ({
      ...state,
      translation: findTranslation(state.translationId),
      textSize: findTextSize(state.textSizeId),
      setTranslation,
      setTextSize,
      reset,
      hydrated,
    }),
    [state, setTranslation, setTextSize, reset, hydrated],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error(
      "usePreferences must be used inside <PreferencesProvider>",
    );
  }
  return ctx;
}
