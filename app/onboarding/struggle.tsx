import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { FadeIn } from "@/components/FadeIn";
import { OnboardingChrome } from "@/components/OnboardingChrome";
import { OptionCard } from "@/components/OptionCard";
import { progressFor } from "@/constants/onboarding";
import { useOnboarding } from "@/state/onboarding";

/**
 * Particular struggle — after denomination, before phone-time.
 * Soft personalization signal for sermon / verse recommendations.
 */

const OPTIONS = [
  { id: "lust", label: "Lust / purity" },
  { id: "anger", label: "Anger" },
  { id: "anxiety", label: "Anxiety / fear" },
  { id: "pride", label: "Pride" },
  { id: "envy", label: "Envy / comparison" },
  { id: "laziness", label: "Laziness / distraction" },
  { id: "unforgiveness", label: "Unforgiveness" },
  { id: "none", label: "Nothing specific right now" },
  { id: "preferNot", label: "I\u2019d rather not say" },
] as const;

export default function StruggleScreen() {
  const router = useRouter();
  const { answers, setAnswer } = useOnboarding();

  const [selected, setSelected] = useState<string | null>(
    answers.particularSin ?? null,
  );

  const handleContinue = () => {
    if (!selected) return;
    setAnswer("particularSin", selected);
    router.push("/onboarding/scrolltime");
  };

  return (
    <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
      <OnboardingChrome
        mode="with-progress"
        progress={progressFor("struggle")}
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
              Are you struggling with{"\n"}a particular sin?
            </Text>
          </FadeIn>

          <FadeIn delayMs={400}>
            <Text
              className="text-ink-muted text-[15px] leading-[22px] mt-3"
              style={{ fontFamily: "System", fontWeight: "400" }}
            >
              This stays between you and God. We only use it to
              point you toward the right encouragement.
            </Text>
          </FadeIn>

          <FadeIn delayMs={800}>
            <View className="mt-8 gap-3">
              {OPTIONS.map((option) => (
                <OptionCard
                  key={option.id}
                  label={option.label}
                  selected={selected === option.id}
                  onPress={() => setSelected(option.id)}
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
