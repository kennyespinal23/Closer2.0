import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useColorScheme as useRNColorScheme, View } from "react-native";
import { colorScheme as nwColorScheme, vars } from "nativewind";
import {
  DARK_COLORS,
  LIGHT_COLORS,
  paletteToCssVars,
  type ColorPalette,
} from "@/constants/theme";
import { removeKey, STORAGE_KEYS, usePersistence } from "@/lib/storage";

/**
 * Theme provider — single source of truth for Closer's color scheme.
 *
 * State shape:
 *   • `pref`     — the user's choice: `"system"`, `"dark"`, `"light"`.
 *                  Persisted to AsyncStorage so it survives launches.
 *   • `scheme`   — the resolved scheme actually in effect right now.
 *                  When pref === "system", we read the device scheme
 *                  via React Native's `useColorScheme()`; otherwise
 *                  we follow `pref` directly.
 *   • `colors`   — the active palette (DARK_COLORS or LIGHT_COLORS),
 *                  exposed through `useColors()`.
 *
 * How the swap actually flips the UI:
 *   1. NativeWind class tokens like `bg-bg` / `text-ink` resolve to
 *      `rgb(var(--color-bg) / a)`. Their values come from CSS
 *      variables defined on the root <View> via NativeWind's
 *      `vars()` helper.
 *   2. When the scheme changes, the provider re-renders that View
 *      with a different `vars()` payload — and every descendant's
 *      Tailwind class immediately picks up the new color.
 *   3. We ALSO call NativeWind's `colorScheme.set()` so any
 *      third-party / future code that uses `dark:` variants stays
 *      in sync. (We don't author `dark:` classes in this codebase
 *      — semantic tokens do the work — but this is cheap insurance.)
 *
 * Migration note:
 *   Files that read colors directly (SVG strokes, computed styles,
 *   gradient stops, etc.) need to switch from
 *   `import { colors } from "@/constants/theme"` to
 *   `const colors = useColors()` to flip with the theme. Until they
 *   do, those surfaces will keep rendering in the dark palette
 *   (since `colors` is still exported as a static alias for
 *   DARK_COLORS for back-compat). Tailwind-classed surfaces flip
 *   regardless.
 */

export type ThemePref = "system" | "dark" | "light";
export type ResolvedScheme = "dark" | "light";

type ThemeState = {
  pref: ThemePref;
};

type ThemeContextValue = ThemeState & {
  /** Whichever scheme is actually painting right now. */
  scheme: ResolvedScheme;
  /** The active palette. Re-render-safe via context. */
  colors: ColorPalette;
  /** Update the user preference (persisted). */
  setPref: (next: ThemePref) => void;
  reset: () => void;
  /** True once the saved pref has loaded from disk. */
  hydrated: boolean;
};

const DEFAULT: ThemeState = {
  // System-follow is the default for new installs — matches the
  // behavior most iOS users expect from a polished app.
  pref: "system",
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ThemeState>(DEFAULT);
  const systemScheme = useRNColorScheme();

  // Resolve: explicit pref wins; "system" → follow the device.
  // Default to "dark" when the device scheme is null (some early
  // RN frames return null before the bridge resolves it). This
  // matches Closer's identity as a night-first app.
  const scheme: ResolvedScheme =
    state.pref === "system"
      ? systemScheme === "light"
        ? "light"
        : "dark"
      : state.pref;

  const palette: ColorPalette =
    scheme === "dark" ? DARK_COLORS : LIGHT_COLORS;

  // Memoize the vars() payload so we only re-create the style object
  // when the palette actually changes (not on every render).
  const themeVars = useMemo(
    () => vars(paletteToCssVars(palette)),
    [palette],
  );

  // Keep NativeWind's internal color-scheme state in sync, so any
  // `dark:` Tailwind variants (third-party libs, future code) flip
  // with our resolved scheme.
  useEffect(() => {
    nwColorScheme.set(scheme);
  }, [scheme]);

  // Persist the user pref. We persist the WHOLE state (object) for
  // forward compat — future fields like "amoled black" or
  // "high-contrast" can land without bumping the key.
  const applyLoaded = useCallback((loaded: ThemeState) => {
    const safePref: ThemePref =
      loaded.pref === "system" ||
      loaded.pref === "dark" ||
      loaded.pref === "light"
        ? loaded.pref
        : DEFAULT.pref;
    setState({ pref: safePref });
  }, []);
  const hydrated = usePersistence(STORAGE_KEYS.theme, state, applyLoaded);

  const setPref = useCallback((next: ThemePref) => {
    setState({ pref: next });
  }, []);

  const reset = useCallback(() => {
    setState(DEFAULT);
    removeKey(STORAGE_KEYS.theme);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      ...state,
      scheme,
      colors: palette,
      setPref,
      reset,
      hydrated,
    }),
    [state, scheme, palette, setPref, reset, hydrated],
  );

  return (
    <ThemeContext.Provider value={value}>
      {/* The root vars() View. Every Tailwind class below it
          resolves --color-* variables against the active palette.
          flex:1 + the active bg color keeps the canvas painted
          even before the first child paints (avoids a flash). */}
      <View
        style={[
          { flex: 1, backgroundColor: palette.bg },
          themeVars,
        ]}
      >
        {children}
      </View>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used inside <ThemeProvider>");
  }
  return ctx;
}

/**
 * Convenience hook — returns just the active palette. Use this in
 * any file that previously did `import { colors }`.
 *
 *   const colors = useColors();
 *   <Path stroke={colors.ink} ... />
 */
export function useColors(): ColorPalette {
  return useTheme().colors;
}

/**
 * Convenience hook — returns the resolved scheme string. Useful for
 * non-color decisions (e.g. choosing a different SVG glyph for
 * dark vs light, or picking the right StatusBar style).
 */
export function useResolvedScheme(): ResolvedScheme {
  return useTheme().scheme;
}
