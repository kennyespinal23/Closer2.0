import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { FadeIn } from "@/components/FadeIn";
import { OnboardingChrome } from "@/components/OnboardingChrome";
import { OptionCard } from "@/components/OptionCard";
import { progressFor } from "@/constants/onboarding";
import { useOnboarding, type WakeBucket } from "@/state/onboarding";

/**
 * Preferred daily-devotional delivery window.
 * Stored as `wakeBucket` so the later /time picker can pre-select
 * a matching default.
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
    router.push("/onboarding/creating-journey");
  };

  return (
    <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
      <OnboardingChrome
        mode="with-progress"
        progress={progressFor("waketime")}
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6">
          <FadeIn delayMs={0}>
            <Text
              className="text-ink text-[28px] leading-[36px] tracking-[-0.6px] mt-4"
              style={{ fontFamily: "System", fontWeight: "700" }}
            >
              What time do you want to{"\n"}receive your daily{"\n"}devotional?
            </Text>
          </FadeIn>

          <FadeIn delayMs={500}>
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
