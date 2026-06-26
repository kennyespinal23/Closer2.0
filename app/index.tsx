import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { Redirect, useRouter } from "expo-router";
import { SocialAppCard } from "@/components/SocialAppCard";
import type { SocialAppKind } from "@/lib/socialAppIconAssets";
import { FadeIn } from "@/components/FadeIn";
import { CLOSER_ACCENT } from "@/constants/theme";
import * as haptics from "@/lib/haptics";
import {
  armLaunchSplash,
  suppressLaunchSplashUntilRouted,
} from "@/lib/launchSplashSession";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useOnboarding } from "@/state/onboarding";
import { useColors, useResolvedScheme } from "@/state/theme";

/**
 * Get Started — the first screen of the app, before onboarding.
 *
 * Reference: the "falling cards" landing page pattern used by
 * the Wishes / Imprint / Hyper era of premium iOS apps — a themed
 * stage with tilted app icons suspended in mid-fall above the
 * title block, then a single primary CTA.
 *
 * For Closer the falling objects are the social media apps the
 * user is being invited to quiet. The visual is the brief, before
 * any words: these are the things that own your morning. The copy
 * below names what we're replacing them with.
 *
 * The cards animate in on mount: each one drops from above its
 * resting position with a spring, staggered ~120ms apart, with a
 * small rotational wobble so the landing reads as physical. After
 * the stagger completes, each card runs an INDEPENDENT idle sway
 * — a small ±3.5pt translateY + ±1.6° rotation oscillation driven
 * by a slow sin loop with a per-card period (3.5–5s) and a
 * per-card initial phase, so the cards drift like leaves rather
 * than swaying in synchronized "wave" pattern. The motion is
 * deliberately tiny — bigger amplitudes start looking animated
 * instead of physical.
 *
 * Background: a soft orange radial behind the falling cards
 * (Closer accent) on the active theme canvas — cream in light
 * mode, true black in dark mode.
 */

// Warm accent wash behind the cards — Closer orange. Opacity
// steps are applied per-scheme in the render so light mode stays
// subtle and dark mode keeps enough glow to read on black.
const AMBER_GLOW = CLOSER_ACCENT;

const GLOW_STOPS = {
  light: { center: 0.22, mid: 0.08, edge: 0.01 },
  dark: { center: 0.38, mid: 0.12, edge: 0.02 },
} as const;

type CardPlacement = {
  app: SocialAppKind;
  /** Horizontal offset from screen center (in pixels). */
  dx: number;
  /** Vertical offset from the hero center (in pixels). */
  dy: number;
  /** Final resting rotation in degrees. */
  rot: number;
  /** Card width in pt. */
  width: number;
  /** Z-index — higher means on top of overlapping siblings. */
  z: number;
  /** Stagger delay (ms) before this card starts its fall. */
  delay: number;
  /** Half-period (ms) of the idle sway loop. Varied per card so
   *  the cards never sway in sync, which would read as mechanical
   *  / screensaver-like instead of physical drift. */
  swayMs: number;
  /** Initial phase offset of the sway, in [-1, 1]. Also varied so
   *  cards START at different points in their sin cycle. */
  swayPhase: number;
};

// Composed by hand so cards overlap with a sense of layered depth
// rather than a uniform spread. dx is centered on screen midpoint,
// dy is centered on the hero center (negative = up).
// Picked 6 cards because more felt cluttered, fewer felt sparse.
const PLACEMENTS: ReadonlyArray<CardPlacement> = [
  { app: "instagram", dx: -88,  dy: -100, rot: -18, width: 122, z: 2, delay: 0,   swayMs: 3800, swayPhase:  0.2 },
  { app: "tiktok",    dx:  92,  dy: -120, rot:  16, width: 118, z: 3, delay: 120, swayMs: 4400, swayPhase: -0.4 },
  { app: "youtube",   dx: -20,  dy:  -20, rot:  -4, width: 132, z: 5, delay: 240, swayMs: 5000, swayPhase:  0.6 },
  { app: "snapchat",  dx: 110,  dy:   30, rot:  26, width: 116, z: 4, delay: 360, swayMs: 4100, swayPhase: -0.7 },
  { app: "x",         dx: -110, dy:   60, rot: -14, width: 114, z: 3, delay: 480, swayMs: 4700, swayPhase:  0.4 },
  { app: "facebook",  dx:  20,  dy:  110, rot:   8, width: 120, z: 2, delay: 600, swayMs: 3500, swayPhase: -0.1 },
];

