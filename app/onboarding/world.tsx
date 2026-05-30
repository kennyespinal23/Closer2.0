import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { FadeIn } from "@/components/FadeIn";
import { OnboardingHeader } from "@/components/OnboardingHeader";
import { useOnboarding } from "@/state/onboarding";
import { progressFor } from "@/constants/onboarding";

const STATEMENTS = [
  "On the news we hear talks of wars.",
  "Diseases.",
  "Economic collapse.",
  "Mental health is at an all time low.",
  "Loneliness is at an all time high.",
];

const CLOSING =
  "And somehow \u2014 life just keeps moving and you\u2019re expected to keep up.";

function capitalizeFirstName(raw: string): string {
  const first = raw.trim().split(/\s+/)[0] ?? "";
  if (!first) return "";
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

export default function WorldScreen() {
  const router = useRouter();
  const { answers } = useOnboarding();
  const firstName = capitalizeFirstName(answers.name);

  const headline = firstName
    ? `${firstName}, the world feels different, doesn\u2019t it?`
    : "The world feels different, doesn\u2019t it?";

  const handleContinue = () => {
    router.push("/onboarding/faith");
  };

  // Pacing — every value in ms. Tuned for a contemplative exhale.
  const BASE = 700;
  const GAP = 500;
  const PAUSE_BEFORE_CLOSING = 900;

  const lastStatementDelay = BASE + GAP * (STATEMENTS.length - 1);
  const closingDelay = lastStatementDelay + PAUSE_BEFORE_CLOSING;

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <OnboardingHeader progress={progressFor("world")} />

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
              {headline}
            </Text>
          </FadeIn>

          <View className="mt-10">
            {STATEMENTS.map((statement, i) => (
              <FadeIn key={statement} delayMs={BASE + i * GAP}>
                <Text
                  className="text-ink text-[18px] leading-[26px] mb-5 opacity-90"
                  style={{ fontFamily: "PlusJakartaSans_400Regular" }}
                >
                  {statement}
                </Text>
              </FadeIn>
            ))}
          </View>

          <FadeIn delayMs={closingDelay}>
            <Text
              className="text-ink text-[18px] leading-[28px] mt-2"
              style={{ fontFamily: "PlusJakartaSans_500Medium" }}
            >
              {CLOSING}
            </Text>
          </FadeIn>

          <View className="flex-1 min-h-[24px]" />

          <FadeIn delayMs={closingDelay}>
            <View className="pt-6">
              <Button label="Continue" onPress={handleContinue} />
            </View>
          </FadeIn>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
