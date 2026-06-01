import { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { FadeIn } from "@/components/FadeIn";
import { OnboardingHeader } from "@/components/OnboardingHeader";
import { progressFor } from "@/constants/onboarding";
import { useColors } from "@/state/theme";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

/**
 * Floating particle config — each orb has its own position, size,
 * opacity, and phase. The phase staggers entrance + drift so the
 * composition feels organic rather than mechanical.
 */
const ORBS: OrbProps[] = [
  { x: SCREEN_W * 0.16, y: SCREEN_H * 0.42, size: 5, opacity: 0.28, phase: 0 },
  { x: SCREEN_W * 0.82, y: SCREEN_H * 0.39, size: 4, opacity: 0.22, phase: 1 },
  { x: SCREEN_W * 0.5, y: SCREEN_H * 0.5, size: 3, opacity: 0.2, phase: 2 },
  { x: SCREEN_W * 0.28, y: SCREEN_H * 0.55, size: 6, opacity: 0.32, phase: 3 },
  { x: SCREEN_W * 0.72, y: SCREEN_H * 0.58, size: 5, opacity: 0.26, phase: 4 },
  { x: SCREEN_W * 0.2, y: SCREEN_H * 0.68, size: 7, opacity: 0.34, phase: 5 },
  { x: SCREEN_W * 0.78, y: SCREEN_H * 0.71, size: 6, opacity: 0.3, phase: 6 },
];

export default function QuietScreen() {
  const router = useRouter();

  const handleContinue = () => {
    router.push("/onboarding/account");
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <OnboardingHeader progress={progressFor("quiet")} />

      {/* Sunrise glow — large radial gradient mostly off-screen at bottom,
          so only the top of the circle peeks above as a horizon line */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          bottom: -340,
          left: 0,
          right: 0,
          alignItems: "center",
        }}
      >
        <SunriseGlow />
      </View>

      {/* Floating orbs — drift slowly in place, behind the content */}
      <View
        pointerEvents="none"
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      >
        {ORBS.map((orb, i) => (
          <FloatingOrb key={i} {...orb} />
        ))}
      </View>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-6">
          <FadeIn delayMs={200}>
            <Text
              className="text-ink text-[28px] leading-[36px] tracking-[-0.5px] mt-10"
              style={{ fontFamily: "PlusJakartaSans_700Bold" }}
            >
              Even a few quiet minutes can change the direction of your day.
            </Text>
          </FadeIn>

          <FadeIn delayMs={1100}>
            <Text
              className="text-ink-muted text-[16px] leading-[24px] mt-5"
              style={{ fontFamily: "PlusJakartaSans_400Regular" }}
            >
              Closer creates space to slow down before the world gets loud
              again.
            </Text>
          </FadeIn>

          <View className="flex-1 min-h-[120px]" />

          <FadeIn delayMs={2000}>
            <View className="pt-6 pb-2">
              <Button label="Continue" onPress={handleContinue} />
            </View>
          </FadeIn>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────
// Sunrise glow — SVG radial gradient. Lives below the screen and
// peeks up to form a soft horizon. Softer/dimmer than the scripture
// screen's glow because this one is atmospheric, not the focal point.
// ─────────────────────────────────────────────────────────────────

function SunriseGlow() {
  const { accent } = useColors();
  const SIZE = 640;
  return (
    <Svg width={SIZE} height={SIZE}>
      <Defs>
        <RadialGradient id="sunrise" cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor={accent} stopOpacity={0.55} />
          <Stop offset="25%" stopColor={accent} stopOpacity={0.28} />
          <Stop offset="60%" stopColor={accent} stopOpacity={0.06} />
          <Stop offset="100%" stopColor={accent} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x={0} y={0} width={SIZE} height={SIZE} fill="url(#sunrise)" />
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────────
// Floating orb — small circle that fades in then drifts gently
// up and down forever. Uses the native driver for both animations.
// ─────────────────────────────────────────────────────────────────

type OrbProps = {
  x: number;
  y: number;
  size: number;
  opacity: number;
  phase: number;
};

function FloatingOrb({ x, y, size, opacity, phase }: OrbProps) {
  const { accent } = useColors();
  const translateY = useRef(new Animated.Value(0)).current;
  const fadeOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fadeAnim = Animated.timing(fadeOpacity, {
      toValue: opacity,
      duration: 1600,
      delay: 200 + phase * 120,
      useNativeDriver: true,
    });
    fadeAnim.start();

    const driftDistance = 8 + (phase % 3) * 3;
    const driftDuration = 3600 + phase * 500;

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: -driftDistance,
          duration: driftDuration,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: driftDuration,
          useNativeDriver: true,
        }),
      ]),
    );

    const startTimer = setTimeout(() => loop.start(), phase * 400);

    return () => {
      clearTimeout(startTimer);
      loop.stop();
      fadeAnim.stop();
    };
  }, [opacity, phase, fadeOpacity, translateY]);

  return (
    <Animated.View
      style={{
        position: "absolute",
        top: y,
        left: x,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: accent,
        opacity: fadeOpacity,
        transform: [{ translateY }],
      }}
    />
  );
}
