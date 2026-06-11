import { useEffect, useRef } from "react";
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
import { useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { SocialAppCard, type SocialAppKind } from "@/components/SocialAppCard";
import { FadeIn } from "@/components/FadeIn";
import { useOnboarding } from "@/state/onboarding";

/**
 * Get Started — the first screen of the app, before onboarding.
 *
 * Reference: the "falling cards" landing page pattern used by
 * the Wishes / Imprint / Hyper era of premium iOS apps — a dark
 * stage with tilted "playing cards" suspended in mid-fall above
 * the title block, then a single primary CTA.
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
 * Background: a wide warm-amber radial that anchors the cards
 * (matches the reference's red/orange wash) without leaking into
 * the lower text/CTA block, which stays on the new #141416 page bg.
 */

const PAGE_BG = "#141416";
// Warm amber wash — used by the radial behind the cards. Picked
// over Closer's usual cool ambient (purple/teal) because the
// reference visual reads warmer, and the warmth makes the title
// "Quiet the noise" feel like an invitation rather than a verdict.
const AMBER_GLOW = "#FF7A3B";

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

export default function GetStartedScreen() {
  const router = useRouter();
  const { height: screenHeight } = useWindowDimensions();
  const { answers, reset: resetOnboarding } = useOnboarding();

  // ─── Auto-redirect for returning users ──────────────────────
  // HydrationGate (root layout) has already loaded the persisted
  // onboarding answers before this screen mounts, so `completed`
  // is reliable here. If the user finished onboarding on a prior
  // session, skip the landing entirely and route straight into
  // the app — they shouldn't see the Get Started chrome again on
  // every cold launch.
  // `useEffect` (not inline) so the redirect happens after mount
  // and doesn't fight with the router's own initial-route setup.
  useEffect(() => {
    if (answers.completed) {
      router.replace("/today");
    }
  }, [answers.completed, router]);

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

  useEffect(() => {
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
  }, [drops, sways]);

  const handleGetStarted = () => {
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
    // First screen of onboarding is now "What brings you to Closer?"
    // (the why picker), not the stat reveal. New order:
    //   why → name → stat → apps → ...
    // The stat reveal moves to AFTER name so the user has already
    // identified themselves emotionally before being hit with the
    // number — it lands harder when they're a named person, not
    // an anonymous prospect.
    router.push("/onboarding/why");
  };

  const handleSignIn = () => {
    router.replace("/today");
  };

  return (
    <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
      <StatusBar style="light" />

      {/* ─── Warm radial ambient behind the cards ──────────────
          Anchored to the hero center so the glow paints UPWARD,
          tucks behind the falling cards, and falls off well
          before the title block — keeping the lower half on the
          clean #141416 page bg. */}
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
              <Stop offset="0" stopColor={AMBER_GLOW} stopOpacity={0.38} />
              <Stop offset="0.45" stopColor={AMBER_GLOW} stopOpacity={0.12} />
              <Stop offset="0.85" stopColor={AMBER_GLOW} stopOpacity={0.02} />
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

        {/* ─── Text block + CTAs (lower 45% of screen) ──────── */}
        <View style={{ flex: 1, justifyContent: "flex-end", paddingHorizontal: 28 }}>
          <FadeIn delayMs={900} durationMs={900}>
            <Text
              style={{
                color: "#FFFFFF",
                fontFamily: "PlusJakartaSans_700Bold",
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
                color: "#A1A1AA",
                fontFamily: "PlusJakartaSans_500Medium",
                fontSize: 15,
                lineHeight: 22,
                marginBottom: 28,
                maxWidth: 320,
              }}
            >
              The apps that own your mornings can wait.{"\n"}Scripture can&apos;t.
            </Text>
          </FadeIn>

          <FadeIn delayMs={1700} durationMs={800}>
            <Button label="Get Started" onPress={handleGetStarted} />
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
                  color: "#A1A1AA",
                  fontFamily: "PlusJakartaSans_400Regular",
                  fontSize: 14,
                }}
              >
                Already have an account?
              </Text>
              <Text
                style={{
                  color: "#FFFFFF",
                  fontFamily: "PlusJakartaSans_600SemiBold",
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
