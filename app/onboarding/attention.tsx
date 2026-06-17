import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { DistractedPhoneVisual } from "@/components/DistractedPhoneVisual";
import { OnboardingChrome } from "@/components/OnboardingChrome";

/**
 * Onboarding beat 1 — social media gets first attention.
 * Phone mockup only; the Closer solution lands on /protected next.
 */
export default function AttentionScreen() {
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
          Social media gets your first attention.{"\n"}What if God did
          instead?
        </Text>

        <View className="flex-1 items-center justify-center">
          <DistractedPhoneVisual />
        </View>

        <View className="pb-2">
          <Button
            label="Continue"
            onPress={() => router.push("/onboarding/protected")}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
