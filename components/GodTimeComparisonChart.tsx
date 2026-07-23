import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, Text, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import { CLOSER_ACCENT } from "@/constants/theme";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useColors } from "@/state/theme";

const AnimatedPath = Animated.createAnimatedComponent(Path);

const CHART_WIDTH = 320;
const CHART_HEIGHT = 220;
const PAD = { left: 10, right: 18, top: 36, bottom: 28 };

type Point = { x: number; y: number };

/** Smooth rising S-curve — Closer protocol (higher = more alert / with God). */
const CLOSER_CURVE: ReadonlyArray<Point> = [
  { x: 0, y: 0.12 },
  { x: 0.22, y: 0.18 },
  { x: 0.42, y: 0.42 },
  { x: 0.62, y: 0.72 },
  { x: 0.82, y: 0.9 },
  { x: 1, y: 0.94 },
];

/** Jagged low path — phone-first mornings. */
const PHONE_CURVE: ReadonlyArray<Point> = [
  { x: 0, y: 0.22 },
  { x: 0.1, y: 0.34 },
  { x: 0.18, y: 0.14 },
  { x: 0.28, y: 0.3 },
  { x: 0.36, y: 0.1 },
  { x: 0.46, y: 0.28 },
  { x: 0.54, y: 0.12 },
  { x: 0.64, y: 0.26 },
  { x: 0.72, y: 0.14 },
  { x: 0.82, y: 0.22 },
  { x: 0.9, y: 0.32 },
  { x: 1, y: 0.48 },
];

function toPixels(
  points: ReadonlyArray<Point>,
  width: number,
  height: number,
): Point[] {
  const innerW = width - PAD.left - PAD.right;
  const innerH = height - PAD.top - PAD.bottom;
  return points.map((p) => ({
    x: PAD.left + p.x * innerW,
    y: PAD.top + (1 - p.y) * innerH,
  }));
}

function buildSmoothPath(points: Point[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0]!.x} ${points[0]!.y}`;

  let d = `M ${points[0]!.x} ${points[0]!.y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i]!;
    const p1 = points[i + 1]!;
    const cx = (p0.x + p1.x) / 2;
    d += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  return d;
}

/** Angular polyline for the erratic phone path. */
function buildJaggedPath(points: Point[]): string {
  if (points.length === 0) return "";
  return points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");
}

function estimatePathLength(points: Point[]): number {
  let len = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i]!.x - points[i - 1]!.x;
    const dy = points[i]!.y - points[i - 1]!.y;
    len += Math.hypot(dx, dy);
  }
  return len * 1.2;
}

/**
 * Wayk-style comparison chart — smooth Closer rise vs jagged
 * phone-first mornings, with a soft "drift zone" wash.
 */
