import { useEffect, useRef, type ReactNode } from "react";
import { Animated, Easing, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { FadeIn } from "@/components/FadeIn";
import { OnboardingChrome } from "@/components/OnboardingChrome";
import { CLOSER_ACCENT } from "@/constants/theme";
import { useColors } from "@/state/theme";

/**
 * HeroOnboardingPage — the narrative "strong visual page"
 * vocabulary used across the emotional beats of onboarding.
 *
 * June 2026 refresh: every Hallow-style beat now rides the app's
 * light canvas (warm cream bg, dark ink) instead of saturated
 * full-bleed color rooms with radial gradients. The orange
 * CLOSER_ACCENT carries the faith-forward warmth on the CTA and
 * disc halo; the page itself stays calm and readable.
 */
export type HeroOnboardingPageProps = {
  /** @deprecated Ignored — pages now use the active theme bg. */
  pageBg?: string;
  /** @deprecated Ignored — radial atmosphere removed for light mode. */
  ambientGlow?: string;
  showBack?: boolean;
  subject: ReactNode;
  quoteSetup: string;
  quoteEmphasis: string;
  attribution?: string;
  ctaLabel: string;
  onContinue: () => void;
  /** @deprecated CTA is always white on orange now. */
  ctaTextColor?: string;
  eyebrow?: string;
};

export function HeroOnboardingPage({
  showBack = true,
  subject,
  quoteSetup,
  quoteEmphasis,
  attribution,
  ctaLabel,
  onContinue,
  eyebrow,
}: HeroOnboardingPageProps) {
  const colors = useColors();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="dark" />

      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        {showBack ? (
          <OnboardingChrome mode="back-only" tone="auto" />
        ) : (
          <View style={{ height: 64 }} />
        )}

        <View style={{ flex: 1, paddingHorizontal: 28 }}>
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            {eyebrow ? (
              <FadeIn delayMs={100} durationMs={800}>
                <Text
                  style={{
                    color: colors.inkSecondary,
                    fontFamily: "System",
                    fontWeight: "700",
                    fontSize: 11,
                    letterSpacing: 2.8,
                    textTransform: "uppercase",
                    marginBottom: 22,
                    textAlign: "center",
                  }}
                >
                  {eyebrow}
                </Text>
              </FadeIn>
            ) : null}
            <FadeIn delayMs={200} durationMs={1100}>
              {subject}
            </FadeIn>
          </View>

          <View style={{ flex: 1, justifyContent: "flex-start" }}>
            <FadeIn delayMs={1100} durationMs={1100}>
              <Text
                style={{
                  fontFamily: "System",
                  fontWeight: "600",
                  fontSize: 23,
                  lineHeight: 32,
                  letterSpacing: -0.4,
                  textAlign: "left",
                }}
              >
                <Text style={{ color: colors.inkSecondary }}>
                  &ldquo;{quoteSetup}{" "}
                </Text>
                <Text style={{ color: colors.ink }}>
                  {quoteEmphasis}&rdquo;
                </Text>
              </Text>
            </FadeIn>

            {attribution ? (
              <FadeIn delayMs={1900} durationMs={900}>
                <Text
                  style={{
                    color: colors.inkMuted,
                    fontFamily: "System",
                    fontWeight: "500",
                    fontSize: 14,
                    marginTop: 18,
                  }}
                >
                  {attribution}
                </Text>
              </FadeIn>
            ) : null}
          </View>

          <FadeIn delayMs={2600} durationMs={800}>
            <Pressable
              onPress={onContinue}
              accessibilityRole="button"
              accessibilityLabel={ctaLabel}
              style={({ pressed }) => ({
                height: 58,
                borderRadius: 999,
                backgroundColor: CLOSER_ACCENT,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 8,
                opacity: pressed ? 0.88 : 1,
              })}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontFamily: "System",
                  fontWeight: "700",
                  fontSize: 17,
                  letterSpacing: -0.1,
                }}
              >
                {ctaLabel}
              </Text>
            </Pressable>
          </FadeIn>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// HeroDisc — the standard circular framed subject.
// ─────────────────────────────────────────────────────────────────

export type HeroDiscProps = {
  /** @deprecated Halo now uses CLOSER_ACCENT at low alpha. */
  haloColor?: string;
  size?: number;
  children: ReactNode;
  breathe?: boolean;
  innerPaddingVertical?: number;
};

export function HeroDisc({
  size = 196,
  children,
  breathe = true,
  innerPaddingVertical = 0,
}: HeroDiscProps) {
  const colors = useColors();
  const breath = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!breathe) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breath, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [breath, breathe]);

  const discScale = breathe
    ? breath.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.015],
      })
    : 1;
  const haloOpacity = breathe
    ? breath.interpolate({
        inputRange: [0, 1],
        outputRange: [0.18, 0.32],
      })
    : 0.24;

  const haloSize = Math.round(size * 1.42);

  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <Animated.View
        style={{
          position: "absolute",
          width: haloSize,
          height: haloSize,
          borderRadius: haloSize / 2,
          backgroundColor: CLOSER_ACCENT,
          opacity: haloOpacity,
          transform: [{ scale: 0.7 }],
        }}
      />
      <Animated.View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: innerPaddingVertical,
          transform: [{ scale: discScale }],
          shadowColor: "#000",
          shadowOpacity: 0.06,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 12,
          elevation: 3,
        }}
      >
        {children}
      </Animated.View>
    </View>
  );
}
