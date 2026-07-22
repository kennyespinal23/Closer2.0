/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  // `darkMode: "class"` lets us toggle Tailwind's `dark:` variants
  // from JS via `colorScheme.set(...)`. We don't use `dark:` in this
  // codebase (semantic tokens swap via CSS vars instead, see below),
  // but third-party libraries / future code may rely on it.
  darkMode: "class",
  theme: {
    extend: {
      // Closer palette — fed by CSS variables that the ThemeProvider
      // swaps at the root of the app via NativeWind's `vars()`.
      //
      // We use the simplest reliable pattern: each token resolves to
      // `var(--color-X)` and the variable's value is the active hex
      // color. NativeWind's runtime parses the var() reference and
      // resolves it against the nearest View's variable scope.
      //
      // (We intentionally don't use Tailwind's alpha-modifier
      // syntax like `bg-bg/50` anywhere in the codebase, so we
      // don't need the more elaborate
      // `rgb(var(--color-x) / <alpha-value>)` form — that pattern
      // is reserved for projects that need composable alpha.)
      //
      // Per-sermon-type colors live in `constants/sermonTypes.ts`
      // and are used only for ambient glows / gradients — never for
      // chrome — so they're hardcoded hex values, not token vars.
      colors: {
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        ink: {
          DEFAULT: "var(--color-ink)",
          muted: "var(--color-ink-muted)",
          subtle: "var(--color-ink-subtle)",
        },
        primary: {
          DEFAULT: "var(--color-primary)",
          pressed: "var(--color-primary-pressed)",
          fg: "var(--color-primary-fg)",
        },
        accent: {
          DEFAULT: "var(--color-accent)",
          soft: "var(--color-accent-soft)",
        },
        border: {
          DEFAULT: "var(--color-border)",
          strong: "var(--color-border-strong)",
        },
        select: {
          DEFAULT: "var(--color-select)",
          soft: "var(--color-select-soft)",
        },
        destructive: "var(--color-destructive)",
      },
      // June 2026 typography reset: the app now lives on the iOS
      // system fonts. SF Pro (resolved via fontFamily: "System"
      // on iOS) is the interface and reading face; New York is
      // reserved for the few reflective-quote moments. The
      // Tailwind `font-*` shortcuts below map ONLY weights — the
      // family is uniformly "System" so every utility resolves
      // to SF Pro on iOS / Roboto on Android. New York Italic is
      // intentionally not exposed as a utility class: that face
      // appears in a handful of authored components only and
      // should be reached via the typography.reflectiveQuote
      // role token in lib/typography.ts, not by sprinkling a
      // `font-serif` class across the codebase.
      fontFamily: {
        sans: ["System"],
        medium: ["System"],
        semibold: ["System"],
        bold: ["System"],
        extrabold: ["System"],
      },
    },
  },
  plugins: [],
};