export function GodTimeComparisonChart() {
  const colors = useColors();
  const reducedMotion = useReducedMotion();
  const progress = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;

  const closerPx = useMemo(
    () => toPixels(CLOSER_CURVE, CHART_WIDTH, CHART_HEIGHT),
    [],
  );
  const phonePx = useMemo(
    () => toPixels(PHONE_CURVE, CHART_WIDTH, CHART_HEIGHT),
    [],
  );

  const closerPath = useMemo(() => buildSmoothPath(closerPx), [closerPx]);
  const phonePath = useMemo(() => buildJaggedPath(phonePx), [phonePx]);
  const closerLen = useMemo(() => estimatePathLength(closerPx), [closerPx]);
  const phoneLen = useMemo(() => estimatePathLength(phonePx), [phonePx]);

  const closerEnd = closerPx[closerPx.length - 1]!;
  const phoneEnd = phonePx[phonePx.length - 1]!;

  // Badge sits along the rising curve (~45% through).
  const closerBadge = closerPx[Math.floor(closerPx.length * 0.45)]!;
  // Phone label over an early dip.
  const phoneBadge = phonePx[3]!;

  const zoneTopY = PAD.top + (1 - 0.38) * (CHART_HEIGHT - PAD.top - PAD.bottom);

  useEffect(() => {
    if (reducedMotion) {
      progress.setValue(1);
      return;
    }
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 1800,
      delay: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, reducedMotion]);

  const closerOffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [closerLen, 0],
  });
  const phoneOffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [phoneLen, 0],
  });

  const inkLine = colors.ink;

  return (
    <View style={{ width: "100%", maxWidth: CHART_WIDTH, alignSelf: "center" }}>
      <View
        style={{
          borderRadius: 22,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          paddingTop: 18,
          paddingHorizontal: 14,
          paddingBottom: 16,
          shadowColor: "#1A1510",
          shadowOpacity: 0.08,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
        }}
      >
        <Text
          style={{
            fontFamily: "System",
            fontWeight: "700",
            fontSize: 17,
            letterSpacing: -0.3,
            color: colors.ink,
            marginBottom: 8,
            marginLeft: 4,
          }}
        >
          Morning with God
        </Text>

        <View style={{ position: "relative" }}>
          <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
            <Defs>
              <LinearGradient id="driftZone" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={CLOSER_ACCENT} stopOpacity={0} />
                <Stop offset="0.35" stopColor={CLOSER_ACCENT} stopOpacity={0.06} />
                <Stop offset="1" stopColor={CLOSER_ACCENT} stopOpacity={0.16} />
              </LinearGradient>
            </Defs>

            {/* Soft drift-zone wash across the lower band */}
            <Path
              d={`M ${PAD.left} ${zoneTopY} L ${CHART_WIDTH - PAD.right} ${zoneTopY} L ${
                CHART_WIDTH - PAD.right
              } ${CHART_HEIGHT - PAD.bottom} L ${PAD.left} ${
                CHART_HEIGHT - PAD.bottom
              } Z`}
              fill="url(#driftZone)"
            />

            <SvgText
              x={CHART_WIDTH - PAD.right - 8}
              y={CHART_HEIGHT - PAD.bottom - 18}
              fill={CLOSER_ACCENT}
              opacity={0.45}
              fontSize={11}
              fontWeight="700"
              letterSpacing={1.2}
              textAnchor="end"
            >
              DRIFT ZONE
            </SvgText>

            <AnimatedPath
              d={phonePath}
              stroke={CLOSER_ACCENT}
              strokeWidth={2.5}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={`${phoneLen} ${phoneLen}`}
              strokeDashoffset={phoneOffset}
            />

            <AnimatedPath
              d={closerPath}
              stroke={inkLine}
              strokeWidth={4}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={`${closerLen} ${closerLen}`}
              strokeDashoffset={closerOffset}
            />

            <Circle
              cx={phoneEnd.x}
              cy={phoneEnd.y}
              r={6}
              fill={colors.surface}
              stroke={CLOSER_ACCENT}
              strokeWidth={2.5}
            />
            <Circle cx={closerEnd.x} cy={closerEnd.y} r={6} fill={inkLine} />
          </Svg>

          {/* Closer Protocol pill — overlays the rising curve */}
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: Math.max(8, closerBadge.x - 58),
              top: Math.max(4, closerBadge.y - 44),
              backgroundColor: inkLine,
              borderRadius: 999,
              paddingHorizontal: 12,
              paddingVertical: 7,
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
            }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 12 }}>✦</Text>
            <Text
              style={{
                color: "#FFFFFF",
                fontFamily: "System",
                fontWeight: "700",
                fontSize: 12,
                letterSpacing: -0.1,
              }}
            >
              Closer Protocol
            </Text>
          </View>

          {/* Phone-first pill */}
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: Math.max(8, phoneBadge.x - 4),
              top: Math.min(phoneBadge.y + 8, CHART_HEIGHT - 48),
              backgroundColor: colors.surface,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: "rgba(255, 67, 38, 0.35)",
              paddingHorizontal: 10,
              paddingVertical: 5,
            }}
          >
            <Text
              style={{
                color: CLOSER_ACCENT,
                fontFamily: "System",
                fontWeight: "600",
                fontSize: 11,
              }}
            >
              Phone first
            </Text>
          </View>
        </View>

        <Text
          style={{
            marginTop: 10,
            textAlign: "center",
            fontFamily: "System",
            fontWeight: "400",
            fontSize: 13,
            lineHeight: 18,
            color: colors.inkSecondary,
            paddingHorizontal: 8,
          }}
        >
          Avoid the drift zone. Closer puts God first — before the noise.
        </Text>
      </View>
    </View>
  );
}