// Amount of idle drift around the resting pose. Subtle — these
// numbers are intentionally small so the motion reads as "the
// cards are breathing / lightly floating" rather than "the cards
// are moving." Bumping these much higher quickly looks animated.
const SWAY_PX = 3.5;
const SWAY_DEG = 1.6;

type ReturningHref = "/rotating-moment" | "/today";

/**
 * Root launch gate.
 *
 * Returning users (`completed === true`) never see the Get Started
 * landing — they route straight to the rotating moment or home.
 * New users see the falling-cards landing below.
 */
export default function IndexScreen() {
  const { answers } = useOnboarding();
  const [returningHref, setReturningHref] = useState<ReturningHref | null>(
    null,
  );

  useEffect(() => {
    if (!answers.completed) return;

    suppressLaunchSplashUntilRouted();
    let cancelled = false;

    void (async () => {
      try {
        const { shouldShowRotatingMoment } = await import(
          "@/lib/rotatingMomentStorage"
        );
        const showMoment = await shouldShowRotatingMoment();
        if (cancelled) return;
        if (showMoment) {
          setReturningHref("/rotating-moment");
        } else {
          armLaunchSplash();
          setReturningHref("/today");
        }
      } catch {
        if (cancelled) return;
        armLaunchSplash();
        setReturningHref("/today");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [answers.completed]);

  if (answers.completed) {
    if (!returningHref) {
      return <View style={{ flex: 1, backgroundColor: "#000000" }} />;
    }
    return <Redirect href={returningHref} />;
  }

  return <GetStartedLanding />;
}

function GetStartedLanding() {
  const router = useRouter();
  const colors = useColors();
  const scheme = useResolvedScheme();
  const glow = GLOW_STOPS[scheme];
  const { height: screenHeight } = useWindowDimensions();
  const { answers, reset: resetOnboarding, setAnswer } = useOnboarding();

  // Hero center sits in the UPPER-MIDDLE third of the screen so
  // the title block has room to live below the falling cards.
  const heroCenterY = screenHeight * 0.34;

  // One Animated.Value per card, driving its drop-in. 0 = above
  // the resting spot, 1 = settled. Spring physics give the
  // landing a small natural bounce.
  const drops = useRef(PLACEMENTS.map(() => new Animated.Value(0))).current;

  // Idle sway value per card. Oscillates between -1 and 1 forever
  // with sin easing. Each card seeds its own initial value from
  // PLACEMENTS[i].swayPhase so they DON'T start in sync — that
  // way the cards drift independently like leaves, not in a
  // synchronized "wave" pattern.
  const sways = useRef(
    PLACEMENTS.map((p) => new Animated.Value(p.swayPhase)),
  ).current;
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      // Reduce Motion: skip the drop-in spring + idle sway loops
      // entirely. Cards render in their final resting pose, no
      // continuous motion, no card-drop animation. The scene is
      // still composed of all the same illustrated cards, just
      // static — which is exactly the trade Apple makes in the
      // OS for vestibular-sensitive users.
      drops.forEach((v) => v.setValue(1));
      sways.forEach((v) => v.setValue(0));
      return;
    }
    // Drop-in: each card waits its delay, then springs into place.
    Animated.stagger(
      0,
      drops.map((value, i) =>
        Animated.sequence([
          Animated.delay(PLACEMENTS[i].delay),
          Animated.spring(value, {
            toValue: 1,
            tension: 28,
            friction: 7,
            useNativeDriver: true,
          }),
        ]),
      ),
    ).start();

    // Idle sway: start every card's loop immediately (concurrent
    // with the drop). During the fast spring, sway is barely
    // perceptible — drop physics dominate. Once landed, the
    // ambient sway becomes the only motion and the scene reads
    // as "alive but still."
    const swayLoops = sways.map((value, i) => {
      const half = PLACEMENTS[i].swayMs;
      return Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            toValue: 1,
            duration: half,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: -1,
            duration: half,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      );
    });
    swayLoops.forEach((loop) => loop.start());
    return () => {
      swayLoops.forEach((loop) => loop.stop());
    };
  }, [drops, sways, reducedMotion]);

  const handleGetStarted = () => {
    haptics.thud();
    // Wipe any persisted onboarding answers before pushing into
    // the flow. Two cases this guards against:
    //   1. A previous user partially answered the flow, never
    //      finished, and the answers (morningApps, etc.) hydrated
    //      back on relaunch. Without the reset they'd see their
    //      old multi-select state pre-checked on the apps picker.
    //   2. A previous user completed onboarding, then reset via
    //      the dev panel which cleared `completed` but COULD have
    //      missed clearing other answers in older builds. The
    //      reset() here is idempotent insurance.
    // Returning users (completed === true) never hit this branch
    // because the useEffect above redirected them to /today.
    resetOnboarding();
    router.push("/onboarding/attention");
  };

  const handleSignIn = () => {
    // Returning-user shortcut — must persist `completed` or every
    // cold launch routes back to this landing.
    if (!answers.completed) {
      setAnswer("completed", true);
    }
    router.replace("/today");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />

      {/* ─── Warm radial ambient behind the cards ──────────────
          Anchored to the hero center so the glow paints UPWARD,
          tucks behind the falling cards, and falls off well
          before the title block on the active theme bg. */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: heroCenterY + 200,
        }}
      >
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient
              id="getstarted-amber"
              cx="50%"
              cy="40%"
              rx="90%"
              ry="65%"
              fx="50%"
              fy="40%"
            >
              <Stop offset="0" stopColor={AMBER_GLOW} stopOpacity={glow.center} />
              <Stop offset="0.45" stopColor={AMBER_GLOW} stopOpacity={glow.mid} />
              <Stop offset="0.85" stopColor={AMBER_GLOW} stopOpacity={glow.edge} />
              <Stop offset="1" stopColor={AMBER_GLOW} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect x={0} y={0} width="100%" height="100%" fill="url(#getstarted-amber)" />
        </Svg>
      </View>

      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        {/* ─── Falling cards stage ─────────────────────────────
            Single absolute-positioned layer centered on the
            hero center. Each card uses (dx, dy) to position
            itself relative to that center. Z-index via the
            view ordering (we sort by z so higher z renders
            later → ends up on top of overlapping siblings). */}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: heroCenterY + 200,
          }}
        >
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            {[...PLACEMENTS]
              .map((p, i) => ({ p, i }))
              .sort((a, b) => a.p.z - b.p.z)
              .map(({ p, i }) => {
                const drop = drops[i];
                const sway = sways[i];

                // ── Drop contribution ──────────────────────────
                // Card drops from 240pt ABOVE its resting dy down
                // to dy itself, with its rotation easing from
                // ~1.6× its final tilt down to the resting tilt.
                const dropTY = drop.interpolate({
                  inputRange: [0, 1],
                  outputRange: [p.dy - 240, p.dy],
                });
                const dropRot = drop.interpolate({
                  inputRange: [0, 1],
                  outputRange: [p.rot * 1.6, p.rot],
                });

                // ── Sway contribution (idle drift) ─────────────
                // sway oscillates in [-1, 1] with sin easing.
                // We map it to small ± offsets on translateY and
                // rotation. Combined with the drop via Animated.add
                // so during the drop the spring dominates, and once
                // landed the sway becomes the only motion.
                const swayTY = sway.interpolate({
                  inputRange: [-1, 1],
                  outputRange: [-SWAY_PX, SWAY_PX],
                });
                const swayRot = sway.interpolate({
                  inputRange: [-1, 1],
                  outputRange: [-SWAY_DEG, SWAY_DEG],
                });

                const translateY = Animated.add(dropTY, swayTY);
                // For rotate we add the numeric values first, then
                // map to a "Xdeg" string via a fixed-range
                // interpolation (rotate transforms expect strings).
                const totalRot = Animated.add(dropRot, swayRot);
                const rotate = totalRot.interpolate({
                  inputRange: [-60, 60],
                  outputRange: ["-60deg", "60deg"],
                });

                const opacity = drop.interpolate({
                  inputRange: [0, 0.3, 1],
                  outputRange: [0, 0.3, 1],
                });

                return (
                  <Animated.View
                    key={p.app}
                    style={{
                      position: "absolute",
                      transform: [
                        { translateX: p.dx },
                        { translateY },
                        { rotate },
                      ],
                      opacity,
                    }}
                  >
                    <SocialAppCard app={p.app} width={p.width} />
                  </Animated.View>
                );
              })}
          </View>
        </View>

        {/* ─── Text block + CTAs (lower 45% of screen) ────────
            zIndex keeps this layer above the absolute card stage
            so taps always land on the button, not a transparent
            sibling. */}
        <View
          style={{
            flex: 1,
            justifyContent: "flex-end",
            paddingHorizontal: 28,
            zIndex: 2,
          }}
        >
          <FadeIn delayMs={900} durationMs={900}>
            <Text
              style={{
                color: colors.ink,
                fontFamily: "System",
                fontWeight: "700",
                fontSize: 42,
                lineHeight: 46,
                letterSpacing: -1.2,
                marginBottom: 14,
              }}
            >
              Quiet the noise.{"\n"}Find the Word.
            </Text>
          </FadeIn>

          <FadeIn delayMs={1300} durationMs={900}>
            <Text
              style={{
                color: colors.inkSecondary,
                fontFamily: "System",
                fontWeight: "500",
                fontSize: 15,
                lineHeight: 22,
                marginBottom: 28,
                maxWidth: 320,
              }}
            >
              Receive a personalized devotional before social media,
              notifications, and the distractions of the day.
            </Text>
          </FadeIn>

          <FadeIn delayMs={1700} durationMs={800}>
            <Pressable
              onPress={handleGetStarted}
              accessibilityRole="button"
              accessibilityLabel="Get Started"
              style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}
            >
              <View
                style={{
                  height: 56,
                  borderRadius: 16,
                  backgroundColor: CLOSER_ACCENT,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontFamily: "System",
                    fontWeight: "700",
                    fontSize: 16,
                    letterSpacing: 0.1,
                  }}
                >
                  Get Started
                </Text>
              </View>
            </Pressable>
          </FadeIn>

          <FadeIn delayMs={2100} durationMs={700}>
            {/* Sign in row — flex-row + items-center come via
                className because Pressable's function-form style
                is silently dropped on iOS RN 0.81 (see codebase
                notes on the paywall + welcome CTAs). Without that
                fix the two Text nodes stacked vertically. The
                pressed feedback is handled by Tailwind's
                active:opacity utility, which IS applied. */}
            <Pressable
              hitSlop={12}
              onPress={handleSignIn}
              accessibilityRole="button"
              accessibilityLabel="Sign in to an existing account"
              className="mt-4 self-center flex-row items-center py-1.5 active:opacity-60"
            >
              <Text
                style={{
                  color: colors.inkSecondary,
                  fontFamily: "System",
                  fontWeight: "400",
                  fontSize: 14,
                }}
              >
                Already have an account?
              </Text>
              <Text
                style={{
                  color: colors.ink,
                  fontFamily: "System",
                  fontWeight: "600",
                  fontSize: 14,
                  marginLeft: 6,
                }}
              >
                Sign in
              </Text>
            </Pressable>
          </FadeIn>

          <View style={{ height: 12 }} />
        </View>
      </SafeAreaView>
    </View>
  );
}
