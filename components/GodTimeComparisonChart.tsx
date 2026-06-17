import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Text, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Path,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import { CLOSER_ACCENT } from "@/constants/theme";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useColors } from "@/state/theme";

const AnimatedPath = Animated.createAnimatedComponent(Path);

const CHART_WIDTH = 300;
const CHART_HEIGHT = 168;
const PAD = { left: 8, right: 12, top: 14, bottom: 30 };

/** Normalized 0..1 — y is "time with God" (higher = more). */
const WITHOUT_CLOSER = [
  { x: 0, y: 0.78 },
  { x: 1, y: 0.62 },
  { x: 2, y: 0.46 },
  { x: 3, y: 0.3 },
] as const;

const WITH_CLOSER = [
  { x: 0, y: 0.28 },
  { x: 1, y: 0.48 },
  { x: 2, y: 0.66 },
  { x: 3, y: 0.86 },
] as const;

const X_LABELS = ["Wk 1", "Wk 2", "Wk 3", "Wk 4"] as const;

type Point = { x: number; y: number };

function toPixels(
  points: ReadonlyArray<Point>,
  width: number,
  height: number,
): Point[] {
  const innerW = width - PAD.left - PAD.right;
  const innerH = height - PAD.top - PAD.bottom;
  const maxX = points[points.length - 1]?.x ?? 1;

  return points.map((p) => ({
    x: PAD.left + (p.x / maxX) * innerW,
    y: PAD.top + (1 - p.y) * innerH,
  }));
}

/** Smooth cubic path through the pixel points. */
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

function estimatePathLength(points: Point[]): number {
  let len = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i]!.x - points[i - 1]!.x;
    const dy = points[i]!.y - points[i - 1]!.y;
    len += Math.hypot(dx, dy);
  }
  return len * 1.25;
}

/**
 * Animated two-line chart — time with God trending down without
 * Closer (muted) and up with Closer (orange).
 */
export function GodTimeComparisonChart() {
  const colors = useColors();
  const reducedMotion = useReducedMotion();
  const progress = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;
  const [activeSeries, setActiveSeries] = useState<"both" | "without" | "with">(
    "both",
  );

  const withoutPx = useMemo(
    () => toPixels(WITHOUT_CLOSER, CHART_WIDTH, CHART_HEIGHT),
    [],
  );
  const withPx = useMemo(
    () => toPixels(WITH_CLOSER, CHART_WIDTH, CHART_HEIGHT),
    [],
  );

  const withoutPath = useMemo(() => buildSmoothPath(withoutPx), [withoutPx]);
  const withPath = useMemo(() => buildSmoothPath(withPx), [withPx]);

  const withoutLen = useMemo(() => estimatePathLength(withoutPx), [withoutPx]);
  const withLen = useMemo(() => estimatePathLength(withPx), [withPx]);

  useEffect(() => {
    if (reducedMotion) {
      progress.setValue(1);
      return;
    }
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 1600,
      delay: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, reducedMotion]);

  const withoutOffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [withoutLen, 0],
  });
  const withOffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [withLen, 0],
  });

  const showWithout = activeSeries === "both" || activeSeries === "without";
  const showWith = activeSeries === "both" || activeSeries === "with";

  return (
    <View style={{ width: "100%", maxWidth: CHART_WIDTH }}>
      <View
        style={{
          borderRadius: 20,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          paddingTop: 12,
          paddingHorizontal: 8,
          paddingBottom: 10,
        }}
      >
        <Text
          style={{
            fontFamily: "System",
            fontWeight: "600",
            fontSize: 12,
            color: colors.inkSecondary,
            marginLeft: 8,
            marginBottom: 4,
          }}
        >
          Time with God
        </Text>

        <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
          <Defs>
            <LinearGradient id="closerFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={CLOSER_ACCENT} stopOpacity={0.22} />
              <Stop offset="1" stopColor={CLOSER_ACCENT} stopOpacity={0} />
            </LinearGradient>
          </Defs>

          {/* Horizontal guides */}
          {[0.25, 0.5, 0.75].map((y) => {
            const py =
              PAD.top + (1 - y) * (CHART_HEIGHT - PAD.top - PAD.bottom);
            return (
              <Line
                key={y}
                x1={PAD.left}
                y1={py}
                x2={CHART_WIDTH - PAD.right}
                y2={py}
                stroke={colors.border}
                strokeWidth={1}
                strokeDasharray="4 6"
              />
            );
          })}

          {/* Area under Closer line */}
          {showWith ? (
            <Path
              d={`${withPath} L ${withPx[withPx.length - 1]!.x} ${
                CHART_HEIGHT - PAD.bottom
              } L ${withPx[0]!.x} ${CHART_HEIGHT - PAD.bottom} Z`}
              fill="url(#closerFill)"
              opacity={0.9}
            />
          ) : null}

          {showWithout ? (
            <AnimatedPath
              d={withoutPath}
              stroke={colors.inkSubtle}
              strokeWidth={2.5}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={`${withoutLen} ${withoutLen}`}
              strokeDashoffset={withoutOffset}
            />
          ) : null}

          {showWith ? (
            <AnimatedPath
              d={withPath}
              stroke={CLOSER_ACCENT}
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={`${withLen} ${withLen}`}
              strokeDashoffset={withOffset}
            />
          ) : null}

          {showWithout
            ? withoutPx.map((p, i) => (
                <Circle
                  key={`w-${i}`}
                  cx={p.x}
                  cy={p.y}
                  r={4}
                  fill={colors.surface}
                  stroke={colors.inkSubtle}
                  strokeWidth={2}
                />
              ))
            : null}

          {showWith
            ? withPx.map((p, i) => (
                <Circle
                  key={`c-${i}`}
                  cx={p.x}
                  cy={p.y}
                  r={4.5}
                  fill={CLOSER_ACCENT}
                  stroke={colors.surface}
                  strokeWidth={2}
                />
              ))
            : null}

          {X_LABELS.map((label, i) => {
            const x = withoutPx[i]?.x ?? 0;
            return (
              <SvgText
                key={label}
                x={x}
                y={CHART_HEIGHT - 8}
                fill={colors.inkMuted}
                fontSize={11}
                fontWeight="500"
                textAnchor="middle"
              >
                {label}
              </SvgText>
            );
          })}
        </Svg>
      </View>

      {/* Interactive legend — tap to isolate a series */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          gap: 20,
          marginTop: 14,
        }}
      >
        <LegendChip
          label="Without Closer"
          color={colors.inkSubtle}
          active={showWithout}
          onPress={() =>
            setActiveSeries((s) => (s === "without" ? "both" : "without"))
          }
        />
        <LegendChip
          label="With Closer"
          color={CLOSER_ACCENT}
          active={showWith}
          onPress={() => setActiveSeries((s) => (s === "with" ? "both" : "with"))}
        />
      </View>
    </View>
  );
}

function LegendChip({
  label,
  color,
  active,
  onPress,
}: {
  label: string;
  color: string;
  active: boolean;
  onPress: () => void;
}) {
  const colors = useColors();

  return (
    <Text
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={{
        fontFamily: "System",
        fontWeight: active ? "600" : "500",
        fontSize: 13,
        color: active ? colors.ink : colors.inkMuted,
        opacity: active ? 1 : 0.55,
      }}
    >
      <Text style={{ color }}>● </Text>
      {label}
    </Text>
  );
}
