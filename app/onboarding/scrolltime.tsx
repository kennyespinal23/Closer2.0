import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { FadeIn } from "@/components/FadeIn";
import { OnboardingChrome } from "@/components/OnboardingChrome";
import { OptionCard } from "@/components/OptionCard";
import { useOnboarding, type ScrollBucket } from "@/state/onboarding";

/**
 * Screen 3 — "How long do you spend on your phone before you get
 * out of bed?"
 *
 * The second data point. Feeds two downstream calculations:
 *
 *   • Screen 6 ("That's 43 minutes of your morning. Every day.")
 *     — we surface a per-day minutes figure derived from the
 *     midpoint of the bucket the user picks here.
 *
 *   • The default app blocklist if/when we silently seed a focus
 *     routine — a user who admits to an hour is more likely to
 *     want apps blocked aggressively than someone in the
 *     "under 15" tier.
 *
 * Bucket choice rationale:
 *
 *   • "Under 15 minutes" — the polite floor. Most "I'm fine"
 *     users land here.
 *   • "15 – 30" — the "I know I do this but it's not THAT bad" tier.
 *   • "30 – 60" — uncomfortable middle. People stop being fine
 *     when they pick this one.
 *   • "Over an hour" — the wake-up call.
 *   • "I don't even want to know" — the self-aware escape hatch.
 *     We treat it as soft 30+ for math but soften the punch copy
 *     downstream (no point in shaming a user who already raised
 *     their hand).
 */

const OPTIONS: ReadonlyArray<{ bucket: ScrollBucket; label: string }> = [
  { bucket: "under15", label: "Under 15 minutes" },
  { bucket: "fifteen30", label: "15 – 30 minutes" },
  { bucket: "thirty60", label: "30 – 60 minutes" },
  { bucket: "overHour", label: "Over an hour" },
  { bucket: "unknown", label: "I don\u2019t even want to know" },
];

export default function ScrollTimeScreen() {
  const router = useRouter();
  const { answers, setAnswer } = useOnboarding();

  const [selected, setSelected] = useState<ScrollBucket | null>(
    answers.scrollBucket ?? null,
  );

  const handleContinue = () => {
    if (!selected) return;
    setAnswer("scrollBucket", selected);
    router.push("/onboarding/waketime");
  };

  return (
    <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
      <OnboardingChrome mode="back-only" />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6">
          <FadeIn delayMs={0}>
            <Text
              className="text-ink text-[26px] leading-[34px] tracking-[-0.4px] mt-4"
              style={{ fontFamily: "PlusJakartaSans_700Bold" }}
            >
              How long do you spend{"\n"}on your phone before{"\n"}you get out of bed?
            </Text>
          </FadeIn>

          <FadeIn delayMs={600}>
            <Text
              className="text-ink-muted text-[15px] leading-[22px] mt-3"
              style={{ fontFamily: "PlusJakartaSans_400Regular" }}
            >
              Be honest. We&apos;re not judging.
            </Text>
          </FadeIn>

          <FadeIn delayMs={1000}>
            <View className="mt-8 gap-3">
              {OPTIONS.map((opt) => (
                <OptionCard
                  key={opt.bucket}
                  label={opt.label}
                  selected={selected === opt.bucket}
                  onPress={() => setSelected(opt.bucket)}
                />
              ))}
            </View>
          </FadeIn>
        </View>
      </ScrollView>

      {/* Sticky Continue bar — see apps.tsx for the rationale. */}
      <View className="px-6 pt-3 pb-2 bg-bg">
        <Button
          label="Continue"
          onPress={handleContinue}
          disabled={!selected}
        />
      </View>
    </SafeAreaView>
  );
}
