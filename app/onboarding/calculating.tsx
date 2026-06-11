import { useEffect, useRef } from "react";
import { Animated, Easing, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { useRouter } from "expo-router";

/**
 * "Calculating your morning…" — the fake-loading interlude
 * between the audit (apps / scrolltime / waketime) and the
 * personalized gut punch.
 *
 * NOT built on <HeroOnboardingPage> because this screen's whole
 * point is a horizontal progress bar + staggered status lines —
 * a totally different layout from the framed-disc + quote
 * vocabulary. It DOES inherit the Hallow page's palette though:
 * the same CRIMSON the punch uses, so the user feels the
 * calculating beat and the punch reveal as ONE continuous moment
 * (calculating → punch read as "the bar fills, the wall hits").
 *
 * Implementation notes (unchanged from the previous black-canvas
 * version):
 *
 *   • Bar uses Animated.timing with native driver = false
 *     (width animations can't use native). 2800ms linear fill —
 *     reads "computer is working" rather than "almost there."
 *   • Each status line uses its own Animated.Value for opacity,
 *     fired on a delay timer. Fade-in (not type-out) keeps the
 *     visual rhythm calm.
 *   • Auto-advance at 3000ms via router.replace so the user
 *     can't swipe back and re-run the animation.
 */

const PAGE_BG = "#8B1F1F"; // matches punch — same room
const SKY_CRIMSON = "#C44545"; // matches punch's halo + sky
const BAR_FILL_MS = 2800;
const ADVANCE_MS = 3000;

const STATUS_LINES = [
  { label: "Analyzing your scroll habits", appearAt: 250 },
  { label: "Running the numbers", appearAt: 1100 },
  { label: "Building your morning picture", appearAt: 1950 },
];

export default function CalculatingScreen() {
  const router = useRouter();
  const fill = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fill, {
      toValue: 1,
      duration: BAR_FILL_MS,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    const advance = setTimeout(() => {
      router.replace("/onboarding/punch");
    }, ADVANCE_MS);

    return () => clearTimeout(advance);
  }, [fill, router]);

  const widthInterpolation = fill.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
      <StatusBar style="light" />

      {/* Ambient sky radial — same shape as every other Hallow
          page, so the calculating beat reads as part of the
          system even though its body layout is unique. */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 520,
        }}
      >
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient
              id="calc-sky"
              cx="50%"
              cy="20%"
              rx="95%"
              ry="70%"
              fx="50%"
              fy="20%"
            >
              <Stop offset="0" stopColor={SKY_CRIMSON} stopOpacity={0.55} />
              <Stop offset="0.45" stopColor={SKY_CRIMSON} stopOpacity={0.18} />
              <Stop offset="0.85" stopColor={SKY_CRIMSON} stopOpacity={0.02} />
              <Stop offset="1" stopColor={SKY_CRIMSON} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect x={0} y={0} width="100%" height="100%" fill="url(#calc-sky)" />
        </Svg>
      </View>

      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <View className="flex-1 px-8 items-center justify-center">
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

          {/* Thin progress bar — white-on-translucent for the
              empty portion, full-white for the fill. Previous
              version used red on black; on crimson bg the red
              would disappear, so we invert to white-on-tint. */}
          <View
            style={{
              width: "100%",
              height: 4,
              backgroundColor: "rgba(255,255,255,0.18)",
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <Animated.View
              style={{
                height: "100%",
                width: widthInterpolation,
                backgroundColor: "#FFFFFF",
                borderRadius: 999,
              }}
            />
          </View>

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
          color: "rgba(255,255,255,0.7)",
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
