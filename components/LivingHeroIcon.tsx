import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  type ImageSourcePropType,
  View,
} from "react-native";
import Svg, {
  Defs,
  Ellipse,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useColors } from "@/state/theme";

/**
 * LivingHeroIcon — animated sermon-type illustration that lives in
 * a space rather than sitting flat on a page.
 *
 * THREE looping native-driver animations give the icon a sense of
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
 *               The icon ITSELF also scales 0.985 ↔ 1.015 on
 *               the same curve — barely perceptible scale, but
 *               makes the object feel like it's drawing a breath
 *               instead of merely bobbing.
 *
 *   3. PEDESTAL — a wide horizontal ellipse of accent color
 *                 painted UNDER the icon's footprint. Reads as
 *                 the lit base Opal's home-screen stone rests on:
 *                 the icon isn't floating in empty space, it's
 *                 sitting on a pool of warm light. Pulses on the
 *                 same breath curve as the halo for cohesion.
 *
 * All three animations run on the native driver (UI thread) so
 * they don't compete with JS work (gestures, scroll, navigation).
 * They loop indefinitely; we deliberately don't pause on screen
 * blur because the cost is negligible (interpolated values per
 * frame) and pausing would add navigation focus plumbing for a
 * non-issue.
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
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    // Reduce Motion: park both values at the midpoint of their
    // arcs (0.5) so the icon renders in its visual median pose —
    // no float bob, no breath pulse, no halo throb. The static
    // pose still reads "alive" because the lit halo + pedestal
    // are colored, but motion is fully suppressed.
    if (reducedMotion) {
      float.setValue(0.5);
      breath.setValue(0.5);
      return;
    }
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
  }, [float, breath, reducedMotion]);

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
    outputRange: [0.78, 1],
  });

  // Subtle scale on the icon itself — 0.985 ↔ 1.015 is below
  // conscious detection but the eye reads it as "the object is
  // alive". Without this, even a perfectly smooth float reads as
  // a static asset being dragged up and down.
  const breathScale = breath.interpolate({
    inputRange: [0, 1],
    outputRange: [0.985, 1.015],
  });

  // Pedestal pulse — slightly wider opacity swing than the halo
  // (0.7 ↔ 1.0) because the pedestal sits at the bottom edge of
  // the icon footprint, less visible than the surrounding halo,
  // and benefits from a bigger range to read at a glance.
  const pedestalOpacity = breath.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1],
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
      {/* PEDESTAL — rendered FIRST so it sits below the halo and
          the icon in z-order. Anchored to the bottom of the
          footprint via bottom:-12 so the lit base feels like it
          extends slightly beyond the icon's silhouette (the way
          Opal's stone has its glow pooling around the base, not
          contained within the stone's outline). */}
      {haloScale > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            bottom: Math.round(height * 0.06),
            left: 0,
            right: 0,
            alignItems: "center",
            opacity: pedestalOpacity,
          }}
        >
          <PedestalLight color={accent} width={width} />
        </Animated.View>
      ) : null}
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
      <Animated.View
        style={{
          transform: [{ translateY }, { scale: breathScale }],
        }}
      >
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
// PedestalLight — Opal-style lit base under the icon
// ─────────────────────────────────────────────────────────────────
//
// Wide, flat ellipse of accent color anchored UNDER the icon
// footprint. Gives the icon a sense of resting on a surface
// rather than floating in empty space — the visual trick that
// makes Opal's home-screen stone read as a physical object with
// weight.
//
// Width: 1.4x the icon's width so the pool extends past the
//        silhouette and bleeds into the surrounding space.
// Height: ~16% of the width — flat ellipse, not a circle, so it
//         reads as "shadow cast / light pooled at the base"
//         rather than a second halo.
//
// Color: same accent as the halo but with a sharper falloff
//        (center 0.32 → edge 0). Brighter at center than the
//        halo because the pedestal is supposed to read as "lit
//        surface", not "ambient glow" — surfaces have specular
//        highlights, ambient light doesn't.

function PedestalLight({ color, width }: { color: string; width: number }) {
  // Pedestal is 1.4x the icon's width and ~16% of THAT as height
  // (a flat ellipse). Picked empirically against the home hero
  // (184pt wide) — wider than the icon enough to read as "the
  // light pools beyond the object" without becoming a second
  // halo.
  const w = Math.round(width * 1.4);
  const h = Math.round(w * 0.16);
  const cx = w / 2;
  const cy = h / 2;
  const rx = w / 2;
  const ry = h / 2;
  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <Defs>
        <RadialGradient
          id="pedestalLight"
          cx="50%"
          cy="50%"
          rx="50%"
          ry="50%"
          fx="50%"
          fy="50%"
        >
          <Stop offset="0%" stopColor={color} stopOpacity={0.32} />
          <Stop offset="55%" stopColor={color} stopOpacity={0.08} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="url(#pedestalLight)" />
    </Svg>
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
