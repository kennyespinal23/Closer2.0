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
  /** iOS-system-blue selection accent — used by multi-select
   *  chips in onboarding, focus settings, and anywhere else the
   *  app wants to signal "this is a SELECTED state, not the
   *  primary action." Distinct from `primary` (which drives CTAs
   *  / the Begin pill / the FAB) so the eye reads "I picked this"
   *  vs "do this" as two different things. Tracks Apple's
   *  systemBlue UIDynamicColor so it visually slots into iOS
   *  conventions. */
  select: string;
  /** A soft tint of `select` for backgrounds on selected chips —
   *  the SELECTED chip's fill at low alpha against the page bg,
   *  giving the chip a subtle blue glow rather than a solid blue
   *  block (which would feel too iOS-Settings). */
  selectSoft: string;
};

/**
 * Closer's dark palette — "Apple Tuned."
 *
 * Iteration history:
 *   v1  pure black bg (#000) + #0F0F0F surface — read OLED-clinical,
 *       cards barely lifted off the void, whole app felt cold.
 *   v2  "Hallow tuned": warm-neutral dark bg (#141416) + plum-tinted
 *       surface (#22202A). Gained warmth, but the warm bg meant the
 *       sermon-type accent colors and the streak-ring colors lost
 *       their pop — everything sat in the same low-contrast soup.
 *   v3  (this) "Apple tuned." We pulled directly from Apple Fitness,
 *       Apple Games, and Apple TV iOS — the three apps the design
 *       brief explicitly targets — and adopted their shared dark-
 *       app system token-for-token. The principle is the same one
 *       all three follow: the canvas is a true-black void, the
 *       chrome is monochromatic and quiet, and the CONTENT carries
 *       all of the color (sermon-type accents, streak ring,
 *       per-day glow). On OLED this gives the void an actual
 *       "off pixels" depth that warm grays can't fake.
 *
 * The Apple dark-app system, as shipped:
 *
 *   bg            #000000   true black — Apple's page bg across
 *                            Fitness Summary, TV Watch Now, and
 *                            Games Home. OLED-floating depth.
 *   surface       #1C1C1E   iOS UIColor.systemGray6 dark — the
 *                            universal Apple inset-card fill.
 *                            Reads as a single elevation step
 *                            above bg without needing a border.
 *   accentSoft    #1C1C1E   same as surface — soft-accent wells
 *                            (avatar circle, glyph wells) become
 *                            elevation moves rather than colored
 *                            washes. Apple's circle avatars in
 *                            Fitness/TV use exactly this trick.
 *   border        #2C2C2E   iOS UIColor.separator dark — barely
 *                            perceptible. Used as a structural
 *                            hint, never as page chrome.
 *   borderStrong  #3A3A3C   iOS UIColor.opaqueSeparator dark —
 *                            used only when a real edge needs to
 *                            be visible (e.g., pressed states).
 *   inkMuted      #EBEBF5/99 iOS secondaryLabel dark (60% white).
 *                            Body copy, captions, metadata.
 *   inkSubtle     #EBEBF5/66 iOS tertiaryLabel dark (40% white).
 *                            Deep metadata: ref labels, timestamps.
 *
 * Why this matters: bg + surface + border are referenced in nearly
 * every screen via `bg-bg` / `bg-surface` / `border-border`, so
 * flipping the tokens here updates the whole app's feel in one
 * shot — every card on every tab now reads as an Apple dark-app
 * surface without per-screen edits.
 *
 * Cost we accepted: the warm plum tint that v2 brought is gone.
 * The user's brief was explicit (Apple Fitness / Apple Games /
 * Apple TV are the target), and the trade was the right one — a
 * neutral void is what lets the per-sermon accent colors and the
 * vibrant ambient atmosphere actually POP. With the warm bg, the
 * accents fought the canvas; on true black they read like the
 * Apple Fitness activity rings against their black summary.
 */
export const DARK_COLORS: ColorPalette = {
  bg: "#000000",
  surface: "#1C1C1E",
  ink: "#FFFFFF",
  // 60% white — Apple's secondaryLabel dark. We render the hex
  // with an explicit alpha suffix so callers that pass the value
  // straight to SVG/border don't have to do their own composition.
  inkMuted: "rgba(235, 235, 245, 0.60)",
  // 40% white — Apple's tertiaryLabel dark. Used for "deep
  // metadata": verse refs, timestamps, the date eyebrow, etc.
  inkSubtle: "rgba(235, 235, 245, 0.40)",
  primary: "#FFFFFF",
  primaryPressed: "#E5E5E5",
  // primaryFg stays true black — text on a white pill must hit
  // max contrast (the pill is the loud actor, the fg is its voice).
  primaryFg: "#000000",
  accent: "#FFFFFF",
  // Same fill as `surface` — Apple's soft-accent wells (the round
  // avatar in Fitness, the play-pill backdrop in TV) are just the
  // standard inset-card elevation, not a separate tint. Keeping
  // these in lockstep means the whole chrome reads as one
  // material instead of two slightly-different darks.
  accentSoft: "#1C1C1E",
  border: "#2C2C2E",
  borderStrong: "#3A3A3C",
  // Apple's systemBlue in dark mode — the iOS selection blue.
  // Used for chips and multi-select states across onboarding.
  select: "#0A84FF",
  // 18% blue at-alpha against bg — soft tint that reads as
  // "selected" without slamming the user with a solid blue block.
  selectSoft: "rgba(10, 132, 255, 0.18)",
};

