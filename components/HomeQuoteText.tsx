import { Text, View } from "react-native";
import type { HomeQuote, HomeQuoteSegment } from "@/lib/homeQuotes";
import { SF_PRO } from "@/lib/typography";
import { useColors, useResolvedScheme } from "@/state/theme";

/** Kalam face registered in `app/_layout.tsx` via expo-google-fonts.
 *  JSON still tags handwritten segments as `"caveat"`; we map that
 *  role to Kalam at render time. */
export const HANDWRITTEN = "Kalam_400Regular";

const HAND_SIZE = 42;
const SANS_SIZE = 34;
/**
 * Shared line box for the whole run. Applied to the outer Text AND
 * every nested segment span so leading stays even. Must clear Kalam’s
 * ascenders at HAND_SIZE (≈1.3×) — anything tighter clips the first
 * line flat. Inline nested <Text> (not a custom wrapper) keeps wrap
 * gaps from blowing open the way block-stacked segments did.
 */
const LINE = 56;

/** Accent red used in the quote catalog — bright enough on dark. */
const ACCENT_DARK = "#FF453A";

function parseHex(color: string): { r: number; g: number; b: number } | null {
  const raw = color.trim().replace("#", "");
  if (/^[0-9a-fA-F]{3}$/.test(raw)) {
    return {
      r: parseInt(raw[0]! + raw[0]!, 16),
      g: parseInt(raw[1]! + raw[1]!, 16),
      b: parseInt(raw[2]! + raw[2]!, 16),
    };
  }
  if (/^[0-9a-fA-F]{6}$/.test(raw)) {
    return {
      r: parseInt(raw.slice(0, 2), 16),
      g: parseInt(raw.slice(2, 4), 16),
      b: parseInt(raw.slice(4, 6), 16),
    };
  }
  return null;
}

/** Relative luminance 0–1 (sRGB). */
function luminance(hex: string): number {
  const rgb = parseHex(hex);
  if (!rgb) return 1;
  const toLin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * toLin(rgb.r) + 0.7152 * toLin(rgb.g) + 0.0722 * toLin(rgb.b);
}

function isAccentRed(hex: string): boolean {
  const rgb = parseHex(hex);
  if (!rgb) return false;
  // Catalog accents are warm system reds (#FF3B30 family).
  return rgb.r > 200 && rgb.g < 100 && rgb.b < 100;
}

/**
 * Quote JSON is authored for the light cream canvas (black + red).
 * Remap near-black body ink to theme ink in dark mode; keep / tune
 * the red accent so it still pops on black.
 */
function resolveQuoteColor(
  hex: string,
  scheme: "light" | "dark",
  ink: string,
): string {
  if (scheme === "light") return hex;
  if (isAccentRed(hex)) return ACCENT_DARK;
  if (luminance(hex) < 0.25) return ink;
  return hex;
}

/** Per-segment style — font / color / underline from THAT segment only. */
function segmentStyle(
  segment: HomeQuoteSegment,
  scheme: "light" | "dark",
  ink: string,
) {
  const isHand = segment.font === "caveat";
  const color = resolveQuoteColor(segment.color, scheme, ink);
  const underlineColor = segment.underline
    ? resolveQuoteColor(
        segment.underlineColor ?? segment.color,
        scheme,
        ink,
      )
    : undefined;

  return {
    fontFamily: isHand ? HANDWRITTEN : SF_PRO,
    fontWeight: (isHand ? "400" : "700") as "400" | "700",
    fontSize: isHand ? HAND_SIZE : SANS_SIZE,
    lineHeight: LINE,
    letterSpacing: isHand ? 0 : -0.4,
    color,
    textDecorationLine: (segment.underline ? "underline" : "none") as
      | "underline"
      | "none",
    textDecorationColor: underlineColor,
  };
}

type HomeQuoteTextProps = {
  quote: HomeQuote;
  /** Max width for wrapping the inline segment run. */
  maxWidth?: number;
};

/**
 * Renders a home quote as one continuous centered paragraph —
 * each `segments[]` entry becomes its own nested <Text> with that
 * segment’s font, color, and underline. Must stay as direct <Text>
 * children (not a custom wrapper component) so RN keeps them inline.
 */
export function HomeQuoteText({ quote, maxWidth = 320 }: HomeQuoteTextProps) {
  const colors = useColors();
  const scheme = useResolvedScheme();

  const markStyle = {
    fontFamily: SF_PRO,
    fontWeight: "700" as const,
    fontSize: SANS_SIZE,
    lineHeight: LINE,
    letterSpacing: -0.4,
    color: colors.ink,
  };

  return (
    <View
      style={{
        alignItems: "center",
        maxWidth,
        paddingHorizontal: 4,
        // Extra paint room above/below the Text frame — lineHeight
        // alone still clips Kalam on the first/last line on iOS.
        paddingTop: 14,
        paddingBottom: 8,
        overflow: "visible",
      }}
    >
      <Text
        allowFontScaling={false}
        style={{
          textAlign: "center",
          lineHeight: LINE,
          // First-line ascenders still clip inside the Text frame on
          // iOS with Kalam; this expands the clip rect without changing
          // the gap between wrapped lines.
          paddingTop: 6,
          paddingBottom: 4,
          overflow: "visible",
        }}
      >
        <Text allowFontScaling={false} style={markStyle}>
          {"\u201C"}
        </Text>
        {quote.segments.map((segment, index) => (
          <Text
            key={`${quote.id}-${index}`}
            allowFontScaling={false}
            style={segmentStyle(segment, scheme, colors.ink)}
          >
            {segment.text}
          </Text>
        ))}
        <Text allowFontScaling={false} style={markStyle}>
          {"\u201D"}
        </Text>
      </Text>
      {quote.reference ? (
        <Text
          allowFontScaling={false}
          style={{
            fontFamily: SF_PRO,
            fontWeight: "500",
            fontSize: 14,
            lineHeight: 20,
            letterSpacing: -0.08,
            color: colors.inkMuted,
            textAlign: "center",
            marginTop: 10,
          }}
        >
          {quote.reference}
        </Text>
      ) : null}
    </View>
  );
}
