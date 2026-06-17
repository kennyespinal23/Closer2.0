import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { DistractedPhoneVisual } from "@/components/DistractedPhoneVisual";
import { OnboardingChrome } from "@/components/OnboardingChrome";

/**
 * Onboarding beat 2 — Closer quiets the noise.
 * Same phone as /attention, then animates locks + dim on the apps.
 */
export default function ProtectedScreen() {
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
          Closer can help you create an uninterrupted time with God
          before distractions take over.
        </Text>

        <View className="flex-1 items-center justify-center">
          <DistractedPhoneVisual locked animateLock />
        </View>

        <View className="pb-2">
          <Button
            label="Continue"
            onPress={() => router.push("/onboarding/loop")}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
