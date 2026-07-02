import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Redirect, useRouter } from "expo-router";
import { LandingCross } from "@/components/LandingCross";
import { PrimaryPillButton } from "@/components/PrimaryPillButton";
import { SocialAppCard } from "@/components/SocialAppCard";
import type { SocialAppKind } from "@/lib/socialAppIconAssets";
import { FadeIn } from "@/components/FadeIn";
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
 * Background: true-black canvas with social app icons floating
 * dimmed behind a glowing cross mark — the HypeList / premium
 * onboarding pattern where brand identity sits in front and
 * context objects drift softly in the back.
 */

/** Opacity for floating app icons behind the cross hero. */
const FLOATING_APP_DIM = 0.38;
/** Cross mark height in the hero — dominant, HypeList-logo scale. */
const CROSS_MARK_HEIGHT = 310;
/** Drop distance for the card entrance — keep modest so icons
 *  don't originate above the status bar. */
const CARD_DROP_DISTANCE = 100;
/** Min height for the icon ring around the cross (pt). */
const HERO_RING_HEIGHT = 420;

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
   *  the cards never sway in sync. */
  swayMs: number;
  /** Extra delay (ms) before idle sway begins — desyncs cards
   *  without seeding the animated value off-cycle. */
  swayDelay: number;
};

// Composed by hand so cards overlap with a sense of layered depth
// rather than a uniform spread. dx is centered on screen midpoint,
// dy is centered on the hero center (negative = up).
// Picked 6 cards because more felt cluttered, fewer felt sparse.
// Ring pushed outward so icons clear the larger cross and each other.
const PLACEMENTS: ReadonlyArray<CardPlacement> = [
  { app: "instagram", dx: -132, dy:  -68, rot: -20, width: 118, z: 1, delay: 0,   swayMs: 3800, swayDelay: 0 },
  { app: "tiktok",    dx:  140, dy:  -82, rot:  16, width: 114, z: 2, delay: 120, swayMs: 4400, swayDelay: 400 },
  { app: "facebook",  dx:    8, dy: -122, rot: -10, width: 116, z: 2, delay: 200, swayMs: 3600, swayDelay: 750 },
  { app: "youtube",   dx: -148, dy:   58, rot: -10, width: 118, z: 2, delay: 280, swayMs: 5000, swayDelay: 900 },
  { app: "snapchat",  dx:  148, dy:   44, rot:  22, width: 112, z: 3, delay: 400, swayMs: 4100, swayDelay: 200 },
  { app: "x",         dx:  -18, dy:  178, rot:   5, width: 110, z: 1, delay: 520, swayMs: 4700, swayDelay: 650 },
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
  const { height: screenHeight } = useWindowDimensions();
  const { answers, reset: resetOnboarding, setAnswer } = useOnboarding();

  const heroRingHeight = Math.min(HERO_RING_HEIGHT, screenHeight * 0.48);

  // One Animated.Value per card, driving its drop-in. 0 = above
  // the resting spot, 1 = settled. Spring physics give the
  // landing a small natural bounce.
  const drops = useRef(PLACEMENTS.map(() => new Animated.Value(0))).current;

  // Idle sway — ping-pongs between -1 and 1. Every card starts
  // at -1 so loop iterations seam cleanly (see resetBeforeIteration).
  const sways = useRef(PLACEMENTS.map(() => new Animated.Value(-1))).current;
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
            overshootClamping: true,
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
      const pingPong = Animated.loop(
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
        // Default `true` snaps the value back to its initial -1
        // at every loop boundary — reads as a visible jitter.
        { resetBeforeIteration: false },
      );
      return Animated.sequence([
        Animated.delay(PLACEMENTS[i].delay + PLACEMENTS[i].swayDelay),
        pingPong,
      ]);
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

      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        {/* Hero — flex:1 centers cross + icons in the middle of the
            space above the headline (not pinned under the status bar). */}
        <View
          pointerEvents="none"
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1,
          }}
        >
          <View
            pointerEvents="none"
            style={{
              ...StyleSheet.absoluteFillObject,
              backgroundColor:
                scheme === "dark"
                  ? "rgba(0,0,0,0.42)"
                  : "rgba(248,247,244,0.55)",
            }}
          />
          <View
            style={{
              width: "100%",
              height: heroRingHeight,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View
              style={{
                position: "absolute",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 5,
              }}
            >
              <FadeIn delayMs={500} durationMs={900}>
                <LandingCross height={CROSS_MARK_HEIGHT} />
              </FadeIn>
            </View>

            {[...PLACEMENTS]
              .map((p, i) => ({ p, i }))
              .sort((a, b) => a.p.z - b.p.z)
              .map(({ p, i }) => {
                const drop = drops[i];
                const sway = sways[i];

                const dropTY = drop.interpolate({
                  inputRange: [0, 1],
                  outputRange: [p.dy - CARD_DROP_DISTANCE, p.dy],
                });
                const dropRot = drop.interpolate({
                  inputRange: [0, 1],
                  outputRange: [p.rot * 1.6, p.rot],
                });

                const swayTY = sway.interpolate({
                  inputRange: [-1, 1],
                  outputRange: [-SWAY_PX, SWAY_PX],
                });
                const swayRot = sway.interpolate({
                  inputRange: [-1, 1],
                  outputRange: [-SWAY_DEG, SWAY_DEG],
                });

                const translateY = Animated.add(dropTY, swayTY);
                const totalRot = Animated.add(dropRot, swayRot);
                const rotate = totalRot.interpolate({
                  inputRange: [-60, 60],
                  outputRange: ["-60deg", "60deg"],
                });

                const opacity = drop.interpolate({
                  inputRange: [0, 0.3, 1],
                  outputRange: [0, FLOATING_APP_DIM * 0.4, FLOATING_APP_DIM],
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

        {/* ─── Text block + CTAs ────────────────────────────── */}
        <View
          style={{
            paddingHorizontal: 28,
            paddingBottom: 12,
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
            <PrimaryPillButton
              label="Get Started"
              onPress={handleGetStarted}
              heavy
            />
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
        </View>
      </SafeAreaView>
    </View>
  );
}
