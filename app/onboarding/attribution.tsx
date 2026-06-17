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
 * Screen 12 — "Last thing before we set you up — how did you
 * hear about Closer?"
 *
 * Pure product analytics. The answer goes into the persisted
 * onboarding blob and never gets shown back to the user. The
 * "last thing before we set you up" framing is the bridge that
 * connects the post-reveal mood to the practical setup half
 * (notifications, account, time, paywall) coming next.
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
    router.push("/onboarding/notifications");
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
              className="text-ink-muted text-[13px] tracking-[2px] uppercase mt-4"
              style={{ fontFamily: "System", fontWeight: "700" }}
            >
              Last thing before we set you up
            </Text>
          </FadeIn>

          <FadeIn delayMs={400}>
            <Text
              className="text-ink text-[26px] leading-[34px] tracking-[-0.4px] mt-3"
              style={{ fontFamily: "System", fontWeight: "700" }}
            >
              How did you hear about Closer?
            </Text>
          </FadeIn>

          <FadeIn delayMs={900}>
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
