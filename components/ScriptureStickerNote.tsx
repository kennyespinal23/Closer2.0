import { useCallback, useState } from "react";
import {
  Platform,
  type StyleProp,
  StyleSheet,
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
  style?: StyleProp<ViewStyle>;
};

/**
 * Cream scripture "sticker" — verse sits on torn paper over the photo,
 * not directly on the background image.
 */
export function ScriptureStickerNote({
  quote,
  reference,
  maxWidth,
  rotationDeg = -1.15,
  style,
}: ScriptureStickerNoteProps) {
  const [sheet, setSheet] = useState<{ w: number; h: number } | null>(null);

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
          alignSelf: "center",
          transform: [{ rotate: `${rotationDeg}deg` }],
        },
        style,
      ]}
    >
      <View style={STICKER_SHADOW}>
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
                {Array.from({ length: Math.ceil(sheet.h / 22) }, (_, i) => (
                  <Line
                    key={i}
                    x1={0}
                    y1={i * 22 + 8}
                    x2={sheet.w}
                    y2={i * 22 + 11}
                    stroke="rgba(30, 24, 18, 0.035)"
                    strokeWidth={1}
                  />
                ))}
              </G>
            </Svg>
          ) : null}

          <View
            onLayout={(event) => {
              const { width, height } = event.nativeEvent.layout;
              onContentLayout(width, height);
            }}
            style={{
              padding: CONTENT_PAD,
              maxWidth,
              zIndex: 1,
              backgroundColor: sheet ? "transparent" : PAPER,
            }}
          >
            <Text
              style={[
                typography.photoQuote,
                { color: PAPER_INK, textAlign: "center" },
              ]}
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
                    marginTop: 18,
                    textAlign: "center",
                  },
                ]}
              >
                {reference}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}
