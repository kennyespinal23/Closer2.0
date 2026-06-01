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
import { FadeIn } from "@/components/FadeIn";
import { OnboardingHeader } from "@/components/OnboardingHeader";
import { SocialButton } from "@/components/SocialButton";
import { progressFor } from "@/constants/onboarding";
import { useColors } from "@/state/theme";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

/**
 * A sparser set of orbs than the Quiet screen. The atmosphere is the
 * same world, but the focus has shifted from "be still" to "step in".
 */
const ORBS: OrbProps[] = [
  { x: SCREEN_W * 0.14, y: SCREEN_H * 0.4, size: 5, opacity: 0.24, phase: 0 },
  { x: SCREEN_W * 0.82, y: SCREEN_H * 0.46, size: 4, opacity: 0.2, phase: 2 },
  { x: SCREEN_W * 0.25, y: SCREEN_H * 0.6, size: 6, opacity: 0.26, phase: 4 },
  { x: SCREEN_W * 0.78, y: SCREEN_H * 0.66, size: 5, opacity: 0.22, phase: 6 },
];

export default function AccountScreen() {
  const router = useRouter();

  // For now, all three providers land the user at the reminders step
  // after auth. When real auth is wired, the SDK success callback
  // will trigger this navigation instead.
  const goToReminders = () => router.push("/onboarding/reminders");

  const handleApple = () => {
    // Wire Sign in with Apple SDK here.
    goToReminders();
  };

  const handleGoogle = () => {
    // Wire Google Sign-In SDK here.
    goToReminders();
  };

  const handleEmail = () => {
    // Will navigate to a dedicated email/password form when wired.
    goToReminders();
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <OnboardingHeader progress={progressFor("account")} />

      {/* Soft symbolic background — centered warm halo behind the content */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: SCREEN_H * 0.12,
          left: 0,
          right: 0,
          alignItems: "center",
        }}
      >
        <CenteredHalo />
      </View>

      {/* Sparse floating orbs continuing the visual language from /quiet */}
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
          {/* Headline + subtext, generously spaced */}
          <View className="mt-16">
            <FadeIn delayMs={0}>
              <Text
                className="text-ink text-[32px] leading-[40px] tracking-[-0.8px]"
                style={{ fontFamily: "PlusJakartaSans_700Bold" }}
              >
                Start your journey{"\n"}with Closer.
              </Text>
            </FadeIn>

            <FadeIn delayMs={700}>
              <Text
                className="text-ink-muted text-[16px] leading-[24px] mt-4"
                style={{ fontFamily: "PlusJakartaSans_400Regular" }}
              >
                Create your account to personalize your experience.
              </Text>
            </FadeIn>
          </View>

          {/* Lots of breathing room before the buttons */}
          <View className="flex-1 min-h-[60px]" />

          {/* Action stack — three providers, equal weight */}
          <FadeIn delayMs={1400}>
            <View className="gap-3">
              <SocialButton provider="apple" onPress={handleApple} />
              <SocialButton provider="google" onPress={handleGoogle} />
              <SocialButton provider="email" onPress={handleEmail} />
            </View>
          </FadeIn>

          {/* Quiet legal fine print */}
          <FadeIn delayMs={2000}>
            <Text
              className="text-ink-subtle text-[11px] leading-[16px] text-center mt-6 mb-2 px-4"
              style={{ fontFamily: "PlusJakartaSans_400Regular" }}
            >
              By continuing, you agree to our{" "}
              <Text
                className="text-ink-muted"
                style={{ fontFamily: "PlusJakartaSans_500Medium" }}
              >
                Terms of Service
              </Text>{" "}
              and{" "}
              <Text
                className="text-ink-muted"
                style={{ fontFamily: "PlusJakartaSans_500Medium" }}
              >
                Privacy Policy
              </Text>
              .
            </Text>
          </FadeIn>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────
// Centered warm halo. The glow has moved from the horizon (Quiet
// screen) to the center — like the user has arrived at the door.
// ─────────────────────────────────────────────────────────────────

function CenteredHalo() {
  const { accent } = useColors();
  const SIZE = 520;
  return (
    <Svg width={SIZE} height={SIZE} style={{ opacity: 0.7 }}>
      <Defs>
        <RadialGradient id="halo" cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor={accent} stopOpacity={0.32} />
          <Stop offset="40%" stopColor={accent} stopOpacity={0.12} />
          <Stop offset="100%" stopColor={accent} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x={0} y={0} width={SIZE} height={SIZE} fill="url(#halo)" />
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────────
// Same orb pattern as the Quiet screen — consistent atmosphere.
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
