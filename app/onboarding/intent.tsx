import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { FadeIn } from "@/components/FadeIn";
import { OnboardingHeader } from "@/components/OnboardingHeader";
import { OptionCard } from "@/components/OptionCard";
import { useOnboarding } from "@/state/onboarding";
import { progressFor } from "@/constants/onboarding";

const OPTIONS = [
  "I want to feel closer to God",
  "I want more consistency",
  "I want peace and clarity",
  "I\u2019m rebuilding my faith",
  "I want deeper understanding",
  "I\u2019m going through something difficult",
  "I\u2019m just exploring",
];

export default function IntentScreen() {
  const router = useRouter();
  const { answers, setAnswer } = useOnboarding();
  const [selected, setSelected] = useState<string | null>(
    answers.intent ?? null,
  );

  const handleContinue = () => {
    if (!selected) return;
    setAnswer("intent", selected);
    router.push("/onboarding/scripture");
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <OnboardingHeader progress={progressFor("intent")} />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-6">
          <FadeIn delayMs={0}>
            <Text
              className="text-ink text-[26px] leading-[34px] tracking-[-0.4px] mt-6"
              style={{ fontFamily: "PlusJakartaSans_700Bold" }}
            >
              What brings you to Closer right now?
            </Text>
          </FadeIn>

          <FadeIn delayMs={700}>
            <Text
              className="text-ink-muted text-[15px] leading-[22px] mt-3"
              style={{ fontFamily: "PlusJakartaSans_400Regular" }}
            >
              Pick the one that feels closest today.
            </Text>
          </FadeIn>

          <FadeIn delayMs={1300}>
            <View className="mt-8 gap-3">
              {OPTIONS.map((option) => (
                <OptionCard
                  key={option}
                  label={option}
                  selected={selected === option}
                  onPress={() => setSelected(option)}
                />
              ))}
            </View>
          </FadeIn>

          <View className="flex-1 min-h-[16px]" />

          <FadeIn delayMs={1300}>
            <View className="pt-6 pb-2">
              <Button
                label="Continue"
                onPress={handleContinue}
                disabled={!selected}
              />
            </View>
          </FadeIn>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
