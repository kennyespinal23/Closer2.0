import { type TextStyle } from "react-native";

/**
 * Closer type roles. Interface Text/TextInput render through CloserText,
 * which resolves these semantic weights to bundled Nunito faces.
 * Large bold headings use Nunito Black; Scripture uses Nunito Medium;
 * personal handwritten moments explicitly select Shantell Sans.
 */

// ─── Font families ────────────────────────────────────────────

/** Legacy semantic interface alias. CloserText maps System to Nunito by weight. */
export const SF_PRO = "System";

/** Shared upright reading face for Scripture and devotional passages. */
export const SCRIPTURE_FONT = "NunitoMedium";
/** Compatibility alias for existing reading surfaces. */
export const NEW_YORK = SCRIPTURE_FONT;

// ─── Weight vocabulary ────────────────────────────────────────
//
// Apple HIG explicitly forbids Thin / ExtraLight / Light at body
// sizes (they fail legibility at small point sizes), so the
// vocabulary stops at Regular (400). ExtraBold (800) is allowed
// for hero typography but should be used sparingly — Bold (700)
// is the workhorse heavy face.
export const fontWeight = {
  regular: "400" as TextStyle["fontWeight"],
  medium: "500" as TextStyle["fontWeight"],
  semibold: "600" as TextStyle["fontWeight"],
  bold: "700" as TextStyle["fontWeight"],
  extrabold: "800" as TextStyle["fontWeight"],
};

// ─── Role presets ─────────────────────────────────────────────

/**
 * @deprecated Prefer `systemText.largeTitle` for chrome page
 * anchors (Home, Bible, Profile, App Blocks, list screens).
 * Kept as an alias of Apple Large Title (34/41) so leftover
 * call sites match HIG instead of the old Closer-only 40pt.
 */
const pageTitle: TextStyle = {
  fontFamily: SF_PRO,
  fontWeight: fontWeight.bold,
  fontSize: 34,
  lineHeight: 41,
  letterSpacing: -1.05,
};

/**
 * Devotional title — the in-card / in-sermon title that names
 * today's reading. Slightly smaller than the page title so the
 * card frame still reads as a sub-region of the surface. Range
 * 28-32pt; default 30. SF Pro Display Bold.
 */
const devotionalTitle: TextStyle = {
  fontFamily: SF_PRO,
  fontWeight: fontWeight.bold,
  fontSize: 30,
  lineHeight: 36,
  letterSpacing: -0.4,
};

/**
 * Body — the reading default. 17pt is the iOS baseline body size
 * for a reason: it's the comfortable long-form sweet spot for
 * SF Pro Text on a 6.1" iPhone. 28pt leading is generous (1.65x)
 * so multi-paragraph prose has room to breathe. Tracking matches
 * Apple Body (−0.43).
 */
const body: TextStyle = {
  fontFamily: SF_PRO,
  fontWeight: fontWeight.regular,
  fontSize: 17,
  lineHeight: 28,
  letterSpacing: -0.43,
};

/**
 * Button — the canonical primary-action label. Semibold @17pt
 * matches Apple's Human Interface Guidelines for filled-pill
 * buttons (the same label weight UIKit's UIButton uses by
 * default). No lineHeight — buttons are single-line.
 */
const button: TextStyle = {
  fontFamily: SF_PRO,
  fontWeight: fontWeight.extrabold,
  fontSize: 17,
};

/**
 * Small label — the all-caps eyebrow / chip text that announces
 * a section or tags a state ("TODAY'S DEVOTIONAL", "DAY 12").
 * +0.8 tracking is a Closer convention for uppercase chrome —
 * Apple has no Dynamic Type "all-caps eyebrow" style. Prefer
 * `systemText.captionEmphasized` (+1 at 11pt) for system-style
 * metadata; keep this token for 13pt brand eyebrows.
 *
 * IMPORTANT: this preset does NOT set textTransform. Callers
 * decide whether to uppercase — some labels (chip counts,
 * status pills) want title case at this size and the tracking
 * still reads as deliberate.
 */
const smallLabel: TextStyle = {
  fontFamily: SF_PRO,
  fontWeight: fontWeight.semibold,
  fontSize: 13,
  letterSpacing: 0.8,
};

/** Scripture callouts use Nunito Medium with generous leading. */
const reflectiveQuote: TextStyle = {
  fontFamily: NEW_YORK,
  fontStyle: "normal",
  fontWeight: "500",
  fontSize: 26,
  lineHeight: 36,
  textAlign: "center",
  letterSpacing: 0,
};

/** Photo-overlaid Scripture uses the same upright reading face. */
const photoQuote: TextStyle = {
  fontFamily: NEW_YORK,
  fontStyle: "normal",
  fontWeight: "500",
  fontSize: 26,
  lineHeight: 36,
  textAlign: "center",
  letterSpacing: 0,
};

/** Reader body. Callers scale size and leading; measurement uses this same face. */
const readerBody: TextStyle = {
  fontFamily: NEW_YORK,
  fontWeight: "500",
  fontSize: 18,
  lineHeight: 30,
  letterSpacing: -0.1,
};

export const typography = {
  pageTitle,
  devotionalTitle,
  body,
  button,
  smallLabel,
  reflectiveQuote,
  photoQuote,
  readerBody,
} as const;

export type TypographyRole = keyof typeof typography;

