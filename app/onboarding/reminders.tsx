import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Defs, Path, RadialGradient, Rect, Stop } from "react-native-svg";
import { useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { FadeIn } from "@/components/FadeIn";
import { OnboardingHeader } from "@/components/OnboardingHeader";
import { colors } from "@/constants/theme";
import { progressFor } from "@/constants/onboarding";

export default function RemindersScreen() {
  const router = useRouter();

  // Both buttons land at the paywall — the permission ask itself
  // (or its skip) is incidental to whether the user upgrades.
  const goToPaywall = () => router.push("/onboarding/paywall");

  const handleEnable = () => {
    // Wire expo-notifications permission request here.
    // On grant or denial, proceed to the paywall.
    goToPaywall();
  };

  const handleMaybeLater = () => {
    goToPaywall();
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <OnboardingHeader progress={progressFor("reminders")} />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-6">
          {/* Moon hero — fades in slowly like the moon "rising" */}
          <FadeIn delayMs={0} durationMs={1500}>
            <View className="items-center mt-10">
              <MoonWithGlow />
            </View>
          </FadeIn>

          <FadeIn delayMs={400}>
            <Text
              className="text-ink text-[28px] leading-[36px] tracking-[-0.5px] text-center mt-10"
              style={{ fontFamily: "PlusJakartaSans_700Bold" }}
            >
              Don&apos;t let the noise steal every quiet moment.
            </Text>
          </FadeIn>

          <FadeIn delayMs={1200}>
            <Text
              className="text-ink-muted text-[16px] leading-[24px] text-center mt-5 px-2"
              style={{ fontFamily: "PlusJakartaSans_400Regular" }}
            >
              Enable gentle reminders to pause, breathe, and reconnect with God
              throughout your day.
            </Text>
          </FadeIn>

          <View className="flex-1 min-h-[40px]" />

          <FadeIn delayMs={2000}>
            <View className="pb-2">
              <Button
                label="Enable Gentle Reminders"
                onPress={handleEnable}
              />

              <Pressable
                hitSlop={12}
                onPress={handleMaybeLater}
                className="self-center mt-5 py-2 px-4"
              >
                <Text
                  className="text-ink-muted text-[15px]"
                  style={{ fontFamily: "PlusJakartaSans_500Medium" }}
                >
                  Maybe Later
                </Text>
              </Pressable>
            </View>
          </FadeIn>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────
// Moon with a soft halo behind it. The crescent itself is a single
// path; the glow is a radial gradient sitting underneath.
// ─────────────────────────────────────────────────────────────────

function MoonWithGlow() {
  const GLOW_SIZE = 280;
  const MOON_SIZE = 110;

  return (
    <View
      style={{
        width: GLOW_SIZE,
        height: GLOW_SIZE,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Soft warm halo */}
      <Svg
        width={GLOW_SIZE}
        height={GLOW_SIZE}
        style={{ position: "absolute" }}
      >
        <Defs>
          <RadialGradient id="moonGlow" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor={colors.accent} stopOpacity={0.5} />
            <Stop offset="40%" stopColor={colors.accent} stopOpacity={0.18} />
            <Stop offset="100%" stopColor={colors.accent} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect
          x={0}
          y={0}
          width={GLOW_SIZE}
          height={GLOW_SIZE}
          fill="url(#moonGlow)"
        />
      </Svg>

      {/* Crescent moon — a waxing crescent (open to the right) */}
      <Svg
        width={MOON_SIZE}
        height={MOON_SIZE}
        viewBox="0 0 24 24"
        fill="none"
      >
        <Path
          d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
          fill={colors.accent}
          fillOpacity={0.9}
        />
      </Svg>
    </View>
  );
}
