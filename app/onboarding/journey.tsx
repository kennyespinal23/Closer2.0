import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { FadeIn } from "@/components/FadeIn";
import { OnboardingHeader } from "@/components/OnboardingHeader";
import { progressFor } from "@/constants/onboarding";

const SCENARIOS = [
  "Some are returning.",
  "Some are rebuilding consistency.",
  "Some are searching for peace.",
  "Some simply want more of Him.",
];

export default function JourneyScreen() {
  const router = useRouter();

  const handleContinue = () => {
    router.push("/onboarding/intent");
  };

  // Pacing — shorter and warmer than the previous reflection screens.
  const DELAYS = {
    headline: 0,
    subtext: 1000,
    scenario: (i: number) => 1900 + i * 600,
    whereverYouAre: 1900 + SCENARIOS.length * 600 + 600, // ~5100ms
    welcomeHere: 1900 + SCENARIOS.length * 600 + 1500, // ~6000ms
    continueBtn: 1900 + SCENARIOS.length * 600 + 1500, // appears with landing
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <OnboardingHeader progress={progressFor("journey")} />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-6">
          <FadeIn delayMs={DELAYS.headline}>
            <Text
              className="text-ink text-[26px] leading-[34px] tracking-[-0.4px] mt-6"
              style={{ fontFamily: "PlusJakartaSans_700Bold" }}
            >
              Every person&apos;s walk with God looks different.
            </Text>
          </FadeIn>

          <FadeIn delayMs={DELAYS.subtext}>
            <Text
              className="text-ink-muted text-[16px] leading-[24px] mt-3"
              style={{ fontFamily: "PlusJakartaSans_400Regular" }}
            >
              And no two are meant to be the same.
            </Text>
          </FadeIn>

          {/* The four scenarios — staggered exhale */}
          <View className="mt-10">
            {SCENARIOS.map((scenario, i) => (
              <FadeIn key={scenario} delayMs={DELAYS.scenario(i)}>
                <Text
                  className="text-ink text-[18px] leading-[26px] mb-4 opacity-90"
                  style={{ fontFamily: "PlusJakartaSans_400Regular" }}
                >
                  {scenario}
                </Text>
              </FadeIn>
            ))}
          </View>

          {/* The welcome — two-line landing */}
          <FadeIn delayMs={DELAYS.whereverYouAre}>
            <Text
              className="text-ink text-[19px] leading-[28px] mt-8"
              style={{ fontFamily: "PlusJakartaSans_500Medium" }}
            >
              Wherever you are {"\u2014"}
            </Text>
          </FadeIn>

          <FadeIn delayMs={DELAYS.welcomeHere}>
            <Text
              className="text-ink text-[22px] leading-[30px] mt-1"
              style={{ fontFamily: "PlusJakartaSans_600SemiBold" }}
            >
              you&apos;re welcome here.
            </Text>
          </FadeIn>

          <View className="flex-1 min-h-[24px]" />

          <FadeIn delayMs={DELAYS.continueBtn}>
            <View className="pt-6">
              <Button label="Let's begin" onPress={handleContinue} />
            </View>
          </FadeIn>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
