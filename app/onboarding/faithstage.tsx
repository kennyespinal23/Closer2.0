import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { FadeIn } from "@/components/FadeIn";
import { OnboardingChrome } from "@/components/OnboardingChrome";
import { OptionCard } from "@/components/OptionCard";
import { useOnboarding, type FaithStage } from "@/state/onboarding";

/**
 * Faith stage — where the user is on their walk RIGHT NOW.
 *
 * Different from denomination (which is identity / tradition).
 * This is the relationship beat: are you a lifelong believer,
 * returning after years away, brand new, or just exploring?
 *
 * The pair (denomination + stage) is the seed for downstream
 * personalization. A "Catholic returning after time away" gets
 * different sermon recommendations than a "new-to-faith
 * non-denominational" user — and neither should feel like the
 * app is talking past them.
 *
 * Why this is its own screen and not a sub-question of
 * denomination: the answers don't cleanly cross-product (e.g.
 * "Catholic, just exploring" is a real and important user), and
 * sticking it on the same screen would crowd both questions.
 * One question per screen is the new-onboarding pace.
 */

type Option = {
  id: FaithStage;
  label: string;
};

const OPTIONS: ReadonlyArray<Option> = [
  { id: "lifelong", label: "I\u2019ve walked with God for years" },
  { id: "returning", label: "I\u2019m returning after time away" },
  { id: "newToFaith", label: "I\u2019m new to faith" },
  { id: "exploring", label: "I\u2019m just exploring" },
];

export default function FaithStageScreen() {
  const router = useRouter();
  const { answers, setAnswer } = useOnboarding();

  const [selected, setSelected] = useState<FaithStage | null>(
    answers.faithStage ?? null,
  );

  const handleContinue = () => {
    if (!selected) return;
    setAnswer("faithStage", selected);
    router.push("/onboarding/growth");
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
              Where are you{"\n"}on your walk?
            </Text>
          </FadeIn>

          <FadeIn delayMs={500}>
            <Text
              className="text-ink-muted text-[15px] leading-[22px] mt-3"
              style={{ fontFamily: "PlusJakartaSans_400Regular" }}
            >
              No wrong place to start.
            </Text>
          </FadeIn>

          <FadeIn delayMs={1000}>
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
