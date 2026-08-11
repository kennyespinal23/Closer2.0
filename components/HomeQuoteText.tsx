import { Text, View } from "react-native";
import type { HomeQuote, HomeQuoteSegment } from "@/lib/homeQuotes";
import { SF_PRO } from "@/lib/typography";
import { useColors, useResolvedScheme } from "@/state/theme";

/** Shantell Sans Bold — registered in `app/_layout.tsx` via
 *  expo-google-fonts. The whole home quote body uses this face. */
export const HANDWRITTEN = "ShantellSans_700Bold";

const QUOTE_SIZE = 42;
/**
 * Shared line box for the whole run. Applied to the outer Text AND
 * every nested segment span so leading stays even across wraps.
 * Inline nested <Text> (not a custom wrapper) keeps wrap gaps from
 * blowing open the way block-stacked segments did.
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

/** Per-segment style — face is always Shantell Sans Bold; ink is
 *  theme ink for every segment (no catalog accent colors on type).
 *  Underlines still use their accent color when authored. */
function segmentStyle(
  segment: HomeQuoteSegment,
  scheme: "light" | "dark",
  ink: string,
) {
  const underlineColor = segment.underline
    ? resolveQuoteColor(
        segment.underlineColor ?? segment.color,
        scheme,
        ink,
      )
    : undefined;

  return {
    fontFamily: HANDWRITTEN,
    // Weight lives in the loaded Bold face — keep Regular here so
    // iOS doesn't synthetically embolden again.
    fontWeight: "400" as const,
    fontSize: QUOTE_SIZE,
    lineHeight: LINE,
    letterSpacing: 0,
    color: ink,
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
    fontFamily: HANDWRITTEN,
    fontWeight: "400" as const,
    fontSize: QUOTE_SIZE,
    lineHeight: LINE,
    letterSpacing: 0,
    color: colors.ink,
  };

  return (
    <View
      style={{
        alignItems: "center",
        maxWidth,
        paddingHorizontal: 4,
        // Extra paint room above/below the Text frame.
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
