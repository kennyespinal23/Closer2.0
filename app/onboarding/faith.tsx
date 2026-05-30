import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { FadeIn } from "@/components/FadeIn";
import { OnboardingHeader } from "@/components/OnboardingHeader";
import { useOnboarding } from "@/state/onboarding";
import { progressFor } from "@/constants/onboarding";

function capitalizeFirstName(raw: string): string {
  const first = raw.trim().split(/\s+/)[0] ?? "";
  if (!first) return "";
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

export default function FaithScreen() {
  const router = useRouter();
  const { answers } = useOnboarding();
  const firstName = capitalizeFirstName(answers.name);

  const headline = firstName
    ? `${firstName}, life didn\u2019t slow down for your faith.`
    : "Life didn\u2019t slow down for your faith.";

  const handleContinue = () => {
    router.push("/onboarding/journey");
  };

  // Pacing — delays tuned to the emotional arc of the copy.
  // Acknowledge → validate → pivot → land.
  const DELAYS = {
    headline: 0,
    burdens: 1000, // "Work. Relationships. Responsibilities."
    paragraph: 2000, // longer prose, needs reading time before next reveal
    notBelieving: 3800,
    lifeIsFull: 4600,
    pull: 5900, // the pivot — give it space
    neverLeft: 7100, // landing punch
    continueBtn: 7100, // appears with the landing
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <OnboardingHeader progress={progressFor("faith")} />

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
              {headline}
            </Text>
          </FadeIn>

          {/* The three burdens — staccato, on one line */}
          <FadeIn delayMs={DELAYS.burdens}>
            <Text
              className="text-ink text-[18px] leading-[26px] mt-9 opacity-90"
              style={{ fontFamily: "PlusJakartaSans_500Medium" }}
            >
              Work. Relationships. Responsibilities.
            </Text>
          </FadeIn>

          {/* The longer reflection */}
          <FadeIn delayMs={DELAYS.paragraph}>
            <Text
              className="text-ink text-[18px] leading-[28px] mt-6 opacity-90"
              style={{ fontFamily: "PlusJakartaSans_400Regular" }}
            >
              And somewhere in the middle of all of it {"\u2014"} the reading
              plans stopped. The prayers got shorter. Sunday mornings got harder
              to make.
            </Text>
          </FadeIn>

          {/* The gentle validation pair */}
          <FadeIn delayMs={DELAYS.notBelieving}>
            <Text
              className="text-ink text-[18px] leading-[26px] mt-6 opacity-90"
              style={{ fontFamily: "PlusJakartaSans_400Regular" }}
            >
              Not because you stopped believing.
            </Text>
          </FadeIn>

          <FadeIn delayMs={DELAYS.lifeIsFull}>
            <Text
              className="text-ink text-[18px] leading-[26px] mt-2 opacity-90"
              style={{ fontFamily: "PlusJakartaSans_400Regular" }}
            >
              Just because life is full.
            </Text>
          </FadeIn>

          {/* The pivot — slightly heavier weight for the turn */}
          <FadeIn delayMs={DELAYS.pull}>
            <Text
              className="text-ink text-[19px] leading-[28px] mt-8"
              style={{ fontFamily: "PlusJakartaSans_500Medium" }}
            >
              But that pull you feel {"\u2014"} that quiet thirst to be closer
              to Him?
            </Text>
          </FadeIn>

          {/* Landing punch — semibold for quiet emphasis */}
          <FadeIn delayMs={DELAYS.neverLeft}>
            <Text
              className="text-ink text-[20px] leading-[28px] mt-3"
              style={{ fontFamily: "PlusJakartaSans_600SemiBold" }}
            >
              That never left.
            </Text>
          </FadeIn>

          <View className="flex-1 min-h-[24px]" />

          <FadeIn delayMs={DELAYS.continueBtn}>
            <View className="pt-6">
              <Button label="Continue" onPress={handleContinue} />
            </View>
          </FadeIn>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
