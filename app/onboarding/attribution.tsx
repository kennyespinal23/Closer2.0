import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { FadeIn } from "@/components/FadeIn";
import { OnboardingChrome } from "@/components/OnboardingChrome";
import { OptionCard } from "@/components/OptionCard";
import { progressFor } from "@/constants/onboarding";
import {
  useOnboarding,
  type AttributionSource,
} from "@/state/onboarding";

/**
 * First onboarding screen after Get Started —
 * "Where'd you hear about us?"
 *
 * Pure product analytics. Lives before name so we capture source
 * early; the answer is never shown back to the user.
 */

const OPTIONS: ReadonlyArray<{ source: AttributionSource; label: string }> = [
  { source: "instagram", label: "Instagram" },
  { source: "tiktok", label: "TikTok" },
  { source: "friend", label: "A friend or family member" },
  { source: "church", label: "Church" },
  { source: "google", label: "Google" },
  { source: "other", label: "Other" },
];

export default function AttributionScreen() {
  const router = useRouter();
  const { answers, setAnswer } = useOnboarding();

  const [selected, setSelected] = useState<AttributionSource | null>(
    answers.hearAboutUs ?? null,
  );

  const handleContinue = () => {
    if (!selected) return;
    setAnswer("hearAboutUs", selected);
    router.push("/onboarding/name");
  };

  return (
    <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
      <OnboardingChrome
        mode="with-progress"
        progress={progressFor("attribution")}
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6">
          <FadeIn delayMs={0}>
            <Text
              className="text-ink text-[34px] leading-[42px] tracking-[-0.8px] mt-6"
              style={{ fontFamily: "System", fontWeight: "700" }}
            >
              Where&apos;d you hear about us?
            </Text>
          </FadeIn>

          <FadeIn delayMs={500}>
            <View className="mt-8 gap-3">
              {OPTIONS.map((opt) => (
                <OptionCard
                  key={opt.source}
                  label={opt.label}
                  selected={selected === opt.source}
                  onPress={() => setSelected(opt.source)}
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
