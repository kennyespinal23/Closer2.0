import { useEffect, useRef, useState } from "react";
import { Animated, Easing, View } from "react-native";
import Svg, { Circle, G, Path } from "react-native-svg";
import { useReducedMotion } from "@/lib/useReducedMotion";
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
 * Animation:
 *   The ring animates from its previous fill to the new fill on
 *   every prop change, just like Apple Fitness: each time you
 *   open the Activity app it redraws the rings from 0 → today's
 *   value with an ease-out cubic over ~900ms. This is the single
 *   biggest cue that the ring is "live" rather than a static
 *   progress badge. The animation is JS-driven (the arc length is
 *   an SVG stroke-dash prop that can't ride the native driver) —
 *   that's fine at 60fps because the SVG is tiny. We skip the
 *   animation when the same value is set back-to-back so we don't
 *   replay it for unrelated parent re-renders.
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

const FILL_DURATION_MS = 900;

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
  /**
   * Skip the fill animation and snap straight to `pct`. Used by
   * mini rings inside dense grids (WeekStrip, RhythmGrid) where
   * 30+ rings animating in unison would be visual noise rather
   * than a single "live" cue. The hero ring on Home always
   * animates.
   */
  animate?: boolean;
};

export function ActivityRing({
  pct,
  reached,
  size,
  stroke,
  showTip = true,
  color,
  trackColor,
  animate = true,
}: ActivityRingProps) {
  const colors = useColors();
  const reducedMotion = useReducedMotion();
  // Reduce-Motion in iOS Settings disables the fill draw entirely
  // — the ring snaps straight to its target so a vestibular-
  // sensitive user never sees the arc sweep. Same behavior Apple
  // Fitness uses when the user has the OS toggle on.
  const shouldAnimate = animate && !reducedMotion;
  const targetPct = Math.max(0, Math.min(1, pct));

  // We keep two values in lockstep:
  //   • animatedValue — the actual Animated.Value driving the
  //     timing; lives in a ref so it survives re-renders without
  //     restarting from 0.
  //   • displayPct — a React state mirror of animatedValue, set
  //     via a listener. We render off this so SVG props re-paint
  //     each frame. JS-driven animation isn't free, but a single
  //     value pumping at 60fps for 900ms is well under a frame
  //     budget on any device this app targets.
  const animatedValue = useRef(
    new Animated.Value(shouldAnimate ? 0 : targetPct),
  ).current;
  const [displayPct, setDisplayPct] = useState(
    shouldAnimate ? 0 : targetPct,
  );

  useEffect(() => {
    if (!shouldAnimate) {
      animatedValue.setValue(targetPct);
      setDisplayPct(targetPct);
      return;
    }
    const id = animatedValue.addListener(({ value }) => {
      setDisplayPct(value);
    });
    Animated.timing(animatedValue, {
      toValue: targetPct,
      duration: FILL_DURATION_MS,
      // ease-out cubic mirrors the deceleration curve Apple uses
      // for Fitness ring fills — the arc decelerates as it
      // approaches its terminal angle so the moment of arrival
      // feels deliberate rather than mechanical.
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    return () => {
      animatedValue.removeListener(id);
    };
  }, [targetPct, shouldAnimate, animatedValue]);

  const clampedPct = Math.max(0, Math.min(1, displayPct));
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