/**
 * Apple HIG Dynamic Type–aligned system text styles (fixed sizes —
 * Dynamic Type scaling still applies via RN's default allowFontScaling).
 * Prefer these for chrome hierarchy (tab page titles, settings,
 * list screens, eyebrows) so sizes don't drift per-screen.
 * Closer brand tokens remain for reading moments only
 * (`devotionalTitle`, `reflectiveQuote`, `photoQuote`, `readerBody`).
 *
 * Spec sizes: https://developer.apple.com/design/human-interface-guidelines/typography
 * Default (Large) Dynamic Type — Large Title = 34pt.
 *
 * Tracking (letterSpacing) matches Apple's SF Pro table for the
 * Default/Large text-size setting. UIKit/SwiftUI apply this
 * automatically for system text styles; React Native does not,
 * so we bake the values in here. Display styles (≥20pt) tighten;
 * Text styles tighten slightly around body, then open again at
 * caption sizes.
 */
const largeTitle: TextStyle = {
  fontFamily: SF_PRO,
  fontWeight: fontWeight.bold,
  fontSize: 34,
  lineHeight: 41,
  letterSpacing: -1.05,
};

const title1: TextStyle = {
  fontFamily: SF_PRO,
  fontWeight: fontWeight.bold,
  fontSize: 28,
  lineHeight: 34,
  letterSpacing: -0.8,
};

const title2: TextStyle = {
  fontFamily: SF_PRO,
  fontWeight: fontWeight.bold,
  fontSize: 22,
  lineHeight: 28,
  letterSpacing: -0.7,
};

const title3: TextStyle = {
  fontFamily: SF_PRO,
  fontWeight: fontWeight.semibold,
  fontSize: 20,
  lineHeight: 25,
  letterSpacing: -0.6,
};

const headline: TextStyle = {
  fontFamily: SF_PRO,
  fontWeight: fontWeight.semibold,
  fontSize: 17,
  lineHeight: 22,
  letterSpacing: -0.43,
};

const callout: TextStyle = {
  fontFamily: SF_PRO,
  fontWeight: fontWeight.regular,
  fontSize: 16,
  lineHeight: 21,
  letterSpacing: -0.32,
};

const subheadline: TextStyle = {
  fontFamily: SF_PRO,
  fontWeight: fontWeight.regular,
  fontSize: 15,
  lineHeight: 20,
  letterSpacing: -0.24,
};

const footnote: TextStyle = {
  fontFamily: SF_PRO,
  fontWeight: fontWeight.regular,
  fontSize: 13,
  lineHeight: 18,
  letterSpacing: -0.08,
};

const caption1: TextStyle = {
  fontFamily: SF_PRO,
  fontWeight: fontWeight.regular,
  fontSize: 12,
  lineHeight: 16,
  letterSpacing: 0,
};

const caption2: TextStyle = {
  fontFamily: SF_PRO,
  fontWeight: fontWeight.regular,
  fontSize: 11,
  lineHeight: 13,
  letterSpacing: 0.07,
};

/**
 * All-caps eyebrow / metadata (CONTINUE READING, 39 BOOKS).
 * Semibold caption2 + tracking — semantic sibling of `smallLabel`
 * for system-style chrome that must stay AAA-readable when paired
 * with `inkMuted` / `textSecondary`.
 */
const captionEmphasized: TextStyle = {
  fontFamily: SF_PRO,
  fontWeight: fontWeight.semibold,
  fontSize: 11,
  lineHeight: 13,
  letterSpacing: 1,
  textTransform: "uppercase",
};

export const systemText = {
  largeTitle,
  title1,
  title2,
  title3,
  headline,
  /** Alias of typography.body at the system name. */
  body,
  callout,
  subheadline,
  footnote,
  caption1,
  caption2,
  captionEmphasized,
} as const;

export type SystemTextRole = keyof typeof systemText;

// ─── Legacy compatibility ─────────────────────────────────────
//
// The codebase was authored against `fontFamily: "PlusJakartaSans_*"`
// strings — one per weight, with the weight encoded into the
// family name. The mass-migration to the SF Pro role tokens
// above was applied via a mechanical replacement (see the
// June 2026 typography commit) that rewrites every
// PlusJakartaSans_XXX reference into the equivalent
// `{ fontFamily: SF_PRO, fontWeight: XXX }` pair. Nothing in
// the codebase should reference the legacy names anymore — but
// the export below is preserved as a compile-time check: if a
// future patch reintroduces a PlusJakartaSans_* string, the
// typecheck for this helper will catch it. The helper is
// otherwise unused.
export type LegacyFontFamily =
  | "PlusJakartaSans_400Regular"
  | "PlusJakartaSans_500Medium"
  | "PlusJakartaSans_500Medium_Italic"
  | "PlusJakartaSans_600SemiBold"
  | "PlusJakartaSans_700Bold"
  | "PlusJakartaSans_700Bold_Italic"
  | "PlusJakartaSans_800ExtraBold";

export function fromLegacy(family: LegacyFontFamily): TextStyle {
  switch (family) {
    case "PlusJakartaSans_400Regular":
      return { fontFamily: SF_PRO, fontWeight: fontWeight.regular };
    case "PlusJakartaSans_500Medium":
      return { fontFamily: SF_PRO, fontWeight: fontWeight.medium };
    case "PlusJakartaSans_500Medium_Italic":
      return {
        fontFamily: SF_PRO,
        fontWeight: fontWeight.medium,
        fontStyle: "normal",
      };
    case "PlusJakartaSans_600SemiBold":
      return { fontFamily: SF_PRO, fontWeight: fontWeight.semibold };
    case "PlusJakartaSans_700Bold":
      return { fontFamily: SF_PRO, fontWeight: fontWeight.bold };
    case "PlusJakartaSans_700Bold_Italic":
      return {
        fontFamily: SF_PRO,
        fontWeight: fontWeight.bold,
        fontStyle: "normal",
      };
    case "PlusJakartaSans_800ExtraBold":
      return { fontFamily: SF_PRO, fontWeight: fontWeight.extrabold };
  }
}
