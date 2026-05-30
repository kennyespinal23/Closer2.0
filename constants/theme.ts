/**
 * Closer design tokens.
 *
 * These mirror the Tailwind config so non-Tailwind surfaces
 * (StatusBar, SafeArea backgrounds, Splash, SVGs, etc.) stay in sync.
 *
 * App chrome is pure black + white + grays. The only colors in the
 * UI come from each sermon type's `accent` (see `sermonTypes.ts`),
 * which is used exclusively for ambient glows behind heroes/passages.
 */
export const colors = {
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
} as const;

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
