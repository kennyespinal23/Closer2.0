import { View, type ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";
import { findSocialApp, type SocialAppId } from "@/lib/focus";
import { BRAND_GLYPHS } from "@/lib/socialAppGlyphs";

/**
 * BrandGlyph — the reusable iOS-app-tile chip used everywhere a
 * blockable app is represented visually.
 *
 * Outer chip = the app's brand color (e.g. Instagram pink, YouTube
 * red). Inner glyph = the app's logomark in white, scaled to a
 * comfortable visual weight against the chip. Snapchat is the only
 * exception — its yellow chip carries a dark glyph because white
 * on yellow has too little contrast.
 *
 * Used in:
 *   • settings/focus → AppRow leading icon
 *   • ShieldOverlay  → centered hero glyph
 *   • home FocusToggle → mini-chip in the avatar stack
 *   • profile drawer → eventually, as a "blocked apps" preview
 *
 * Visual weight: the glyph inside is ~58% of the chip dimension by
 * default, which lands close to iOS's own app-icon stroke-to-frame
 * ratio. Pass a `glyphRatio` override if you want a smaller (more
 * room around) or larger (denser) glyph.
 *
 * Falls back to a neutral gray chip with no glyph if the appId
 * isn't in the catalog — keeps lists rendering safely if a saved
 * preference references an app we've since dropped.
 */

export type BrandGlyphSize = "xs" | "sm" | "md" | "lg" | "xl";

/**
 * Per-size tuning. Tweaked individually rather than computed from
 * the chip size because the visual weight of a glyph doesn't scale
 * linearly — small chips need a relatively-larger glyph to read.
 */
const SIZES: Record<
  BrandGlyphSize,
  { chip: number; glyph: number; radius: number }
> = {
  xs: { chip: 22, glyph: 13, radius: 6 },
  sm: { chip: 32, glyph: 18, radius: 8 },
  md: { chip: 40, glyph: 22, radius: 10 },
  lg: { chip: 64, glyph: 38, radius: 14 },
  xl: { chip: 96, glyph: 58, radius: 22 },
};

export type BrandGlyphProps = {
  /**
   * The app to render. Typed loosely as `string` so call sites with
   * un-narrowed values (e.g. saved-preference arrays) compile, but
   * we validate against the catalog at runtime.
   */
  appId: SocialAppId | string;
  /** Preset size — defaults to "md". */
  size?: BrandGlyphSize;
  /**
   * Override the glyph-to-chip ratio when the preset doesn't fit.
   * 0..1, where 1 means the glyph fills the chip edge-to-edge.
   * Mostly useful for one-off layouts that need extra padding
   * (e.g. when the chip already sits inside a halo).
   */
  glyphRatio?: number;
  style?: ViewStyle;
};

export function BrandGlyph({
  appId,
  size = "md",
  glyphRatio,
  style,
}: BrandGlyphProps) {
  const app = findSocialApp(appId);
  const dims = SIZES[size];
  const glyphSize = glyphRatio
    ? Math.round(dims.chip * glyphRatio)
    : dims.glyph;

  // Catalog miss — render a neutral chip. We don't render a "?" or
  // any other hint glyph because (a) it'd flash for the brief
  // window during a hot-reload while a new id is being added, and
  // (b) a clean empty chip is friendlier than a debug indicator.
  if (!app) {
    return (
      <View
        style={[
          {
            width: dims.chip,
            height: dims.chip,
            borderRadius: dims.radius,
            backgroundColor: "rgba(120,120,120,0.35)",
          },
          style,
        ]}
      />
    );
  }

  const glyph = BRAND_GLYPHS[app.id];
  // Snapchat's yellow chip uses a dark glyph; everything else uses
  // white. The brand catalog stores the color as the source of
  // truth, so we compare against the literal yellow rather than
  // hard-coding the app id — if Snapchat ever rebrands, the chip
  // foreground recomputes automatically.
  const glyphColor = app.color === "#FFFC00" ? "#0D0D0D" : "#FFFFFF";

  return (
    <View
      style={[
        {
          width: dims.chip,
          height: dims.chip,
          borderRadius: dims.radius,
          backgroundColor: app.color,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        },
        style,
      ]}
    >
      <Svg
        width={glyphSize}
        height={glyphSize}
        viewBox="0 0 24 24"
        // The Path itself uses `fill`; we leave the Svg-level fill
        // alone so theme-aware overrides still work if a future
        // caller wants to recolor the glyph.
      >
        <Path
          d={glyph.path}
          fill={glyphColor}
          fillRule={glyph.fillRule ?? "nonzero"}
        />
      </Svg>
    </View>
  );
}
