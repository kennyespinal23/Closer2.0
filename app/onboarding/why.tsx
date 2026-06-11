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
 * Screen 1 (new flow) — "What brings you to Closer?"
 *
 * The opening of onboarding. Was screen 7 in the previous flow
 * (after the gut punch); promoted to first so the user names
 * their reason BEFORE we audit their phone time.
 *
 * Putting "why are you here" up front does two things:
 *
 *   1. It opens with the user, not with a number. The previous
 *      order led with "the average American spends 2:27 on
 *      socials" — a striking but impersonal stat. Opening with
 *      "what brings you to Closer?" frames the next 60 seconds
 *      as a conversation about the user, which makes the stat
 *      that lands later (now after name) cut deeper because by
 *      then we know who they are and what they're searching for.
 *
 *   2. It gives the rest of the flow a thread to refer back to.
 *      "You said you grew up in faith and drifted" or "You said
 *      something feels missing" — having that anchor sentence
 *      from screen 1 lets later screens echo it.
 *
 * Options unchanged from the previous spec — each is a real
 * entry point with no obviously correct one; that ambiguity is
 * the point. Persisted as `whyAnswer`.
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
    <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
      <OnboardingChrome mode="back-only" />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6">
          <FadeIn delayMs={0}>
            <Text
              className="text-ink text-[28px] leading-[36px] tracking-[-0.6px] mt-4"
              style={{ fontFamily: "PlusJakartaSans_700Bold" }}
            >
              What brings you{"\n"}to Closer?
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
