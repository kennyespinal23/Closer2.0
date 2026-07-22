import { Platform, type TextStyle } from "react-native";

/**
 * Closer typography system.
 *
 * Two faces. One job each.
 *
 *   • SF Pro       → the entire interface and reading surface.
 *                    Nav, tab bar, buttons, cards, the home
 *                    screen, devotional titles, body copy,
 *                    section headers, settings, streaks, App
 *                    Blocks, protection screens. Everything.
 *
 *   • New York     → reserved for spiritual pause moments.
 *                    Scripture callouts. Opening and closing
 *                    reflective quotes. Short blockquotes that
 *                    are meant to feel like a breath. Nothing
 *                    else. The serif is the punctuation of the
 *                    app's voice — it should feel SPECIAL when
 *                    it appears, not familiar.
 *
 * Both faces are iOS system fonts (SF Pro since iOS 9, New York
 * since iOS 13), so we don't ship font files for them. Setting
 * `fontFamily: "System"` tells React Native to pick the platform
 * default — SF Pro on iOS, Roboto on Android. Setting
 * `fontFamily: NEW_YORK` (which is `"ui-serif"` on iOS) picks the
 * system serif design — New York. Raw `"New York"` does NOT work
 * in React Native; see the NEW_YORK export comment.
 *
 * The role tokens below are the canonical vocabulary every screen
 * should reach for. Spread them into a Text `style` prop instead
 * of re-authoring fontFamily / fontWeight / fontSize / lineHeight
 * by hand at each call site — the moment three different
 * "section title" definitions exist in the codebase the system
 * starts to drift.
 *
 *   <Text style={typography.body}>...</Text>
 *   <Text style={[typography.body, { color: ink }]}>...</Text>
 *
 * Per-role overrides (a specific color, a tighter margin, etc.)
 * compose cleanly on top of the preset via the array form — the
 * preset stays the source of truth for family + weight + size +
 * leading + tracking.
 */

// ─── Font families ────────────────────────────────────────────

/**
 * The interface face. `"System"` resolves to SF Pro on iOS (with
 * automatic Display/Text optical-size selection based on size)
 * and Roboto on Android. We never set fontFamily to anything
 * other than this for interface text — every weight is reached
 * via the `fontWeight` property below, not by stringifying the
 * face name.
 */
export const SF_PRO = "System";

/**
 * The reflection / reading face (Apple New York on iOS).
 *
 * IMPORTANT — do NOT set `fontFamily: "New York"`.
 * RCTFont looks that string up via `UIFont fontNamesForFamilyName:` /
 * `fontWithName:`, which fails for New York (it's a private system
 * face: `.NewYork-Regular`). RN then logs "Unrecognized font family"
 * and silently falls back to SF Pro — which is what we were seeing
 * on the Genesis reader and the scripture screen.
 *
 * The supported RN/iOS bridge for Apple's system serif design is
 * `"ui-serif"` (same family as `"ui-rounded"` / `"ui-monospace"`).
 * That path goes through `UIFontDescriptorSystemDesignSerif`, which
 * is New York on every iOS 13+ device. Android falls back to Georgia.
 */
export const NEW_YORK = Platform.select({
  ios: "ui-serif",
  default: "Georgia",
}) as string;

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
  fontWeight: fontWeight.semibold,
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

/**
 * Reflective quote — the ONLY place New York Italic appears in
 * the app. Scripture callouts on the sermon detail page, the
 * opening / closing reflective quotes on intro screens, and
 * short standalone blockquotes inside reading flows. Centered
 * by default with a max-width of 85% (~340pt on a 6.1" iPhone)
 * so the line measure stays short and the eye doesn't have to
 * track across a full-bleed line of italics.
 *
 * Default size 26pt (range 24-28). Leading 36pt (the upper end
 * of the spec's 34-38 range) because italics need slightly more
 * vertical room than upright text — the descenders are longer
 * and the ascenders sweep further.
 *
 * Callers compose max-width via the parent View, not via the
 * Text style itself (RN Text doesn't honor maxWidth on its own).
 */
const reflectiveQuote: TextStyle = {
  fontFamily: NEW_YORK,
  fontStyle: "italic",
  fontWeight: fontWeight.regular,
  fontSize: 26,
  lineHeight: 36,
  textAlign: "center",
  letterSpacing: 0,
};

/**
 * Photo-overlaid verse / title — upright New York on dimmed
 * photography (home verse-share hero, photo heroes). Italic
 * Playfair / reflectiveQuote tested poorly at length; upright
 * keeps legibility once the image brightness ceiling is locked.
 */
const photoQuote: TextStyle = {
  fontFamily: NEW_YORK,
  fontStyle: "normal",
  fontWeight: fontWeight.regular,
  fontSize: 26,
  lineHeight: 36,
  textAlign: "center",
  letterSpacing: 0,
};

/**
 * Reader body — continuous Bible chapter prose in the chapter
 * reader. Upright New York (not italic) so long-form scripture
 * matches Apple Books' system-serif reading surface. SF Pro stays
 * on chrome (page indicators, toolbars, headers). Callers still
 * multiply size/leading via scale; this token only locks the face.
 *
 * iOS resolves New York via `NEW_YORK` (`"ui-serif"` — see the
 * NEW_YORK export comment). Do not pass `"New York"` directly.
 */
const readerBody: TextStyle = {
  fontFamily: NEW_YORK,
  fontWeight: fontWeight.regular,
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
        fontStyle: "italic",
      };
    case "PlusJakartaSans_600SemiBold":
      return { fontFamily: SF_PRO, fontWeight: fontWeight.semibold };
    case "PlusJakartaSans_700Bold":
      return { fontFamily: SF_PRO, fontWeight: fontWeight.bold };
    case "PlusJakartaSans_700Bold_Italic":
      return {
        fontFamily: SF_PRO,
        fontWeight: fontWeight.bold,
        fontStyle: "italic",
      };
    case "PlusJakartaSans_800ExtraBold":
      return { fontFamily: SF_PRO, fontWeight: fontWeight.extrabold };
  }
}
