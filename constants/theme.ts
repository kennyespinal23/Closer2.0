/**
 * Closer design tokens.
 *
 * These mirror the Tailwind config so non-Tailwind surfaces
 * (StatusBar, SafeArea backgrounds, Splash, SVGs, etc.) stay in sync.
 *
 * App chrome is pure black + white + grays. The only colors in the
 * UI come from each sermon type's `accent` (see `sermonTypes.ts`),
 * which is used exclusively for ambient glows behind heroes/passages.
 *
 * ─────────────────────────────────────────────────────────────────
 * Theme strategy
 * ─────────────────────────────────────────────────────────────────
 *
 * Two palettes ship with the app: DARK_COLORS (the original night-
 * first chrome) and LIGHT_COLORS (a calm, Apple-Books-style daytime
 * surface). The Tailwind config consumes them as CSS variables that
 * the ThemeProvider swaps at the root via NativeWind's `vars()`, so
 * any Tailwind class (`bg-bg`, `text-ink`, `border-border`) flips
 * automatically when the active scheme changes.
 *
 * For code that reads colors directly (SVG strokes, computed
 * styles, gradient stops), use the `useColors()` hook from
 * `state/theme.tsx`. The legacy `colors` export below is the dark
 * palette — kept for back-compat with screens not yet migrated.
 *
 * Migration: replace `import { colors }` with
 * `import { useColors }` and call it inside the component.
 */

export type ColorPalette = {
  bg: string;
  surface: string;
  ink: string;
  inkMuted: string;
  inkSubtle: string;
  primary: string;
  primaryPressed: string;
  primaryFg: string;
  accent: string;
  accentSoft: string;
  border: string;
  borderStrong: string;
};

/**
 * The original Closer palette — pure black canvas, white ink, dim
 * gray chrome. Tuned for low-light morning use.
 */
export const DARK_COLORS: ColorPalette = {
  bg: "#000000",
  surface: "#0F0F0F",
  ink: "#FFFFFF",
  inkMuted: "#A1A1AA",
  inkSubtle: "#71717A",
  primary: "#FFFFFF",
  primaryPressed: "#E5E5E5",
  primaryFg: "#000000",
  accent: "#FFFFFF",
  accentSoft: "#1A1A1A",
  border: "#1F1F1F",
  borderStrong: "#2A2A2A",
};

/**
 * Light palette — clean white canvas with deep ink, calm gray
 * chrome, and a black primary. Designed to feel like Apple Books'
 * library/reader: bright but never sterile, with quiet rules and
 * subtle elevation.
 *
 * Notes on intentional choices:
 *   • `primary` flips to ink-black so the PlayPill/CTAs read as
 *     a single bold mark on a bright surface.
 *   • `accentSoft` is a near-white gray (not transparent) so
 *     avatar/pill backdrops keep their soft elevation against
 *     `bg`. Pure transparency disappears on white.
 *   • `border` is a hair lighter than `surface` so cards stay
 *     just barely outlined — same rhythm as the dark theme.
 */
export const LIGHT_COLORS: ColorPalette = {
  bg: "#FFFFFF",
  surface: "#F7F7F8",
  ink: "#0F0F0F",
  inkMuted: "#6B6B72",
  inkSubtle: "#8F8F96",
  primary: "#0F0F0F",
  primaryPressed: "#2A2A2A",
  primaryFg: "#FFFFFF",
  accent: "#0F0F0F",
  accentSoft: "#F0F0F2",
  border: "#E5E5E7",
  borderStrong: "#D4D4D8",
};

/**
 * Legacy export — kept so the ~40 screens that import `colors`
 * directly continue to work while we migrate them to `useColors()`.
 * New code should NOT use this; prefer the hook so theme switching
 * affects all surfaces.
 *
 * It points at DARK_COLORS, which is also the app's default scheme
 * when the system preference is unknown.
 */
export const colors = DARK_COLORS;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

/**
 * Build the `--color-*` CSS variable record that the ThemeProvider
 * feeds to NativeWind's `vars()`. Keys match the Tailwind token
 * names so a class like `bg-bg` resolves to `--color-bg`.
 *
 * Values are emitted as raw hex strings (e.g. `"#000000"`) since
 * the Tailwind config consumes each token as `var(--color-X)`
 * directly — no Tailwind `<alpha-value>` substitution involved.
 * Simpler, less brittle, and easy to inspect when debugging.
 */
export function paletteToCssVars(
  palette: ColorPalette,
): Record<string, string> {
  return {
    "--color-bg": palette.bg,
    "--color-surface": palette.surface,
    "--color-ink": palette.ink,
    "--color-ink-muted": palette.inkMuted,
    "--color-ink-subtle": palette.inkSubtle,
    "--color-primary": palette.primary,
    "--color-primary-pressed": palette.primaryPressed,
    "--color-primary-fg": palette.primaryFg,
    "--color-accent": palette.accent,
    "--color-accent-soft": palette.accentSoft,
    "--color-border": palette.border,
    "--color-border-strong": palette.borderStrong,
  };
}
