import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { GodTimeComparisonChart } from "@/components/GodTimeComparisonChart";
import { OnboardingChrome } from "@/components/OnboardingChrome";
import { progressFor } from "@/constants/onboarding";
import { useOnboarding } from "@/state/onboarding";
import { useColors } from "@/state/theme";

/**
 * Proof beat — Closer mornings vs phone-first drift.
 */
export default function ProofScreen() {
  const router = useRouter();
  const colors = useColors();
  const { answers } = useOnboarding();
  const firstName = (answers.name || "").trim().split(" ")[0];

  const eyebrow = firstName
    ? `${firstName.toUpperCase()} — HERE'S THE DIFFERENCE`
    : "HERE'S THE DIFFERENCE";

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.bg }}
      edges={["top", "bottom"]}
    >
      <OnboardingChrome
        mode="with-progress"
        progress={progressFor("proof")}
      />

      <View style={{ flex: 1, paddingHorizontal: 24 }}>
        <Text
          style={{
            marginTop: 8,
            fontFamily: "System",
            fontWeight: "700",
            fontSize: 11,
            letterSpacing: 2.4,
            textTransform: "uppercase",
            color: colors.inkMuted,
          }}
        >
          {eyebrow}
        </Text>

        <Text
          accessibilityRole="header"
          style={{
            marginTop: 10,
            fontFamily: "System",
            fontWeight: "800",
            fontSize: 28,
            lineHeight: 34,
            letterSpacing: -0.6,
            color: colors.ink,
          }}
        >
          Start with God.{"\n"}Skip the drift.
        </Text>

        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 12,
          }}
        >
          <GodTimeComparisonChart />
        </View>

        <View style={{ paddingBottom: 10 }}>
          <Button
            label="Continue"
            onPress={() => router.push("/onboarding/rating")}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
