import { useEffect, useRef } from "react";
import { Animated, Easing, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";

/**
 * Screen 5 — "Calculating your morning…"
 *
 * The fake-loading interlude between the audit (Screens 1–4) and
 * the personalized gut punch (Screen 6). Purpose:
 *
 *   1. Give the punch screen time to feel "earned." Showing the
 *      personal stat the instant the user picks their wake-time
 *      reads like "here's some math we did" — showing it after
 *      three seconds of "Running the numbers" reads like "here's
 *      what we discovered about you."
 *
 *   2. Stage the reveal. The slow fill + staggered status lines
 *      build a small narrative arc all on their own. By the time
 *      the bar reaches 100% the user is leaning forward.
 *
 * Implementation notes:
 *
 *   • Bar uses Animated.timing with the native driver so the fill
 *     stays at 60fps even on lower-end devices. Total fill time
 *     is 2800ms — short enough that the screen doesn't feel like
 *     a delay tactic, long enough that the punch screen has a
 *     moment to load behind the scenes.
 *
 *   • Each status line uses a separate Animated.Value for its
 *     opacity, fired on a delay timer relative to mount. The
 *     lines fade in (not type out) to keep the visual rhythm
 *     calm — type-out would feel like "fake terminal output."
 *
 *   • Auto-navigation fires at 3000ms (the bar reaches 100% at
 *     2800ms; the extra 200ms lets the eye register "full" before
 *     the screen swaps). We use router.replace so the user can't
 *     swipe back into the loading screen and re-run the animation.
 *
 *   • The whole screen is forced black regardless of theme. The
 *     thin red progress bar carries the only color on the page —
 *     matching the spec's "thin, red, fills slowly left to right."
 */

const BAR_FILL_MS = 2800;
const ADVANCE_MS = 3000;
// Spec calls out a thin RED progress bar. Closer's palette is
// neutral monochrome elsewhere; the loading bar is the one place
// red appears, because the spec leans into that color choice as
// a "calculating something serious" signal.
const RED = "#E53935";

const STATUS_LINES = [
  { label: "Analyzing your scroll habits", appearAt: 250 },
  { label: "Running the numbers", appearAt: 1100 },
  { label: "Building your morning picture", appearAt: 1950 },
];

export default function CalculatingScreen() {
  const router = useRouter();
  const fill = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Drive the bar from 0 → 1 over the full duration. Linear
    // easing reads more "computer is working" than ease-out;
    // ease-out would suggest "almost there" too early and break
    // the suspense.
    Animated.timing(fill, {
      toValue: 1,
      duration: BAR_FILL_MS,
      easing: Easing.linear,
      useNativeDriver: false, // width animation can't use native
    }).start();

    const advance = setTimeout(() => {
      router.replace("/onboarding/punch");
    }, ADVANCE_MS);

    return () => clearTimeout(advance);
  }, [fill, router]);

  // Map fill 0..1 → "0%".."100%" for the inner bar width.
  const widthInterpolation = fill.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={{ flex: 1, backgroundColor: "#000000" }}>
      <StatusBar style="light" />
      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <View className="flex-1 px-8 items-center justify-center">
          {/* Title — quiet, neutral. The energy is in the bar
              below, not in the headline. Slightly smaller than the
              comfortable hero size (20 vs 22) because at the wider
              size the ellipsis was clipping on standard 6.1"
              devices when the horizontal padding pushed in. */}
          <Text
            style={{
              color: "#FFFFFF",
              fontFamily: "PlusJakartaSans_600SemiBold",
              fontSize: 20,
              letterSpacing: -0.2,
              textAlign: "center",
              marginBottom: 36,
            }}
          >
            Calculating your morning…
          </Text>

          {/* Progress bar — thin, red, fills slowly left to right.
              The track is a faint white so the empty portion of
              the bar is visible against pure black. */}
          <View
            style={{
              width: "100%",
              height: 4,
              backgroundColor: "rgba(255,255,255,0.08)",
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <Animated.View
              style={{
                height: "100%",
                width: widthInterpolation,
                backgroundColor: RED,
                borderRadius: 999,
              }}
            />
          </View>

          {/* Status lines fade in one at a time, in sync with the
              bar's progress. Each line is a slightly different
              "step" the loader is supposedly doing. */}
          <View style={{ marginTop: 32, alignItems: "center" }}>
            {STATUS_LINES.map((line) => (
              <StatusLine
                key={line.label}
                label={line.label}
                appearAt={line.appearAt}
              />
            ))}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

/**
 * Single status line. Owns its own opacity animator so each line
 * fades in at its individual delay without the parent needing to
 * orchestrate a sequence of Animateds.
 */
function StatusLine({ label, appearAt }: { label: string; appearAt: number }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 500,
      delay: appearAt,
      useNativeDriver: true,
    }).start();
  }, [opacity, appearAt]);

  return (
    <Animated.View style={{ opacity, marginTop: 10 }}>
      <Text
        style={{
          color: "#9B9BA3",
          fontFamily: "PlusJakartaSans_500Medium",
          fontSize: 14,
          textAlign: "center",
          letterSpacing: 0.1,
        }}
      >
        {label}
      </Text>
    </Animated.View>
  );
}
