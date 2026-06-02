import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { FadeIn } from "@/components/FadeIn";
import { OnboardingChrome } from "@/components/OnboardingChrome";
import { OptionCard } from "@/components/OptionCard";
import { useOnboarding } from "@/state/onboarding";

/**
 * Screen 7 — "Why do you want to get closer to God?"
 *
 * The emotional anchor right after the gut punch. The punch
 * exposes a cost; this screen lets the user name a reason. The
 * sequence matters — they're choosing a reason while the number
 * from the previous screen is still in their head.
 *
 * Options are the rebuilt set from the spec: "I feel distant",
 * "I'm going through something hard", "I grew up in faith and
 * drifted", "Never really had a faith life but curious", "Just
 * feel like something is missing." Each is a real entry point;
 * none feels like the obviously correct one. That ambiguity is
 * the point — the user has to choose for themselves.
 *
 * The answer gets persisted as `whyAnswer` but isn't used to
 * branch the rest of onboarding. Today it's a single-touch
 * personalization input (the home screen / journal could surface
 * it back later); tomorrow it could feed A/B copy variants.
 */

const OPTIONS = [
  "I feel distant and I don\u2019t know why",
  "I\u2019m going through something hard right now",
  "I grew up in faith and slowly drifted away",
  "I\u2019ve never really had a faith life but I\u2019m curious",
  "I just feel like something is missing",
];

export default function WhyScreen() {
  const router = useRouter();
  const { answers, setAnswer } = useOnboarding();

  const [selected, setSelected] = useState<string | null>(
    answers.whyAnswer ?? null,
  );

  const handleContinue = () => {
    if (!selected) return;
    setAnswer("whyAnswer", selected);
    router.push("/onboarding/name");
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <OnboardingChrome mode="back-only" />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-6">
          <FadeIn delayMs={0}>
            <Text
              className="text-ink text-[26px] leading-[34px] tracking-[-0.4px] mt-4"
              style={{ fontFamily: "PlusJakartaSans_700Bold" }}
            >
              Why do you want to{"\n"}get closer to God?
            </Text>
          </FadeIn>

          <FadeIn delayMs={500}>
            <Text
              className="text-ink-muted text-[15px] leading-[22px] mt-3"
              style={{ fontFamily: "PlusJakartaSans_400Regular" }}
            >
              No wrong answers.
            </Text>
          </FadeIn>

          <FadeIn delayMs={1000}>
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

          <View className="pt-6 pb-2">
            <Button
              label="Continue"
              onPress={handleContinue}
              disabled={!selected}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
