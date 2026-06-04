import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  type ImageSourcePropType,
  View,
} from "react-native";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { useColors } from "@/state/theme";

/**
 * LivingHeroIcon — animated sermon-type illustration that lives in
 * a space rather than sitting flat on a page.
 *
 * Two looping native-driver animations give the icon a sense of
 * presence (the static-asset problem that makes apps feel less
 * premium than Opal):
 *
 *   1. FLOAT  — vertical drift ±4pt over ~5s, sine-eased. Subtle
 *               enough not to distract during reading, obvious
 *               enough that the eye picks up motion on a glance.
 *
 *   2. BREATH — accent halo behind the icon pulses 80%↔100%
 *               opacity over ~5.4s, deliberately offset from the
 *               float so the curves never synchronize. Reads as
 *               ambient light brightening and dimming.
 *
 * Both animations run on the native driver (UI thread) so they
 * don't compete with JS work (gestures, scroll, navigation).
 * Both loop indefinitely; we deliberately don't pause on screen
 * blur because the cost is negligible (two interpolated values
 * per frame) and pausing would add navigation focus plumbing for
 * a non-issue.
 *
 * Sizing is configurable via props so the same component can
 * carry a small home-hero footprint (184x156) or a larger
 * sermon-intro/complete footprint (200x170, 240x200).
 *
 * The accent halo size scales WITH the icon — `haloScale` lets
 * callers override the default 1.0 if they want a bigger
 * atmospheric pool (sermon intro uses ~1.4 for example).
 */
export type LivingHeroIconProps = {
  source: ImageSourcePropType;
  accent: string;
  /** Icon dimensions. Defaults to 184x156 (home hero footprint). */
  width?: number;
  height?: number;
  /** Halo size multiplier — 1.0 is the default tight glow.
   *  Sermon intro and complete pass ~1.4 for a roomier wash.
   *  Pass 0 to suppress the halo entirely (for screens that
   *  paint their own ambient atmosphere underneath, like the
   *  celebration screen with its expanding entrance halo). */
  haloScale?: number;
};

export function LivingHeroIcon({
  source,
  accent,
  width = 184,
  height = 156,
  haloScale = 1.0,
}: LivingHeroIconProps) {
  // Two separate Animated.Values so the curves run on independent
  // timelines (float is 5s sine, breath is 5.4s sine — the offset
  // prevents synchronization).
  const float = useRef(new Animated.Value(0)).current;
  const breath = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    const breathLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {
          toValue: 1,
          duration: 2700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breath, {
          toValue: 0,
          duration: 2700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    floatLoop.start();
    breathLoop.start();
    return () => {
      floatLoop.stop();
      breathLoop.stop();
    };
  }, [float, breath]);

  // Float interpolation: 0 → -4pt at the apex, 1 → +4pt at the
  // trough. ±4pt is the sweet spot — perceptible without feeling
  // jittery.
  const translateY = float.interpolate({
    inputRange: [0, 1],
    outputRange: [-4, 4],
  });

  // Breath interpolation: 80% → 100% halo opacity. The halo never
  // fully dims (lower bound 0.8) so the icon always has a
  // grounded glow; we modulate intensity, not presence.
  const haloOpacity = breath.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1],
  });

  return (
    <View
      style={{
        width,
        height,
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      {haloScale > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            alignItems: "center",
            justifyContent: "center",
            opacity: haloOpacity,
          }}
        >
          <LivingHalo color={accent} scale={haloScale} />
        </Animated.View>
      ) : null}
      <Animated.View style={{ transform: [{ translateY }] }}>
        <Image
          source={source}
          style={{ width, height }}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// LivingHalo — accent-tinted radial glow behind the icon
// ─────────────────────────────────────────────────────────────────
//
// Internally-tracked component so the SermonCard, intro, and
// complete screens all paint the same halo gradient under their
// hero icons. The outermost stop fades to the active surface
// color so the glow blends into the page cleanly in both themes
// (otherwise a hardcoded dark stop leaves a charcoal halo on
// light backgrounds).

function LivingHalo({ color, scale }: { color: string; scale: number }) {
  const colors = useColors();
  const w = Math.round(360 * scale);
  const h = Math.round(180 * scale);
  return (
    <Svg width={w} height={h} viewBox="0 0 360 180">
      <Defs>
        <RadialGradient id="livingHalo" cx="50%" cy="50%" r="60%">
          <Stop offset="0%" stopColor={color} stopOpacity={0.22} />
          <Stop offset="60%" stopColor={color} stopOpacity={0.04} />
          <Stop offset="100%" stopColor={colors.surface} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={360} height={180} fill="url(#livingHalo)" />
    </Svg>
  );
}
