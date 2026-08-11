import { useCallback, useState } from "react";
import {
  Animated,
  Platform,
  type StyleProp,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import Svg, { G, Line, Path } from "react-native-svg";
import { typography } from "@/lib/typography";

const PAPER = "#F4F0E6";
const PAPER_INK = "#141414";
const PAPER_INK_MUTED = "rgba(20, 20, 20, 0.62)";
const JAG = 6;
const STEP = 14;
const CONTENT_PAD = 32;
const CONTENT_PAD_LIST = 18;

/** Compact upright New York for list scrap quotes — reflective surface only. */
const listQuote = {
  fontFamily: typography.photoQuote.fontFamily,
  fontStyle: "normal" as const,
  fontWeight: typography.photoQuote.fontWeight,
  fontSize: 17,
  lineHeight: 24,
  textAlign: "center" as const,
  letterSpacing: 0,
};

/** Deckled rectangle — deterministic zigzag so edges feel torn, not clip-mask round. */
function buildTornPaperPath(w: number, h: number): string {
  const parts: string[] = [`M 0 ${JAG}`];

  for (let x = STEP; x <= w; x += STEP) {
    const y = Math.floor(x / STEP) % 2 === 0 ? 0 : JAG;
    parts.push(`L ${Math.min(x, w)} ${y}`);
  }
  if (w % STEP !== 0) parts.push(`L ${w} ${JAG}`);

  for (let y = STEP; y <= h; y += STEP) {
    const x = Math.floor(y / STEP) % 2 === 0 ? w : w - JAG;
    parts.push(`L ${x} ${Math.min(y, h)}`);
  }
  if (h % STEP !== 0) parts.push(`L ${w - JAG} ${h}`);

  for (let x = w - STEP; x >= 0; x -= STEP) {
    const y = Math.floor(x / STEP) % 2 === 0 ? h : h - JAG;
    parts.push(`L ${Math.max(x, 0)} ${y}`);
  }

  for (let y = h - STEP; y >= 0; y -= STEP) {
    const x = Math.floor(y / STEP) % 2 === 0 ? 0 : JAG;
    parts.push(`L ${x} ${Math.max(y, 0)}`);
  }

  parts.push("Z");
  return parts.join(" ");
}

const STICKER_SHADOW = Platform.select({
  ios: {
    shadowColor: "#1A1510",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
  },
  android: { elevation: 8 },
  default: {},
});

type ScriptureStickerNoteProps = {
  quote: string;
  reference?: string;
  maxWidth: number;
  rotationDeg?: number;
  /** Hero (home sticker) vs compact list scrap. */
  variant?: "hero" | "list";
  /** Cap quote lines in list scrap so rows stay scannable. */
  numberOfLines?: number;
  /** Fades verse + reference only — paper stays fully opaque. */
  textOpacity?: Animated.Value | number;
  style?: StyleProp<ViewStyle>;
};

const LIST_SHADOW = Platform.select({
  ios: {
    shadowColor: "#1A1510",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
  },
  android: { elevation: 4 },
  default: {},
});

/**
 * Cream scripture "sticker" — verse sits on torn paper over the photo,
 * not directly on the background image. `variant="list"` is the compact
 * scrap used above completed-devotional rows.
 */
export function ScriptureStickerNote({
  quote,
  reference,
  maxWidth,
  rotationDeg = -1.15,
  variant = "hero",
  numberOfLines,
  textOpacity = 1,
  style,
}: ScriptureStickerNoteProps) {
  const [sheet, setSheet] = useState<{ w: number; h: number } | null>(null);
  const isList = variant === "list";
  const pad = isList ? CONTENT_PAD_LIST : CONTENT_PAD;

  const onContentLayout = useCallback((w: number, h: number) => {
    const nextW = Math.ceil(w);
    const nextH = Math.ceil(h);
    setSheet((prev) =>
      prev?.w === nextW && prev?.h === nextH ? prev : { w: nextW, h: nextH },
    );
  }, []);

  return (
    <View
      style={[
        {
          maxWidth,
          alignSelf: isList ? "stretch" : "center",
          width: isList ? "100%" : undefined,
          transform: [{ rotate: `${rotationDeg}deg` }],
        },
        style,
      ]}
    >
      <View style={isList ? LIST_SHADOW : STICKER_SHADOW}>
        <View style={{ position: "relative" }}>
          {sheet ? (
            <Svg
              width={sheet.w + JAG * 2}
              height={sheet.h + JAG * 2}
              style={{
                position: "absolute",
                top: -JAG,
                left: -JAG,
                zIndex: 0,
              }}
            >
              <G transform={`translate(${JAG}, ${JAG})`}>
                <Path d={buildTornPaperPath(sheet.w, sheet.h)} fill={PAPER} />
                {Array.from(
                  { length: Math.ceil(sheet.h / (isList ? 18 : 22)) },
                  (_, i) => (
                    <Line
                      key={i}
                      x1={0}
                      y1={i * (isList ? 18 : 22) + 8}
                      x2={sheet.w}
                      y2={i * (isList ? 18 : 22) + 11}
                      stroke="rgba(30, 24, 18, 0.035)"
                      strokeWidth={1}
                    />
                  ),
                )}
              </G>
            </Svg>
          ) : null}

          <View
            onLayout={(event) => {
              const { width, height } = event.nativeEvent.layout;
              onContentLayout(width, height);
            }}
            style={{
              padding: pad,
              maxWidth,
              width: isList ? "100%" : undefined,
              zIndex: 1,
              backgroundColor: sheet ? "transparent" : PAPER,
            }}
          >
            <Animated.View style={{ opacity: textOpacity }}>
              <Text
                style={[
                  isList ? listQuote : typography.photoQuote,
                  { color: PAPER_INK, textAlign: "center" },
                ]}
                numberOfLines={numberOfLines}
              >
                {quote}
              </Text>
              {reference ? (
                <Text
                  style={[
                    typography.smallLabel,
                    {
                      color: PAPER_INK_MUTED,
                      textTransform: "uppercase",
                      marginTop: isList ? 10 : 18,
                      textAlign: "center",
                    },
                  ]}
                >
                  {reference}
                </Text>
              ) : null}
            </Animated.View>
          </View>
        </View>
      </View>
    </View>
  );
}
