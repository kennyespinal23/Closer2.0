import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { FadeIn } from "@/components/FadeIn";
import { OnboardingChrome } from "@/components/OnboardingChrome";
import { OptionCard } from "@/components/OptionCard";
import { useOnboarding, type WakeBucket } from "@/state/onboarding";

/**
 * Screen 4 — "What time do you usually wake up?"
 *
 * Last data point in The Audit. We use this to:
 *
 *   • Pre-select a reasonable default on the morning-time picker
 *     on Screen 14. A user who wakes at 7am gets "7:00am — Most
 *     people" pre-highlighted; a 6am riser gets "6:00am — Early
 *     riser."
 *
 *   • Flavor the gut-punch line on Screen 6 ("Every day. Before
 *     you've even had coffee.").
 *
 * The buckets mirror the Screen 14 picker's options so the
 * mapping is one-to-one — when we lift this answer onto the
 * picker later, there's no guesswork.
 */

const OPTIONS: ReadonlyArray<{ bucket: WakeBucket; label: string }> = [
  { bucket: "before6", label: "Before 6am" },
  { bucket: "six7", label: "6:00 – 7:00am" },
  { bucket: "seven8", label: "7:00 – 8:00am" },
  { bucket: "eight9", label: "8:00 – 9:00am" },
  { bucket: "after9", label: "After 9am" },
];

export default function WakeTimeScreen() {
  const router = useRouter();
  const { answers, setAnswer } = useOnboarding();

  const [selected, setSelected] = useState<WakeBucket | null>(
    answers.wakeBucket ?? null,
  );

  const handleContinue = () => {
    if (!selected) return;
    setAnswer("wakeBucket", selected);
    // Pattern is the spiritual diagnosis that names what the user
    // just admitted ("Phone first. Phone last."), before the
    // calculating screen sets up the personalized punch.
    router.push("/onboarding/pattern");
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
              What time do you usually wake up?
            </Text>
          </FadeIn>

          <FadeIn delayMs={700}>
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
