import { Image, Text, View } from "react-native";
import type { Insight } from "@/constants/insights";

/**
 * Width/height of a local image asset, looked up at module level.
 *
 * `Image.resolveAssetSource` is synchronous for `require()`'d local
 * assets (Metro bundles dimensions into the JS payload), so we can
 * compute aspect ratio without an async load. We `try/catch` because
 * if the asset can't be resolved we'd rather show the article than
 * crash the screen.
 */
function safeAspect(
  source: ReturnType<typeof require> | undefined,
  fallback: number,
): number {
  if (!source) return fallback;
  try {
    const r = Image.resolveAssetSource(source);
    if (r && r.width && r.height) return r.width / r.height;
  } catch {
    // fall through
  }
  return fallback;
}

/**
 * The hero block displayed at the top of every Insight card and at
 * the top of the article detail screen.
 *
 * Two render modes:
 *   1. If the Insight ships with a `hero` image, render it cover-fit.
 *   2. Otherwise, render a typographic fallback — a large initial
 *      letterform over the palette background plus a corner monogram.
 *      This lets us ship articles before art lands without cards
 *      looking like placeholders.
 *
 * Sharing the component means both surfaces stay visually
 * consistent — if we ever change the fallback monogram or accent
 * placement, the change happens in one place.
 */
export function ArticleHero({
  insight,
  height,
  coverWidth,
  rounded = false,
}: {
  insight: Insight;
  /**
   * Target height in points for the illustrative-hero render. Used
   * when `insight.coverIncludesTitle` is false (the default). When
   * true, the hero switches to book-cover mode and `coverWidth`
   * drives layout instead.
   */
  height: number;
  /**
   * Required when `insight.coverIncludesTitle` is true. The width of
   * the cover in points; height is computed from the asset's natural
   * aspect ratio so the artwork is never cropped or letterboxed.
   *
   * Why explicit width (not "fill parent"): book covers want
   * thumbnail-sized renders in rails and a larger but still
   * bounded render on detail. Letting `width: 100%` drive layout
   * here would expand a portrait cover to ~400pt tall even in a
   * 280pt rail card, dominating the screen.
   */
  coverWidth?: number;
  rounded?: boolean;
}) {
  const radius = rounded ? 24 : 0;

  if (insight.hero) {
    // Book-cover artwork: render at the requested width, height
    // computed from the asset's natural aspect ratio so the
    // baked-in title is never cropped or letterboxed.
    if (insight.coverIncludesTitle) {
      const aspect = safeAspect(insight.hero, 684 / 1024);
      const w = coverWidth ?? 240;
      const h = w / aspect;
      return (
        <View
          style={{
            width: w,
            height: h,
            borderRadius: radius,
            overflow: "hidden",
            backgroundColor: insight.palette.bg,
          }}
        >
          <Image
            source={insight.hero}
            style={{ width: w, height: h }}
            resizeMode="cover"
          />
        </View>
      );
    }

    return (
      <View style={{ height, borderRadius: radius, overflow: "hidden" }}>
        <Image
          source={insight.hero}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
      </View>
    );
  }

  const initial = firstWordInitial(insight.title);

  return (
    <View
      style={{
        height,
        backgroundColor: insight.palette.bg,
        borderRadius: radius,
        overflow: "hidden",
      }}
    >
      {/* Two soft translucent ovals stacked to give the flat fill
          some depth — cheaper than pulling in a gradient library for
          one decorative element. */}
      <View
        style={{
          position: "absolute",
          top: -height * 0.4,
          right: -height * 0.3,
          width: height * 1.2,
          height: height * 1.2,
          borderRadius: height * 0.6,
          backgroundColor: hexWithAlpha(insight.palette.accent, 0.18),
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: -height * 0.3,
          left: -height * 0.2,
          width: height * 0.9,
          height: height * 0.9,
          borderRadius: height * 0.45,
          backgroundColor: hexWithAlpha(insight.palette.ink, 0.06),
        }}
      />

      {/* Centered initial — the heart of the fallback. */}
      <View className="flex-1 items-center justify-center">
        <Text
          style={{
            fontFamily: "PlusJakartaSans_800ExtraBold",
            fontSize: Math.round(height * 0.55),
            lineHeight: Math.round(height * 0.55),
            color: insight.palette.ink,
            opacity: 0.92,
            letterSpacing: -2,
          }}
        >
          {initial}
        </Text>
      </View>

      {/* Bottom-left eyebrow — magazine-cover seal energy. */}
      <View style={{ position: "absolute", bottom: 12, left: 14 }}>
        <Text
          style={{
            fontFamily: "PlusJakartaSans_700Bold",
            fontSize: 9.5,
            letterSpacing: 2.5,
            color: insight.palette.ink,
            opacity: 0.5,
            textTransform: "uppercase",
          }}
        >
          Closer · Faith Basics
        </Text>
      </View>
    </View>
  );
}

/**
 * Extract the initial of the first non-stop-word in the title so the
 * fallback hero gets a strong letter ("G" for "What Is Grace?",
 * not "W"). Falls back to the first character on titles with no
 * non-stop words (vanishingly rare).
 */
export function firstWordInitial(title: string): string {
  const STOP = new Set([
    "what",
    "is",
    "the",
    "a",
    "an",
    "of",
    "and",
    "or",
    "for",
    "to",
  ]);
  const tokens = title
    .replace(/[?.!]/g, "")
    .split(/\s+/)
    .filter(Boolean);
  for (const t of tokens) {
    if (!STOP.has(t.toLowerCase())) return t.charAt(0).toUpperCase();
  }
  return (tokens[0] ?? "•").charAt(0).toUpperCase();
}

/**
 * Convert "#RRGGBB" + 0..1 alpha → "#RRGGBBAA". Used for the soft
 * tint layers inside the typographic hero and the scripture-ref
 * card. We use this instead of `rgba()` so the resulting color
 * composes cleanly with `style.borderRadius` and `overflow:hidden`
 * (which can render edge artifacts when an rgba background sits
 * inside a clipped view on iOS).
 */
export function hexWithAlpha(hex: string, alpha: number): string {
  const a = Math.max(0, Math.min(1, alpha));
  const hh = Math.round(a * 255)
    .toString(16)
    .padStart(2, "0")
    .toUpperCase();
  const long =
    hex.length === 4
      ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
      : hex;
  return `${long}${hh}`;
}