/**
 * Light palette — "Imprint tuned."
 *
 * Iteration history:
 *   v1  pure white bg (#FFFFFF) + light-gray surface (#F7F7F8).
 *       This is the canonical Apple Books library palette —
 *       white page, slightly-darker gray cards. It's defensible
 *       on its own, but in our home screen it read as "gray
 *       card on bright white page" — the cards felt DEPRESSED
 *       into the page, not lifted above it. The user's reference
 *       was Imprint's home, which does the opposite move:
 *       white cards floating on a warm cream page.
 *   v2  (this) "Imprint tuned." Flips the elevation so the page
 *       is the cream-toned material and the cards are pure
 *       white, the way Imprint and Apple Books (LIBRARY view,
 *       not the reader) do it on iOS 17+. White-on-cream reads
 *       as "card lifted above page" without needing a heavy
 *       drop shadow to carry the elevation alone.
 *
 * The Imprint light system, as shipped here:
 *
 *   bg            #F4F1EB   warm off-white / cream — the canvas
 *                            tone Apple Books library and Imprint
 *                            both land on. Slight warmth saves
 *                            the surface from feeling clinical;
 *                            still bright enough that black ink
 *                            sings on top.
 *   surface       #FFFFFF   pure white — cards / sheets / inset
 *                            wells lift ABOVE the cream page
 *                            because they're literally a step
 *                            lighter. Inverted from the dark
 *                            palette's elevation logic (where
 *                            surface is a step LIGHTER than the
 *                            black void) — but the perceptual
 *                            move is the same: surface > bg.
 *   accentSoft    #F0EDE7   a hair darker than bg so avatar
 *                            wells / chip backdrops read as
 *                            inset rather than floating cards.
 *                            Apple Books uses this same trick
 *                            for "well" elements on its library
 *                            cream canvas.
 *   border        #E8E4DB   warm-tinted hairline calibrated to
 *                            the cream bg so card edges sit
 *                            without reading as cold gray rules.
 *   borderStrong  #D8D2C5   used only when a real edge needs to
 *                            be visible (pressed state, divider
 *                            inside a card).
 *   inkMuted      #6B6B72   neutral mid-gray. Pure black ink
 *                            stays at full strength; muted/subtle
 *                            shed weight via gray, not by going
 *                            warm (warm muted text starts to
 *                            read like a stain on cream).
 *
 * Why this matters: bg + surface + border drive every card on
 * every tab via Tailwind tokens (`bg-bg`, `bg-surface`,
 * `border-border`), so flipping the elevation here re-imprints
 * the whole app in one shot — every home card, every settings
 * row, every popover surface now sits as white-on-cream without
 * per-screen edits.
 *
 * `primary` stays ink-black so the PlayPill / CTAs read as a
 * single bold mark on the bright surface. `select` (selection
 * blue) and the saturated reds/oranges in sermon accents read
 * vibrantly against cream the same way they did against the
 * black void — saturated content + neutral chrome is the
 * universal Apple recipe.
 */
export const LIGHT_COLORS: ColorPalette = {
  // "Gentler Streak tuned." Iteration history:
  //   • v1 #F4F1EB cream — too yellow against photo content
  //   • v2 #F6F4F0 (Apple Books Library family) — still warmer
  //         than the Gentler Streak reference; the photo
  //         illustrations and the editorial-red accent fought
  //         the cream cast a hair.
  //   • v3 (this) #F8F7F4 — pulls almost all the yellow out
  //         while keeping enough warmth that pure-white cards
  //         still lift perceptibly above the page. Reads as a
  //         soft daylight white the way Gentler Streak's body
  //         sheet does, and lets the editorial red pop without
  //         competing chroma in the canvas itself.
  bg: "#F8F7F4",
  surface: "#FFFFFF",
  ink: "#0F0F0F",
  inkMuted: "#6B6B72",
  inkSubtle: "#8F8F96",
  primary: "#0F0F0F",
  primaryPressed: "#2A2A2A",
  primaryFg: "#FFFFFF",
  accent: "#0F0F0F",
  // Accent-soft mirrors the bg warmth — used by avatar wells and
  // chip backdrops which should feel inset rather than floating.
  accentSoft: "#F0EDE8",
  border: "#E8E4DD",
  borderStrong: "#D8D3CA",
  // Apple's systemBlue in light mode.
  select: "#007AFF",
  selectSoft: "rgba(0, 122, 255, 0.12)",
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

/**
 * iOS system color palette (dark-mode values).
 *
 * Apple Fitness, Health, Music, and TV all pull from this exact
 * set when they tint metrics, ring fills, or category badges. The
 * single visual lesson from Apple Fitness's Summary screen is
 * that CHROME stays monochromatic (#1C1C1E surface, white labels)
 * but METRIC VALUES light up in a saturated semantic hue: Move
 * calories in pink-red, Steps in purple, Distance in cyan,
 * Sessions in green. Each metric earns its own color so the
 * user's eye scans the page and immediately knows "the orange
 * number is my streak, the cyan is my reading time."
 *
 * We expose the full palette here (not just the three we use
 * today) so future surfaces — insights charts, mood badges,
 * journey milestones — can reach into the same iOS-tuned set
 * without anyone having to eyeball custom hex.
 *
 * Values are Apple's published dark-mode UIDynamicColor hex.
 * Light mode values would be slightly different (Apple's
 * systemRed is #FF453A in dark, #FF3B30 in light); when we
 * re-enable light mode we'll add a SYSTEM_LIGHT counterpart.
 */
export const SYSTEM_COLORS_DARK = {
  red: "#FF453A",
  orange: "#FF9F0A",
  yellow: "#FFD60A",
  green: "#30D158",
  mint: "#66D4CF",
  teal: "#40C8E0",
  cyan: "#64D2FF",
  blue: "#0A84FF",
  indigo: "#5E5CE6",
  purple: "#BF5AF2",
  pink: "#FF375F",
  brown: "#AC8E68",
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
    "--color-select": palette.select,
    "--color-select-soft": palette.selectSoft,
  };
}
