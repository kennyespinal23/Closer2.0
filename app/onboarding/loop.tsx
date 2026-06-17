import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { OnboardingChrome } from "@/components/OnboardingChrome";
import { OnboardingLoopDiagram } from "@/components/OnboardingLoopDiagram";

/**
 * Onboarding beat 3 — the morning loop in one glance.
 * Sits after /protected (locks) and before /why.
 */
export default function LoopScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
      <OnboardingChrome mode="back-only" />

      <View className="flex-1 px-6">
        <Text
          className="text-ink mt-3"
          style={{
            fontFamily: "System",
            fontWeight: "700",
            fontSize: 26,
            lineHeight: 32,
            letterSpacing: -0.5,
          }}
          accessibilityRole="header"
        >
          How it works
        </Text>

        <Text
          className="text-ink-muted mt-2"
          style={{
            fontFamily: "System",
            fontWeight: "400",
            fontSize: 15,
            lineHeight: 21,
          }}
        >
          A simple loop, every morning.
        </Text>

        <View className="flex-1 items-center justify-center">
          <OnboardingLoopDiagram />
        </View>

        <View className="pb-2">
          <Button
            label="Continue"
            onPress={() => router.push("/onboarding/why")}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
