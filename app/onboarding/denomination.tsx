import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { FadeIn } from "@/components/FadeIn";
import { OnboardingChrome } from "@/components/OnboardingChrome";
import { OptionCard } from "@/components/OptionCard";
import { useOnboarding, type Denomination } from "@/state/onboarding";

/**
 * Faith background — the first of three Christian-specific beats
 * inserted between /name and /stat. Establishes WHO the user is
 * spiritually before the secular app audit begins.
 *
 * Why this matters as the third onboarding screen:
 *
 *   • Without these beats, the previous onboarding read as a
 *     generic "app blocker" flow that happened to mention God in
 *     passing. Asking the denomination question up front signals
 *     to the user — within 30 seconds of downloading — that
 *     Closer is a *Christian* product first, a focus product
 *     second. That's the right priority for our positioning.
 *
 *   • Denomination is what most premium Christian apps (Hallow,
 *     YouVersion, Pray.com) ask first because it unlocks every
 *     downstream personalization decision: translation defaults,
 *     prayer style recommendations, sermon picks, language
 *     choices ("Mass" vs "service" vs "fellowship", etc.).
 *
 * Options intentionally include "Christian — not sure which" and
 * "I'm exploring" so the screen doesn't make users feel they
 * have to pick a tradition they don't identify with. The latter
 * is the answer for deconstructing / curious / new-to-faith users
 * — that group is huge and a forced pick would feel exclusionary.
 */

type Option = {
  id: Denomination;
  label: string;
};

const OPTIONS: ReadonlyArray<Option> = [
  { id: "catholic", label: "Catholic" },
  { id: "protestant", label: "Protestant" },
  { id: "orthodox", label: "Orthodox" },
  { id: "nondenominational", label: "Non-denominational" },
  { id: "christianOther", label: "Christian — not sure which" },
  { id: "exploring", label: "I\u2019m exploring" },
];

export default function DenominationScreen() {
  const router = useRouter();
  const { answers, setAnswer } = useOnboarding();

  const [selected, setSelected] = useState<Denomination | null>(
    answers.denomination ?? null,
  );

  const handleContinue = () => {
    if (!selected) return;
    setAnswer("denomination", selected);
    router.push("/onboarding/faithstage");
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
              style={{ fontFamily: "System", fontWeight: "700" }}
            >
              What&apos;s your{"\n"}faith background?
            </Text>
          </FadeIn>

          <FadeIn delayMs={500}>
            <Text
              className="text-ink-muted text-[15px] leading-[22px] mt-3"
              style={{ fontFamily: "System", fontWeight: "400" }}
            >
              We&apos;ll meet you where you are.
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

      {/* Sticky Continue — see apps.tsx for rationale. */}
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
