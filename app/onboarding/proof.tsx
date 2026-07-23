import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { GodTimeComparisonChart } from "@/components/GodTimeComparisonChart";
import { OnboardingChrome } from "@/components/OnboardingChrome";
import { useOnboarding } from "@/state/onboarding";

/**
 * Here's the good news — time with God trends up with Closer.
 */
export default function ProofScreen() {
  const router = useRouter();
  const { answers } = useOnboarding();
  const firstName = (answers.name || "").trim().split(" ")[0];

  const eyebrow = firstName
    ? `${firstName.toUpperCase()} — HERE'S THE GOOD NEWS`
    : "HERE'S THE GOOD NEWS";

  return (
    <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
      <OnboardingChrome mode="back-only" />

      <View className="flex-1 px-6">
        <Text
          className="text-ink-muted mt-3"
          style={{
            fontFamily: "System",
            fontWeight: "700",
            fontSize: 11,
            letterSpacing: 2.4,
            textTransform: "uppercase",
          }}
        >
          {eyebrow}
        </Text>

        <Text
          className="text-ink mt-2"
          style={{
            fontFamily: "System",
            fontWeight: "700",
            fontSize: 26,
            lineHeight: 32,
            letterSpacing: -0.5,
          }}
          accessibilityRole="header"
        >
          Put God first, and time with Him grows.
        </Text>

        <View className="flex-1 items-center justify-center">
          <GodTimeComparisonChart />
        </View>

        <Text
          className="text-ink-muted text-center mb-4"
          style={{
            fontFamily: "System",
            fontWeight: "400",
            fontSize: 14,
            lineHeight: 20,
          }}
        >
          Without Closer, mornings drift. With Closer, the habit
          compounds week after week.
        </Text>

        <View className="pb-2">
          <Button
            label="Continue"
            onPress={() => router.push("/onboarding/rating")}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
