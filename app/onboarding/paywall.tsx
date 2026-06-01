import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Defs, Path, RadialGradient, Rect, Stop } from "react-native-svg";
import { useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { FadeIn } from "@/components/FadeIn";
import { useColors } from "@/state/theme";

const FEATURES = [
  "Personalized daily sermons",
  "Prayer nights",
  "Guided reflections",
  "Spiritual check-ins",
  "Journey tracking",
  "Exclusive content",
  "Future premium experiences",
];

const TRIAL_DAYS = 7;

export default function PaywallScreen() {
  const router = useRouter();
  const colors = useColors();

  const enterApp = () => {
    // `replace` so the user can't swipe/back into the onboarding stack.
    router.replace("/today");
  };

  const handleStart = () => {
    // TODO: Wire RevenueCat / StoreKit purchase flow here.
    // For now, simulate a successful purchase and drop the user into the app.
    enterApp();
  };

  const handleClose = () => {
    // Dismissing the paywall also lands them in the app — we'll
    // gate premium features inline later instead of blocking entry.
    enterApp();
  };

  const handleRestore = () => {
    // TODO: Wire restore purchases.
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      {/* Custom mini-header — just an X. No back button, no progress.
          This screen is no longer part of the onboarding arc. */}
      <View className="flex-row justify-end px-5 pt-2 pb-3">
        <Pressable
          hitSlop={14}
          onPress={handleClose}
          className="w-10 h-10 rounded-full items-center justify-center bg-surface border border-border"
        >
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path
              d="M6 6l12 12M6 18L18 6"
              stroke={colors.ink}
              strokeWidth={2}
              strokeLinecap="round"
            />
          </Svg>
        </Pressable>
      </View>

      {/* Premium ambient glow behind the offer area */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 320,
          left: 0,
          right: 0,
          alignItems: "center",
        }}
      >
        <PremiumGlow />
      </View>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-6">
          {/* Journey progression — 7 dots, one per trial day */}
          <FadeIn delayMs={0} durationMs={1200}>
            <View className="items-center pt-2 pb-6">
              <JourneyDots total={TRIAL_DAYS} />
            </View>
          </FadeIn>

          <FadeIn delayMs={300}>
            <Text
              className="text-ink text-[30px] leading-[38px] tracking-[-0.6px] text-center"
              style={{ fontFamily: "PlusJakartaSans_700Bold" }}
            >
              Build a daily rhythm with God.
            </Text>
          </FadeIn>

          <FadeIn delayMs={800}>
            <Text
              className="text-ink-muted text-[16px] leading-[24px] text-center mt-3"
              style={{ fontFamily: "PlusJakartaSans_400Regular" }}
            >
              Unlock the full Closer experience.
            </Text>
          </FadeIn>

          {/* Features list */}
          <FadeIn delayMs={1300}>
            <View className="mt-8 gap-3">
              {FEATURES.map((feature) => (
                <FeatureRow key={feature} label={feature} />
              ))}
            </View>
          </FadeIn>

          {/* Offer card — the focal point */}
          <FadeIn delayMs={2000}>
            <View className="mt-9 rounded-2xl border-2 border-primary bg-accent-soft px-6 py-6 items-center">
              <Text
                className="text-primary text-[12px] tracking-[3px] uppercase"
                style={{ fontFamily: "PlusJakartaSans_700Bold" }}
              >
                7-Day Free Trial
              </Text>
              <Text
                className="text-ink text-[18px] mt-3"
                style={{ fontFamily: "PlusJakartaSans_500Medium" }}
              >
                Then{" "}
                <Text style={{ fontFamily: "PlusJakartaSans_700Bold" }}>
                  $XX/year
                </Text>
              </Text>
            </View>
          </FadeIn>

          {/* CTA + reassurance */}
          <FadeIn delayMs={2500}>
            <View className="mt-6">
              <Button label="Begin Your 7 Days" onPress={handleStart} />
              <Text
                className="text-ink-muted text-[13px] text-center mt-4"
                style={{ fontFamily: "PlusJakartaSans_500Medium" }}
              >
                Cancel anytime.
              </Text>
            </View>
          </FadeIn>

          {/* App Store boilerplate links */}
          <FadeIn delayMs={3000}>
            <View className="flex-row justify-center items-center mt-6 mb-2 gap-4">
              <Pressable hitSlop={8} onPress={handleRestore}>
                <Text
                  className="text-ink-subtle text-[12px]"
                  style={{ fontFamily: "PlusJakartaSans_500Medium" }}
                >
                  Restore Purchases
                </Text>
              </Pressable>
              <Dot />
              <Pressable hitSlop={8}>
                <Text
                  className="text-ink-subtle text-[12px]"
                  style={{ fontFamily: "PlusJakartaSans_500Medium" }}
                >
                  Terms
                </Text>
              </Pressable>
              <Dot />
              <Pressable hitSlop={8}>
                <Text
                  className="text-ink-subtle text-[12px]"
                  style={{ fontFamily: "PlusJakartaSans_500Medium" }}
                >
                  Privacy
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
// Journey progression — N dots, day 1 brightest, fading right.
// Visualizes the trial: you start here, the path extends ahead.
// ─────────────────────────────────────────────────────────────────

function JourneyDots({ total }: { total: number }) {
  const colors = useColors();
  return (
    <View className="flex-row items-center" style={{ gap: 12 }}>
      {Array.from({ length: total }).map((_, i) => {
        // First dot: fully lit + slightly larger (today)
        // Subsequent: progressively dimmer (the journey ahead)
        const isToday = i === 0;
        const opacity = isToday ? 1 : Math.max(0.15, 0.85 - i * 0.12);
        const size = isToday ? 8 : 6;
        return (
          <View
            key={i}
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: colors.accent,
              opacity,
            }}
          />
        );
      })}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Feature row — orange checkmark + label
// ─────────────────────────────────────────────────────────────────

function FeatureRow({ label }: { label: string }) {
  const colors = useColors();
  return (
    <View className="flex-row items-center">
      <View className="w-6 items-center mr-3">
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Path
            d="M5 12.5l4.5 4.5L19 7"
            stroke={colors.accent}
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>
      <Text
        className="text-ink text-[16px] leading-[24px] flex-1"
        style={{ fontFamily: "PlusJakartaSans_500Medium" }}
      >
        {label}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Premium ambient glow — sits behind the offer card area
// ─────────────────────────────────────────────────────────────────

function PremiumGlow() {
  const colors = useColors();
  const SIZE = 480;
  return (
    <Svg width={SIZE} height={SIZE} style={{ opacity: 0.7 }}>
      <Defs>
        <RadialGradient id="premiumGlow" cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor={colors.accent} stopOpacity={0.28} />
          <Stop offset="50%" stopColor={colors.accent} stopOpacity={0.08} />
          <Stop offset="100%" stopColor={colors.accent} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x={0} y={0} width={SIZE} height={SIZE} fill="url(#premiumGlow)" />
    </Svg>
  );
}

// Tiny separator dot for the footer links
function Dot() {
  const colors = useColors();
  return (
    <View
      style={{
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: colors.inkSubtle,
      }}
    />
  );
}
