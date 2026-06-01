import { View } from "react-native";
import Svg, { Circle, G, Path } from "react-native-svg";
import { useColors } from "@/state/theme";

/**
 * Reading-goal activity ring — Apple-Fitness style.
 *
 * Two stacked stroked circles:
 *   • Track — full circle in a dim border color, the "missed" arc
 *   • Fill  — partial circle (length = pct * circumference) drawn in
 *             accent or primary, with rounded ends so the head of
 *             the arc reads as a tip, not a hard chop
 *
 * Optionally renders a small indicator at the END of the arc
 * (arrow when in-progress, checkmark when reached) that mirrors the
 * Apple Fitness ring head marker. The indicator is suppressed when
 * `showTip` is false, which is how the WeekStrip mini-rings render
 * — at 24pt the tip is just visual noise.
 *
 * The SVG is rotated -90° around the center so 0° starts at the
 * 12-o'clock position (matching the natural mental model of "the
 * top of the ring"). Without that, fills would start at 3-o'clock.
 *
 * `RING_ACCENT` is exported as the canonical color so the home
 * pill, detail screen, and any other ring callers share the same
 * hue. iOS system blue (the dark-mode variant, `#0A84FF`) — picked
 * deliberately so the "effort + progress" story feels distinct
 * from the warm orange brand `primary` that drives the streak
 * card. Same blue Apple uses across Fitness / Settings toggles,
 * so it reads as a familiar "you" accent in both light + dark
 * themes without overpowering the brand.
 */
export const RING_ACCENT = "#0A84FF";

export type ActivityRingProps = {
  /** 0..1 — clipped internally. Values >1 cap at 1 (full ring). */
  pct: number;
  /**
   * When true, the ring is treated as goal-reached: the fill
   * switches to the primary (white) color and the tip indicator
   * renders a checkmark instead of an arrow.
   */
  reached: boolean;
  /** Outer diameter in points. */
  size: number;
  /** Stroke width in points. ~12 for hero, ~3 for mini-rings. */
  stroke: number;
  /**
   * Hide the head-of-arc tip indicator. Defaults to true. Set to
   * false for very small rings (e.g. WeekStrip mini rings) where
   * the tip is too small to read as a meaningful glyph.
   */
  showTip?: boolean;
  /** Override the in-progress arc color. Defaults to RING_ACCENT. */
  color?: string;
  /** Override the track (unfilled) color. Defaults to the theme border. */
  trackColor?: string;
};

export function ActivityRing({
  pct,
  reached,
  size,
  stroke,
  showTip = true,
  color,
  trackColor,
}: ActivityRingProps) {
  const colors = useColors();
  const clampedPct = Math.max(0, Math.min(1, pct));
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  // strokeDasharray = [filled, gap]. Floor a hairline so the
  // rounded cap is still visible at 0% (looks like the ring's
  // starting nub) — pure 0 would render nothing.
  const filled = Math.max(circumference * 0.001, circumference * clampedPct);
  const accent = color ?? (reached ? colors.ink : RING_ACCENT);
  const track = trackColor ?? colors.border;

  // Position of the head/tip of the arc — used to drop the small
  // indicator icon. 12-o'clock at pct=0 → moving clockwise.
  const tipAngle = -90 + 360 * clampedPct;
  const tipRad = (tipAngle * Math.PI) / 180;
  const tipX = cx + r * Math.cos(tipRad);
  const tipY = cy + r * Math.sin(tipRad);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Track — the unfilled portion of the ring. */}
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          stroke={track}
          strokeWidth={stroke}
          fill="none"
        />
        {/* Filled arc — rotated so 0% starts at 12-o'clock. */}
        <G originX={cx} originY={cy} rotation={-90}>
          <Circle
            cx={cx}
            cy={cy}
            r={r}
            stroke={accent}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${filled} ${circumference}`}
          />
        </G>

        {/* Tip indicator — sits at the leading edge of the arc.
            Apple Fitness uses a small white arrow inside a colored
            disc; we mirror that for in-progress and switch to a
            check glyph when the goal is reached. Optional so mini
            rings can opt out. */}
        {showTip && (
          <G>
            <Circle
              cx={tipX}
              cy={tipY}
              r={stroke / 2 + 1}
              fill={accent}
            />
            {reached ? (
              <Path
                d={`M ${tipX - 3.2} ${tipY + 0.2} L ${tipX - 0.8} ${tipY + 2.6} L ${tipX + 3.4} ${tipY - 2}`}
                stroke={colors.bg}
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            ) : (
              <Path
                d={`M ${tipX - 2.4} ${tipY - 0.4} L ${tipX + 1.2} ${tipY - 0.4} M ${tipX - 0.6} ${tipY - 2.2} L ${tipX + 1.6} ${tipY - 0.4} L ${tipX - 0.6} ${tipY + 1.4}`}
                stroke={colors.bg}
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            )}
          </G>
        )}
      </Svg>
    </View>
  );
}
